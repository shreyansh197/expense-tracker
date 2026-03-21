"use client";

import { useMemo } from "react";
import {
  getMonthlyTotal,
  getMonthlySaving,
  getAllCategoryTotals,
  getAllDailyTotals,
  getStackedDailyTotals,
  getAverageDailySpend,
  getBudgetUsedPercent,
  getTopCategory,
  getElapsedDays,
  getDaysRemaining,
  getPaceToStayUnder,
  getEomForecast,
  detectAnomalies,
} from "@/lib/calculations";
import { getDaysInMonth } from "@/lib/utils";
import type { Expense, CategoryId, DailyTotal, CategoryTotal, StackedDailyTotal, Forecast, AnomalyResult } from "@/types";

export function useCalculations(
  expenses: Expense[],
  categories: CategoryId[],
  salary: number,
  month: number,
  year: number,
  rolloverEnabled?: boolean,
  rolloverHistory?: Record<string, number>
) {
  const daysInMonth = useMemo(() => getDaysInMonth(month, year), [month, year]);
  const elapsedDays = useMemo(() => getElapsedDays(month, year), [month, year]);

  // Calculate effective budget with rollover
  const effectiveBudget = useMemo(() => {
    if (!rolloverEnabled || !rolloverHistory) return salary;
    let pm = month - 1;
    let py = year;
    if (pm <= 0) { pm = 12; py -= 1; }
    const key = `${py}-${String(pm).padStart(2, "0")}`;
    const rollover = rolloverHistory[key] ?? 0;
    return salary + Math.max(0, rollover);
  }, [salary, rolloverEnabled, rolloverHistory, month, year]);

  const monthlyTotal = useMemo(
    () => getMonthlyTotal(expenses, month, year),
    [expenses, month, year]
  );

  const remaining = useMemo(
    () => getMonthlySaving(effectiveBudget, monthlyTotal),
    [effectiveBudget, monthlyTotal]
  );

  const budgetUsedPercent = useMemo(
    () => getBudgetUsedPercent(monthlyTotal, effectiveBudget),
    [monthlyTotal, effectiveBudget]
  );

  const avgDaily = useMemo(
    () => getAverageDailySpend(monthlyTotal, elapsedDays),
    [monthlyTotal, elapsedDays]
  );

  const categoryTotals: CategoryTotal[] = useMemo(
    () => getAllCategoryTotals(expenses, categories, month, year),
    [expenses, categories, month, year]
  );

  const dailyTotals: DailyTotal[] = useMemo(
    () => getAllDailyTotals(expenses, month, year, daysInMonth),
    [expenses, month, year, daysInMonth]
  );

  const stackedDailyTotals: StackedDailyTotal[] = useMemo(
    () => getStackedDailyTotals(expenses, categories, month, year, daysInMonth),
    [expenses, categories, month, year, daysInMonth]
  );

  const topCategory = useMemo(
    () => getTopCategory(expenses, categories, month, year),
    [expenses, categories, month, year]
  );

  const daysRemaining = useMemo(() => getDaysRemaining(month, year), [month, year]);

  const paceToStayUnder = useMemo(
    () => getPaceToStayUnder(remaining, daysRemaining),
    [remaining, daysRemaining]
  );

  const forecast: Forecast = useMemo(
    () => getEomForecast(monthlyTotal, effectiveBudget, elapsedDays, daysInMonth),
    [monthlyTotal, effectiveBudget, elapsedDays, daysInMonth]
  );

  const anomalies: AnomalyResult[] = useMemo(
    () => detectAnomalies(expenses, month, year),
    [expenses, month, year]
  );

  return {
    monthlyTotal,
    remaining,
    budgetUsedPercent,
    avgDaily,
    categoryTotals,
    dailyTotals,
    stackedDailyTotals,
    topCategory,
    daysInMonth,
    elapsedDays,
    daysRemaining,
    paceToStayUnder,
    forecast,
    anomalies,
    effectiveBudget,
  };
}
