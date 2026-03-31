"use client";

import { useMemo, useState, useEffect } from "react";
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
import { fetchRates, convert } from "@/lib/exchangeRates";
import type { Expense, CategoryId, DailyTotal, CategoryTotal, StackedDailyTotal, Forecast, AnomalyResult } from "@/types";

export function useCalculations(
  expenses: Expense[],
  categories: CategoryId[],
  salary: number,
  month: number,
  year: number,
  rolloverEnabled?: boolean,
  rolloverHistory?: Record<string, number>,
  baseCurrency?: string,
  multiCurrencyEnabled?: boolean,
) {
  const daysInMonth = useMemo(() => getDaysInMonth(month, year), [month, year]);
  const elapsedDays = useMemo(() => getElapsedDays(month, year), [month, year]);

  // Fetch exchange rates when multi-currency is active
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!multiCurrencyEnabled || !baseCurrency) return;
    fetchRates(baseCurrency).then(setRates);
  }, [multiCurrencyEnabled, baseCurrency]);

  // Normalize expenses: convert foreign-currency amounts to base currency
  const normalizedExpenses = useMemo(() => {
    if (!multiCurrencyEnabled || !rates || !baseCurrency) return expenses;
    const hasForeign = expenses.some((e) => e.currency && e.currency !== baseCurrency);
    if (!hasForeign) return expenses;
    return expenses.map((e) => {
      if (!e.currency || e.currency === baseCurrency) return e;
      return { ...e, amount: convert(e.amount, e.currency, baseCurrency, rates) };
    });
  }, [expenses, multiCurrencyEnabled, rates, baseCurrency]);

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
    () => getMonthlyTotal(normalizedExpenses, month, year),
    [normalizedExpenses, month, year]
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
    () => getAllCategoryTotals(normalizedExpenses, categories, month, year),
    [normalizedExpenses, categories, month, year]
  );

  const dailyTotals: DailyTotal[] = useMemo(
    () => getAllDailyTotals(normalizedExpenses, month, year, daysInMonth),
    [normalizedExpenses, month, year, daysInMonth]
  );

  const stackedDailyTotals: StackedDailyTotal[] = useMemo(
    () => getStackedDailyTotals(normalizedExpenses, categories, month, year, daysInMonth),
    [normalizedExpenses, categories, month, year, daysInMonth]
  );

  const topCategory = useMemo(
    () => getTopCategory(normalizedExpenses, categories, month, year),
    [normalizedExpenses, categories, month, year]
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
    () => detectAnomalies(normalizedExpenses, month, year),
    [normalizedExpenses, month, year]
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
