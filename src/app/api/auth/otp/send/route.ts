import { NextRequest, NextResponse } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/server/prisma";

/** Normalize to E.164 format, basic validation */
function normalizePhone(raw: string): string | null {
  const stripped = raw.replace(/[\s\-().]/g, "");
  // Must start with + and have 7-15 digits
  if (!/^\+\d{7,15}$/.test(stripped)) return null;
  return stripped;
}

function hashOtp(otp: string, phone: string): string {
  return createHash("sha256").update(`${otp}:${phone}`).digest("hex");
}

async function sendSmsTwilio(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    throw new Error("SMS provider not configured");
  }

  const credentials = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[otp/send] Twilio error", err);
    throw new Error((err as { message?: string }).message || "SMS failed");
  }
}

/**
 * POST /api/auth/otp/send
 * Body: { phone: string }  — E.164 format, e.g. "+919876543210"
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawPhone = (body as { phone?: unknown }).phone;
  if (typeof rawPhone !== "string") {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return NextResponse.json(
      { error: "Invalid phone number. Use international format, e.g. +919876543210" },
      { status: 400 },
    );
  }

  // Rate-limit: max 1 OTP per 60s per phone
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = await (prisma as any).phoneOtp.findFirst({
    where: {
      phone,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recent) {
    const waitSec = Math.ceil(
      60 - (Date.now() - new Date(recent.createdAt).getTime()) / 1000,
    );
    return NextResponse.json(
      { error: `Please wait ${waitSec}s before requesting another code.` },
      { status: 429 },
    );
  }

  // Generate 6-digit OTP
  const otp = String(randomInt(100_000, 999_999));
  const otpHash = hashOtp(otp, phone);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).phoneOtp.create({
    data: { phone, otpHash, expiresAt },
  });

  try {
    await sendSmsTwilio(phone, `Your ExpenseTracker code is: ${otp}. Valid for 10 minutes.`);
  } catch (err) {
    console.error("[otp/send]", err);
    return NextResponse.json(
      { error: "Failed to send SMS. Please check the number and try again." },
      { status: 503 },
    );
  }

  return NextResponse.json({ sent: true });
}
