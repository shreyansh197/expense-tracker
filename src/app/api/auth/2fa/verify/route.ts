import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { verifyTotp, generateRecoveryCodes } from "@/lib/server/totp";
import { audit } from "@/lib/server/audit";
import { hashIp, hashToken } from "@/lib/server/tokens";
import { totpVerifySchema } from "@/lib/validators";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`2fa-enable:${hashIp(ip)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

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
    return jsonError("Invalid code format", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { totpSecret: true, totpEnabledAt: true },
  });

  if (!user?.totpSecret) {
    return jsonError("TOTP not set up. Call GET /api/auth/2fa first.", 400);
  }

  const valid = verifyTotp(user.totpSecret, parsed.data.code);
  if (!valid) {
    return jsonError("Invalid TOTP code", 400);
  }

  // If not yet enabled, activate it now
  if (!user.totpEnabledAt) {
    const codes = generateRecoveryCodes();
    const hashedCodes = codes.map((c) => hashToken(c));
    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        totpEnabledAt: new Date(),
        recoveryCodes: hashedCodes,
      },
    });

    await audit({
      userId: auth.userId,
      entityType: "user",
      entityId: auth.userId,
      action: "user.2fa_enable",
      ipHash: hashIp(
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      ),
    });

    return NextResponse.json({
      enabled: true,
      recoveryCodes: codes,
    });
  }

  // Already enabled — this is a verification call (e.g. during login)
  return NextResponse.json({ verified: true });
}
