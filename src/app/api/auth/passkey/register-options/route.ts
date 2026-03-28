import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";

const RP_NAME = "ExpenStream";
const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) return jsonError("User not found", 404);

  const existingPasskeys = await prisma.passkey.findMany({
    where: { userId: user.id },
    select: {
      credentialId: true,
      transports: true,
    },
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: user.email,
    userDisplayName: user.name || user.email,
    attestationType: "none",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    excludeCredentials: existingPasskeys.map((p: any) => ({
      id: p.credentialId,
      transports: p.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Store challenge temporarily in a short-lived record
  // In production, use a cache (Redis). For simplicity, use cookie.
  const response = NextResponse.json(options);
  response.cookies.set("webauthn_challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 min
    path: "/",
  });

  return response;
}
