"use client";

import { createContext, useContext } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
import { useCalculations } from "@/hooks/useCalculations";
import type { CategoryTotal, DailyTotal, StackedDailyTotal, Forecast, AnomalyResult } from "@/types";

interface CalculationsContextValue {
  monthlyTotal: number;
  remaining: number;
  budgetUsedPercent: number;
  avgDaily: number;
  categoryTotals: CategoryTotal[];
  dailyTotals: DailyTotal[];
  stackedDailyTotals: StackedDailyTotal[];
  topCategory: CategoryTotal | null;
  daysInMonth: number;
  elapsedDays: number;
  daysRemaining: number;
  paceToStayUnder: number;
  forecast: Forecast;
  anomalies: AnomalyResult[];
  effectiveBudget: number;
}

const DEFAULTS: CalculationsContextValue = {
  monthlyTotal: 0,
  remaining: 0,
  budgetUsedPercent: 0,
  avgDaily: 0,
  categoryTotals: [],
  dailyTotals: [],
  stackedDailyTotals: [],
  topCategory: null,
  daysInMonth: 30,
  elapsedDays: 0,
  daysRemaining: 30,
  paceToStayUnder: 0,
  forecast: { projectedTotal: 0, projectedRemaining: 0, confidence: "low", method: "linear", historicalMonths: 0 },
  anomalies: [],
  effectiveBudget: 0,
};

const CalculationsContext = createContext<CalculationsContextValue>(DEFAULTS);

export function CalculationsProvider({ children }: { children: React.ReactNode }) {
  const { currentMonth, currentYear } = useUIStore();
  const { settings } = useSettings();
  const { expenses } = useExpenses(currentMonth, currentYear);

  const calcs = useCalculations(
    expenses,
    settings.categories,
    settings.salary,
    currentMonth,
    currentYear,
    settings.rolloverEnabled,
    settings.rolloverHistory,
    settings.currency,
    settings.multiCurrencyEnabled,
    settings.monthlyBudgets,
  );

  return (
    <CalculationsContext.Provider value={calcs}>
      {children}
    </CalculationsContext.Provider>
  );
}

export function useCalculationsContext() {
  return useContext(CalculationsContext);
}
