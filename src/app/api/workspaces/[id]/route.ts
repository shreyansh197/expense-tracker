import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, requireWorkspaceMember, requireWorkspaceAdmin, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET — workspace details + members */
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const member = await requireWorkspaceMember(auth.userId, id);
  if (!member) return jsonError("Not a member of this workspace", 403);

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true, ownerId: true, createdAt: true },
  });
  if (!workspace) return jsonError("Workspace not found", 404);

  const members = await prisma.membership.findMany({
    where: { workspaceId: id },
    include: {
      user: { select: { id: true, email: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    ...workspace,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: members.map((m: any) => ({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.createdAt,
    })),
  });
}

/** PATCH — update workspace name */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const isAdmin = await requireWorkspaceAdmin(auth.userId, id);
  if (!isAdmin) return jsonError("Admin or Owner role required", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { name } = body as { name?: string };
  if (!name || name.length > 120) {
    return jsonError("Name is required (max 120 chars)", 400);
  }

  const updated = await prisma.workspace.update({
    where: { id },
    data: { name },
    select: { id: true, name: true },
  });

  await audit({
    userId: auth.userId,
    entityType: "workspace",
    entityId: id,
    action: "workspace.update",
    meta: { name },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json(updated);
}
