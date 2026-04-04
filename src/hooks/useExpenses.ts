"use client";

import { useCallback } from "react";
import { getActiveWorkspaceId } from "@/lib/authClient";
import { db } from "@/lib/db";
import {
  makeIdempotencyKey,
  enqueueMutation,
  trySyncPush,
  generateUUID,
} from "@/lib/syncEngine";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import type { Expense, ExpenseInput, CategoryId, SyncStatus } from "@/types";

const EMPTY: Expense[] = [];

function toExpense(row: { id: string; category: string; amount: number; currency?: string; day: number; month: number; year: number; remark?: string; isRecurring: boolean; recurringId?: string; createdAt: number; updatedAt: number; deletedAt: number | null | undefined }): Expense {
  return {
    id: row.id,
    category: row.category as CategoryId,
    amount: row.amount,
    currency: row.currency,
    day: row.day,
    month: row.month,
    year: row.year,
    remark: row.remark,
    isRecurring: row.isRecurring ?? false,
    recurringId: row.recurringId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
    deviceId: "",
  };
}

export function useExpenses(month: number, year: number) {
  const wid = getActiveWorkspaceId();

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

    trySyncPush(workspace, true);
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<ExpenseInput>) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    // Optimistic IDB update
    const existing = await db.expenses.get(id);
    if (existing) {
      await db.expenses.put({ ...existing, ...updates, updatedAt: Date.now() });
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

    // Optimistic IDB delete
    await db.expenses.delete(id);

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
