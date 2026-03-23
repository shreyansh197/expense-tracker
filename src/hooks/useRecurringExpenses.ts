"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useExpenses } from "@/hooks/useExpenses";
import type { RecurringExpense } from "@/types";

const APPLIED_KEY = "expense-tracker-recurring-applied";

function getAppliedKey(recurringId: string, month: number, year: number): string {
  return `${recurringId}:${month}:${year}`;
}

function getAppliedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(APPLIED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function markApplied(key: string) {
  const set = getAppliedSet();
  set.add(key);
  localStorage.setItem(APPLIED_KEY, JSON.stringify([...set]));
}

export function useRecurringExpenses(month: number, year: number) {
  const { settings } = useSettings();
  const { addExpense, expenses, loading } = useExpenses(month, year);
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    if (loading) return;
    const recurring = settings.recurringExpenses || [];
    const active = recurring.filter((r: RecurringExpense) => r.active);
    if (active.length === 0) return;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (month !== currentMonth || year !== currentYear) return;

    const today = now.getDate();
    const applied = getAppliedSet();

    const candidates = active.filter((r: RecurringExpense) => {
      const key = getAppliedKey(r.id, month, year);
      return r.day <= today && !applied.has(key);
    });

    if (candidates.length === 0) return;

    appliedRef.current = true;

    // Apply recurring expenses — dedup using already-fetched expenses list
    (async () => {
      for (const r of candidates) {
        try {
          // Check if this recurring expense already exists in the fetched data
          const alreadyExists = expenses.some(
            (e) => e.recurringId === r.id && !e.deletedAt
          );

          if (alreadyExists) {
            markApplied(getAppliedKey(r.id, month, year));
            continue;
          }

          await addExpense({
            category: r.category,
            amount: r.amount,
            day: r.day,
            month,
            year,
            remark: r.remark,
            isRecurring: true,
            recurringId: r.id,
          });
          markApplied(getAppliedKey(r.id, month, year));
        } catch {
          // Silently fail — will retry next time
        }
      }
    })();
  }, [settings.recurringExpenses, month, year, addExpense, expenses, loading]);
}
