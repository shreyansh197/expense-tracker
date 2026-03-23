import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, requireWorkspaceMember, jsonError } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";

interface Params {
  params: Promise<{ id: string }>;
}

/** DELETE — permanently delete all workspace data (expenses, ledgers, payments) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: workspaceId } = await params;

  // Must be a member with OWNER role
  const member = await requireWorkspaceMember(auth.userId, workspaceId);
  if (!member) return jsonError("Not a member of this workspace", 403);
  if (member.role !== "OWNER") return jsonError("Only workspace owners can delete data", 403);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    await tx.businessPayment.deleteMany({ where: { workspaceId } });
    await tx.businessLedger.deleteMany({ where: { workspaceId } });
    await tx.expense.deleteMany({ where: { workspaceId } });
    // Reset workspace settings to defaults
    await tx.workspaceSettings.updateMany({
      where: { workspaceId },
      data: {
        salary: 0,
        categories: [],
        customCategories: [],
        hiddenDefaults: [],
        categoryBudgets: {},
        recurringExpenses: [],
        savedFilters: [],
        goals: [],
        rolloverEnabled: false,
        rolloverHistory: {},
        businessMode: false,
        revenueExpectations: [],
        businessTags: [],
      },
    });
  });

  await audit({
    userId: auth.userId,
    entityType: "workspace",
    entityId: workspaceId,
    action: "workspace.update",
    meta: { action: "delete_all_data" },
    ipHash: hashIp(
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    ),
  });

  return NextResponse.json({ ok: true });
}
