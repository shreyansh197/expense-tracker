import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { createHash, randomBytes } from "node:crypto";

// ── Env ──────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32)
    throw new Error("JWT_SECRET must be set and at least 32 chars");
  return new TextEncoder().encode(raw);
}

// ── Access Token (short-lived, stateless) ────────────────────

export interface AccessTokenPayload extends JWTPayload {
  sub: string; // userId
  sid: string; // sessionId
  did: string; // deviceId
  wid: string; // workspaceId
}

const ACCESS_TOKEN_TTL = "15m";

export async function signAccessToken(payload: {
  userId: string;
  sessionId: string;
  deviceId: string;
  workspaceId: string;
}): Promise<string> {
  return new SignJWT({
    sub: payload.userId,
    sid: payload.sessionId,
    did: payload.deviceId,
    wid: payload.workspaceId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setIssuer("expenstream")
    .sign(getSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: "expenstream",
  });
  return payload as AccessTokenPayload;
}

// ── Refresh Token (opaque, stored as hash) ───────────────────

export const REFRESH_TOKEN_TTL_DAYS = 30;

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// ── Invite / DeviceLink tokens ───────────────────────────────

export function generateSecureToken(): string {
  return randomBytes(16).toString("base64url");
}

// ── 2FA Challenge Token (short-lived, proves password was verified) ───

const TWO_FA_CHALLENGE_TTL = "5m";

export async function sign2FAChallenge(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, purpose: "2fa-challenge" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TWO_FA_CHALLENGE_TTL)
    .setIssuer("expenstream")
    .sign(getSecret());
}

export async function verify2FAChallenge(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: "expenstream",
  });
  if (payload.purpose !== "2fa-challenge" || !payload.sub) {
    throw new Error("Invalid 2FA challenge token");
  }
  return payload.sub;
}

// ── IP hashing (privacy-preserving) ──────────────────────────

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "expenstream-ip";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}
