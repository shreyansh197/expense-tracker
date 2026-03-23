import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, requireWorkspaceAdmin, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

interface Params {
  params: Promise<{ id: string; inviteId: string }>;
}

/** DELETE — revoke an invite */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: workspaceId, inviteId } = await params;

  const isAdmin = await requireWorkspaceAdmin(auth.userId, workspaceId);
  if (!isAdmin) return jsonError("Admin or Owner role required", 403);

  const invite = await prisma.invite.findFirst({
    where: { id: inviteId, workspaceId, usedAt: null, revokedAt: null },
  });

  if (!invite) return jsonError("Invite not found or already used/revoked", 404);

  await prisma.invite.update({
    where: { id: inviteId },
    data: { revokedAt: new Date() },
  });

  await audit({
    userId: auth.userId,
    entityType: "invite",
    entityId: inviteId,
    action: "invite.revoke",
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({ ok: true });
}
