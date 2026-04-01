import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  hashIp,
  REFRESH_TOKEN_TTL_DAYS,
} from "@/lib/server/tokens";
import { refreshSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "refreshToken is required" },
      { status: 400 },
    );
  }

  const tokenHash = hashToken(parsed.data.refreshToken);

  // Find the matching session
  const session = await prisma.session.findFirst({
    where: {
      refreshTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: { select: { id: true, deletedAt: true } },
      device: { select: { id: true, workspaceId: true, revokedAt: true } },
    },
  });

  if (!session || session.user.deletedAt || session.device.revokedAt) {
    // Token reuse detection: if we find a revoked session with this hash,
    // it means the token was already rotated — possible theft. Revoke all
    // sessions for the user.
    const revokedMatch = await prisma.session.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: { not: null } },
      select: { userId: true },
    });
    if (revokedMatch) {
      await prisma.session.updateMany({
        where: { userId: revokedMatch.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 },
    );
  }

  // Rotate the refresh token
  const newRefreshTokenRaw = generateRefreshToken();
  const newRefreshTokenHash = hashToken(newRefreshTokenRaw);
  const newExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
      ipHash: hashIp(
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      ),
    },
  });

  const accessToken = await signAccessToken({
    userId: session.userId,
    sessionId: session.id,
    deviceId: session.deviceId,
    workspaceId: session.device.workspaceId,
  });

  // Touch device lastActiveAt
  await prisma.device.update({
    where: { id: session.deviceId },
    data: { lastActiveAt: new Date() },
  });

  return NextResponse.json({
    accessToken,
    refreshToken: newRefreshTokenRaw,
  });
}
