import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { requireAuth, requireWorkspaceMember, jsonError, getClientIp } from "@/lib/server/guards";
import { hashIp } from "@/lib/server/tokens";

/**
 * POST /api/audit/sync-dead-letter
 *
 * Records a user's action on a dead-lettered mutation (retry / discard) into
 * `audit_logs`. Called by the client from the Sync Diagnostics UI.
 *
 * SECURITY
 * ────────
 * - Requires a valid session (requireAuth) + workspace membership.
 * - The payload MUST NOT contain the mutation `data` field (which may hold
 *   monetary values or free-text notes). Only a redacted summary is accepted.
 * - IP is hashed before persistence (matches other audit sites).
 */

const bodySchema = z.object({
  workspaceId: z.string().uuid(),
  action: z.enum(["retry", "discard"]),
  mutationSummary: z.object({
    table: z.enum(["expenses", "workspace_settings", "business_ledgers", "business_payments"]),
    operation: z.enum(["upsert", "delete"]),
    idempotencyKey: z.string().min(1).max(64),
    attempts: z.number().int().min(0).max(1_000),
    lastError: z.string().max(200).nullable().optional(),
  }),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { workspaceId, action, mutationSummary } = parsed.data;

  const member = await requireWorkspaceMember(auth.userId, workspaceId);
  if (!member) return jsonError("Not a member of this workspace", 403);

  await audit({
    userId: auth.userId,
    entityType: "sync_mutation",
    entityId: mutationSummary.idempotencyKey,
    action: action === "retry" ? "sync.dead_letter_retry" : "sync.dead_letter_discard",
    meta: {
      workspaceId,
      table: mutationSummary.table,
      operation: mutationSummary.operation,
      attempts: mutationSummary.attempts,
      lastError: mutationSummary.lastError ?? null,
    },
    ipHash: hashIp(getClientIp(req)),
  });

  return NextResponse.json({ ok: true });
}
