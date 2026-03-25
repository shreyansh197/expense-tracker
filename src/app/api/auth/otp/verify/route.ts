import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { supabase } from "@/lib/supabase";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  hashIp,
  REFRESH_TOKEN_TTL_DAYS,
} from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

function normalizePhone(raw: string): string | null {
  const stripped = raw.replace(/[\s\-().]/g, "");
  if (!/^\+\d{7,15}$/.test(stripped)) return null;
  return stripped;
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

/**
 * POST /api/auth/otp/verify
 * Body: { phone: string, otp: string }
 * Returns: { user, accessToken, refreshToken, workspaces, activeWorkspaceId }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawPhone = (body as { phone?: unknown }).phone;
  const rawOtp = (body as { otp?: unknown }).otp;

  if (typeof rawPhone !== "string" || typeof rawOtp !== "string") {
    return NextResponse.json({ error: "phone and otp are required" }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  if (!/^\d{6}$/.test(rawOtp.trim())) {
    return NextResponse.json({ error: "OTP must be 6 digits" }, { status: 400 });
  }

  // Verify OTP via Supabase (handles expiry, rate-limiting, and token storage)
  const { error: verifyError } = await supabase.auth.verifyOtp({
    phone,
    token: rawOtp.trim(),
    type: "sms",
  });

  if (verifyError) {
    return NextResponse.json(
      { error: "Invalid or expired code. Please request a new one." },
      { status: 401 },
    );
  }

  try {
    const ua = (req.headers.get("user-agent") ?? "").slice(0, 512);
    const ipHash = hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // Find or create user by phone
      let dbUser = await tx.user.findFirst({
        where: { phone },
        select: { id: true, email: true, name: true },
      });

      let workspaceId: string;

      if (!dbUser) {
        // New phone user — generate placeholder email
        const placeholderEmail = `_phone_${phone.replace(/\+/, "")}@otp.internal`;

        dbUser = await tx.user.create({
          data: {
            email: placeholderEmail,
            name: "",
            phone,
            phoneVerifiedAt: new Date(),
          },
          select: { id: true, email: true, name: true },
        });

        const ws = await tx.workspace.create({
          data: { name: "My Expenses", ownerId: dbUser.id },
        });
        workspaceId = ws.id;

        await tx.membership.create({
          data: { userId: dbUser.id, workspaceId, role: "OWNER" },
        });
        await tx.workspaceSettings.create({
          data: {
            workspaceId,
            salary: 0,
            currency: "INR",
            categories: DEFAULT_CATEGORIES,
          },
        });
      } else {
        // Existing user — get primary workspace
        const membership = await tx.membership.findFirst({
          where: { userId: dbUser.id },
          orderBy: { createdAt: "asc" },
          select: { workspaceId: true },
        });
        if (!membership) throw new Error("No workspace found");
        workspaceId = membership.workspaceId;

        // Mark phone as verified if not already
        await tx.user.update({
          where: { id: dbUser.id },
          data: { phoneVerifiedAt: new Date() },
        });
      }

      // Create or reuse device
      let device = await tx.device.findFirst({
        where: { userId: dbUser.id, workspaceId, userAgent: ua, revokedAt: null },
      });

      if (device) {
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
            userId: dbUser.id,
            workspaceId,
            name: parseDeviceName(ua),
            platform: "web",
            userAgent: ua,
          },
        });
      }

      const refreshTokenRaw = generateRefreshToken();
      const expiresAt = new Date(
        Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      );
      const session = await tx.session.create({
        data: {
          userId: dbUser.id,
          deviceId: device.id,
          refreshTokenHash: hashToken(refreshTokenRaw),
          userAgent: ua,
          ipHash,
          expiresAt,
        },
      });

      const memberships = await tx.membership.findMany({
        where: { userId: dbUser.id },
        include: { workspace: { select: { id: true, name: true } } },
      });

      return { dbUser, device, session, refreshTokenRaw, workspaceId, memberships };
    });

    const accessToken = await signAccessToken({
      userId: result.dbUser.id,
      sessionId: result.session.id,
      deviceId: result.device.id,
      workspaceId: result.workspaceId,
    });

    await audit({
      userId: result.dbUser.id,
      entityType: "user",
      entityId: result.dbUser.id,
      action: "user.login",
      meta: { method: "phone_otp" },
      ipHash,
    });

    return NextResponse.json({
      user: {
        id: result.dbUser.id,
        email: result.dbUser.email,
        name: result.dbUser.name,
      },
      accessToken,
      refreshToken: result.refreshTokenRaw,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workspaces: result.memberships.map((m: any) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
      })),
      activeWorkspaceId: result.workspaceId,
    });
  } catch (err) {
    console.error("[otp/verify]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
