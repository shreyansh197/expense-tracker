import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { verifyPassword } from "@/lib/server/password";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  hashIp,
  REFRESH_TOKEN_TTL_DAYS,
} from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";
import { loginSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  try {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      passwordHash: true,
      totpEnabledAt: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt || !user.passwordHash) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  // If 2FA is enabled, return a pending state
  if (user.totpEnabledAt) {
    // Issue a short-lived 2FA challenge token (reuse JWT with a flag)
    return NextResponse.json({
      requires2FA: true,
      userId: user.id,
    });
  }

  // Get the user's primary workspace (first owned)
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true, role: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "No workspace found. Contact support." },
      { status: 500 },
    );
  }

  // Create device + session (dedup: reuse existing device by client device ID)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    const ua = (req.headers.get("user-agent") ?? "").slice(0, 512);
    const clientId = (req.headers.get("x-device-id") ?? "").slice(0, 64) || null;

    // Match by clientId first (stable per-browser), fallback to UA only if no clientId
    let device = clientId
      ? await tx.device.findFirst({
          where: { userId: user.id, workspaceId: membership.workspaceId, clientId, revokedAt: null },
        })
      : await tx.device.findFirst({
          where: { userId: user.id, workspaceId: membership.workspaceId, userAgent: ua, revokedAt: null },
        });

    if (device) {
      // Revoke all existing sessions on this device
      await tx.session.updateMany({
        where: { deviceId: device.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      // Touch lastActiveAt
      await tx.device.update({
        where: { id: device.id },
        data: { lastActiveAt: new Date() },
      });
    } else {
      device = await tx.device.create({
        data: {
          userId: user.id,
          workspaceId: membership.workspaceId,
          clientId,
          name: parseDeviceName(req.headers.get("user-agent") ?? ""),
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
    meta: { method: "password" },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  // Fetch all workspaces for the user
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
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
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
