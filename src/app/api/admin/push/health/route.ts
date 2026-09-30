import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireAuth, requireWorkspaceAdmin, getClientIp } from "@/lib/server/guards";

/**
 * GET /api/admin/push/health
 *
 * Sprint 3.2 / T-3.2.5 — operations dashboard for the push pipeline built in
 * Sprint 3.1. Returns aggregate `push_deliveries` counters for the last 24h
 * so operators can spot an outage (dead-letter spike, no `sent` rows) before
 * users complain. See docs/ops/push.md for alert thresholds.
 *
 * Auth: either the shared `CRON_SECRET` (so an external monitor can poll it
 * the same way it triggers `/api/push/send`) or an authenticated session
 * belonging to an OWNER/ADMIN of their workspace. Rate-limited per caller.
 *
 * Privacy: the response never includes a raw push `endpoint` (which can
 * embed a push-service-specific token) or any user-identifying field —
 * only the opaque `subscriptionId` UUID, status counters, and short error
 * strings that already exclude PII/money (see pushDispatcher.ts).
 */
export async function GET(req: NextRequest) {
  // ── Auth: CRON_SECRET OR an authenticated workspace admin ──────────────
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const suppliedSecret = bearer || req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  const isCronAuthed = !!cronSecret && !!suppliedSecret && suppliedSecret === cronSecret;

  let isAdminAuthed = false;
  if (!isCronAuthed) {
    const auth = await requireAuth(req);
    if (auth) {
      isAdminAuthed = await requireWorkspaceAdmin(auth.userId, auth.workspaceId);
    }
  }

  if (!isCronAuthed && !isAdminAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  // Keyed by caller IP since the CRON_SECRET path has no session identity.
  const limited = await rateLimit(`admin:push-health:${getClientIp(req)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  // ── Aggregate counts (last 24h) — workspace-agnostic ops view ───────────
  const windowHours = 24;
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  let statusRows: Array<{ status: string; count: bigint }>;
  let topFailingRows: Array<{ subscription_id: string; attempts: number; last_error: string | null; last_seen: Date }>;

  try {
    [statusRows, topFailingRows] = await Promise.all([
      prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
        SELECT status, COUNT(*)::bigint AS count
        FROM push_deliveries
        WHERE created_at > ${since}
        GROUP BY status
      `,
      prisma.$queryRaw<Array<{ subscription_id: string; attempts: number; last_error: string | null; last_seen: Date }>>`
        SELECT subscription_id,
               MAX(attempts)      AS attempts,
               MAX(last_error)    AS last_error,
               MAX(updated_at)    AS last_seen
        FROM push_deliveries
        WHERE status = 'dead' AND updated_at > ${since}
        GROUP BY subscription_id
        ORDER BY MAX(attempts) DESC, MAX(updated_at) DESC
        LIMIT 10
      `,
    ]);
  } catch (e) {
    console.error("[admin/push/health] Query failed:", e);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  const counts = { pending: 0, sent: 0, failed: 0, dead: 0 };
  for (const row of statusRows) {
    if (row.status in counts) counts[row.status as keyof typeof counts] = Number(row.count);
  }

  const totalTerminal = counts.sent + counts.failed + counts.dead;
  const deliveredRatio = totalTerminal > 0 ? counts.sent / totalTerminal : 1;

  return NextResponse.json({
    windowHours,
    counts,
    deliveredRatio: Math.round(deliveredRatio * 1000) / 1000,
    topFailingSubscriptions: topFailingRows.map((r) => ({
      subscriptionId: r.subscription_id,
      attempts: r.attempts,
      lastError: r.last_error,
      lastSeenAt: r.last_seen.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  });
}
