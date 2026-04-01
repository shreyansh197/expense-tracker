import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";
import { changePasswordSchema } from "@/lib/validators";

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body", 400);

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("New password must be 8–72 characters", 400);
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { passwordHash: true, googleId: true },
  });

  if (!user) return jsonError("User not found", 404);

  // If user has a password, they must provide currentPassword
  if (user.passwordHash) {
    if (!currentPassword) {
      return jsonError("Current password is required", 400);
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return jsonError("Current password is incorrect", 403);
    }
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: auth.userId },
    data: { passwordHash: hashed },
  });

  const ipHash = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
  );

  await audit({
    userId: auth.userId,
    entityType: "user",
    entityId: auth.userId,
    action: "user.change_password",
    ipHash,
  });

  return NextResponse.json({ ok: true });
}
