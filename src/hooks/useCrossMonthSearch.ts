"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSyncExternalStore } from "react";
import { db } from "@/lib/db";
import { getActiveWorkspaceId, subscribeAuth } from "@/lib/authClient";
import { filterExpenses } from "@/lib/filters";
import type { Expense, CategoryId } from "@/types";

interface CrossMonthSearchOptions {
  searchQuery: string;
  activeCategories?: CategoryId[];
  amountMin?: number;
  amountMax?: number;
}

interface CrossMonthSearchResult {
  results: Expense[];
  loading: boolean;
}

/**
 * Searches expenses across ALL months in the current workspace.
 * Uses a 300ms debounce on searchQuery to avoid excessive IDB reads.
 * Only fetches from Dexie when `enabled` is true.
 */
export function useCrossMonthSearch(
  opts: CrossMonthSearchOptions,
  enabled: boolean,
): CrossMonthSearchResult {
  const wid = useSyncExternalStore(subscribeAuth, getActiveWorkspaceId, () => null);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(opts.searchQuery);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(opts.searchQuery), 300);
    return () => clearTimeout(t);
  }, [opts.searchQuery]);

  // Load all non-deleted expenses for the workspace when enabled
  useEffect(() => {
    if (!enabled || !wid) {
      setAllExpenses([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // Cap to last 12 months to avoid scanning years of data
    const now = new Date();
    const capYear = now.getFullYear();
    const capMonth = now.getMonth() + 1; // 1-indexed
    const cutoffYear = capMonth === 12 ? capYear : capYear - 1;
    const cutoffMonth = capMonth === 12 ? 1 : capMonth + 1;

    db.expenses
      .where("workspaceId")
      .equals(wid)
      .filter((e) => {
        if (e.deletedAt !== null) return false;
        // Keep if within the last 12 months
        if (e.year > capYear) return false;
        if (e.year < cutoffYear) return false;
        if (e.year === cutoffYear && e.month < cutoffMonth) return false;
        return true;
      })
      .toArray()
      .then((rows) => {
        if (!cancelled) {
          // Sort by year desc, month desc, day desc
          rows.sort((a, b) =>
            b.year !== a.year ? b.year - a.year :
            b.month !== a.month ? b.month - a.month :
            b.day - a.day
          );
          setAllExpenses(rows as unknown as Expense[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [enabled, wid]);

  const results = useMemo(() => {
    if (!enabled || allExpenses.length === 0) return [];
    return filterExpenses(allExpenses, {
      activeCategories: opts.activeCategories ?? [],
      searchQuery: debouncedQuery,
      amountMin: opts.amountMin,
      amountMax: opts.amountMax,
    });
  }, [enabled, allExpenses, debouncedQuery, opts.activeCategories, opts.amountMin, opts.amountMax]);

  return { results, loading };
}
