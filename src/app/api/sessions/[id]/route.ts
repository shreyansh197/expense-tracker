import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

interface Params {
  params: Promise<{ id: string }>;
}

/** DELETE — revoke a specific session */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: sessionId } = await params;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: auth.userId, revokedAt: null },
  });

  if (!session) return jsonError("Session not found", 404);

  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  // Auto-revoke the device if it has no remaining active sessions
  const remainingSessions = await prisma.session.count({
    where: { deviceId: session.deviceId, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  if (remainingSessions === 0) {
    await prisma.device.update({
      where: { id: session.deviceId },
      data: { revokedAt: new Date() },
    });
  }

  await audit({
    userId: auth.userId,
    entityType: "session",
    entityId: sessionId,
    action: "session.revoke",
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({ ok: true });
}
