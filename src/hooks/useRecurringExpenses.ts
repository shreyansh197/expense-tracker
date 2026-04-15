"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/components/ui/Toast";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/lib/authClient";
import type { RecurringExpense } from "@/types";

const APPLIED_KEY = "expenstream-recurring-applied";

function getAppliedKey(recurringId: string, month: number, year: number): string {
  return `${recurringId}:${month}:${year}`;
}

function getAppliedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(APPLIED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function markApplied(key: string) {
  if (typeof window === "undefined") return;
  const set = getAppliedSet();
  set.add(key);
  localStorage.setItem(APPLIED_KEY, JSON.stringify([...set]));
}

// Module-level in-flight set: survives React remounts and StrictMode
// double-invocations. Prevents concurrent effect runs from both
// passing the IDB check and writing the same recurring expense twice.
const _inFlight = new Set<string>();

export function useRecurringExpenses(month: number, year: number) {
  const { settings } = useSettings();
  const { addExpense, loading } = useExpenses(month, year);
  const { toast } = useToast();
  // Stable ref to addExpense so it never triggers the effect dependency
  const addExpenseRef = useRef(addExpense);
  useEffect(() => { addExpenseRef.current = addExpense; }, [addExpense]);

  useEffect(() => {
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
      return r.day <= today && !applied.has(key) && !_inFlight.has(key);
    });

    if (candidates.length === 0) return;

    // Claim all candidates atomically before any async work
    for (const r of candidates) {
      _inFlight.add(getAppliedKey(r.id, month, year));
    }

    (async () => {
      let appliedCount = 0;
      for (const r of candidates) {
        try {
          const key = getAppliedKey(r.id, month, year);

          // Mark applied in localStorage BEFORE writing to IDB to prevent
          // re-entry from any effect re-run triggered by the IDB write
          markApplied(key);

          // Authoritative IDB check — guards against a second device or tab
          // that already wrote the expense before our localStorage was set
          const wid = getActiveWorkspaceId();
          if (wid) {
            const freshExpenses = await db.expenses
              .where("[workspaceId+month+year]")
              .equals([wid, month, year])
              .toArray();

            const alreadyExists = freshExpenses.some(
              (e) => e.recurringId === r.id && !e.deletedAt
            );

            if (alreadyExists) continue;
          }

          await addExpenseRef.current({
            category: r.category,
            amount: r.amount,
            day: r.day,
            month,
            year,
            remark: r.remark,
            isRecurring: true,
            recurringId: r.id,
          });
          appliedCount++;
        } catch {
          // Silently fail — will retry next time
        } finally {
          _inFlight.delete(getAppliedKey(r.id, month, year));
        }
      }
      if (appliedCount > 0) {
        toast(`Applied ${appliedCount} recurring expense${appliedCount > 1 ? "s" : ""}`);
      }
    })();
  // Intentionally omit `addExpense` and `expenses` — addExpense is accessed
  // via stable ref, and including `expenses` would re-fire after every IDB
  // write causing duplicates. `loading` is kept so we don't run before data loads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.recurringExpenses, month, year, loading, toast]);
}
