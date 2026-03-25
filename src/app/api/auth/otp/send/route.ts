import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/** Normalize to E.164 format, basic validation */
function normalizePhone(raw: string): string | null {
  const stripped = raw.replace(/[\s\-().]/g, "");
  if (!/^\+\d{7,15}$/.test(stripped)) return null;
  return stripped;
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

  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    console.error("[otp/send] Supabase error", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to send SMS. Please try again." },
      { status: 503 },
    );
  }

  return NextResponse.json({ sent: true });
}
