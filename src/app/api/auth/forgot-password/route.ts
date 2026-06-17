import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { signPasswordResetToken, hashIp } from "@/lib/server/tokens";
import { sendPasswordResetEmail } from "@/lib/server/email";
import { forgotPasswordSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/server/rateLimit";
import { getClientIp } from "@/lib/server/guards";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`forgot-pw:${hashIp(ip)}`, 3, 60_000);
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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({
    ok: true,
    message: "If an account exists with that email, a password reset link has been sent.",
  });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, deletedAt: true, passwordHash: true },
  });

  // No user, deleted user, or OAuth-only user (no password): return generic success
  if (!user || user.deletedAt) {
    return successResponse;
  }

  const resetToken = await signPasswordResetToken(user.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const resetLink = `${appUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

  try {
    await sendPasswordResetEmail(email, resetLink);
  } catch (err) {
    console.error("[Password Reset] Email send failed:", err);
    // Still return success to prevent email enumeration
  }

  return successResponse;
}
