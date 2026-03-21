"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getSyncCode } from "@/lib/deviceId";
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
    const syncCode = getSyncCode();
    if (!syncCode) return;
    setSyncStatus("syncing");
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("device_id", syncCode)
      .eq("month", month)
      .eq("year", year)
      .is("deleted_at", null)
      .order("day", { ascending: true });

    if (error) {
      console.error("Fetch expenses error:", error);
      setSyncStatus("error");
    } else {
      setExpenses(
        (data ?? []).map((row) => ({
          id: row.id,
          category: row.category as CategoryId,
          amount: row.amount,
          day: row.day,
          month: row.month,
          year: row.year,
          remark: row.remark ?? undefined,
          isRecurring: row.is_recurring ?? false,
          recurringId: row.recurring_id ?? undefined,
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: new Date(row.updated_at).getTime(),
          deletedAt: null,
          deviceId: "",
        }))
      );
      setSyncStatus("synced");
    }
    setLoading(false);
  }, [month, year]);

  // Initial fetch + realtime subscription + global change listener
  useEffect(() => {
    fetchExpenses();

    // Listen for changes from other useExpenses instances (e.g. modal)
    expenseListeners.add(fetchExpenses);

    const syncCode = getSyncCode();
    const channel = syncCode
      ? supabase
          .channel(`expenses-${syncCode}-${month}-${year}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "expenses",
              filter: `device_id=eq.${syncCode}`,
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
    const insertData: Record<string, unknown> = {
      category: input.category,
      amount: input.amount,
      day: input.day,
      month: input.month,
      year: input.year,
      remark: input.remark || null,
      device_id: getSyncCode(),
    };
    if (input.isRecurring) insertData.is_recurring = true;
    if (input.recurringId) insertData.recurring_id = input.recurringId;
    const { error } = await supabase.from("expenses").insert(insertData);
    if (error) throw error;
    notifyExpenseChange();
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseInput>) => {
    // Optimistic update
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    const { error } = await supabase
      .from("expenses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      fetchExpenses();
      throw error;
    }
    notifyExpenseChange();
  };

  const deleteExpense = async (id: string) => {
    // Optimistic removal
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase
      .from("expenses")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      fetchExpenses();
      throw error;
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
  };
}
