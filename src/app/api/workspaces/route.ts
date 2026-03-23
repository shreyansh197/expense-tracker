import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";
import { createWorkspaceSchema } from "@/lib/validators";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

/** POST — create a new workspace */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    const workspace = await tx.workspace.create({
      data: {
        name: parsed.data.name,
        ownerId: auth.userId,
      },
    });

    await tx.membership.create({
      data: {
        userId: auth.userId,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    await tx.workspaceSettings.create({
      data: {
        workspaceId: workspace.id,
        salary: 0,
        currency: "INR",
        categories: DEFAULT_CATEGORIES,
      },
    });

    return workspace;
  });

  await audit({
    userId: auth.userId,
    entityType: "workspace",
    entityId: result.id,
    action: "workspace.create",
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json(
    { id: result.id, name: result.name },
    { status: 201 },
  );
}

/** GET — list workspaces for the current user */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const memberships = await prisma.membership.findMany({
    where: { userId: auth.userId },
    include: { workspace: { select: { id: true, name: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memberships.map((m: any) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
      createdAt: m.workspace.createdAt,
    })),
  );
}
