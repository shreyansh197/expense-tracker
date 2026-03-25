import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Apple Sign-In is not configured." }, { status: 501 });
}
