import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { hashToken } from "@/lib/server/tokens";

interface Params {
  params: Promise<{ token: string }>;
}

/** GET — preview what workspace this invite links to (public) */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const tokenHash = hashToken(token);

  const invite = await prisma.invite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      role: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true,
      workspace: { select: { id: true, name: true } },
      inviter: { select: { name: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.usedAt) {
    return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  }
  if (invite.revokedAt) {
    return NextResponse.json({ error: "Invite revoked" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  return NextResponse.json({
    workspaceName: invite.workspace.name,
    role: invite.role,
    invitedBy: invite.inviter.name || "A team member",
    expiresAt: invite.expiresAt,
  });
}
