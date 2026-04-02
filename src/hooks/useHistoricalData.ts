"use client";

import { useMemo } from "react";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/lib/authClient";
import { getDaysInMonth } from "@/lib/utils";
import { getDayOfWeekFactors } from "@/lib/calculations";
import type { Expense, CategoryId } from "@/types";

const EMPTY: Expense[] = [];

function toExpense(row: { id: string; category: string; amount: number; currency?: string; day: number; month: number; year: number; remark?: string; isRecurring: boolean; recurringId?: string; createdAt: number; updatedAt: number; deletedAt: number | null }): Expense {
  return { id: row.id, category: row.category as CategoryId, amount: row.amount, currency: row.currency, day: row.day, month: row.month, year: row.year, remark: row.remark, isRecurring: row.isRecurring ?? false, recurringId: row.recurringId, createdAt: row.createdAt, updatedAt: row.updatedAt, deletedAt: row.deletedAt, deviceId: "" };
}

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

  return useMemo(() => {
    // Build per-month data
    const months: MonthData[] = monthKeys.map(({ m, y }) => {
      const monthExpenses = allExpenses.filter(e => e.month === m && e.year === y);
      const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
      const categoryBreakdown: Record<string, number> = {};
      for (const e of monthExpenses) {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      }
      return {
        month: m,
        year: y,
        label: `${MONTH_NAMES[m - 1]} ${y}`,
        total,
        count: monthExpenses.length,
        expenses: monthExpenses,
        categoryBreakdown,
      };
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
      months,
      currentMonth: current,
      avgMonthlySpend,
      monthOverMonthChange,
      topCategoriesAllTime,
      dayOfWeekFactors,
      recurringVsOneTime: { recurring, oneTime },
      biggestExpenses,
      spendingByWeek,
    };
  }, [allExpenses, monthKeys, currentMonth, currentYear]);
}
