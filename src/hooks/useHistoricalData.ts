"use client";

import { useMemo, useEffect } from "react";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/lib/authClient";
import { getDaysInMonth } from "@/lib/utils";
import { getDayOfWeekFactors } from "@/lib/calculations";
import { toExpense } from "@/lib/mappers";
import type { Expense } from "@/types";

const EMPTY: Expense[] = [];

interface MonthData {
  month: number;
  year: number;
  label: string;
  total: number;
  count: number;
  expenses: Expense[];
  categoryBreakdown: Record<string, number>;
}

interface HistoricalAnalytics {
  months: MonthData[];
  currentMonth: MonthData | undefined;
  avgMonthlySpend: number;
  monthOverMonthChange: number | null;
  topCategoriesAllTime: { category: string; total: number }[];
  dayOfWeekFactors: Record<number, number>;
  recurringVsOneTime: { recurring: number; oneTime: number };
  biggestExpenses: Expense[];
  spendingByWeek: { week: number; total: number }[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function useHistoricalData(currentMonth: number, currentYear: number, lookback = 6): HistoricalAnalytics {
  const wid = getActiveWorkspaceId();

  // Build list of months to query (current + lookback previous)
  const monthKeys = useMemo(() => {
    const keys: { m: number; y: number }[] = [];
    let m = currentMonth;
    let y = currentYear;
    for (let i = 0; i <= lookback; i++) {
      keys.unshift({ m, y });
      m--;
      if (m <= 0) { m = 12; y--; }
    }
    return keys;
  }, [currentMonth, currentYear, lookback]);

  // Query all expenses for all months in one query
  const allExpenses = useDexieQuery(
    async () => {
      if (!wid) return EMPTY;
      const results: Expense[] = [];
      for (const { m, y } of monthKeys) {
        const rows = await db.expenses
          .where("[workspaceId+month+year]")
          .equals([wid, m, y])
          .toArray();
        for (const r of rows) {
          if (!r.deletedAt) results.push(toExpense(r));
        }
      }
      return results;
    },
    [wid, ...monthKeys.map(k => `${k.y}-${k.m}`)],
    EMPTY,
  );

  // Load cached MonthData for completed (non-current) months
  const cachedMonths = useDexieQuery(
    async () => {
      if (!wid) return {} as Record<string, MonthData>;
      const result: Record<string, MonthData> = {};
      for (const { m, y } of monthKeys) {
        if (m === currentMonth && y === currentYear) continue; // skip current month
        const key = `${wid}-${m}-${y}`;
        const cached = await db.calcCache.get(key);
        if (cached && cached.data) {
          try {
            result[`${m}-${y}`] = JSON.parse(cached.data) as MonthData;
          } catch { /* ignore corrupt cache */ }
        }
      }
      return result;
    },
    [wid, ...monthKeys.map(k => `${k.y}-${k.m}`)],
    {} as Record<string, MonthData>,
  );

  // Compute analytics + track which completed months need caching
  const { analytics, toCache } = useMemo(() => {
    // Build per-month data (use cache for completed months)
    const pendingCache: { key: string; data: MonthData }[] = [];
    const months: MonthData[] = monthKeys.map(({ m, y }) => {
      const isCurrent = m === currentMonth && y === currentYear;
      const cacheKey = `${m}-${y}`;

      // Use cache for completed months
      if (!isCurrent && cachedMonths[cacheKey]) {
        return { ...cachedMonths[cacheKey], expenses: cachedMonths[cacheKey].expenses || [] };
      }

      // Compute fresh
      const monthExpenses = allExpenses.filter(e => e.month === m && e.year === y);
      const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
      const categoryBreakdown: Record<string, number> = {};
      for (const e of monthExpenses) {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      }
      const md: MonthData = {
        month: m,
        year: y,
        label: `${MONTH_NAMES[m - 1]} ${y}`,
        total,
        count: monthExpenses.length,
        expenses: monthExpenses,
        categoryBreakdown,
      };

      // Track completed months for cache write
      if (!isCurrent && wid) {
        pendingCache.push({ key: `${wid}-${m}-${y}`, data: md });
      }

      return md;
    });

    const current = months.find(d => d.month === currentMonth && d.year === currentYear);
    const previous = months.length >= 2 ? months[months.length - 2] : undefined;

    // Average monthly spend (excluding current in-progress month)
    const completed = months.filter(d => !(d.month === currentMonth && d.year === currentYear));
    const avgMonthlySpend = completed.length > 0
      ? completed.reduce((s, d) => s + d.total, 0) / completed.length
      : 0;

    // Month-over-month change %
    const monthOverMonthChange = previous && previous.total > 0 && current
      ? ((current.total - previous.total) / previous.total) * 100
      : null;

    // Top categories across all months
    const catTotals: Record<string, number> = {};
    for (const e of allExpenses) {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    }
    const topCategoriesAllTime = Object.entries(catTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Day-of-week analysis
    const dayOfWeekFactors = getDayOfWeekFactors(allExpenses);

    // Recurring vs one-time
    const recurring = allExpenses.filter(e => e.isRecurring).reduce((s, e) => s + e.amount, 0);
    const oneTime = allExpenses.filter(e => !e.isRecurring).reduce((s, e) => s + e.amount, 0);

    // Biggest expenses (current month)
    const biggestExpenses = current
      ? [...current.expenses].sort((a, b) => b.amount - a.amount).slice(0, 5)
      : [];

    // Weekly totals (current month)
    const spendingByWeek: { week: number; total: number }[] = [];
    if (current) {
      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
      for (let w = 0; w < Math.ceil(daysInMonth / 7); w++) {
        const startDay = w * 7 + 1;
        const endDay = Math.min(startDay + 6, daysInMonth);
        const total = current.expenses
          .filter(e => e.day >= startDay && e.day <= endDay)
          .reduce((s, e) => s + e.amount, 0);
        spendingByWeek.push({ week: w + 1, total });
      }
    }

    return {
      analytics: {
        months,
        currentMonth: current,
        avgMonthlySpend,
        monthOverMonthChange,
        topCategoriesAllTime,
        dayOfWeekFactors,
        recurringVsOneTime: { recurring, oneTime },
        biggestExpenses,
        spendingByWeek,
      },
      toCache: pendingCache,
    };
  }, [allExpenses, monthKeys, currentMonth, currentYear, cachedMonths, wid]);

  // Write freshly computed completed month data to cache (fire-and-forget)
  useEffect(() => {
    if (toCache.length === 0) return;
    for (const { key, data } of toCache) {
      // Store without expenses array to keep cache small
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expenses: _e, ...cacheable } = data;
      db.calcCache.put({ key, data: JSON.stringify(cacheable), computedAt: Date.now() }).catch(() => {});
    }
  }, [toCache]);

  return analytics;
}
