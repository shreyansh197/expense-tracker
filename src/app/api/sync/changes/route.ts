import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, requireWorkspaceMember, jsonError } from "@/lib/server/guards";
import { ensureSyncColumns } from "@/lib/server/ensureSyncColumns";

/**
 * GET /api/sync/changes?workspaceId=...&since=ISO8601
 *
 * Returns all rows changed after `since` for each domain table,
 * scoped to workspaceId. Returns soft-deleted rows too (so clients
 * can remove them locally).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return jsonError("Unauthorized", 401);

    const url = req.nextUrl;
    const workspaceId = url.searchParams.get("workspaceId") ?? auth.workspaceId;
    const sinceRaw = url.searchParams.get("since");
    const since = sinceRaw ? new Date(sinceRaw) : new Date(0);

    // Verify membership
    const member = await requireWorkspaceMember(auth.userId, workspaceId);
    if (!member) return jsonError("Not a member of this workspace", 403);

    // Ensure all required columns exist (idempotent, runs once per cold start)
    await ensureSyncColumns();

    // Fetch changed rows across all domain tables in parallel
    const [expenses, settings, ledgers, payments] = await Promise.all([
      prisma.expense.findMany({
        where: { workspaceId, updatedAt: { gt: since } },
        orderBy: { updatedAt: "asc" },
        take: 500,
      }),
      prisma.workspaceSettings.findFirst({
        where: { workspaceId, updatedAt: { gt: since } },
      }),
      prisma.businessLedger.findMany({
        where: { workspaceId, updatedAt: { gt: since } },
        orderBy: { updatedAt: "asc" },
        take: 200,
      }),
      prisma.businessPayment.findMany({
        where: { workspaceId, updatedAt: { gt: since } },
        orderBy: { updatedAt: "asc" },
        take: 500,
      }),
    ]);

    // Compute new cursor (max updatedAt across all rows)
    const allDates = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...expenses.map((e: any) => e.updatedAt),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...ledgers.map((l: any) => l.updatedAt),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...payments.map((p: any) => p.updatedAt),
      ...(settings ? [settings.updatedAt] : []),
    ];
    const cursor =
      allDates.length > 0
        ? new Date(Math.max(...allDates.map((d) => d.getTime()))).toISOString()
        : since.toISOString();

    const hasMore =
      expenses.length === 500 ||
      ledgers.length === 200 ||
      payments.length === 500;

    console.log(`[sync/changes] workspace=${workspaceId.slice(0,8)}… since=${since.toISOString()} → ${expenses.length} expenses, ${settings ? 1 : 0} settings, ${ledgers.length} ledgers, ${payments.length} payments`);

    return NextResponse.json({
      cursor,
      hasMore,
      changes: {
        expenses: expenses.map(serializeExpense),
        settings: settings ? serializeSettings(settings) : null,
        businessLedgers: ledgers.map(serializeLedger),
        businessPayments: payments.map(serializePayment),
      },
    });
  } catch (err) {
    console.error("[sync/changes] UNHANDLED ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// Serializers — convert Decimal to number, BigInt to string, etc.

function serializeExpense(e: Record<string, unknown>) {
  return {
    ...e,
    amount: Number(e.amount),
    createdAt: (e.createdAt as Date).toISOString(),
    updatedAt: (e.updatedAt as Date).toISOString(),
    deletedAt: e.deletedAt ? (e.deletedAt as Date).toISOString() : null,
  };
}

function serializeSettings(s: Record<string, unknown>) {
  return {
    ...s,
    salary: Number(s.salary),
    updatedAt: (s.updatedAt as Date).toISOString(),
  };
}

function serializeLedger(l: Record<string, unknown>) {
  return {
    ...l,
    expectedAmount: Number(l.expectedAmount),
    createdAt: (l.createdAt as Date).toISOString(),
    updatedAt: (l.updatedAt as Date).toISOString(),
    deletedAt: l.deletedAt ? (l.deletedAt as Date).toISOString() : null,
    dueDate: l.dueDate ? (l.dueDate as Date).toISOString() : null,
  };
}

function serializePayment(p: Record<string, unknown>) {
  return {
    ...p,
    amount: Number(p.amount),
    date: (p.date as Date).toISOString(),
    createdAt: (p.createdAt as Date).toISOString(),
    updatedAt: (p.updatedAt as Date).toISOString(),
    deletedAt: p.deletedAt ? (p.deletedAt as Date).toISOString() : null,
  };
}
