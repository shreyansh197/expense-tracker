import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import {
  hashToken,
  hashIp,
  signAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_TTL_DAYS,
} from "@/lib/server/tokens";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";

interface Params {
  params: Promise<{ token: string }>;
}

/** POST — accept a device link (requires auth — same user) */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { token } = await params;
  const tokenHash = hashToken(token);

  const link = await prisma.deviceLink.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      workspaceId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!link) return jsonError("Device link not found", 404);
  if (link.usedAt) return jsonError("Device link already used", 410);
  if (link.expiresAt < new Date()) return jsonError("Device link expired", 410);

  // The link must belong to the authenticated user
  if (link.userId !== auth.userId) {
    return jsonError("This device link belongs to a different user", 403);
  }

  // Create device + session for this workspace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    await tx.deviceLink.update({
      where: { id: link.id },
      data: { usedAt: new Date() },
    });

    const device = await tx.device.create({
      data: {
        userId: auth.userId,
        workspaceId: link.workspaceId,
        name: parseDeviceName(req.headers.get("user-agent") ?? ""),
        platform: "web",
        userAgent: (req.headers.get("user-agent") ?? "").slice(0, 512),
      },
    });

    const refreshTokenRaw = generateRefreshToken();
    const session = await tx.session.create({
      data: {
        userId: auth.userId,
        deviceId: device.id,
        refreshTokenHash: hashToken(refreshTokenRaw),
        userAgent: (req.headers.get("user-agent") ?? "").slice(0, 512),
        ipHash: hashIp(
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
        ),
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return { device, session, refreshTokenRaw };
  });

  const accessToken = await signAccessToken({
    userId: auth.userId,
    sessionId: result.session.id,
    deviceId: result.device.id,
    workspaceId: link.workspaceId,
  });

  await audit({
    userId: auth.userId,
    entityType: "device_link",
    entityId: link.id,
    action: "device_link.accept",
    meta: { deviceId: result.device.id, workspaceId: link.workspaceId },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({
    workspaceId: link.workspaceId,
    deviceId: result.device.id,
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
