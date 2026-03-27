"use client";

import { useState } from "react";
import {
  PiggyBank,
  AlertTriangle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { BUDGET_WARNING_THRESHOLD } from "@/lib/constants";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { CategoryTotal, Forecast } from "@/types";

interface KpiCardsProps {
  monthlyTotal: number;
  remaining: number;
  salary: number;
  avgDaily: number;
  budgetUsedPercent: number;
  topCategory: CategoryTotal | null;
  daysRemaining: number;
  paceToStayUnder: number;
  expenseCount: number;
  forecast: Forecast;
  rolloverAmount?: number;
}

export function KpiCards({
  monthlyTotal,
  remaining,
  salary,
  avgDaily,
  budgetUsedPercent,
  daysRemaining,
  paceToStayUnder,
  expenseCount,
  forecast,
  rolloverAmount = 0,
}: KpiCardsProps) {
  const { formatCurrency } = useCurrency();
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("spendly-kpi-expanded") === "true";
  });

  const toggleExpanded = () => {
    setExpanded((prev) => {
      localStorage.setItem("spendly-kpi-expanded", String(!prev));
      return !prev;
    });
  };

  const isOverspent = remaining < 0;
  const isWarning = !isOverspent && budgetUsedPercent >= BUDGET_WARNING_THRESHOLD;
  const paceExceeded = avgDaily > paceToStayUnder && paceToStayUnder > 0;
  const savingsRate = salary > 0 ? Math.round((remaining / salary) * 100) : 0;
  const forecastOverBudget = forecast.projectedRemaining < 0;
  const forecastWarning = !forecastOverBudget && salary > 0 && forecast.projectedTotal > salary * 0.8;

  return (
    <div className="space-y-3">
      {/* ── Hero Row: Spent + Remaining ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Spent / Budget */}
        <div className="card p-5">
          <p className="text-section-title">Spent</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="tabular-nums text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(monthlyTotal)}
            </p>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span className="tabular-nums text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {formatCurrency(salary)}
            </span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOverspent
                  ? "bg-red-500"
                  : isWarning
                    ? "bg-amber-500"
                    : "bg-indigo-500 dark:bg-indigo-400"
              )}
              style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-meta">
              {budgetUsedPercent}% of budget · {expenseCount} txns
            </p>
            {rolloverAmount > 0 && (
              <p className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
                +{formatCurrency(rolloverAmount)} rollover
              </p>
            )}
          </div>
        </div>

        {/* Remaining + Days Left */}
        <div
          className={cn(
            "rounded-2xl border p-5 card-interactive",
            isOverspent
              ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
              : isWarning
                ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30"
                : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              isOverspent
                ? "text-red-600 dark:text-red-400"
                : isWarning
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {isOverspent ? <AlertTriangle size={15} /> : <PiggyBank size={15} />}
            <span>{isOverspent ? "Overspent" : "Remaining"}</span>
          </div>
          <p
            className={cn(
              "tabular-nums mt-2 text-3xl font-bold",
              isOverspent
                ? "text-red-700 dark:text-red-400"
                : isWarning
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {formatCurrency(Math.abs(remaining))}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span className={cn(
              "text-xs font-medium",
              isOverspent ? "text-red-500 dark:text-red-400"
                : isWarning ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}>
              {daysRemaining === 0 ? "Month ended" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Toggle + Metrics Row ── */}
      <div>
        <button
          onClick={toggleExpanded}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          aria-expanded={expanded}
        >
          {expanded ? "Hide details" : "More details"}
          <ChevronDown size={14} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
        </button>
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
      <div className="grid grid-cols-3 gap-3 pt-1">
        {/* Spend Target */}
        <div className="card-sm p-3.5">
          <p className="text-meta font-medium">Spend Target</p>
          <p className={cn(
            "tabular-nums mt-1.5 text-lg font-bold",
            paceExceeded
              ? "text-amber-600 dark:text-amber-400"
              : ""
          )} style={!paceExceeded ? { color: 'var(--text-primary)' } : undefined}>
            {paceToStayUnder > 0 ? `${formatCurrency(paceToStayUnder)}/d` : "—"}
          </p>
          <p className="tabular-nums mt-1 text-meta">
            Now {formatCurrency(avgDaily)}/day
          </p>
        </div>

        {/* Saved */}
        <div className="card-sm p-3.5">
          <p className="text-meta font-medium">Saved</p>
          <p className={cn(
            "tabular-nums mt-1.5 text-lg font-bold",
            savingsRate < 0
              ? "text-red-600 dark:text-red-400"
              : savingsRate < 20
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
          )}>
            {savingsRate}%
          </p>
          <p className="tabular-nums mt-1 text-meta">
            {remaining >= 0 ? formatCurrency(remaining) : `−${formatCurrency(Math.abs(remaining))}`}
          </p>
        </div>

        {/* Month-End Forecast */}
        <div className={cn(
          "rounded-[0.875rem] border p-3.5",
          forecastOverBudget
            ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
            : forecastWarning
              ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30"
              : "card-sm"
        )}>
          <div className={cn(
            "flex items-center gap-1.5 text-meta font-medium",
            forecastOverBudget
              ? "text-red-600 dark:text-red-400"
              : forecastWarning
                ? "text-amber-600 dark:text-amber-400"
                : ""
          )}>
            <span>Forecast</span>
            <InfoTooltip title="End-of-Month Forecast">
              <p>Projects your total spend by month end using your average daily spending.</p>
              <p className="mt-1"><strong>Confidence:</strong></p>
              <ul className="ml-3 list-disc mt-0.5">
                <li><strong>Low</strong> — less than 7 days of data</li>
                <li><strong>Medium</strong> — 7–14 days of data</li>
                <li><strong>High</strong> — 15+ days of data</li>
              </ul>
            </InfoTooltip>
          </div>
          <p className={cn(
            "tabular-nums mt-1.5 text-lg font-bold",
            forecastOverBudget
              ? "text-red-700 dark:text-red-400"
              : forecastWarning
                ? "text-amber-700 dark:text-amber-400"
                : ""
          )} style={!forecastOverBudget && !forecastWarning ? { color: 'var(--text-primary)' } : undefined}>
            {forecast.projectedTotal > 0 ? formatCurrency(forecast.projectedTotal) : "—"}
          </p>
          <p className="tabular-nums mt-1 text-meta">
            {forecast.projectedTotal > 0 && salary > 0
              ? `${Math.round((forecast.projectedTotal / salary) * 100)}% of budget`
              : "\u00A0"}
          </p>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}
