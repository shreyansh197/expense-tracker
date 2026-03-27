import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const ipHash = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
  );

  // Audit before deletion (user row will be cascade-deleted)
  await audit({
    userId: auth.userId,
    entityType: "user",
    entityId: auth.userId,
    action: "user.delete_account",
    ipHash,
  });

  // Hard-delete — Prisma cascades remove all related data:
  // workspaces, expenses, ledgers, payments, sessions, devices,
  // memberships, passkeys, invites, device links, sync cursors,
  // workspace settings. AuditLog.userId is set to null (SetNull).
  await prisma.user.delete({ where: { id: auth.userId } });

  return NextResponse.json({ ok: true });
}
