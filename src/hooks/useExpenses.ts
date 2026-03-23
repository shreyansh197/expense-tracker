"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
import { makeIdempotencyKey, enqueueOfflineMutation } from "@/lib/syncClient";
import { supabase } from "@/lib/supabase";
import type { Expense, ExpenseInput, CategoryId, SyncStatus } from "@/types";

// Global event to trigger re-fetch across all useExpenses instances
const expenseListeners = new Set<() => void>();
function notifyExpenseChange() {
  expenseListeners.forEach((fn) => fn());
}

export function useExpenses(month: number, year: number) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  const fetchExpenses = useCallback(async () => {
    const wid = getActiveWorkspaceId();
    if (!wid) return;
    setSyncStatus("syncing");

    try {
      const params = new URLSearchParams({ workspaceId: wid });
      const res = await authFetch(`/api/sync/changes?${params}`);
      if (!res.ok) {
        setSyncStatus("error");
        setLoading(false);
        return;
      }
      const data = await res.json();
      const all: Expense[] = (data.changes?.expenses ?? [])
        .filter((e: Record<string, unknown>) => !e.deletedAt)
        .filter((e: Record<string, unknown>) => e.month === month && e.year === year)
        .map((row: Record<string, unknown>) => ({
          id: row.id as string,
          category: row.category as CategoryId,
          amount: Number(row.amount),
          day: row.day as number,
          month: row.month as number,
          year: row.year as number,
          remark: (row.remark as string) ?? undefined,
          isRecurring: (row.isRecurring as boolean) ?? false,
          recurringId: (row.recurringId as string) ?? undefined,
          createdAt: new Date(row.createdAt as string).getTime(),
          updatedAt: new Date(row.updatedAt as string).getTime(),
          deletedAt: null,
          deviceId: "",
        }));
      // Sort by day ascending
      all.sort((a, b) => a.day - b.day);
      setExpenses(all);
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
    setLoading(false);
  }, [month, year]);

  // Initial fetch + realtime subscription + global change listener
  useEffect(() => {
    fetchExpenses();

    expenseListeners.add(fetchExpenses);

    const wid = getActiveWorkspaceId();
    const channel = wid
      ? supabase
          .channel(`expenses-${wid}-${month}-${year}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "expenses",
              filter: `workspace_id=eq.${wid}`,
            },
            () => {
              fetchExpenses();
            }
          )
          .subscribe()
      : null;

    return () => {
      expenseListeners.delete(fetchExpenses);
      if (channel) supabase.removeChannel(channel);
    };
  }, [month, year, fetchExpenses]);

  const addExpense = async (input: ExpenseInput) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimistic: Expense = {
      id: tempId,
      category: input.category as CategoryId,
      amount: input.amount,
      day: input.day,
      month: input.month,
      year: input.year,
      remark: input.remark,
      isRecurring: input.isRecurring ?? false,
      recurringId: input.recurringId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      deviceId: "",
    };
    setExpenses((prev) => [...prev, optimistic]);

    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "expenses" as const,
      operation: "upsert" as const,
      data: {
        category: input.category,
        amount: input.amount,
        day: input.day,
        month: input.month,
        year: input.year,
        remark: input.remark || null,
        isRecurring: input.isRecurring ?? false,
        recurringId: input.recurringId || null,
      },
      idempotencyKey: makeIdempotencyKey(),
    };

    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations: [mutation] }),
      });
      if (!res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== tempId));
        throw new Error("Failed to add expense");
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      setExpenses((prev) => prev.filter((e) => e.id !== tempId));
      throw err;
    }
    notifyExpenseChange();
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseInput>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "expenses" as const,
      operation: "upsert" as const,
      id,
      data: { ...updates },
      idempotencyKey: makeIdempotencyKey(),
    };

    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations: [mutation] }),
      });
      if (!res.ok) {
        fetchExpenses();
        throw new Error("Failed to update expense");
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      fetchExpenses();
      throw err;
    }
    notifyExpenseChange();
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "expenses" as const,
      operation: "delete" as const,
      id,
      data: {},
      idempotencyKey: makeIdempotencyKey(),
    };

    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations: [mutation] }),
      });
      if (!res.ok) {
        fetchExpenses();
        throw new Error("Failed to delete expense");
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      fetchExpenses();
      throw err;
    }
    notifyExpenseChange();
  };

  const deleteExpenses = async (ids: string[]) => {
    const idSet = new Set(ids);
    setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutations = ids.map((id) => ({
      table: "expenses" as const,
      operation: "delete" as const,
      id,
      data: {},
      idempotencyKey: makeIdempotencyKey(),
    }));

    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations }),
      });
      if (!res.ok) {
        fetchExpenses();
        throw new Error("Failed to delete expenses");
      }
    } catch (err) {
      mutations.forEach((m) => enqueueOfflineMutation(m));
      fetchExpenses();
      throw err;
    }
    notifyExpenseChange();
  };

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
