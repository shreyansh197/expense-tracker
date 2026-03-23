import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "./tokens";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────

export interface AuthContext {
  userId: string;
  sessionId: string;
  deviceId: string;
  workspaceId: string;
}

// ── Helpers ──────────────────────────────────────────────────

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── Guards ───────────────────────────────────────────────────

/**
 * Verify the access JWT and return the decoded payload.
 * Also checks that the session has not been revoked in the database.
 * Returns null (and you should return 401) if invalid or revoked.
 */
export async function requireAuth(
  req: NextRequest,
): Promise<AuthContext | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  try {
    const payload: AccessTokenPayload = await verifyAccessToken(token);
    if (!payload.sub || !payload.sid || !payload.did || !payload.wid)
      return null;

    // Check session is still valid in DB
    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      select: { revokedAt: true },
    });
    if (!session || session.revokedAt) return null;

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      deviceId: payload.did,
      workspaceId: payload.wid,
    };
  } catch {
    return null;
  }
}

/**
 * Verify the caller is a member of the given workspace.
 * Call *after* requireAuth.
 */
export async function requireWorkspaceMember(
  userId: string,
  workspaceId: string,
): Promise<{ role: string } | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
  return membership
    ? { role: membership.role }
    : null;
}

/**
 * Verify the caller is an OWNER or ADMIN of the workspace.
 */
export async function requireWorkspaceAdmin(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const membership = await requireWorkspaceMember(userId, workspaceId);
  return membership !== null && (membership.role === "OWNER" || membership.role === "ADMIN");
}

/**
 * Get client IP from request (privacy-safe path only).
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
