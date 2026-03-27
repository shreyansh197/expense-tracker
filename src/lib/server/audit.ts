import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

type AuditAction =
  | "user.register"
  | "user.login"
  | "user.logout"
  | "user.2fa_enable"
  | "user.2fa_disable"
  | "user.passkey_add"
  | "user.passkey_remove"
  | "workspace.create"
  | "workspace.update"
  | "invite.create"
  | "invite.accept"
  | "invite.revoke"
  | "device_link.create"
  | "device_link.accept"
  | "member.remove"
  | "device.revoke"
  | "session.revoke"
  | "user.delete_account"
  | "migration.sync_code";

export async function audit(params: {
  userId?: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  meta?: Record<string, unknown>;
  ipHash?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      meta: (params.meta as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      ipHash: params.ipHash ?? null,
    },
  });
}
