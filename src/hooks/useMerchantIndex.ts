"use client";

import { useMemo } from "react";
import type { Expense, CategoryId } from "@/types";

export interface MerchantSuggestion {
  remark: string;
  category: CategoryId;
  medianAmount: number;
  count: number;
}

/**
 * Builds a local merchant index from past expense remarks.
 * Groups by normalized remark, computes the mode category and median amount.
 * Returns a search function that matches typed input (≥2 chars) against the index.
 */
export function useMerchantIndex(expenses: Expense[]) {
  const index = useMemo(() => {
    const map = new Map<string, { remark: string; categories: Record<string, number>; amounts: number[] }>();

    for (const e of expenses) {
      if (!e.remark || e.deletedAt) continue;
      const key = e.remark.trim().toLowerCase();
      if (key.length < 2) continue;

      let entry = map.get(key);
      if (!entry) {
        entry = { remark: e.remark.trim(), categories: {}, amounts: [] };
        map.set(key, entry);
      }
      entry.categories[e.category] = (entry.categories[e.category] ?? 0) + 1;
      entry.amounts.push(e.amount);
    }

    const suggestions: MerchantSuggestion[] = [];
    for (const entry of map.values()) {
      if (entry.amounts.length < 2) continue; // only suggest if logged more than once

      // Mode category
      let modeCategory = "" as CategoryId;
      let maxCount = 0;
      for (const [cat, count] of Object.entries(entry.categories)) {
        if (count > maxCount) {
          maxCount = count;
          modeCategory = cat as CategoryId;
        }
      }

      // Median amount
      const sorted = [...entry.amounts].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

      suggestions.push({
        remark: entry.remark,
        category: modeCategory,
        medianAmount: Math.round(median),
        count: entry.amounts.length,
      });
    }

    // Sort by frequency descending
    suggestions.sort((a, b) => b.count - a.count);
    return suggestions;
  }, [expenses]);

  const search = useMemo(() => {
    return (query: string, limit = 5): MerchantSuggestion[] => {
      if (query.length < 2) return [];
      const q = query.toLowerCase();
      return index.filter((s) => s.remark.toLowerCase().includes(q)).slice(0, limit);
    };
  }, [index]);

  return { suggestions: index, search };
}
