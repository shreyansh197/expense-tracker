import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) throw new Error("JWT_SECRET must be set");
  return new TextEncoder().encode(raw);
}

/**
 * POST /api/auth/google/exchange
 * Server reads the httpOnly _oauth_tmp cookie, verifies the JWT,
 * returns the auth payload, and clears the cookie.
 * Called from /auth/complete client page.
 */
export async function POST(req: NextRequest) {
  const tmpToken = req.cookies.get("_oauth_tmp")?.value;
  if (!tmpToken) {
    return NextResponse.json({ error: "No pending OAuth session" }, { status: 400 });
  }

  try {
    const { payload } = await jwtVerify(tmpToken, getJwtSecret(), {
      audience: "oauth-temp",
    });

    const data = payload.data as {
      user: { id: string; email: string; name: string; avatarUrl?: string | null };
      accessToken: string;
      refreshToken: string;
      workspaces: Array<{ id: string; name: string; role: string }>;
      activeWorkspaceId: string;
    };

    const res = NextResponse.json(data);
    res.cookies.delete("_oauth_tmp");
    return res;
  } catch (err) {
    console.error("[google/exchange]", err);
    return NextResponse.json(
      { error: "Invalid or expired OAuth session. Please sign in again." },
      { status: 401 },
    );
  }
}
