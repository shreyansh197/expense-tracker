import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

/**
 * GET /api/auth/encryption-key
 *
 * Returns the workspace-scoped client-side encryption key (base64).
 * If the workspace doesn't have one yet, generates a 256-bit key and stores it.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const workspace = await prisma.workspace.findUnique({
    where: { id: auth.workspaceId },
    select: { encryptionKey: true },
  });

  if (!workspace) return jsonError("Workspace not found", 404);

  let keyB64 = workspace.encryptionKey;

  if (!keyB64) {
    // Generate a new 256-bit key
    keyB64 = randomBytes(32).toString("base64");
    await prisma.workspace.update({
      where: { id: auth.workspaceId },
      data: { encryptionKey: keyB64 },
    });
  }

  return NextResponse.json({ key: keyB64 });
}
