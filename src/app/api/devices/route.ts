import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { generateSecureToken, hashToken, hashIp } from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";

/** POST — issue a device-link token (from an already-signed-in device) */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const link = await prisma.deviceLink.create({
    data: {
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      tokenHash,
      expiresAt,
    },
  });

  await audit({
    userId: auth.userId,
    entityType: "device_link",
    entityId: link.id,
    action: "device_link.create",
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const linkUrl = `${baseUrl}/device-link/${rawToken}`;

  return NextResponse.json(
    { token: rawToken, url: linkUrl, expiresAt },
    { status: 201 },
  );
}

/** GET — list user's devices */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const devices = await prisma.device.findMany({
    where: { userId: auth.userId, revokedAt: null },
    select: {
      id: true,
      name: true,
      platform: true,
      lastActiveAt: true,
      createdAt: true,
      workspaceId: true,
    },
    orderBy: { lastActiveAt: "desc" },
  });

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    devices: devices.map((d: any) => ({
      id: d.id,
      name: d.name,
      platform: d.platform,
      lastActiveAt: d.lastActiveAt,
      createdAt: d.createdAt,
      isCurrent: d.id === auth.deviceId,
    })),
  });
}
