import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_TOKEN_TTL_DAYS } from "@/lib/server/tokens";

const COOKIE_NAME = "refresh_token";
const COOKIE_PATH = "/api/auth";

/**
 * Set the refresh token as an httpOnly secure cookie on a NextResponse.
 */
export function setRefreshTokenCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60, // seconds
  });
}

/**
 * Clear the refresh token cookie (on logout or revocation).
 */
export function clearRefreshTokenCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: COOKIE_PATH,
    maxAge: 0,
  });
}

/**
 * Read the refresh token from the incoming request cookie.
 */
export function getRefreshTokenFromCookie(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}
