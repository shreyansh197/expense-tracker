import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/server/prisma";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  hashIp,
  REFRESH_TOKEN_TTL_DAYS,
} from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) throw new Error("JWT_SECRET must be set");
  return new TextEncoder().encode(raw);
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  verified_email?: boolean;
}

/**
 * GET /api/auth/google/callback
 * Handles the OAuth callback from Google.
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      return NextResponse.redirect(`${baseUrl}/?error=google_denied`);
    }

    // Verify CSRF state
    const storedState = req.cookies.get("_oauth_state")?.value;
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(`${baseUrl}/?error=oauth_state_mismatch`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/?error=oauth_no_code`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/?error=google_not_configured`);
    }

    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // Exchange authorization code for Google access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }).toString(),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[google/callback] token exchange failed", tokenData);
      return NextResponse.redirect(`${baseUrl}/?error=oauth_token_exchange`);
    }

    // Fetch Google user profile
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = (await userRes.json()) as GoogleUserInfo;
    if (!userRes.ok || !googleUser.email) {
      return NextResponse.redirect(`${baseUrl}/?error=oauth_user_info`);
    }

    const ua = (req.headers.get("user-agent") ?? "").slice(0, 512);
    const ipHash = hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Try to find existing user by googleId
      let dbUser = await tx.user.findUnique({
        where: { googleId: googleUser.id },
        select: { id: true, email: true, name: true, deletedAt: true },
      });

      // 2. Fallback: find by email (link existing email/password account)
      if (!dbUser) {
        const byEmail = await tx.user.findUnique({
          where: { email: googleUser.email.toLowerCase() },
          select: { id: true, email: true, name: true, deletedAt: true },
        });
        if (byEmail && !byEmail.deletedAt) {
          await tx.user.update({
            where: { id: byEmail.id },
            data: { googleId: googleUser.id },
          });
          dbUser = byEmail;
        }
      }

      let workspaceId: string;

      if (!dbUser || dbUser.deletedAt) {
        // 3. New user — create user + workspace + membership + settings
        const created = await tx.user.create({
          data: {
            email: googleUser.email.toLowerCase(),
            name: googleUser.name || "",
            googleId: googleUser.id,
            emailVerifiedAt: new Date(),
          },
          select: { id: true, email: true, name: true },
        });
        dbUser = { ...created, deletedAt: null };

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
        // 4. Existing user — get primary workspace
        const membership = await tx.membership.findFirst({
          where: { userId: dbUser.id },
          orderBy: { createdAt: "asc" },
          select: { workspaceId: true },
        });
        if (!membership) throw new Error("No workspace found for user");
        workspaceId = membership.workspaceId;
      }

      // 5. Create or reuse device
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

      // 6. Create session
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

      // 7. Fetch all workspaces
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
      meta: { method: "google" },
      ipHash,
    });

    // 8. Sign short-lived temp token containing full auth payload
    const tempPayload = {
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
    };

    const tempToken = await new SignJWT({ data: tempPayload })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("oauth-temp")
      .setExpirationTime("5m")
      .sign(getJwtSecret());

    // 9. Redirect to client completion page with temp token in httpOnly cookie
    const res = NextResponse.redirect(`${baseUrl}/auth/complete`);
    res.cookies.delete("_oauth_state");
    res.cookies.set("_oauth_tmp", tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[google/callback]", err);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_internal`);
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
