"use client";

import { useMemo } from "react";
import { Sunrise, Calendar, TrendingDown, TrendingUp, Target } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import type { Expense, RecurringExpense } from "@/types";

interface MonthStartAnchorProps {
  prevMonthExpenses: Expense[];
  prevMonthBudget: number;
  currentBudget: number;
  currentMonthTotal?: number;
}

/**
 * Month Start Anchor — contextual card that adapts throughout the month.
 * Days 1-3: Shows last month result + recurring commitments.
 * Days 4-10: Shows pace check — are you on track vs. last month?
 * Days 11-20: Mid-month checkpoint — budget pacing summary.
 * Days 21+: Hidden (dashboard KPIs take over).
 */
export function MonthStartAnchor({ prevMonthExpenses, prevMonthBudget, currentBudget, currentMonthTotal = 0 }: MonthStartAnchorProps) {
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();

  const today = new Date().getDate();

  const anchor = useMemo(() => {
    // Hide after day 20 — dashboard KPIs cover the rest
    if (today > 20) return null;
    if (prevMonthBudget <= 0 && currentBudget <= 0) return null;

    const prevTotal = prevMonthExpenses
      .filter((e) => !e.deletedAt)
      .reduce((sum, e) => sum + e.amount, 0);
    const diff = prevMonthBudget - prevTotal;
    const underBudget = diff >= 0;

    const recurringExpenses = (settings.recurringExpenses ?? []).filter((r: RecurringExpense) => r.active);
    const recurringTotal = recurringExpenses.reduce((sum: number, r: RecurringExpense) => sum + r.amount, 0);
    const afterRecurring = currentBudget - recurringTotal;

    // Pace comparison: spending at same point last month
    const prevAtThisPoint = prevMonthExpenses
      .filter((e) => !e.deletedAt && e.day <= today)
      .reduce((sum, e) => sum + e.amount, 0);
    const paceVsPrev = prevAtThisPoint > 0
      ? ((currentMonthTotal - prevAtThisPoint) / prevAtThisPoint) * 100
      : null;

    // Mid-month budget pacing
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyBudgetPace = currentBudget > 0 ? currentBudget / daysInMonth : 0;
    const idealSpentByNow = dailyBudgetPace * today;
    const budgetPacePercent = idealSpentByNow > 0 ? ((currentMonthTotal - idealSpentByNow) / idealSpentByNow) * 100 : 0;

    const phase = today <= 3 ? "new-month" as const
      : today <= 10 ? "pace-check" as const
      : "mid-month" as const;

    return {
      phase,
      prevTotal,
      diff: Math.abs(diff),
      underBudget,
      recurringTotal,
      recurringCount: recurringExpenses.length,
      afterRecurring: Math.max(0, afterRecurring),
      paceVsPrev,
      prevAtThisPoint,
      budgetPacePercent,
      remainingBudget: Math.max(0, currentBudget - currentMonthTotal),
      daysLeft: daysInMonth - today,
      dailyBudgetPace,
    };
  }, [today, prevMonthExpenses, prevMonthBudget, currentBudget, currentMonthTotal, settings.recurringExpenses]);

  if (!anchor) return null;

  // Days 11-20: mid-month budget checkpoint
  if (anchor.phase === "mid-month") {
    if (currentBudget <= 0 || currentMonthTotal === 0) return null;
    const ahead = anchor.budgetPacePercent > 5;
    const behind = anchor.budgetPacePercent < -5;
    const dailyAllowance = anchor.daysLeft > 0 ? anchor.remainingBudget / anchor.daysLeft : 0;

    return (
      <div
        className="card p-4 sm:p-5"
        style={{ borderLeft: `3px solid ${ahead ? "var(--warning)" : behind ? "var(--success)" : "var(--border-strong)"}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target size={15} style={{ color: ahead ? "var(--warning)" : "var(--es-sage)" }} />
          <h3 className="text-card-title">Mid-month checkpoint</h3>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {ahead
            ? <>{formatCurrency(anchor.remainingBudget)} left for {anchor.daysLeft} days — about {formatCurrency(Math.round(dailyAllowance))}/day to stay on track.</>
            : behind
            ? <>Ahead of pace — {formatCurrency(anchor.remainingBudget)} left with {anchor.daysLeft} days to go.</>
            : <>{formatCurrency(anchor.remainingBudget)} remaining, {anchor.daysLeft} days left — on track.</>
          }
        </p>
      </div>
    );
  }

  // Days 4-10: pace check card
  if (anchor.phase === "pace-check") {
    if (anchor.paceVsPrev === null || currentMonthTotal === 0) return null;
    const faster = anchor.paceVsPrev > 5;
    const slower = anchor.paceVsPrev < -5;

    return (
      <div
        className="card p-4 sm:p-5"
        style={{ borderLeft: `3px solid ${faster ? "var(--warning)" : slower ? "var(--success)" : "var(--border-strong)"}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          {faster ? <TrendingUp size={15} style={{ color: "var(--warning)" }} /> : slower ? <TrendingDown size={15} style={{ color: "var(--success)" }} /> : <Calendar size={15} style={{ color: "var(--es-sage)" }} />}
          <h3 className="text-card-title">Day {today} pace check</h3>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {faster
            ? <>Spending {Math.round(Math.abs(anchor.paceVsPrev))}% faster than this point last month ({formatCurrency(currentMonthTotal)} vs {formatCurrency(anchor.prevAtThisPoint)}).</>
            : slower
            ? <>Spending {Math.round(Math.abs(anchor.paceVsPrev))}% less than this time last month — good pace.</>
            : <>On par with last month at this point.</>
          }
        </p>
      </div>
    );
  }

  // Days 1-3: new month card (original)
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
