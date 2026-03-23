import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, requireWorkspaceAdmin, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

interface Params {
  params: Promise<{ id: string; userId: string }>;
}

/** DELETE — remove a member from the workspace */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: workspaceId, userId: targetUserId } = await params;

  // Allow self-removal, otherwise require admin
  if (targetUserId !== auth.userId) {
    const isAdmin = await requireWorkspaceAdmin(auth.userId, workspaceId);
    if (!isAdmin) return jsonError("Admin or Owner role required", 403);
  }

  // Cannot remove the workspace owner
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) return jsonError("Workspace not found", 404);
  if (workspace.ownerId === targetUserId) {
    return jsonError("Cannot remove the workspace owner", 400);
  }

  // Remove membership + revoke all devices/sessions for this user in this workspace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    await tx.membership.deleteMany({
      where: { userId: targetUserId, workspaceId },
    });

    const devices = await tx.device.findMany({
      where: { userId: targetUserId, workspaceId, revokedAt: null },
      select: { id: true },
    });

    if (devices.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deviceIds = devices.map((d: any) => d.id);
      await tx.session.updateMany({
        where: { deviceId: { in: deviceIds }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.device.updateMany({
        where: { id: { in: deviceIds } },
        data: { revokedAt: new Date() },
      });
    }
  });

  await audit({
    userId: auth.userId,
    entityType: "membership",
    entityId: `${targetUserId}:${workspaceId}`,
    action: "member.remove",
    meta: { targetUserId },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({ ok: true });
}
