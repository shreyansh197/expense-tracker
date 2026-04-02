"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { SkeletonKpiCards, SkeletonChart } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { ChartIllustration } from "@/components/ui/illustrations";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
import { useMonthUrlSync } from "@/hooks/useMonthUrlSync";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { useCalculationsContext } from "@/contexts/CalculationsContext";

const CategoryChart = dynamic(
  () => import("@/components/dashboard/CategoryChart").then((m) => m.CategoryChart),
  { ssr: false },
);
const CategoryLegend = dynamic(
  () => import("@/components/dashboard/CategoryChart").then((m) => m.CategoryLegend),
  { ssr: false },
);
const DailyTrendChart = dynamic(
  () => import("@/components/dashboard/DailyTrendChart").then((m) => m.DailyTrendChart),
  { ssr: false },
);

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsContent() {
  usePageTitle("Analytics");
  useMonthUrlSync();
  const router = useRouter();
  const { currentMonth, currentYear } = useUIStore();
  const { expenses, loading } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();

  const {
    monthlyTotal,
    remaining,
    budgetUsedPercent,
    avgDaily,
    categoryTotals,
    dailyTotals,
    stackedDailyTotals,
    daysRemaining,
    paceToStayUnder,
    forecast,
    anomalies,
    effectiveBudget,
  } = useCalculationsContext();

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/category/${encodeURIComponent(categorySlug)}?month=${currentMonth}&year=${currentYear}`);
  };

  const handleDayClick = (day: number) => {
    const { setActiveCategories, setSearchQuery } = useUIStore.getState();
    setActiveCategories([]);
    setSearchQuery("");
    router.push(`/expenses?m=${currentMonth}&y=${currentYear}&day=${day}`);
  };

  return (
    <AppShell>
      <PageTransition className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Analytics</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Deep dive into your spending patterns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MonthSwitcher />
            <SyncIndicator />
          </div>
        </div>

        {/* KPI Cards */}
        <AnimatePresence mode="wait">
          {loading ? (
            <m.div key="kpi-skeleton" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <SkeletonKpiCards />
            </m.div>
          ) : expenses.length > 0 ? (
            <m.div key="kpi-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <KpiCards
                monthlyTotal={monthlyTotal}
                remaining={remaining}
                salary={effectiveBudget}
                avgDaily={avgDaily}
                budgetUsedPercent={budgetUsedPercent}
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
            </m.div>
          ) : null}
        </AnimatePresence>

        {/* Alerts */}
        {expenses.length > 0 && effectiveBudget > 0 && (
          <ErrorBoundary>
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
          </ErrorBoundary>
        )}

        {/* Charts */}
        <AnimatePresence mode="wait">
          {loading ? (
            <m.div key="chart-skeleton" className="grid gap-4 md:grid-cols-2" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <SkeletonChart />
              <SkeletonChart />
            </m.div>
          ) : expenses.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="card relative overflow-hidden p-5">
                <AmbientBackground />
                <h3 className="relative text-section-title mb-4">Category Breakdown</h3>
                <div className="relative flex h-[220px] items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <ChartIllustration size={120} />
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Preview</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Add expenses to see your breakdown</p>
                  </div>
                </div>
              </div>
              <div className="card relative overflow-hidden p-5">
                <AmbientBackground />
                <h3 className="relative text-section-title mb-4">Daily Trend</h3>
                <div className="relative flex h-[220px] items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <ChartIllustration size={120} />
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Preview</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Add expenses to see your trend</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <m.div key="chart-content" className="grid gap-4 md:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="card p-5">
                <h3 className="text-section-title mb-4">Category Breakdown</h3>
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
                <h3 className="text-section-title mb-4">Daily Spending Trend</h3>
                <div className="flex-1 min-h-[280px]">
                  <DailyTrendChart
                    dailyTotals={dailyTotals}
                    stackedDailyTotals={stackedDailyTotals}
                    onBarClick={handleDayClick}
                  />
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </PageTransition>
    </AppShell>
  );
}
