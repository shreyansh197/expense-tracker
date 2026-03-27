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
import { SubscriptionsSummary } from "@/components/dashboard/SubscriptionsSummary";
import { SavingsGoalsWidget } from "@/components/dashboard/SavingsGoalsWidget";
import { SkeletonKpiCards, SkeletonChart } from "@/components/ui/Skeleton";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useCalculations } from "@/hooks/useCalculations";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { useUIStore } from "@/stores/uiStore";
import { getMonthName } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { CategoryDot } from "@/components/expenses/CategoryChips";
import { Repeat, Receipt } from "lucide-react";

export default function DashboardPage() {
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const { currentMonth, currentYear } = useUIStore();
  const { expenses, loading, syncStatus } = useExpenses(currentMonth, currentYear);
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
    forecast,
    anomalies,
    effectiveBudget,
  } = useCalculations(
    expenses,
    settings.categories,
    settings.salary,
    currentMonth,
    currentYear,
    settings.rolloverEnabled,
    settings.rolloverHistory
  );

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
        <div className="mx-auto max-w-4xl xl:max-w-6xl space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <MonthSwitcher />
          <SyncIndicator syncStatus={syncStatus} />
        </div>

        {/* KPI Cards */}
        {loading ? (
          <SkeletonKpiCards />
        ) : (
          <KpiCards
            monthlyTotal={monthlyTotal}
            remaining={remaining}
            salary={effectiveBudget}
            avgDaily={avgDaily}
            budgetUsedPercent={budgetUsedPercent}
            topCategory={topCategory}
            daysRemaining={daysRemaining}
            paceToStayUnder={paceToStayUnder}
            expenseCount={expenses.length}
            forecast={forecast}
            rolloverAmount={
              settings.rolloverEnabled && settings.rolloverHistory
                ? (() => {
                    let pm = currentMonth - 1, py = currentYear;
                    if (pm <= 0) { pm = 12; py -= 1; }
                    return settings.rolloverHistory[`${py}-${String(pm).padStart(2, "0")}`] ?? 0;
                  })()
                : 0
            }
          />
        )}

        {/* Alerts */}
        <AlertsPanel
          categoryTotals={categoryTotals}
          categoryBudgets={settings.categoryBudgets}
          budgetUsedPercent={budgetUsedPercent}
          avgDaily={avgDaily}
          paceToStayUnder={paceToStayUnder}
          forecast={forecast}
          anomalies={anomalies}
          onCategoryClick={handleCategoryClick}
        />

        {/* Subscriptions Summary */}
        <SubscriptionsSummary />

        {/* Savings Goals */}
        <SavingsGoalsWidget />

        {/* Charts Row */}
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 lg:p-5 dark:border-slate-800 dark:bg-slate-900 card-interactive">
            <h3 className="mb-4 text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300">
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

          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 lg:p-5 dark:border-slate-800 dark:bg-slate-900 card-interactive">
            <h3 className="mb-4 text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300">
              Daily Spending Trend
            </h3>
            <div className="flex-1 min-h-0">
            <DailyTrendChart
              dailyTotals={dailyTotals}
              stackedDailyTotals={stackedDailyTotals}
              onBarClick={handleDayClick}
            />
            </div>
          </div>
        </div>
        )}

        {/* Recent Expenses */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 lg:p-5 dark:border-slate-800 dark:bg-slate-900 card-interactive">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300">
              Recent Expenses
            </h3>
            <a
              href="/expenses"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View All →
            </a>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-10 text-slate-400">
              <Receipt className="h-9 w-9 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">No expenses this month</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Tap + to add your first one</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                >
                  <div className="grid min-w-0 flex-1" style={{ gridTemplateColumns: "5.5rem 1fr", gap: "0.75rem", alignItems: "center" }}>
                    <div className="w-[5.5rem] flex justify-start">
                      <CategoryDot category={e.category} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {e.isRecurring && <Repeat className="shrink-0 h-3 w-3 text-blue-500" />}
                        <p className="text-xs text-slate-400">
                          {e.day} {getMonthName(currentMonth).slice(0, 3)}
                        </p>
                      </div>
                      {e.remark && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {e.remark}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="tabular-nums ml-3 shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
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
