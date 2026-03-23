import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { hashIp, generateSecureToken, hashToken } from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";
import { migrateSyncCodeSchema } from "@/lib/validators";


/**
 * POST /api/migrate/sync-code
 *
 * Exchange a legacy sync code for:
 * 1) A Workspace (created if not already migrated)
 * 2) A single-use invite token to join that workspace
 *
 * Rate-limited to 5 requests per minute per IP (enforced at edge/CDN).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = migrateSyncCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid sync code format" },
      { status: 400 },
    );
  }

  const syncCode = parsed.data.syncCode.toUpperCase().trim();

  // Check if this sync code has already been migrated to a workspace
  const workspace = await prisma.workspace.findUnique({
    where: { legacySyncCode: syncCode },
    select: { id: true, name: true },
  });

  if (!workspace) {
    // Create a new workspace for this sync code
    // We need a placeholder owner. In a real migration, we'd prompt the user
    // to create an account first, then claim. For the compatibility layer,
    // we create the workspace without an owner initially, then the first
    // user to register with this code claims ownership.
    //
    // Since Prisma requires ownerId, we use a system approach:
    // We'll require the user to register first, then call this endpoint
    // with auth. But this is a PUBLIC endpoint for the compat window.
    //
    // STRATEGY: Create workspace during the DB migration script (batch).
    // This endpoint just finds it and hands out an invite.

    return NextResponse.json(
      { error: "Sync code not yet migrated. Please contact support or wait for migration." },
      { status: 404 },
    );
  }

  // Generate a one-time invite for this workspace
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  await prisma.invite.create({
    data: {
      workspaceId: workspace.id,
      inviterId: (await prisma.workspace.findUnique({
        where: { id: workspace.id },
        select: { ownerId: true },
      }))!.ownerId,
      tokenHash,
      role: "MEMBER",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  await audit({
    entityType: "workspace",
    entityId: workspace.id,
    action: "migration.sync_code",
    meta: { syncCodePrefix: syncCode.slice(0, 2) },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  return NextResponse.json({
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    inviteToken: rawToken,
    inviteUrl: `${baseUrl}/invite/${rawToken}`,
    expiresIn: "24 hours",
  });
}
