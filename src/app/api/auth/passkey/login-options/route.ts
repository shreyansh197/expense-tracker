import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/server/prisma";
import { passkeyLoginOptionsSchema } from "@/lib/validators";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = passkeyLoginOptionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email } = parsed.data;

  // If email is provided, scope to that user's passkeys
  let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] | undefined;

  if (email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (user) {
      const passkeys = await prisma.passkey.findMany({
        where: { userId: user.id },
        select: { credentialId: true, transports: true },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allowCredentials = passkeys.map((p: any) => ({
        id: p.credentialId,
        transports: p.transports as AuthenticatorTransport[],
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials,
    userVerification: "preferred",
  });

  const response = NextResponse.json(options);
  response.cookies.set("webauthn_challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return response;
}
