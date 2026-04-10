"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { m, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { SubscriptionsSummary } from "@/components/dashboard/SubscriptionsSummary";
import { RecurringSuggestions } from "@/components/dashboard/RecurringSuggestions";
import { SavingsGoalsWidget } from "@/components/dashboard/SavingsGoalsWidget";
import { DashboardCustomizer, getVisibleSections } from "@/components/dashboard/DashboardCustomizer";
import { RevealOnScroll } from "@/components/motion/RevealOnScroll";
import { staggerLoose, fadeUp } from "@/lib/motion/variants";
import { SkeletonKpiCards, SkeletonChart } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { ChartIllustration, HeaderGraphic, SparkGraphic, WavePatternGraphic } from "@/components/ui/illustrations";
import { ObserverCharacter } from "@/components/ui/illustrations/characters";
import { Trophy, Wallet } from "lucide-react";

// Lazy-load heavy chart components (recharts ~200KB)
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
const SmartInsights = dynamic(
  () => import("@/components/dashboard/SmartInsights").then((m) => m.SmartInsights),
  { ssr: false },
);

import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { useUIStore } from "@/stores/uiStore";
import { getMonthName } from "@/lib/utils";
import { formatCurrency as fmtCurrency } from "@/lib/utils";
import { convert, getFallbackRates } from "@/lib/exchangeRates";
import { useCurrency } from "@/hooks/useCurrency";
import { getSpendingStreak } from "@/lib/calculations";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/lib/authClient";
import { CategoryDot } from "@/components/expenses/CategoryChips";
import { QuickHelpButton } from "@/components/ui/QuickHelpButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Repeat, PlusCircle, Target, BarChart3, Sparkles, ChevronDown, Check, ArrowRight, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSectionId, DashboardLayout, Expense } from "@/types";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import type { ReactNode } from "react";
import { SpendingHeatmap } from "@/components/dashboard/SpendingHeatmap";
import { SpendingComparison } from "@/components/dashboard/SpendingComparison";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useMonthUrlSync } from "@/hooks/useMonthUrlSync";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getAllCategories } from "@/lib/categories";

/* ── Lightweight fallback for per-section ErrorBoundary ────── */
function SectionFallback() {
  return (
    <div className="card flex items-center justify-center gap-2 py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
      <span>This section failed to load.</span>
    </div>
  );
}

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
    <div className="dash-section">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-xs font-semibold uppercase tracking-wider lg:hidden"
        style={{ color: 'var(--text-tertiary)' }}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown size={18} className={cn("transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div className={cn(
        "transition-all duration-300 ease-in-out lg:block",
        open ? "block opacity-100" : "hidden opacity-0 lg:block lg:opacity-100"
      )}>
        {children}
      </div>
    </div>
  );
}

/* ── Onboarding step ──────────────────────────────────────── */
function OnboardingStep({
  done,
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  done: boolean;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    indigo: { bg: "bg-data-soft", text: "text-data-text", ring: "ring-data-border" },
    emerald: { bg: "bg-brand-soft", text: "text-brand", ring: "ring-brand-border" },
    amber: { bg: "bg-coral-soft", text: "text-coral", ring: "ring-coral-border" },
  };
  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <div className={cn(
      "relative flex items-center gap-3.5 rounded-xl p-3.5 transition-all duration-200",
      done ? "opacity-50" : ""
    )} style={{ background: 'var(--surface-secondary)' }}>
      {/* Step indicator */}
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
        done ? "bg-[var(--goal-achieved-bg)]" : c.bg
      )}>
        {done ? (
          <Check size={16} className="text-ok" strokeWidth={2.5} />
        ) : (
          <Icon size={16} className={c.text} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold leading-tight", done && "line-through")} style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function WelcomeCard({ onAddExpense, hasBudget }: { onAddExpense: () => void; hasBudget: boolean }) {
  const stepsCompleted = hasBudget ? 1 : 0;
  const totalSteps = 3;

  return (
    <m.div
      className="dash-section relative overflow-hidden rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', boxShadow: 'var(--card-shadow)' }}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Gradient accent bar */}
      <div className="h-1" style={{ background: 'var(--accent-gradient)' }} />

      <div className="relative p-5 sm:p-7">
        {/* Header */}
        <m.div
          className="flex items-start gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--accent-soft)' }}>
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight sm:text-xl" style={{ color: 'var(--text-primary)' }}>
              Welcome to ExpenStream
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Get set up in a few quick steps.
            </p>
          </div>
        </m.div>

        {/* Progress indicator */}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }}>
            <m.div
              className="h-full rounded-full"
              style={{ background: 'var(--accent-gradient)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(stepsCompleted / totalSteps) * 100}%` }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-xs font-bold text-amount" style={{ color: 'var(--text-tertiary)' }}>
            {stepsCompleted}/{totalSteps}
          </span>
        </div>

        {/* Steps */}
        <m.div
          className="mt-4 grid gap-2 sm:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
        >
          {[
            { done: hasBudget, icon: Target, color: "indigo" as const, title: "Set your budget", subtitle: "Settings → Monthly Budget" },
            { done: false, icon: PlusCircle, color: "emerald" as const, title: "Add first expense", subtitle: "Track where your money goes" },
            { done: false, icon: BarChart3, color: "amber" as const, title: "Explore insights", subtitle: "Charts & alerts appear automatically" },
          ].map((step) => (
            <m.div key={step.title} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } }}>
              <OnboardingStep {...step} />
            </m.div>
          ))}
        </m.div>

        {/* CTA */}
        <m.button
          onClick={onAddExpense}
          className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl sm:w-auto sm:px-8"
          style={{ background: 'var(--accent-gradient)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.97 }}
        >
          <PlusCircle size={16} strokeWidth={2.5} />
          Add Your First Expense
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </m.button>
      </div>
    </m.div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardShell />
    </Suspense>
  );
}

/** Thin wrapper so DashboardContent renders INSIDE AppShell / CalculationsProvider */
function DashboardShell() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  usePageTitle("Dashboard");
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentMonth, currentYear, setMonth } = useUIStore();
  const { expenses, loading } = useExpenses(currentMonth, currentYear);
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();

  // Reset to present month when navigating to dashboard without explicit URL params
  useEffect(() => {
    if (!searchParams.get("m") && !searchParams.get("y")) {
      const now = new Date();
      setMonth(now.getMonth() + 1, now.getFullYear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync month/year ↔ URL search params (?m=4&y=2026)
  useMonthUrlSync();

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
    daysRemaining,
    paceToStayUnder,
    forecast,
    anomalies,
    effectiveBudget,
  } = useCalculationsContext();

  const recentExpenses = [...expenses]
    .sort((a, b) => b.day - a.day || b.createdAt - a.createdAt)
    .slice(0, 5);

  // Previous month expenses — for SmartInsights & SpendingComparison
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const { expenses: prevMonthExpenses } = useExpenses(prevMonth, prevYear);
  const prevMonthTotal = useMemo(
    () => prevMonthExpenses.reduce((s, e) => s + e.amount, 0),
    [prevMonthExpenses],
  );
  const allCategories = useMemo(
    () => getAllCategories(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  // Spending streak — consecutive days with at least one expense logged
  const allExpenses = useDexieQuery(
    () => {
      const wid = getActiveWorkspaceId();
      if (!wid) return [] as { year: number; month: number; day: number; deletedAt: number | null }[];
      return db.expenses.where("workspaceId").equals(wid).toArray();
    },
    [],
    [] as { year: number; month: number; day: number; deletedAt: number | null }[],
  );
  const streak = useMemo(() => getSpendingStreak(allExpenses as Expense[]), [allExpenses]);

  // Budget milestone celebrations — toast at 25%, 50%, 75% savings thresholds (once per month)
  const { toast } = useToast();
  useEffect(() => {
    if (!effectiveBudget || effectiveBudget <= 0 || loading) return;
    const savedPercent = Math.round(((effectiveBudget - monthlyTotal) / effectiveBudget) * 100);
    if (savedPercent <= 0) return;
    const milestoneKey = `expenstream-milestone-${currentYear}-${currentMonth}`;
    const shown: number[] = JSON.parse(localStorage.getItem(milestoneKey) || "[]");
    const milestones = [75, 50, 25] as const;
    for (const m of milestones) {
      if (savedPercent >= m && !shown.includes(m)) {
        shown.push(m);
        localStorage.setItem(milestoneKey, JSON.stringify(shown));
        const msgs: Record<number, string> = {
          25: `25% of budget saved — nice start!`,
          50: `Halfway there — 50% saved this month!`,
          75: `75% saved — outstanding discipline! 🏆`,
        };
        toast(msgs[m], "success");
        break; // only one toast per render cycle
      }
    }
  }, [effectiveBudget, monthlyTotal, currentMonth, currentYear, loading, toast]);

  // Welcome card: only show for truly new users, dismiss permanently once any expense exists
  const WELCOME_KEY = "expenstream-welcome-dismissed";
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(WELCOME_KEY) === "true";
  });

  // Persist dismissal when user adds their first expense (derived, no cascading setState)
  if (!welcomeDismissed && expenses.length > 0) {
    localStorage.setItem(WELCOME_KEY, "true");
    setWelcomeDismissed(true);
  }

  const showWelcome = !loading && !welcomeDismissed && expenses.length === 0;

  const [chartTab, setChartTab] = useState<"category" | "daily">("category");

  const visibleSections = getVisibleSections(settings.dashboardLayout);

  const handleSaveLayout = useCallback((layout: DashboardLayout) => {
    updateSettings({ dashboardLayout: layout });
  }, [updateSettings]);

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
        <PageTransition className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-5 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header — hero zone */}
        <m.div
          className="zone-header dash-section relative z-40 overflow-hidden rounded-2xl p-5 sm:p-6"
          style={{
            background: 'var(--surface)',
            backgroundImage: 'var(--gradient-hero)',
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--shadow-sm)',
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Abstract decorative graphic — desktop only */}
          <div className="pointer-events-none absolute right-3 top-3 sm:right-5 sm:top-3">
            <HeaderGraphic />
          </div>
          {/* Character illustration — ObserverCharacter for calm presence (density: max 1 character + 1 art per section) */}
          <div className="pointer-events-none absolute right-16 bottom-3 opacity-40 sm:opacity-70 scale-75 sm:scale-100 origin-bottom-right">
            <ObserverCharacter size={80} />
          </div>

          <h1 className="sr-only">Dashboard</h1>

          {user?.name && (
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-xs font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {(() => {
                    const h = new Date().getHours();
                    if (h < 5) return "🌙 Burning the midnight oil";
                    if (h < 12) return "☀️ Good morning";
                    if (h < 17) return "👋 Good afternoon";
                    if (h < 21) return "🌅 Good evening";
                    return "🌙 Good night";
                  })()}
                </p>
                {streak >= 2 && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--warning-soft)', color: 'var(--warning-text)' }}>
                    <Flame size={10} />
                    {streak}d streak
                  </span>
                )}
              </div>
              <p className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {user.name.split(" ")[0]}
              </p>
              <p className="mt-0.5 text-xs sm:text-xs tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          )}
          <div data-tour="dashboard" className="flex items-center justify-between gap-2">
            <div className="min-w-0 shrink-1">
              <MonthSwitcher />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SyncIndicator />
              <DashboardCustomizer layout={settings.dashboardLayout} onSave={handleSaveLayout} />
              <div className="relative z-[50] lg:hidden">
                <QuickHelpButton />
              </div>
            </div>
          </div>
        </m.div>

        {/* Welcome Card for first-time users */}
        {showWelcome && (
          <WelcomeCard
            onAddExpense={() => {
              localStorage.setItem(WELCOME_KEY, "true");
              setWelcomeDismissed(true);
              useUIStore.getState().openAddForm();
            }}
            hasBudget={settings.salary > 0}
          />
        )}

        {/* Smart Insights — contextual spending analysis */}
        {!loading && expenses.length > 0 && (
          <SmartInsights
            expenses={expenses}
            previousMonthExpenses={prevMonthExpenses}
            salary={effectiveBudget}
            categories={allCategories}
          />
        )}

        {/* ── Dashboard sections rendered in user-customized order ── */}
        <m.div initial="initial" animate="animate" variants={staggerLoose} className="space-y-5 sm:space-y-6">
        {visibleSections.map((sectionId) => {
          const renderer: Record<DashboardSectionId, () => ReactNode> = {
            kpi: () => (
              <AnimatePresence mode="wait" key="kpi">
                {loading ? (
                  <m.div key="kpi-skeleton" className="dash-section" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <SkeletonKpiCards />
                  </m.div>
                ) : (
                  <m.div key="kpi-content" className="dash-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  {/* vs last month comparison — inline with section */}
                  {prevMonthTotal > 0 && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>This month</span>
                      <SpendingComparison currentTotal={monthlyTotal} previousTotal={prevMonthTotal} />
                    </div>
                  )}
                  {/* Trophy: month ended under budget */}
                  {daysRemaining === 0 && remaining >= 0 && effectiveBudget > 0 && (
                    <div className="mb-3 flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--goal-achieved-border)', background: 'var(--goal-achieved-bg)' }}>
                      <Trophy size={28} className="shrink-0" style={{ color: 'var(--success)' }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--goal-achieved-text)' }}>Budget Goal Met!</p>
                        <p className="text-xs" style={{ color: 'var(--goal-achieved-text)', opacity: 0.8 }}>You stayed under budget this month. Great discipline!</p>
                      </div>
                    </div>
                  )}
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
              )}
              </AnimatePresence>
            ),

            alerts: () => (
              expenses.length > 0 && effectiveBudget > 0 ? (
                <div key="alerts">
                <CollapsibleSection id="alerts" title="Insights & Alerts">
                <div className="space-y-4">
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
                {(settings.recurringExpenses ?? []).length > 0 && <SubscriptionsSummary />}
                </div>
                </CollapsibleSection>
                </div>
              ) : null
            ),

            subscriptions: () => (
              <div key="subscriptions" className="space-y-4 sm:space-y-5">
                {/* Subscriptions shown inside alerts section when budget is set; standalone fallback here */}
                {!(expenses.length > 0 && effectiveBudget > 0) && (settings.recurringExpenses ?? []).length > 0 && (
                  <div>
                  <CollapsibleSection id="subscriptions" title="Recurring Expenses">
                  <SubscriptionsSummary />
                  </CollapsibleSection>
                  </div>
                )}
                <RecurringSuggestions />
              </div>
            ),

            goals: () => (
              (settings.goals ?? []).length > 0 ? (
                <div key="goals">
                <CollapsibleSection id="goals" title="Savings Goals">
                <SavingsGoalsWidget />
                </CollapsibleSection>
                </div>
              ) : null
            ),

            charts: () => (
              <div key="charts">
              <AnimatePresence mode="wait">
                {loading ? (
                  <m.div key="chart-skeleton" className="dash-section" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <SkeletonChart />
                  </m.div>
                ) : expenses.length === 0 ? (
                <div className="dash-section card relative overflow-hidden p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="relative text-section-title mb-4">Spending Insights</h3>
                    <WavePatternGraphic />
                  </div>
                  <div className="relative flex h-[220px] items-center justify-center">
                    <div className="flex flex-col items-center text-center">
                      <ChartIllustration size={120} />
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Preview</p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Your spending charts will appear here</p>
                    </div>
                  </div>
                </div>
              ) : (
              <>
              <div className="dash-section">
                {(() => {
                  const tabToggle = (
                    <div className="segmented-control">
                      <button data-active={chartTab === "category" ? "true" : undefined} onClick={() => setChartTab("category")}>Categories</button>
                      <button data-active={chartTab === "daily" ? "true" : undefined} onClick={() => setChartTab("daily")}>Daily</button>
                    </div>
                  );
                  return (
                <div className="card overflow-hidden p-5">
                  <AnimatePresence mode="wait" initial={false}>
                    {chartTab === "category" ? (
                      <m.div key="cat" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>
                        <CategoryChart
                          categoryTotals={categoryTotals}
                          onCategoryClick={handleCategoryClick}
                          categoryBudgets={settings.categoryBudgets}
                          expenses={expenses}
                          headerLeft={tabToggle}
                        />
                        <div className="mt-4">
                          <CategoryLegend categoryTotals={categoryTotals} onCategoryClick={handleCategoryClick} categoryBudgets={settings.categoryBudgets} />
                        </div>
                      </m.div>
                    ) : (
                      <m.div key="daily" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                        <div className="h-[320px]">
                          <DailyTrendChart
                            dailyTotals={dailyTotals}
                            stackedDailyTotals={stackedDailyTotals}
                            onBarClick={handleDayClick}
                            headerLeft={tabToggle}
                          />
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
                  );
                })()}
              </div>
              <RevealOnScroll className="dash-section mt-4" delay={0.15}>
                <SpendingHeatmap
                  expenses={expenses}
                  month={currentMonth}
                  year={currentYear}
                  onDayClick={handleDayClick}
                />
              </RevealOnScroll>
              </>
              )}
              </AnimatePresence>
              </div>
            ),

            recent: () => (
              <div key="recent">
              <div className="dash-section card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  <h3 className="text-section-title">
                    Recent Expenses
                  </h3>
                  <SparkGraphic />
                  </div>
                  {recentExpenses.length > 0 && (
                    <a
                      href="/expenses"
                      className="text-xs font-semibold transition-colors"
                      style={{ color: 'var(--accent)' }}
                    >
                      View All →
                    </a>
                  )}
                </div>
                {recentExpenses.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Wallet size={32} className="text-brand opacity-60" />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No expenses this month</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your recent spending will show up here</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {recentExpenses.map((e, idx) => (
                      <m.div
                        key={e.id}
                        className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-[var(--surface-secondary)]"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                        <span className="text-amount ml-3 shrink-0 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                          {settings.multiCurrencyEnabled && e.currency && e.currency !== settings.currency
                            ? fmtCurrency(e.amount, e.currency)
                            : formatCurrency(e.amount)}
                        </span>
                        {settings.multiCurrencyEnabled && e.currency && e.currency !== settings.currency && (
                          <span className="text-amount ml-3 shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                            ≈ {fmtCurrency(convert(e.amount, e.currency, settings.currency, getFallbackRates(settings.currency)), settings.currency)}
                          </span>
                        )}
                      </m.div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            ),
          };

          return <m.div key={sectionId} variants={fadeUp}><ErrorBoundary fallback={<SectionFallback />}>{renderer[sectionId]()}</ErrorBoundary></m.div>;
        })}
        </m.div>
      </PageTransition>
  );
}