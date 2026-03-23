import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { hashToken, hashIp } from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";

interface Params {
  params: Promise<{ token: string }>;
}

/** POST — accept an invite (requires auth) */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { token } = await params;
  const tokenHash = hashToken(token);

  const invite = await prisma.invite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      workspaceId: true,
      role: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true,
    },
  });

  if (!invite) return jsonError("Invite not found", 404);
  if (invite.usedAt) return jsonError("Invite already used", 410);
  if (invite.revokedAt) return jsonError("Invite revoked", 410);
  if (invite.expiresAt < new Date()) return jsonError("Invite expired", 410);

  // Check if already a member
  const existing = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: auth.userId,
        workspaceId: invite.workspaceId,
      },
    },
  });

  if (existing) {
    return jsonError("Already a member of this workspace", 409);
  }

  // Accept: create membership + mark invite used
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    await tx.membership.create({
      data: {
        userId: auth.userId,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });
  });

  await audit({
    userId: auth.userId,
    entityType: "invite",
    entityId: invite.id,
    action: "invite.accept",
    meta: { workspaceId: invite.workspaceId, role: invite.role },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({
    workspaceId: invite.workspaceId,
    role: invite.role,
  });
}
