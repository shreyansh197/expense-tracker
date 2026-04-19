"use client";

import { useState, useMemo, useCallback } from "react";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useUIStore } from "@/stores/uiStore";
import { getSpendingStreak } from "@/lib/calculations";

export type WatcherInsightType =
  | "anomaly"
  | "streak"
  | "budget_milestone"
  | "forecast_warning";

export interface WatcherInsight {
  type: WatcherInsightType;
  text: string;
}

const COOLDOWN_KEY = "es-watcher-last-shown";
const COOLDOWN_MS = 1 * 60 * 60 * 1000; // 1 hour

/**
 * Produces at most one ambient insight per 1-hour window.
 * Insight is derived state (useMemo) — no setState inside effects.
 *
 * Priority order:
 *  1. High-confidence forecast warning (data-rich)
 *  2. Spending anomaly (surprising large spend)
 *  3. Streak milestone (positive reinforcement)
 *  4. Budget milestone (crossing 75%)
 *  5. Top category dominance (one category > 50% of spend)
 *  6. Quiet day encouragement (no spend today)
 */
export function useWatcher(): { insight: WatcherInsight | null; dismiss: () => void } {
  // Track which insight type the user has already dismissed this session
  const [dismissedType, setDismissedType] = useState<WatcherInsightType | null>(null);

  // Evaluate the cooldown exactly once on mount (useState initializer is not a render)
  const [cooledDown] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return Date.now() - Number(localStorage.getItem(COOLDOWN_KEY) ?? "0") >= COOLDOWN_MS;
  });

  const { anomalies, forecast, budgetUsedPercent, effectiveBudget } =
    useCalculationsContext();
  const { currentMonth, currentYear } = useUIStore();
  const { expenses } = useExpenses(currentMonth, currentYear);

  // Only produce "live" insights when viewing the real current month
  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

  const streak = useMemo(() => getSpendingStreak(expenses), [expenses]);

  // Derive the candidate insight purely from reactive values — no side effects
  const candidateInsight = useMemo<WatcherInsight | null>(() => {
    if (!cooledDown) return null;
    if (!isCurrentMonth) return null;

    // 1. Forecast warning (confident and risky)
    if (
      forecast.confidence !== "low" &&
      forecast.projectedRemaining < 0 &&
      effectiveBudget > 0
    ) {
      const over = Math.abs(forecast.projectedRemaining);
      return {
        type: "forecast_warning",
        text: `At this pace you may go over by ≈${Math.round(over).toLocaleString()} — a few quiet days will fix it.`,
      };
    }

    // 2. Anomaly (a spend that's unusually large for its category)
    const topAnomaly = anomalies[0];
    if (topAnomaly && topAnomaly.zScore > 1.8) {
      return {
        type: "anomaly",
        text: `That ${topAnomaly.expense.category} spend was unusually large — about ${Math.round(topAnomaly.zScore * 10) / 10}× your normal.`,
      };
    }

    // 3. Streak milestone (multiples of 7, 14, 21, 30...)
    if (streak > 0 && streak % 7 === 0) {
      return {
        type: "streak",
        text: `${streak} days of logging in a row. That consistency is rare — and valuable.`,
      };
    }

    // 4. Budget milestone (crossing 75% this month)
    if (budgetUsedPercent >= 75 && budgetUsedPercent < 90 && effectiveBudget > 0) {
      const daysLeft =
        new Date(currentYear, currentMonth, 0).getDate() - new Date().getDate();
      return {
        type: "budget_milestone",
        text: `You've used ${Math.round(budgetUsedPercent)}% of your budget with ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left.`,
      };
    }

    // 5. Top category dominance (>50% of monthly spend in one category)
    if (expenses.length >= 3) {
      const active = expenses.filter((e) => !e.deletedAt);
      const total = active.reduce((s, e) => s + e.amount, 0);
      if (total > 0) {
        const byCat: Record<string, number> = {};
        for (const e of active) byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
        const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
        if (top && top[1] / total > 0.5) {
          return {
            type: "anomaly",
            text: `${Math.round((top[1] / total) * 100)}% of your spend this month is ${top[0]} — that's more than all other categories combined.`,
          };
        }
      }
    }

    // 6. Quiet day encouragement (no expenses today)
    const today = new Date().getDate();
    const todaySpend = expenses.filter((e) => !e.deletedAt && e.day === today);
    if (expenses.length > 0 && todaySpend.length === 0) {
      return {
        type: "streak",
        text: "No spending logged today — a quiet day is a powerful day.",
      };
    }

    return null;
  }, [cooledDown, isCurrentMonth, anomalies, forecast, budgetUsedPercent, effectiveBudget, streak, expenses, currentMonth, currentYear]);

  // Suppress the insight only if the user dismissed this exact type
  const insight =
    candidateInsight?.type === dismissedType ? null : candidateInsight;

  const dismiss = useCallback(() => {
    if (candidateInsight) {
      if (typeof window !== "undefined") {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      }
      setDismissedType(candidateInsight.type);
    }
  }, [candidateInsight]);

  return { insight, dismiss };
}
