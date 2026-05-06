import type { NextRequest } from "next/server";

/**
 * Derive the WebAuthn RP ID and expected origin from the incoming request.
 *
 * Priority:
 *   1. WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN env vars (explicit, always wins)
 *   2. `x-forwarded-host` header (set by Vercel, Cloudflare, etc. for the
 *      actual public hostname behind a proxy)
 *   3. `host` header (direct connection or dev server)
 *
 * This means the same code works on:
 *   - localhost:3000 (dev, no env vars needed)
 *   - *.vercel.app preview deployments (auto-derived, no env vars needed)
 *   - Custom production domains (set env vars for full control)
 *
 * WebAuthn rule: rpID must equal the effective domain of the origin,
 * or be a registrable-domain suffix of it. Port is never part of the rpID.
 */
export function getWebAuthnConfig(req: NextRequest): {
  rpID: string;
  origin: string;
} {
  // Use explicit env vars when set (production with custom domain)
  if (process.env.WEBAUTHN_RP_ID && process.env.WEBAUTHN_ORIGIN) {
    return {
      rpID: process.env.WEBAUTHN_RP_ID,
      origin: process.env.WEBAUTHN_ORIGIN,
    };
  }

  // Auto-derive from request headers
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = req.headers.get("host") ?? "localhost";

  // x-forwarded-host is the real public domain on Vercel/proxied deployments
  const effectiveHost = forwardedHost ?? host;

  // Strip port from rpID (WebAuthn spec requires host without port)
  const rpID =
    process.env.WEBAUTHN_RP_ID ?? effectiveHost.split(":")[0];

  // Determine protocol: assume https in production unless running on localhost
  const isLocalhost =
    rpID === "localhost" || rpID === "127.0.0.1" || rpID.startsWith("192.168.");
  const proto = isLocalhost ? "http" : "https";

  // Use the full host (with port if present) for the origin
  const origin =
    process.env.WEBAUTHN_ORIGIN ?? `${proto}://${effectiveHost}`;

  return { rpID, origin };
}
