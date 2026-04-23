import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { verifyPasswordResetToken, hashIp } from "@/lib/server/tokens";
import { hashPassword } from "@/lib/server/password";
import { audit } from "@/lib/server/audit";
import { resetPasswordSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/server/rateLimit";
import { getClientIp } from "@/lib/server/guards";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`reset-pw:${hashIp(ip)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { token, newPassword } = parsed.data;

  let userId: string;
  try {
    userId = await verifyPasswordResetToken(token);
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired reset link. Please request a new one." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return NextResponse.json(
      { error: "Invalid or expired reset link. Please request a new one." },
      { status: 400 },
    );
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashed },
  });

  // Revoke all existing sessions for security
  await prisma.session.updateMany({
    where: { device: { userId }, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const ipHash = hashIp(ip);
  await audit({
    userId,
    entityType: "user",
    entityId: userId,
    action: "user.reset_password",
    ipHash,
  });

  return NextResponse.json({ ok: true });
}
