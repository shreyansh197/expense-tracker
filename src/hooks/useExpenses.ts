"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getSyncCode } from "@/lib/deviceId";
import type { Expense, ExpenseInput, CategoryId, SyncStatus } from "@/types";

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

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchExpenses();

    const channel = supabase
      .channel(`expenses-${month}-${year}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        () => {
          // Re-fetch on any change (simple and reliable)
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, year, fetchExpenses]);

  const addExpense = async (input: ExpenseInput) => {
    const { error } = await supabase.from("expenses").insert({
      category: input.category,
      amount: input.amount,
      day: input.day,
      month: input.month,
      year: input.year,
      remark: input.remark || null,
      device_id: getSyncCode(),
    });
    if (error) throw error;
    fetchExpenses();
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
      fetchExpenses(); // Revert on error
      throw error;
    }
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
      fetchExpenses(); // Revert on error
      throw error;
    }
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
