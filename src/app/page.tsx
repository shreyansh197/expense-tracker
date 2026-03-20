"use client";

export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { CategoryChart, CategoryLegend } from "@/components/dashboard/CategoryChart";
import { DailyTrendChart } from "@/components/dashboard/DailyTrendChart";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useCalculations } from "@/hooks/useCalculations";
import { useUIStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import { CategoryBadge } from "@/components/expenses/CategoryChips";

export default function DashboardPage() {
  const { currentMonth, currentYear } = useUIStore();
  const { expenses, syncStatus } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();

  const {
    monthlyTotal,
    remaining,
    budgetUsedPercent,
    avgDaily,
    categoryTotals,
    dailyTotals,
    topCategory,
  } = useCalculations(expenses, settings.categories, settings.salary, currentMonth, currentYear);

  const recentExpenses = [...expenses]
    .sort((a, b) => b.day - a.day || b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <MonthSwitcher />
          <SyncIndicator syncStatus={syncStatus} />
        </div>

        {/* KPI Cards */}
        <KpiCards
          monthlyTotal={monthlyTotal}
          remaining={remaining}
          salary={settings.salary}
          avgDaily={avgDaily}
          budgetUsedPercent={budgetUsedPercent}
          topCategory={topCategory}
        />

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Category Breakdown
            </h3>
            <CategoryChart categoryTotals={categoryTotals} />
            <div className="mt-3">
              <CategoryLegend categoryTotals={categoryTotals} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Daily Spending Trend
            </h3>
            <DailyTrendChart dailyTotals={dailyTotals} />
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Recent Expenses
            </h3>
            <a
              href="/expenses"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View All →
            </a>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No expenses this month
            </p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={e.category} />
                    <span className="text-xs text-gray-400">Day {e.day}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
