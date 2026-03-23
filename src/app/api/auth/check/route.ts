import { NextRequest, NextResponse } from "next/server";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

/**
 * GET /api/auth/check — lightweight session validity check.
 * Called by the client heartbeat to detect revoked sessions.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const session = await prisma.session.findUnique({
    where: { id: auth.sessionId },
    select: { revokedAt: true, expiresAt: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return jsonError("Session revoked", 401);
  }

  return NextResponse.json({ ok: true });
}
