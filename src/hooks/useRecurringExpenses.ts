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

export function useRecurringExpenses(month: number, year: number) {
  const { settings } = useSettings();
  const { addExpense, expenses, loading } = useExpenses(month, year);
  const { toast } = useToast();
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

    // Apply recurring expenses — query IDB directly each iteration to
    // avoid stale-closure duplicates when multiple candidates are processed.
    (async () => {
      let appliedCount = 0;
      for (const r of candidates) {
        try {
          const key = getAppliedKey(r.id, month, year);

          // Mark applied BEFORE writing to prevent re-entry from effect re-runs
          markApplied(key);

          // Fresh IDB check — authoritative, not a stale React snapshot
          const wid = getActiveWorkspaceId();
          const freshExpenses = wid
            ? await db.expenses
                .where("[workspaceId+month+year]")
                .equals([wid, month, year])
                .toArray()
            : expenses;

          const alreadyExists = freshExpenses.some(
            (e) => e.recurringId === r.id && !e.deletedAt
          );

          if (alreadyExists) {
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
          appliedCount++;
        } catch {
          // Silently fail — will retry next time
        }
      }
      if (appliedCount > 0) {
        toast(`Applied ${appliedCount} recurring expense${appliedCount > 1 ? "s" : ""}`);
      }
    })();
  }, [settings.recurringExpenses, month, year, addExpense, expenses, loading, toast]);
}
