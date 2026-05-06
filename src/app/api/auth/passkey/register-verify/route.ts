import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError , getClientIp} from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";
import { getWebAuthnConfig } from "@/lib/server/webauthn";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { rpID, origin: ORIGIN } = getWebAuthnConfig(req);

  const challenge = req.cookies.get("webauthn_challenge")?.value;
  if (!challenge) {
    return jsonError("Challenge expired. Please retry.", 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { credential, deviceName } = body as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credential: any;
    deviceName?: string;
  };

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: rpID,
    });
  } catch (err) {
    console.error("[passkey/register-verify]", err);
    return jsonError(
      "Passkey verification failed",
      400,
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return jsonError("Passkey verification failed", 400);
  }

  const { credential: cred, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const passkey = await prisma.passkey.create({
    data: {
      userId: auth.userId,
      credentialId: cred.id,
      credentialPublicKey: Buffer.from(cred.publicKey),
      counter: BigInt(cred.counter),
      transports: credential.response?.transports ?? [],
      deviceName: deviceName ?? `${credentialDeviceType}${credentialBackedUp ? " (backed up)" : ""}`,
    },
  });

  // Clear challenge cookie
  const response = NextResponse.json({
    id: passkey.id,
    credentialId: passkey.credentialId,
    deviceName: passkey.deviceName,
  });
  response.cookies.delete("webauthn_challenge");

  await audit({
    userId: auth.userId,
    entityType: "passkey",
    entityId: passkey.id,
    action: "user.passkey_add",
    ipHash: hashIp(
      getClientIp(req),
    ),
  });

  return response;
}
