import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";

/**
 * POST /api/auth/passkey/app-lock-verify
 *
 * Verifies a WebAuthn assertion for app-lock purposes (biometric unlock).
 * Requires a valid session JWT — the user is already authenticated but
 * the app is PIN-locked due to inactivity.
 *
 * Returns { ok: true } on success — does NOT issue new tokens.
 * Updates the passkey counter for replay-attack protection.
 */
export async function POST(req: NextRequest) {
  // Must be authenticated (JWT still valid, app is just PIN-locked)
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const challenge = req.cookies.get("webauthn_challenge")?.value;
  if (!challenge) {
    return NextResponse.json(
      { error: "Challenge expired. Please retry." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const credential = body as any;

  // Look up the passkey — must belong to the current authenticated user
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: credential.id },
    select: {
      id: true,
      userId: true,
      credentialId: true,
      credentialPublicKey: true,
      counter: true,
      transports: true,
    },
  });

  if (!passkey || passkey.userId !== auth.userId) {
    return NextResponse.json({ error: "Passkey not recognized" }, { status: 401 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: passkey.credentialId,
        publicKey: passkey.credentialPublicKey,
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransport[],
      },
    });
  } catch (err) {
    console.error("[passkey/app-lock-verify]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Passkey verification failed" }, { status: 401 });
  }

  // Update counter (replay-attack protection)
  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  const response = NextResponse.json({ ok: true });
  // Clear the challenge cookie
  response.cookies.set("webauthn_challenge", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
