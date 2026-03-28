import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { generateTotpSecret, verifyTotp } from "@/lib/server/totp";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";
import { totpVerifySchema } from "@/lib/validators";

/** GET — retrieve TOTP setup info (secret + QR URI) */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { email: true, totpEnabledAt: true },
  });
  if (!user) return jsonError("User not found", 404);

  // Status-only check (no secret generation)
  if (req.nextUrl.searchParams.get("status") === "1") {
    return NextResponse.json({ enabled: !!user.totpEnabledAt });
  }

  if (user.totpEnabledAt) {
    return NextResponse.json({ enabled: true });
  }

  const { secret, uri } = generateTotpSecret(user.email);

  // Store the secret (unverified) — user must verify before it's active
  await prisma.user.update({
    where: { id: auth.userId },
    data: { totpSecret: secret },
  });

  return NextResponse.json({ enabled: false, uri, secret });
}

/** DELETE — disable 2FA (requires TOTP code for confirmation) */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = totpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("A valid 6-digit code is required to disable 2FA", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { totpSecret: true, totpEnabledAt: true },
  });
  if (!user?.totpSecret || !user.totpEnabledAt) {
    return jsonError("2FA is not enabled", 400);
  }

  const valid = verifyTotp(user.totpSecret, parsed.data.code);
  if (!valid) {
    return jsonError("Invalid code", 400);
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      totpSecret: null,
      totpEnabledAt: null,
      recoveryCodes: [],
    },
  });

  await audit({
    userId: auth.userId,
    entityType: "user",
    entityId: auth.userId,
    action: "user.2fa_disable",
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({ ok: true });
}
