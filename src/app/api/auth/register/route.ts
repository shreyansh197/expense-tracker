import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { hashPassword } from "@/lib/server/password";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  hashIp,
  REFRESH_TOKEN_TTL_DAYS,
} from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";
import { registerSchema } from "@/lib/validators";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

export async function POST(req: NextRequest) {
  // Parse & validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;

  try {
  // Check for existing user
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  // Create user + default workspace + membership + settings atomically
  const passwordHash = await hashPassword(password);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name ?? "",
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: "My Expenses",
        ownerId: user.id,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
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

    // Create device & session
    const device = await tx.device.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        name: parseDeviceName(req.headers.get("user-agent") ?? ""),
        platform: "web",
        userAgent: (req.headers.get("user-agent") ?? "").slice(0, 512),
      },
    });

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
        userAgent: (req.headers.get("user-agent") ?? "").slice(0, 512),
        ipHash: hashIp(
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
        ),
        expiresAt,
      },
    });

    return { user, workspace, device, session, refreshTokenRaw };
  });

  const accessToken = await signAccessToken({
    userId: result.user.id,
    sessionId: result.session.id,
    deviceId: result.device.id,
    workspaceId: result.workspace.id,
  });

  await audit({
    userId: result.user.id,
    entityType: "user",
    entityId: result.user.id,
    action: "user.register",
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json(
    {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
      },
      accessToken,
      refreshToken: result.refreshTokenRaw,
    },
    { status: 201 },
  );
  } catch (err) {
    console.error("[register]", err);
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
