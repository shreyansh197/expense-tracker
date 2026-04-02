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

const CalculationsContext = createContext<CalculationsContextValue | null>(null);

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
  const ctx = useContext(CalculationsContext);
  if (!ctx) throw new Error("useCalculationsContext must be used within CalculationsProvider");
  return ctx;
}
