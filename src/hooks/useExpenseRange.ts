"use client";

import { useDexieQuery } from "@/hooks/useDexieQuery";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/lib/authClient";
import { toExpense } from "@/lib/mappers";
import type { Expense } from "@/types";

const EMPTY: Expense[] = [];

/**
 * Live, non-deleted expenses for a list of calendar months in the active
 * workspace. Unlike `useHistoricalData` (which serves cached month summaries
 * without line items), this always returns raw expenses, so day-level charts
 * such as the rolling average see every day in their range.
 */
export function useExpenseRange(months: readonly { month: number; year: number }[]): Expense[] {
  const wid = getActiveWorkspaceId();
  const key = months.map((m) => `${m.year}-${m.month}`).join(",");

  return useDexieQuery(
    async () => {
      if (!wid || months.length === 0) return EMPTY;
      const results: Expense[] = [];
      for (const { month, year } of months) {
        const rows = await db.expenses.where("[workspaceId+month+year]").equals([wid, month, year]).toArray();
        for (const r of rows) if (!r.deletedAt) results.push(toExpense(r));
      }
      return results;
    },
    [wid, key],
    EMPTY,
  );
}
