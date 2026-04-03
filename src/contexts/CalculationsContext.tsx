"use client";

import { createContext, useContext, useEffect, useRef } from "react";
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
  const { settings, updateSettings } = useSettings();
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

  // Auto-compute rollover for past months when rollover is enabled
  const computingRef = useRef(false);
  useEffect(() => {
    if (!settings.rolloverEnabled || !settings.salary || computingRef.current) return;
    computingRef.current = true;

    (async () => {
      try {
        const wid = (await import("@/lib/authClient")).getActiveWorkspaceId();
        if (!wid) return;

        const now = new Date();
        const nowMonth = now.getMonth() + 1;
        const nowYear = now.getFullYear();
        const history = { ...(settings.rolloverHistory ?? {}) };
        let changed = false;

        // Compute for the last 6 months (if not already stored)
        for (let i = 1; i <= 6; i++) {
          let pm = nowMonth - i;
          let py = nowYear;
          while (pm <= 0) { pm += 12; py -= 1; }
          const key = `${py}-${String(pm).padStart(2, "0")}`;
          if (history[key] !== undefined) continue; // Already computed

          // Get budget for that month
          const monthKey = `${py}-${String(pm).padStart(2, "0")}`;
          const override = settings.monthlyBudgets?.[monthKey];
          const budget = (override !== undefined && override > 0) ? override : settings.salary;
          if (!budget) continue;

          // Fetch expenses for that month
          const { db } = await import("@/lib/db");
          const rows = await db.expenses
            .where("[workspaceId+month+year]")
            .equals([wid, pm, py])
            .toArray();
          const total = rows
            .filter((r) => !r.deletedAt)
            .reduce((sum, r) => sum + r.amount, 0);

          history[key] = budget - total;
          changed = true;
        }

        if (changed) {
          updateSettings({ rolloverHistory: history });
        }
      } finally {
        computingRef.current = false;
      }
    })();
  }, [settings.rolloverEnabled, settings.salary, settings.rolloverHistory, settings.monthlyBudgets, updateSettings]);

  return (
    <CalculationsContext.Provider value={calcs}>
      {children}
    </CalculationsContext.Provider>
  );
}

export function useCalculationsContext() {
  return useContext(CalculationsContext);
}
