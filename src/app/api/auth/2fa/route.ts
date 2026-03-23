import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { generateTotpSecret } from "@/lib/server/totp";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

/** GET — retrieve TOTP setup info (secret + QR URI) */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { email: true, totpEnabledAt: true },
  });
  if (!user) return jsonError("User not found", 404);

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

/** DELETE — disable 2FA */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

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
