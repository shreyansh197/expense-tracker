import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

/**
 * GET /api/auth/google
 * Initiates the Google OAuth 2.0 authorization code flow.
 * Requires env vars: GOOGLE_CLIENT_ID, NEXT_PUBLIC_APP_URL (optional)
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Google OAuth not configured — redirect back with error param
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    return NextResponse.redirect(`${origin}/?error=google_not_configured`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // CSRF state token
  const state = randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );

  // Store state in httpOnly cookie for CSRF verification on callback
  res.cookies.set("_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return res;
}
