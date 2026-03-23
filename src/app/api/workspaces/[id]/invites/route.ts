import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, requireWorkspaceAdmin, jsonError } from "@/lib/server/guards";
import { generateSecureToken, hashToken, hashIp } from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";
import { createInviteSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST — create an invite for a workspace */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: workspaceId } = await params;

  const isAdmin = await requireWorkspaceAdmin(auth.userId, workspaceId);
  if (!isAdmin) return jsonError("Admin or Owner role required", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400);
  }

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + parsed.data.expiresInMinutes * 60 * 1000,
  );

  const invite = await prisma.invite.create({
    data: {
      workspaceId,
      inviterId: auth.userId,
      tokenHash,
      role: parsed.data.role,
      expiresAt,
    },
  });

  await audit({
    userId: auth.userId,
    entityType: "invite",
    entityId: invite.id,
    action: "invite.create",
    meta: { role: parsed.data.role, expiresInMinutes: parsed.data.expiresInMinutes },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  // Build the invite URL (client will construct QR from this)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const inviteUrl = `${baseUrl}/invite/${rawToken}`;

  return NextResponse.json(
    {
      id: invite.id,
      token: rawToken,
      url: inviteUrl,
      role: parsed.data.role,
      expiresAt: invite.expiresAt,
    },
    { status: 201 },
  );
}

/** GET — list active invites for a workspace */
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: workspaceId } = await params;

  const isAdmin = await requireWorkspaceAdmin(auth.userId, workspaceId);
  if (!isAdmin) return jsonError("Admin or Owner role required", 403);

  const invites = await prisma.invite.findMany({
    where: {
      workspaceId,
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      inviter: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}
