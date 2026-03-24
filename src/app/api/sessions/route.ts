import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

/** GET — list sessions for the current user */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const sessions = await prisma.session.findMany({
    where: { userId: auth.userId, revokedAt: null, expiresAt: { gt: new Date() } },
    include: {
      device: { select: { id: true, name: true, platform: true, lastActiveAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessions: sessions.map((s: any) => ({
      id: s.id,
      deviceName: s.device?.name ?? "Unknown Device",
      platform: s.device?.platform ?? "web",
      ipHash: s.ipHash ?? "",
      createdAt: s.createdAt,
      lastActiveAt: s.device?.lastActiveAt ?? s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === auth.sessionId,
    })),
  });
}

/** DELETE — revoke all sessions except current */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  await prisma.session.updateMany({
    where: {
      userId: auth.userId,
      id: { not: auth.sessionId },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  // Auto-revoke devices that no longer have any active sessions
  const orphanDevices = await prisma.device.findMany({
    where: {
      userId: auth.userId,
      revokedAt: null,
      id: { not: auth.deviceId },
      sessions: { none: { revokedAt: null, expiresAt: { gt: new Date() } } },
    },
    select: { id: true },
  });
  if (orphanDevices.length > 0) {
    await prisma.device.updateMany({
      where: { id: { in: orphanDevices.map((d) => d.id) } },
      data: { revokedAt: new Date() },
    });
  }

  await audit({
    userId: auth.userId,
    entityType: "session",
    entityId: "all",
    action: "session.revoke",
    meta: { scope: "all_except_current" },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({ ok: true });
}
