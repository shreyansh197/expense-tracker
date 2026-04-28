"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getActiveWorkspaceId, subscribeAuth } from "@/lib/authClient";
import { db } from "@/lib/db";
import {
  makeIdempotencyKey,
  enqueueMutation,
  trySyncPush,
  generateUUID,
} from "@/lib/syncEngine";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import { toExpense } from "@/lib/mappers";
import type { Expense, ExpenseInput, SyncStatus } from "@/types";

/** Invalidate the calc cache entry for a given month/year. */
function invalidateCalcCache(wid: string, month: number, year: number) {
  db.calcCache.delete(`${wid}-${month}-${year}`).catch(() => {});
}

const EMPTY: Expense[] = [];

export function useExpenses(month: number, year: number) {
  // Reactively subscribe to auth state so the hook re-runs when workspaceId
  // becomes available (e.g. after SSR hydration or delayed auth init).
  const wid = useSyncExternalStore(subscribeAuth, getActiveWorkspaceId, () => null);

  const queryResult = useDexieQuery(
    async () => {
      if (!wid) return EMPTY;
      const rows = await db.expenses
        .where("[workspaceId+month+year]")
        .equals([wid, month, year])
        .toArray();
      return rows
        .filter(r => !r.deletedAt)
        .map(toExpense)
        .sort((a, b) => a.day - b.day);
    },
    [wid, month, year],
    EMPTY,
  );

  const expenses = queryResult;
  const loading = queryResult === EMPTY && wid !== null;
  const syncStatus: SyncStatus = "synced";

  const addExpense = useCallback(async (input: ExpenseInput) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    const id = generateUUID();

    // Write directly to IDB — useDexieQuery auto-updates
    await db.expenses.put({
      id,
      workspaceId: workspace,
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      day: input.day,
      month: input.month,
      year: input.year,
      remark: input.remark,
      isRecurring: input.isRecurring ?? false,
      recurringId: input.recurringId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });

    // Enqueue mutation for server sync
    await enqueueMutation({
      table: "expenses",
      operation: "upsert",
      id,
      data: {
        category: input.category,
        amount: input.amount,
        currency: input.currency || null,
        day: input.day,
        month: input.month,
        year: input.year,
        remark: input.remark || null,
        isRecurring: input.isRecurring ?? false,
        recurringId: input.recurringId || null,
      },
      idempotencyKey: makeIdempotencyKey(),
    }, workspace);

    invalidateCalcCache(workspace, input.month, input.year);
    trySyncPush(workspace, true);
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<ExpenseInput>) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    // Optimistic IDB update
    const existing = await db.expenses.get(id);
    if (existing) {
      invalidateCalcCache(workspace, existing.month, existing.year);
      await db.expenses.put({ ...existing, ...updates, updatedAt: Date.now() });
      if (updates.month || updates.year) {
        invalidateCalcCache(workspace, updates.month ?? existing.month, updates.year ?? existing.year);
      }
    }

    await enqueueMutation({
      table: "expenses",
      operation: "upsert",
      id,
      data: { ...updates },
      idempotencyKey: makeIdempotencyKey(),
    }, workspace);

    trySyncPush(workspace, true);
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    // Read the expense before deleting to get its month/year for cache invalidation
    const existing = await db.expenses.get(id);

    // Optimistic IDB delete
    await db.expenses.delete(id);

    if (existing) invalidateCalcCache(workspace, existing.month, existing.year);

    await enqueueMutation({
      table: "expenses",
      operation: "delete",
      id,
      data: {},
      idempotencyKey: makeIdempotencyKey(),
    }, workspace);

    trySyncPush(workspace, true);
  }, []);

  const deleteExpenses = useCallback(async (ids: string[]) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    // Read expenses before deleting for cache invalidation
    const existing = await db.expenses.bulkGet(ids);
    const invalidated = new Set<string>();
    for (const e of existing) {
      if (e) {
        const key = `${e.month}-${e.year}`;
        if (!invalidated.has(key)) {
          invalidated.add(key);
          invalidateCalcCache(workspace, e.month, e.year);
        }
      }
    }

    // Optimistic IDB delete
    await db.expenses.bulkDelete(ids);

    for (const id of ids) {
      await enqueueMutation({
        table: "expenses",
        operation: "delete",
        id,
        data: {},
        idempotencyKey: makeIdempotencyKey(),
      }, workspace);
    }

    trySyncPush(workspace, true);
  }, []);

  return {
    expenses,
    allExpenses: expenses,
    loading,
    syncStatus,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteExpenses,
  };
}
