"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { TrendingUp, TrendingDown, Calendar, Repeat, BarChart3, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InsightData {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  sentiment: "positive" | "negative" | "neutral";
}

interface SpendingInsightsProps {
  monthOverMonthChange: number | null;
  dayOfWeekFactors: Record<number, number>;
  recurringVsOneTime: { recurring: number; oneTime: number };
  currentMonthCategories: Record<string, number>;
  previousMonthCategories: Record<string, number>;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SpendingInsights({
  monthOverMonthChange,
  dayOfWeekFactors,
  recurringVsOneTime,
  currentMonthCategories,
  previousMonthCategories,
}: SpendingInsightsProps) {
  const insights = useMemo(() => {
    const results: InsightData[] = [];

    // 1. Month-over-month change
    if (monthOverMonthChange !== null) {
      const up = monthOverMonthChange > 0;
      const abs = Math.abs(Math.round(monthOverMonthChange));
      results.push({
        id: "mom",
        icon: up ? TrendingUp : TrendingDown,
        label: "vs Last Month",
        value: `${up ? "+" : "−"}${abs}%`,
        detail: up ? `Spending is up ${abs}% compared to last month` : `Spending is down ${abs}% — nice work!`,
        sentiment: up ? "negative" : "positive",
      });
    }

    // 2. Weekend vs weekday spending
    const weekdayFactors = [1, 2, 3, 4, 5].map((d) => dayOfWeekFactors[d] ?? 1);
    const weekendFactors = [0, 6].map((d) => dayOfWeekFactors[d] ?? 1);
    const avgWeekday = weekdayFactors.reduce((a, b) => a + b, 0) / weekdayFactors.length;
    const avgWeekend = weekendFactors.reduce((a, b) => a + b, 0) / weekendFactors.length;
    if (avgWeekday > 0 && avgWeekend > 0) {
      const ratio = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100);
      if (Math.abs(ratio) >= 10) {
        const moreOnWeekends = ratio > 0;
        results.push({
          id: "weekend",
          icon: Calendar,
          label: "Weekend Pattern",
          value: `${moreOnWeekends ? "+" : "−"}${Math.abs(ratio)}%`,
          detail: moreOnWeekends
            ? `You spend ${Math.abs(ratio)}% more on weekends`
            : `You spend ${Math.abs(ratio)}% less on weekends`,
          sentiment: moreOnWeekends ? "negative" : "positive",
        });
      }
    }

    // 3. Top category shift
    const currentEntries = Object.entries(currentMonthCategories).sort((a, b) => b[1] - a[1]);
    const previousEntries = Object.entries(previousMonthCategories).sort((a, b) => b[1] - a[1]);
    if (currentEntries.length > 0 && previousEntries.length > 0) {
      const currentTop = currentEntries[0][0];
      const previousTop = previousEntries[0][0];
      if (currentTop !== previousTop) {
        results.push({
          id: "category_shift",
          icon: ArrowRight,
          label: "Category Shift",
          value: currentTop,
          detail: `${currentTop} overtook ${previousTop} as #1 this month`,
          sentiment: "neutral",
        });
      }
    }

    // 4. Best day of the week
    const dayEntries = Object.entries(dayOfWeekFactors).map(([d, f]) => ({ day: Number(d), factor: f }));
    if (dayEntries.length >= 3) {
      const cheapest = dayEntries.reduce((a, b) => (a.factor < b.factor ? a : b));
      results.push({
        id: "best_day",
        icon: BarChart3,
        label: "Cheapest Day",
        value: DAY_NAMES[cheapest.day],
        detail: `${DAY_NAMES[cheapest.day]}s tend to be your lowest-spending day`,
        sentiment: "positive",
      });
    }

    // 5. Recurring ratio
    const totalRecOneTime = recurringVsOneTime.recurring + recurringVsOneTime.oneTime;
    if (totalRecOneTime > 0) {
      const recurringPct = Math.round((recurringVsOneTime.recurring / totalRecOneTime) * 100);
      if (recurringPct >= 20) {
        results.push({
          id: "recurring_ratio",
          icon: Repeat,
          label: "Recurring Share",
          value: `${recurringPct}%`,
          detail: `${recurringPct}% of your spending is recurring subscriptions`,
          sentiment: "neutral",
        });
      }
    }

    return results.slice(0, 4); // Show max 4 insights
  }, [monthOverMonthChange, dayOfWeekFactors, recurringVsOneTime, currentMonthCategories, previousMonthCategories]);

  if (insights.length === 0) return null;

  const sentimentColors: Record<string, string> = {
    positive: "var(--success-text)",
    negative: "var(--danger-text)",
    neutral: "var(--text-secondary)",
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 size={16} style={{ color: "var(--accent)" }} />
        <h3 className="text-section-title">Spending Insights</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <m.div
              key={insight.id}
              className="rounded-xl p-3"
              style={{ background: "var(--surface-secondary)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <Icon size={13} style={{ color: "var(--text-muted)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {insight.label}
                </span>
              </div>
              <p className="text-lg font-bold leading-tight" style={{ color: sentimentColors[insight.sentiment] }}>
                {insight.value}
              </p>
              <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
                {insight.detail}
              </p>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}
