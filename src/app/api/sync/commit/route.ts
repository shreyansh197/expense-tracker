import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, requireWorkspaceMember, jsonError } from "@/lib/server/guards";
import { syncCommitSchema } from "@/lib/validators";
import { ensureSyncColumns } from "@/lib/server/ensureSyncColumns";
import type { Prisma } from "@prisma/client";

type Json = Prisma.InputJsonValue;

/**
 * POST /api/sync/commit
 *
 * Batch upsert/delete mutations for a workspace. Each mutation carries
 * an idempotencyKey to prevent duplicate processing.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = syncCommitSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[sync/commit] Validation failed:", JSON.stringify(parsed.error.flatten()));
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { workspaceId, mutations } = parsed.data;
  console.log(`[sync/commit] Processing ${mutations.length} mutations for workspace=${workspaceId.slice(0,8)}…`);

  // Enforce membership
  const member = await requireWorkspaceMember(auth.userId, workspaceId);
  if (!member) return jsonError("Not a member of this workspace", 403);

  // Ensure all required columns exist (idempotent, runs once per cold start)
  await ensureSyncColumns();

  const results: { idempotencyKey: string; status: "applied" | "skipped" | "error"; id?: string; error?: string }[] = [];

  for (const mutation of mutations) {
    try {
      if (mutation.table === "expenses") {
        if (mutation.operation === "upsert") {
          const data = mutation.data as Record<string, unknown>;
          const expenseId = (mutation.id ?? data.id) as string | undefined;
          if (!expenseId) {
            results.push({ idempotencyKey: mutation.idempotencyKey, status: "error", error: "Missing expense id" });
            continue;
          }
          // Verify ownership: if expense exists, it must belong to this workspace
          const existingExpense = await prisma.expense.findUnique({ where: { id: expenseId }, select: { workspaceId: true } });
          if (existingExpense && existingExpense.workspaceId !== workspaceId) {
            results.push({ idempotencyKey: mutation.idempotencyKey, status: "error", error: "Access denied" });
            continue;
          }
          const record = await prisma.expense.upsert({
            where: { id: expenseId },
            create: {
              id: expenseId,
              workspaceId,
              category: data.category as string,
              amount: data.amount as number,
              currency: (data.currency as string) ?? null,
              day: data.day as number,
              month: data.month as number,
              year: data.year as number,
              remark: (data.remark as string) ?? null,
              isRecurring: (data.isRecurring as boolean) ?? false,
              recurringId: (data.recurringId as string) ?? null,
              version: 1,
            },
            update: {
              category: data.category as string | undefined,
              amount: data.amount as number | undefined,
              currency: data.currency !== undefined ? (data.currency as string | null) : undefined,
              day: data.day as number | undefined,
              month: data.month as number | undefined,
              year: data.year as number | undefined,
              remark: data.remark as string | undefined,
              isRecurring: data.isRecurring as boolean | undefined,
              recurringId: data.recurringId as string | undefined,
              deletedAt: data.deletedAt ? new Date(data.deletedAt as string) : undefined,
              version: { increment: 1 },
            },
          });
          results.push({ idempotencyKey: mutation.idempotencyKey, status: "applied", id: record.id });
        } else {
          // Soft delete — use updateMany to avoid P2025 if record doesn't exist
          await prisma.expense.updateMany({
            where: { id: mutation.id!, workspaceId },
            data: { deletedAt: new Date() },
          });
          results.push({ idempotencyKey: mutation.idempotencyKey, status: "applied", id: mutation.id! });
        }
      } else if (mutation.table === "workspace_settings") {
        const data = mutation.data as Record<string, unknown>;
        await prisma.workspaceSettings.upsert({
          where: { workspaceId },
          create: {
            workspaceId,
            salary: (data.salary as number) ?? 0,
            currency: (data.currency as string) ?? "INR",
            categories: data.categories ?? [],
            customCategories: data.customCategories ?? [],
            hiddenDefaults: data.hiddenDefaults ?? [],
            categoryBudgets: data.categoryBudgets ?? {},
            recurringExpenses: data.recurringExpenses ?? [],
            savedFilters: data.savedFilters ?? [],
            goals: data.goals ?? [],
            rolloverEnabled: (data.rolloverEnabled as boolean) ?? false,
            rolloverHistory: data.rolloverHistory ?? {},
            monthlyBudgets: data.monthlyBudgets ?? {},
            businessMode: (data.businessMode as boolean) ?? false,
            revenueExpectations: data.revenueExpectations ?? [],
            businessTags: data.businessTags ?? [],
            multiCurrencyEnabled: (data.multiCurrencyEnabled as boolean) ?? false,
            dashboardLayout: data.dashboardLayout ?? undefined,
            dismissedRecurringSuggestions: data.dismissedRecurringSuggestions ?? [],
            autoRules: data.autoRules ?? [],
            version: 1,
          },
          update: {
            ...(data.salary !== undefined && { salary: data.salary as number }),
            ...(data.currency !== undefined && { currency: data.currency as string }),
            ...(data.categories !== undefined && { categories: data.categories as Json }),
            ...(data.customCategories !== undefined && { customCategories: data.customCategories as Json }),
            ...(data.hiddenDefaults !== undefined && { hiddenDefaults: data.hiddenDefaults as Json }),
            ...(data.categoryBudgets !== undefined && { categoryBudgets: data.categoryBudgets as Json }),
            ...(data.recurringExpenses !== undefined && { recurringExpenses: data.recurringExpenses as Json }),
            ...(data.savedFilters !== undefined && { savedFilters: data.savedFilters as Json }),
            ...(data.goals !== undefined && { goals: data.goals as Json }),
            ...(data.rolloverEnabled !== undefined && { rolloverEnabled: data.rolloverEnabled as boolean }),
            ...(data.rolloverHistory !== undefined && { rolloverHistory: data.rolloverHistory as Json }),
            ...(data.monthlyBudgets !== undefined && { monthlyBudgets: data.monthlyBudgets as Json }),
            ...(data.businessMode !== undefined && { businessMode: data.businessMode as boolean }),
            ...(data.revenueExpectations !== undefined && { revenueExpectations: data.revenueExpectations as Json }),
            ...(data.businessTags !== undefined && { businessTags: data.businessTags as Json }),
            ...(data.multiCurrencyEnabled !== undefined && { multiCurrencyEnabled: data.multiCurrencyEnabled as boolean }),
            ...(data.dashboardLayout !== undefined && { dashboardLayout: data.dashboardLayout as Json }),
            ...(data.dismissedRecurringSuggestions !== undefined && { dismissedRecurringSuggestions: data.dismissedRecurringSuggestions as Json }),
            ...(data.autoRules !== undefined && { autoRules: data.autoRules as Json }),
            version: { increment: 1 },
          } as Prisma.WorkspaceSettingsUpdateInput,
        });
        results.push({ idempotencyKey: mutation.idempotencyKey, status: "applied", id: workspaceId });
      } else if (mutation.table === "business_ledgers") {
        if (mutation.operation === "upsert") {
          const data = mutation.data as Record<string, unknown>;
          const ledgerId = (mutation.id ?? data.id) as string | undefined;
          let record: { id: string };
          if (ledgerId) {
            // Verify ownership: if ledger exists, it must belong to this workspace
            const existingLedger = await prisma.businessLedger.findUnique({ where: { id: ledgerId }, select: { workspaceId: true } });
            if (existingLedger && existingLedger.workspaceId !== workspaceId) {
              results.push({ idempotencyKey: mutation.idempotencyKey, status: "error", error: "Access denied" });
              continue;
            }
            record = await prisma.businessLedger.upsert({
              where: { id: ledgerId },
              create: {
                id: ledgerId,
                workspaceId,
                name: data.name as string,
                expectedAmount: data.expectedAmount as number,
                currency: (data.currency as string) ?? "INR",
                status: (data.status as string) ?? "active",
                dueDate: data.dueDate ? new Date(data.dueDate as string) : null,
                tags: data.tags ?? [],
                notes: (data.notes as string) ?? "",
                version: 1,
              },
              update: {
                name: data.name as string | undefined,
                expectedAmount: data.expectedAmount as number | undefined,
                currency: data.currency as string | undefined,
                status: data.status as string | undefined,
                dueDate: data.dueDate ? new Date(data.dueDate as string) : undefined,
                tags: data.tags ?? undefined,
                notes: data.notes as string | undefined,
                deletedAt: data.deletedAt ? new Date(data.deletedAt as string) : undefined,
                version: { increment: 1 },
              },
            });
          } else {
            // New record — use create
            record = await prisma.businessLedger.create({
              data: {
                workspaceId,
                name: data.name as string,
                expectedAmount: data.expectedAmount as number,
                currency: (data.currency as string) ?? "INR",
                status: (data.status as string) ?? "active",
                dueDate: data.dueDate ? new Date(data.dueDate as string) : null,
                tags: data.tags ?? [],
                notes: (data.notes as string) ?? "",
                version: 1,
              },
            });
          }
          results.push({ idempotencyKey: mutation.idempotencyKey, status: "applied", id: record.id });
        } else {
          await prisma.businessLedger.updateMany({
            where: { id: mutation.id!, workspaceId },
            data: { deletedAt: new Date() },
          });
          results.push({ idempotencyKey: mutation.idempotencyKey, status: "applied", id: mutation.id! });
        }
      } else if (mutation.table === "business_payments") {
        if (mutation.operation === "upsert") {
          const data = mutation.data as Record<string, unknown>;
          const paymentId = (mutation.id ?? data.id) as string | undefined;
          let record: { id: string };
          if (paymentId) {
            // Validate ledger belongs to this workspace (for new records)
            const existingPayment = await prisma.businessPayment.findUnique({ where: { id: paymentId }, select: { id: true, workspaceId: true } });
            if (existingPayment && existingPayment.workspaceId !== workspaceId) {
              results.push({ idempotencyKey: mutation.idempotencyKey, status: "error", error: "Access denied" });
              continue;
            }
            if (!existingPayment && data.ledgerId) {
              const ledger = await prisma.businessLedger.findFirst({
                where: { id: data.ledgerId as string, workspaceId, deletedAt: null },
                select: { id: true },
              });
              if (!ledger) {
                results.push({ idempotencyKey: mutation.idempotencyKey, status: "error", error: "Ledger not found in workspace" });
                continue;
              }
            }
            record = await prisma.businessPayment.upsert({
              where: { id: paymentId },
              create: {
                id: paymentId,
                workspaceId,
                ledgerId: data.ledgerId as string,
                amount: data.amount as number,
                date: new Date(data.date as string),
                method: (data.method as string) ?? null,
                reference: (data.reference as string) ?? null,
                notes: (data.notes as string) ?? null,
                version: 1,
              },
              update: {
                amount: data.amount as number | undefined,
                date: data.date ? new Date(data.date as string) : undefined,
                method: data.method as string | undefined,
                reference: data.reference as string | undefined,
                notes: data.notes as string | undefined,
                deletedAt: data.deletedAt ? new Date(data.deletedAt as string) : undefined,
                version: { increment: 1 },
              },
            });
          } else {
            // Validate ledger belongs to this workspace
            const ledger = await prisma.businessLedger.findFirst({
              where: { id: data.ledgerId as string, workspaceId, deletedAt: null },
              select: { id: true },
            });
            if (!ledger) {
              results.push({ idempotencyKey: mutation.idempotencyKey, status: "error", error: "Ledger not found in workspace" });
              continue;
            }
            record = await prisma.businessPayment.create({
              data: {
                workspaceId,
                ledgerId: data.ledgerId as string,
                amount: data.amount as number,
                date: new Date(data.date as string),
                method: (data.method as string) ?? null,
                reference: (data.reference as string) ?? null,
                notes: (data.notes as string) ?? null,
                version: 1,
              },
            });
          }
          results.push({ idempotencyKey: mutation.idempotencyKey, status: "applied", id: record.id });
        } else {
          await prisma.businessPayment.updateMany({
            where: { id: mutation.id!, workspaceId },
            data: { deletedAt: new Date() },
          });
          results.push({ idempotencyKey: mutation.idempotencyKey, status: "applied", id: mutation.id! });
        }
      }
    } catch (err) {
      console.error(`[sync/commit] Error processing mutation ${mutation.table}:${mutation.operation}:`, err);
      results.push({
        idempotencyKey: mutation.idempotencyKey,
        status: "error",
        error: "Failed to process mutation",
      });
    }
  }

  console.log(`[sync/commit] Results:`, results.map(r => `${r.status}${r.error ? ':'+r.error : ''}`).join(', '));
  return NextResponse.json({ results });
}
