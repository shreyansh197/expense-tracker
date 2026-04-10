"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { Lightbulb, AlertTriangle, TrendingDown, Star } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Expense, CategoryMeta } from "@/types";

interface SmartInsightsProps {
  expenses: Expense[];
  previousMonthExpenses: Expense[];
  salary: number;
  categories: CategoryMeta[];
}

interface Insight {
  icon: typeof Lightbulb;
  text: string;
  type: "tip" | "warning" | "positive" | "neutral";
}

/**
 * Contextual spending insights banner for the dashboard.
 * Analyzes current vs previous month to surface actionable observations.
 */
export function SmartInsights({ expenses, previousMonthExpenses, salary, categories }: SmartInsightsProps) {
  const { formatCurrency } = useCurrency();

  const insight = useMemo<Insight | null>(() => {
    const active = expenses.filter((e) => !e.deletedAt);
    const prevActive = previousMonthExpenses.filter((e) => !e.deletedAt);
    const total = active.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevActive.reduce((s, e) => s + e.amount, 0);

    const today = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const paceRatio = total / Math.max(today, 1);
    const projected = paceRatio * daysInMonth;

    // 1. Under budget and on track
    if (salary > 0 && projected < salary * 0.7 && today > 10) {
      const savings = salary - projected;
      return {
        icon: Star,
        text: `You're on track to save ${formatCurrency(Math.round(savings))} this month — keep it up!`,
        type: "positive",
      };
    }

    // 2. Category spike detection
    if (prevActive.length > 0) {
      const catTotals = new Map<string, number>();
      const prevCatTotals = new Map<string, number>();
      for (const e of active) catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount);
      for (const e of prevActive) prevCatTotals.set(e.category, (prevCatTotals.get(e.category) ?? 0) + e.amount);

      // Adjust for partial month
      const dayRatio = daysInMonth / Math.max(today, 1);

      for (const [cat, amount] of catTotals) {
        const prevAmount = prevCatTotals.get(cat) ?? 0;
        const projectedCat = amount * dayRatio;
        if (prevAmount > 0 && projectedCat > prevAmount * 1.5 && amount > 500) {
          const catMeta = categories.find((c) => c.id === cat);
          const label = catMeta?.label ?? cat;
          return {
            icon: AlertTriangle,
            text: `Your ${label} spending is trending 50%+ higher than last month`,
            type: "warning",
          };
        }
      }
    }

    // 3. Spending slowdown
    if (prevTotal > 0 && total < prevTotal * 0.7 && today > 15) {
      return {
        icon: TrendingDown,
        text: `You've spent ${Math.round((1 - total / prevTotal) * 100)}% less than last month so far`,
        type: "positive",
      };
    }

    // 4. Default tip
    if (today <= 5 && salary > 0) {
      return {
        icon: Lightbulb,
        text: `New month! Your ${formatCurrency(salary)} budget resets — plan your spending wisely`,
        type: "neutral",
      };
    }

    return null;
  }, [expenses, previousMonthExpenses, salary, categories, formatCurrency]);

  if (!insight) return null;

  const colorMap = {
    tip: { bg: "var(--info-soft)", border: "var(--info-border)", color: "var(--info-text)", icon: "var(--info)" },
    warning: { bg: "var(--warning-soft)", border: "var(--warning-border)", color: "var(--warning-text)", icon: "var(--warning)" },
    positive: { bg: "var(--success-soft)", border: "var(--success-soft)", color: "var(--success-text)", icon: "var(--success)" },
    neutral: { bg: "var(--surface-secondary)", border: "var(--border)", color: "var(--text-secondary)", icon: "var(--text-muted)" },
  };

  const colors = colorMap[insight.type];
  const Icon = insight.icon;

  return (
    <m.div
      className="dash-section flex items-start gap-3 rounded-xl border px-4 py-3"
      style={{ background: colors.bg, borderColor: colors.border }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      <div className="mt-0.5 shrink-0">
        <Icon size={16} style={{ color: colors.icon }} />
      </div>
      <p className="text-body-sm" style={{ color: colors.color }}>
        {insight.text}
      </p>
    </m.div>
  );
}
