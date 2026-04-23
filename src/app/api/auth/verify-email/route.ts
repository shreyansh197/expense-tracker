import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { hashToken } from "@/lib/server/tokens";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const tokenHash = hashToken(token);

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.type !== "email_verify") {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  if (record.usedAt) {
    return NextResponse.json({ error: "Token already used" }, { status: 400 });
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ verified: true });
}
