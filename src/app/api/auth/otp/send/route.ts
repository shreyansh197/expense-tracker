import { NextResponse } from "next/server";

/**
 * POST /api/auth/otp/send
 * OTP sending is now handled entirely client-side by the Firebase JS SDK.
 * This stub exists only so the middleware PUBLIC_PATHS entry stays valid.
 */
export async function POST() {
  return NextResponse.json(
    { error: "OTP is sent client-side via Firebase SDK." },
    { status: 410 },
  );
}
