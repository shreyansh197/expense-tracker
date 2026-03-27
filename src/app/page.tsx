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
import { Repeat, Receipt, PlusCircle } from "lucide-react";

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
        <div className="fade-in mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-5 p-4 lg:p-6">
        {/* Header */}
        <div data-tour="dashboard" className="flex items-center justify-between">
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
          <div className="card p-5">
            <h3 className="text-section-title mb-4">
              Category Breakdown
            </h3>
            <CategoryChart
              categoryTotals={categoryTotals}
              onCategoryClick={handleCategoryClick}
              categoryBudgets={settings.categoryBudgets}
              expenses={expenses}
            />
            <div className="mt-4">
              <CategoryLegend categoryTotals={categoryTotals} onCategoryClick={handleCategoryClick} categoryBudgets={settings.categoryBudgets} />
            </div>
          </div>

          <div className="card flex flex-col p-5">
            <h3 className="text-section-title mb-4">
              Daily Spending Trend
            </h3>
            <div className="flex-1 min-h-[280px]">
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
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-section-title">
              Recent Expenses
            </h3>
            <a
              href="/expenses"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              View All →
            </a>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12" style={{ color: 'var(--text-tertiary)' }}>
              <Receipt className="h-10 w-10" />
              <p className="text-sm font-medium">No expenses this month</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Start tracking to see your spending here</p>
              <button
                onClick={() => router.push("/expenses")}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Expense
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors"
                  style={{ ['--tw-bg-opacity' as string]: 1 }}
                  onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-secondary)'}
                  onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                >
                  <div className="grid min-w-0 flex-1" style={{ gridTemplateColumns: "5.5rem 1fr", gap: "0.75rem", alignItems: "center" }}>
                    <div className="w-[5.5rem] flex justify-start">
                      <CategoryDot category={e.category} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {e.isRecurring && <Repeat className="shrink-0 h-3 w-3 text-blue-500" />}
                        <p className="text-meta">
                          {e.day} {getMonthName(currentMonth).slice(0, 3)}
                        </p>
                      </div>
                      {e.remark && (
                        <p className="truncate text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {e.remark}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="tabular-nums ml-3 shrink-0 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
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
