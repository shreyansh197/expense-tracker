"use client";

import {
  PiggyBank,
  AlertTriangle,
  Clock,
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
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 card-interactive">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Spent</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <p className="tabular-nums text-2xl font-semibold text-gray-900 sm:text-3xl dark:text-white">
              {formatCurrency(monthlyTotal)}
            </p>
            <span className="text-sm text-gray-300 dark:text-gray-600">/</span>
            <span className="tabular-nums text-sm font-medium text-gray-400 dark:text-gray-500">
              {formatCurrency(salary)}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOverspent
                  ? "bg-red-500"
                  : isWarning
                    ? "bg-amber-500"
                    : "bg-indigo-500"
              )}
              style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {budgetUsedPercent}% of budget · {expenseCount} txns
            </p>
            {rolloverAmount > 0 && (
              <p className="text-[10px] text-indigo-500">
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
              "flex items-center gap-2 text-sm",
              isOverspent
                ? "text-red-600 dark:text-red-400"
                : isWarning
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {isOverspent ? <AlertTriangle size={14} /> : <PiggyBank size={14} />}
            <span>{isOverspent ? "Overspent" : "Remaining"}</span>
          </div>
          <p
            className={cn(
              "tabular-nums mt-1.5 text-2xl font-semibold sm:text-3xl",
              isOverspent
                ? "text-red-700 dark:text-red-400"
                : isWarning
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {formatCurrency(Math.abs(remaining))}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <Clock size={11} className="text-gray-400" />
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

      {/* ── Metrics Row: Pace, Savings, Forecast ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Spend Target */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Spend Target</span>
          </div>
          <p className={cn(
            "tabular-nums mt-1 text-lg font-semibold",
            paceExceeded
              ? "text-amber-600 dark:text-amber-400"
              : "text-gray-900 dark:text-white"
          )}>
            {paceToStayUnder > 0 ? `${formatCurrency(paceToStayUnder)}/d` : "—"}
          </p>
          <p className="tabular-nums mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Now {formatCurrency(avgDaily)}/day
          </p>
        </div>

        {/* Saved */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Saved</span>
          </div>
          <p className={cn(
            "tabular-nums mt-1 text-lg font-semibold",
            savingsRate < 0
              ? "text-red-600 dark:text-red-400"
              : savingsRate < 20
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
          )}>
            {savingsRate}%
          </p>
          <p className="tabular-nums mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {remaining >= 0 ? formatCurrency(remaining) : `−${formatCurrency(Math.abs(remaining))}`}
          </p>
        </div>

        {/* Month-End Forecast */}
        <div className={cn(
          "rounded-2xl border p-3",
          forecastOverBudget
            ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
            : forecastWarning
              ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30"
              : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
        )}>
          <div className={cn(
            "flex items-center gap-1.5 text-xs",
            forecastOverBudget
              ? "text-red-600 dark:text-red-400"
              : forecastWarning
                ? "text-amber-600 dark:text-amber-400"
                : "text-gray-500 dark:text-gray-400"
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
            "tabular-nums mt-1 text-lg font-semibold",
            forecastOverBudget
              ? "text-red-700 dark:text-red-400"
              : forecastWarning
                ? "text-amber-700 dark:text-amber-400"
                : "text-gray-900 dark:text-white"
          )}>
            {forecast.projectedTotal > 0 ? formatCurrency(forecast.projectedTotal) : "—"}
          </p>
          <p className="tabular-nums mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {forecast.projectedTotal > 0 && salary > 0
              ? `${Math.round((forecast.projectedTotal / salary) * 100)}% of budget`
              : "\u00A0"}
          </p>
        </div>
      </div>
    </div>
  );
}
