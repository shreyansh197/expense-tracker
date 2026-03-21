"use client";

import {
  Wallet,
  PiggyBank,
  TrendingDown,
  AlertTriangle,
  Clock,
  Gauge,
  Percent,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { BUDGET_WARNING_THRESHOLD } from "@/lib/constants";
import { buildCategoryMap } from "@/lib/categories";
import { useSettings } from "@/hooks/useSettings";
import type { CategoryTotal } from "@/types";

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
}

export function KpiCards({
  monthlyTotal,
  remaining,
  salary,
  avgDaily,
  budgetUsedPercent,
  topCategory,
  daysRemaining,
  paceToStayUnder,
  expenseCount,
}: KpiCardsProps) {
  const isOverspent = remaining < 0;
  const isWarning = !isOverspent && budgetUsedPercent >= BUDGET_WARNING_THRESHOLD;
  const { settings } = useSettings();
  const catMap = buildCategoryMap(settings.customCategories);
  const paceExceeded = avgDaily > paceToStayUnder && paceToStayUnder > 0;
  const savingsRate = salary > 0 ? Math.round((remaining / salary) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {/* Total Spent */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <TrendingDown size={14} />
          <span>Spent</span>
        </div>
        <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          {formatCurrency(monthlyTotal)}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isOverspent
                ? "bg-red-500"
                : isWarning
                  ? "bg-amber-500"
                  : "bg-blue-500"
            )}
            style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {budgetUsedPercent}% of budget · {expenseCount} txns
        </p>
      </div>

      {/* Remaining + Days Left */}
      <div
        className={cn(
          "rounded-xl border p-4 shadow-sm",
          isOverspent
            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
            : isWarning
              ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50"
              : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50"
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
            "mt-1 text-xl font-bold sm:text-2xl",
            isOverspent
              ? "text-red-700 dark:text-red-400"
              : isWarning
                ? "text-amber-700 dark:text-amber-400"
                : "text-emerald-700 dark:text-emerald-400"
          )}
        >
          {formatCurrency(Math.abs(remaining))}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
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

      {/* Budget */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Wallet size={14} />
          <span>Budget</span>
        </div>
        <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          {formatCurrency(salary)}
        </p>
        {topCategory && (
          <p className="mt-1 text-xs text-gray-400">
            Top:{" "}
            <span
              className="font-medium"
              style={{ color: catMap[topCategory.category]?.color }}
            >
              {catMap[topCategory.category]?.label}
            </span>
          </p>
        )}
      </div>

      {/* Daily Pace */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Gauge size={14} />
          <span>Daily Pace</span>
        </div>
        <p className={cn(
          "mt-1 text-xl font-bold sm:text-2xl",
          paceExceeded
            ? "text-amber-600 dark:text-amber-400"
            : "text-gray-900 dark:text-white"
        )}>
          {paceToStayUnder > 0 ? `${formatCurrency(paceToStayUnder)}/d` : "—"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Currently {formatCurrency(avgDaily)}/day
        </p>
      </div>

      {/* Savings Rate */}
      <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Percent size={14} />
          <span>Savings Rate</span>
        </div>
        <p className={cn(
          "mt-1 text-xl font-bold sm:text-2xl",
          savingsRate < 0
            ? "text-red-600 dark:text-red-400"
            : savingsRate < 20
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
        )}>
          {savingsRate}%
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {remaining >= 0 ? `Saving ${formatCurrency(remaining)}` : `Over by ${formatCurrency(Math.abs(remaining))}`}
        </p>
      </div>
    </div>
  );
}
