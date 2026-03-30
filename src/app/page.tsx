"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
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
import { QuickHelpButton } from "@/components/ui/QuickHelpButton";
import { Repeat, Receipt, PlusCircle, Target, Settings, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Collapsible section for mobile dashboard ───────────────── */
function CollapsibleSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const storageKey = `expenstream-dash-${id}`;
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(storageKey);
    return stored === null ? true : stored === "true";
  });

  const toggle = useCallback(() => {
    setOpen((prev) => {
      localStorage.setItem(storageKey, String(!prev));
      return !prev;
    });
  }, [storageKey]);

  return (
    <div>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-lg py-1 text-xs font-semibold lg:hidden"
        style={{ color: 'var(--text-tertiary)' }}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown size={14} className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div className={cn(
        "lg:block",
        open ? "block" : "hidden lg:block"
      )}>
        {children}
      </div>
    </div>
  );
}

function WelcomeCard({ onAddExpense, hasBudget }: { onAddExpense: () => void; hasBudget: boolean }) {
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={20} className="text-indigo-500" />
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Welcome to ExpenStream!</h2>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Get started in three simple steps:
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`flex items-start gap-3 rounded-xl p-3.5 ${hasBudget ? 'opacity-60' : ''}`} style={{ background: 'var(--surface-secondary)' }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
            <Target size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {hasBudget ? '✓ Budget set' : '1. Set your budget'}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {hasBudget ? 'You\'re all set' : 'Go to Settings → Monthly Budget'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: 'var(--surface-secondary)' }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
            <PlusCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>2. Add your first expense</p>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Track where your money goes</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: 'var(--surface-secondary)' }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <Settings size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>3. Explore insights</p>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Charts &amp; alerts appear automatically</p>
          </div>
        </div>
      </div>
      <button
        onClick={onAddExpense}
        className="mt-5 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.97] transition-all"
      >
        <PlusCircle size={15} /> Add Your First Expense
      </button>
    </div>
  );
}

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
          <div className="flex items-center gap-2">
            <SyncIndicator syncStatus={syncStatus} />
            <div className="lg:hidden">
              <QuickHelpButton />
            </div>
          </div>
        </div>

        {/* Welcome Card for first-time users */}
        {!loading && expenses.length === 0 && (
          <WelcomeCard
            onAddExpense={() => useUIStore.getState().openAddForm()}
            hasBudget={settings.salary > 0}
          />
        )}

        {/* KPI Cards */}
        {loading ? (
          <SkeletonKpiCards />
        ) : expenses.length === 0 ? null : (
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

        {expenses.length === 0 ? null : (
        <>
        {/* Alerts */}
        <CollapsibleSection id="alerts" title="Alerts">
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
        </CollapsibleSection>

        {/* Subscriptions Summary */}
        <CollapsibleSection id="subscriptions" title="Subscriptions">
        <SubscriptionsSummary />
        </CollapsibleSection>

        {/* Savings Goals */}
        <CollapsibleSection id="goals" title="Savings Goals">
        <SavingsGoalsWidget />
        </CollapsibleSection>

        {/* Charts Row */}
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : expenses.length === 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="text-section-title mb-4">Category Breakdown</h3>
              <div className="flex h-[220px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-24 w-24 rounded-full border-[6px] opacity-20" style={{ borderColor: 'var(--border)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your spending breakdown will appear here</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-section-title mb-4">Daily Spending Trend</h3>
              <div className="flex h-[220px] items-end justify-center gap-1.5 px-4 pb-4">
                {[30, 55, 20, 70, 45, 35, 60, 25, 50, 40, 65, 30].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t opacity-10" style={{ height: `${h}%`, background: 'var(--text-muted)' }} />
                ))}
              </div>
              <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>Your daily trend will appear here</p>
            </div>
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
            {recentExpenses.length > 0 && (
              <a
                href="/expenses"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                View All →
              </a>
            )}
          </div>
          {recentExpenses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8" style={{ color: 'var(--text-tertiary)' }}>
              <Receipt className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium">No expenses this month</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your recent spending will show up here</p>
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
        </>
        )}
      </div>
    </AppShell>
  );
}