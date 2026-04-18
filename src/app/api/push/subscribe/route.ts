import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, requireWorkspaceMember, jsonError } from "@/lib/server/guards";
import { z } from "zod";

const subscribeSchema = z.object({
  workspaceId: z.string().uuid(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

/**
 * POST /api/push/subscribe
 * Save a Web Push subscription for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON", 400); }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { workspaceId, subscription } = parsed.data;

  const member = await requireWorkspaceMember(auth.userId, workspaceId);
  if (!member) return jsonError("Not a member of this workspace", 403);

  // Upsert by endpoint (one subscription per browser)
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId: auth.userId,
      workspaceId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      userId: auth.userId,
      workspaceId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

/**
 * DELETE /api/push/subscribe
 * Remove a Web Push subscription.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON", 400); }

  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      endpoint: parsed.data.endpoint,
      userId: auth.userId,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
