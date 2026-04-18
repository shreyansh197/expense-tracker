import { NextResponse } from "next/server";

/**
 * GET /api/push/vapid-key
 * Returns the VAPID public key for the browser to subscribe.
 */
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
