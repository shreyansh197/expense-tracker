"use client";

import { useState, useEffect, useCallback } from "react";
import { differenceInCalendarDays } from "date-fns";
import type { Expense } from "@/types";

export interface EchoData {
  daysAgo: number;
  lastAmount: number;
  diff: number;
  category: string;
  remark?: string;
}

/**
 * After an expense is logged, finds the most recent prior expense in the
 * same category and returns a brief "echo" comparison to display to the user.
 * Auto-clears after `ttlMs` milliseconds (default 2500ms).
 *
 * Suppressed on business routes to keep the business ledger flow clean.
 */
export function useEcho(expenses: Expense[], ttlMs = 2500) {
  const [echo, setEcho] = useState<EchoData | null>(null);

  const triggerEcho = useCallback(
    (newExpense: Expense) => {
      const prior = expenses
        .filter(
          (e) =>
            !e.deletedAt &&
            e.id !== newExpense.id &&
            e.category === newExpense.category,
        )
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      if (!prior) return;

      const daysAgo = differenceInCalendarDays(
        new Date(),
        new Date(prior.createdAt),
      );

      // Only show echo if the last transaction was within 60 days
      if (daysAgo > 60) return;

      setEcho({
        daysAgo,
        lastAmount: prior.amount,
        diff: newExpense.amount - prior.amount,
        category: newExpense.category,
        remark: prior.remark,
      });
    },
    [expenses],
  );

  // Auto-clear after TTL
  useEffect(() => {
    if (!echo) return;
    const id = setTimeout(() => setEcho(null), ttlMs);
    return () => clearTimeout(id);
  }, [echo, ttlMs]);

  const clearEcho = useCallback(() => setEcho(null), []);

  return { echo, triggerEcho, clearEcho };
}
