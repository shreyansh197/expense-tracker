import { NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const PUBLIC_PATHS = new Set([
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/login/verify-2fa",
  "/api/auth/refresh",
  "/api/auth/magic-link",
  "/api/auth/magic-link/verify",
  "/api/auth/passkey/login-options",
  "/api/auth/passkey/login-verify",
  // Google OAuth
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/auth/google/exchange",
  // Phone OTP
  "/api/auth/otp/send",
  "/api/auth/otp/verify",
  "/api/invites/preview",   // GET – public preview of invite
  "/api/migrate/sync-code", // POST – legacy migration
]);

// Path prefixes that don't require auth
const PUBLIC_PREFIXES = [
  "/api/invites/", // accept flow (token in URL)
];

function isPublicApiRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p) && pathname !== p);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate /api/* routes (let pages through — client-side auth handles UI)
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public API routes pass through
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Protected API routes: require Authorization header presence.
  // Actual JWT verification happens in the route handler (via requireAuth).
  // This middleware is a fast-fail for missing tokens.
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
