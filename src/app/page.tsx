"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { CategoryChart, CategoryLegend } from "@/components/dashboard/CategoryChart";
import { DailyTrendChart } from "@/components/dashboard/DailyTrendChart";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useCalculations } from "@/hooks/useCalculations";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { useUIStore } from "@/stores/uiStore";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { CategoryBadge } from "@/components/expenses/CategoryChips";

export default function DashboardPage() {
  const router = useRouter();
  const { currentMonth, currentYear } = useUIStore();
  const { expenses, syncStatus } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();

  // Auto-apply recurring expenses for current month
  useRecurringExpenses(currentMonth, currentYear);

  const {
    monthlyTotal,
    remaining,
    budgetUsedPercent,
    avgDaily,
    categoryTotals,
    dailyTotals,
    stackedDailyTotals,
    topCategory,
    daysRemaining,
    paceToStayUnder,
  } = useCalculations(expenses, settings.categories, settings.salary, currentMonth, currentYear);

  const recentExpenses = [...expenses]
    .sort((a, b) => b.day - a.day || b.createdAt - a.createdAt)
    .slice(0, 5);

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/category/${encodeURIComponent(categorySlug)}?month=${currentMonth}&year=${currentYear}`);
  };

  const handleDayClick = (day: number) => {
    const { setActiveCategories, setSearchQuery } = useUIStore.getState();
    setActiveCategories([]);
    setSearchQuery(`day:${day}`);
    router.push("/expenses");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
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
          daysRemaining={daysRemaining}
          paceToStayUnder={paceToStayUnder}
          expenseCount={expenses.length}
        />

        {/* Alerts */}
        <AlertsPanel
          categoryTotals={categoryTotals}
          categoryBudgets={settings.categoryBudgets}
          budgetUsedPercent={budgetUsedPercent}
          avgDaily={avgDaily}
          paceToStayUnder={paceToStayUnder}
          onCategoryClick={handleCategoryClick}
        />

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Category Breakdown
            </h3>
            <CategoryChart
              categoryTotals={categoryTotals}
              onCategoryClick={handleCategoryClick}
              categoryBudgets={settings.categoryBudgets}
              expenses={expenses}
            />
            <div className="mt-3">
              <CategoryLegend categoryTotals={categoryTotals} onCategoryClick={handleCategoryClick} categoryBudgets={settings.categoryBudgets} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Daily Spending Trend
            </h3>
            <DailyTrendChart
              dailyTotals={dailyTotals}
              stackedDailyTotals={stackedDailyTotals}
              onBarClick={handleDayClick}
            />
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
            <div className="space-y-1">
              {recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge category={e.category} />
                    <div className="min-w-0">
                      {e.remark && (
                        <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                          {e.remark}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {e.day} {getMonthName(currentMonth).slice(0, 3)} {currentYear}
                      </p>
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
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
