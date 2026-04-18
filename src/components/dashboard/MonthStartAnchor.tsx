"use client";

import { useMemo } from "react";
import { Sunrise } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import type { Expense, RecurringExpense } from "@/types";

interface MonthStartAnchorProps {
  prevMonthExpenses: Expense[];
  prevMonthBudget: number;
  currentBudget: number;
}

/**
 * Month Start Anchor — shown on days 1-3 of a new month to bridge the gap.
 * Shows last month's result and what recurring expenses are committed this month.
 * Auto-expires after day 3.
 */
export function MonthStartAnchor({ prevMonthExpenses, prevMonthBudget, currentBudget }: MonthStartAnchorProps) {
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();

  const today = new Date().getDate();

  const anchor = useMemo(() => {
    // Only show days 1-3
    if (today > 3) return null;
    // Need a valid previous month to show context
    if (prevMonthBudget <= 0) return null;

    const prevTotal = prevMonthExpenses
      .filter((e) => !e.deletedAt)
      .reduce((sum, e) => sum + e.amount, 0);
    const diff = prevMonthBudget - prevTotal;
    const underBudget = diff >= 0;

    const recurringExpenses = (settings.recurringExpenses ?? []).filter((r: RecurringExpense) => r.active);
    const recurringTotal = recurringExpenses.reduce((sum: number, r: RecurringExpense) => sum + r.amount, 0);

    const afterRecurring = currentBudget - recurringTotal;

    return {
      prevTotal,
      diff: Math.abs(diff),
      underBudget,
      recurringTotal,
      recurringCount: recurringExpenses.length,
      afterRecurring: Math.max(0, afterRecurring),
    };
  }, [today, prevMonthExpenses, prevMonthBudget, currentBudget, settings.recurringExpenses]);

  if (!anchor) return null;

  return (
    <div className="card p-4 sm:p-5" style={{ borderLeft: `3px solid ${anchor.underBudget ? "var(--success)" : "var(--warning)"}` }}>
      <div className="flex items-center gap-2 mb-2">
        <Sunrise size={15} style={{ color: "var(--es-sage)" }} />
        <h3 className="text-card-title">New month</h3>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {anchor.underBudget
          ? <>Last month you finished <span className="font-semibold" style={{ color: "var(--success-text)" }}>{formatCurrency(anchor.diff)} under budget</span>.</>
          : <>Last month you went <span className="font-semibold" style={{ color: "var(--danger-text)" }}>{formatCurrency(anchor.diff)} over budget</span>.</>
        }
        {anchor.recurringCount > 0 && (
          <> With {anchor.recurringCount} recurring expense{anchor.recurringCount !== 1 ? "s" : ""} ({formatCurrency(anchor.recurringTotal)}), you have <span className="font-semibold font-numeric" style={{ color: "var(--text-primary)" }}>{formatCurrency(anchor.afterRecurring)}</span> flexible this month.</>
        )}
      </p>
    </div>
  );
}
