import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { verifyTotp } from "@/lib/server/totp";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  hashIp,
  REFRESH_TOKEN_TTL_DAYS,
} from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";

/**
 * POST /api/auth/login/verify-2fa
 * Complete login after TOTP verification.
 * Body: { userId: string, code: string }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, code } = body as { userId?: string; code?: string };
  if (!userId || !code || code.length !== 6) {
    return NextResponse.json(
      { error: "userId and 6-digit code are required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      totpSecret: true,
      totpEnabledAt: true,
      deletedAt: true,
      recoveryCodes: true,
    },
  });

  if (!user || user.deletedAt || !user.totpEnabledAt || !user.totpSecret) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 401 },
    );
  }

  // Try TOTP code first
  let valid = verifyTotp(user.totpSecret, code);

  // If TOTP fails, check recovery codes
  if (!valid && Array.isArray(user.recoveryCodes)) {
    const idx = (user.recoveryCodes as string[]).indexOf(code);
    if (idx !== -1) {
      valid = true;
      // Remove used recovery code
      const remaining = [...(user.recoveryCodes as string[])];
      remaining.splice(idx, 1);
      await prisma.user.update({
        where: { id: user.id },
        data: { recoveryCodes: remaining },
      });
    }
  }

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid code" },
      { status: 401 },
    );
  }

  // Code is valid — complete the login (create device + session)
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true, role: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "No workspace found" },
      { status: 500 },
    );
  }

  const ua = (req.headers.get("user-agent") ?? "").slice(0, 512);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    // Try to find an existing device with the same user-agent
    let device = await tx.device.findFirst({
      where: {
        userId: user.id,
        workspaceId: membership.workspaceId,
        userAgent: ua,
        revokedAt: null,
      },
    });

    if (device) {
      // Revoke all existing sessions on this device
      await tx.session.updateMany({
        where: { deviceId: device.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.device.update({
        where: { id: device.id },
        data: { lastActiveAt: new Date() },
      });
    } else {
      device = await tx.device.create({
        data: {
          userId: user.id,
          workspaceId: membership.workspaceId,
          name: parseDeviceName(ua),
          platform: "web",
          userAgent: ua,
        },
      });
    }

    const refreshTokenRaw = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const session = await tx.session.create({
      data: {
        userId: user.id,
        deviceId: device.id,
        refreshTokenHash,
        userAgent: ua,
        ipHash: hashIp(
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
        ),
        expiresAt,
      },
    });

    return { device, session, refreshTokenRaw };
  });

  const accessToken = await signAccessToken({
    userId: user.id,
    sessionId: result.session.id,
    deviceId: result.device.id,
    workspaceId: membership.workspaceId,
  });

  await audit({
    userId: user.id,
    entityType: "user",
    entityId: user.id,
    action: "user.login",
    meta: { method: "password+totp" },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  const workspaces = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl ?? null },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workspaces: workspaces.map((m: any) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
    })),
    activeWorkspaceId: membership.workspaceId,
    accessToken,
    refreshToken: result.refreshTokenRaw,
  });
}

function parseDeviceName(ua: string): string {
  if (!ua) return "Unknown Device";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android Device";
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Linux")) return "Linux PC";
  return "Web Browser";
}
