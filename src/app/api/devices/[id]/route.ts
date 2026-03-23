import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

interface Params {
  params: Promise<{ id: string }>;
}

/** DELETE — revoke a device (and its sessions) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: deviceId } = await params;

  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId: auth.userId, revokedAt: null },
  });

  if (!device) return jsonError("Device not found", 404);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    await tx.session.updateMany({
      where: { deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.device.update({
      where: { id: deviceId },
      data: { revokedAt: new Date() },
    });
  });

  await audit({
    userId: auth.userId,
    entityType: "device",
    entityId: deviceId,
    action: "device.revoke",
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({ ok: true });
}
