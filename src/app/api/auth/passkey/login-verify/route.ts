import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/server/prisma";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  hashIp,
  REFRESH_TOKEN_TTL_DAYS,
} from "@/lib/server/tokens";
import { audit } from "@/lib/server/audit";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
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

  // Look up the passkey by credential ID
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: credential.id },
    include: { user: { select: { id: true, email: true, name: true, deletedAt: true } } },
  });

  if (!passkey || passkey.user.deletedAt) {
    return NextResponse.json(
      { error: "Passkey not recognized" },
      { status: 401 },
    );
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
    console.error("[passkey/login-verify]", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 400 },
    );
  }

  if (!verification.verified) {
    return NextResponse.json(
      { error: "Passkey verification failed" },
      { status: 401 },
    );
  }

  // Update counter
  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  // Get primary workspace
  const membership = await prisma.membership.findFirst({
    where: { userId: passkey.userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "No workspace found" },
      { status: 500 },
    );
  }

  // Create device + session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    const device = await tx.device.create({
      data: {
        userId: passkey.userId,
        workspaceId: membership.workspaceId,
        name: passkey.deviceName || "Passkey Device",
        platform: "web",
        userAgent: (req.headers.get("user-agent") ?? "").slice(0, 512),
      },
    });

    const refreshTokenRaw = generateRefreshToken();
    const session = await tx.session.create({
      data: {
        userId: passkey.userId,
        deviceId: device.id,
        refreshTokenHash: hashToken(refreshTokenRaw),
        userAgent: (req.headers.get("user-agent") ?? "").slice(0, 512),
        ipHash: hashIp(
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
        ),
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return { device, session, refreshTokenRaw };
  });

  const accessToken = await signAccessToken({
    userId: passkey.userId,
    sessionId: result.session.id,
    deviceId: result.device.id,
    workspaceId: membership.workspaceId,
  });

  await audit({
    userId: passkey.userId,
    entityType: "user",
    entityId: passkey.userId,
    action: "user.login",
    meta: { method: "passkey" },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  const workspaces = await prisma.membership.findMany({
    where: { userId: passkey.userId },
    include: { workspace: { select: { id: true, name: true } } },
  });

  const response = NextResponse.json({
    user: {
      id: passkey.user.id,
      email: passkey.user.email,
      name: passkey.user.name,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workspaces: workspaces.map((m: any) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
    })),
    activeWorkspaceId: membership.workspaceId,
    accessToken,
    refreshToken: result.refreshTokenRaw,
  });

  response.cookies.delete("webauthn_challenge");
  return response;
}
