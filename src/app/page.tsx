"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { m, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { RecurringSuggestions } from "@/components/dashboard/RecurringSuggestions";
import { UpcomingStream } from "@/components/dashboard/UpcomingStream";
import { MonthStartAnchor } from "@/components/dashboard/MonthStartAnchor";
import { RevealOnScroll } from "@/components/motion/RevealOnScroll";
import { stoneSettle } from "@/lib/motion/variants";
import { SkeletonKpiCards, SkeletonChart } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { SpendingStream } from "@/components/dashboard/SpendingStream";
import { SpendingForecastCalendar } from "@/components/analytics/SpendingForecastCalendar";
import { SavingsGoalsWidget } from "@/components/dashboard/SavingsGoalsWidget";
import { NarrativeInsight } from "@/components/dashboard/NarrativeInsight";
import { MonthlyPostcard } from "@/components/dashboard/MonthlyPostcard";
import { PostcardPrompt } from "@/components/dashboard/PostcardPrompt";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { MoneyDnaCard } from "@/components/dashboard/MoneyDnaCard";
import { SpendingChallenges } from "@/components/dashboard/SpendingChallenges";
import { ClearingScene } from "@/components/ui/illustrations/terrain/ClearingScene";
import { Repeat, PlusCircle, ChevronDown, Flame, TrendingUp, AlertTriangle, Leaf, Coffee, Sunrise } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { useUIStore } from "@/stores/uiStore";
import { getMonthName } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { getSpendingStreak } from "@/lib/calculations";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/lib/authClient";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useAchievements } from "@/hooks/useAchievements";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useNotifications } from "@/hooks/useNotifications";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useMonthUrlSync } from "@/hooks/useMonthUrlSync";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getAllCategories } from "@/lib/categories";

/* â”€â”€ Lightweight fallback for per-section ErrorBoundary â”€â”€â”€â”€â”€â”€ */
function SectionFallback() {
  return (
    <div className="card-stone flex items-center justify-center gap-2 py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
      <span>This section couldn&apos;t load.</span>
    </div>
  );
}

// Lazy-load heavy charts (only in "Dig Deeper" expandable)
const CategoryChart = dynamic(
  () => import("@/components/dashboard/CategoryChart").then((m) => m.CategoryChart),
  { ssr: false },
);
const CategoryLegend = dynamic(
  () => import("@/components/dashboard/CategoryChart").then((m) => m.CategoryLegend),
  { ssr: false },
);

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardShell />
    </Suspense>
  );
}

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

  useEffect(() => {
    if (!searchParams.get("m") && !searchParams.get("y")) {
      const now = new Date();
      setMonth(now.getMonth() + 1, now.getFullYear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMonthUrlSync();
  useRecurringExpenses(currentMonth, currentYear);
  useNotifications(currentMonth, currentYear, expenses);

  const {
    monthlyTotal,
    remaining,
    budgetUsedPercent,
    avgDaily,
    categoryTotals,
    dailyTotals,
    daysRemaining,
    daysInMonth,
    paceToStayUnder,
    forecast,
    effectiveBudget,
    anomalies,
  } = useCalculationsContext();

  const anomalyDays = useMemo(
    () => new Set(anomalies.map((a) => a.expense.day)),
    [anomalies],
  );

  // Previous month for comparisons
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const { expenses: prevMonthExpenses } = useExpenses(prevMonth, prevYear);

  const allCategories = useMemo(
    () => getAllCategories(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  // Spending streak
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

  // Achievements
  const achievementsData = useAchievements(settings, allExpenses as Expense[], expenses, streak, updateSettings);

  // Historical data for narrative insights
  useHistoricalData(currentMonth, currentYear);

  // Budget milestone celebrations — only for the real current month
  const { toast } = useToast();
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (!isCurrentMonth) return;
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
          75: `75% saved — outstanding discipline!`,
        };
        toast(msgs[m], "success");
        break;
      }
    }
  }, [effectiveBudget, monthlyTotal, currentMonth, currentYear, loading, toast, isCurrentMonth]);

  // "Dig Deeper" expandable state
  const [digDeeperOpen, setDigDeeperOpen] = useState(false);
  const [moreInsightsOpen, setMoreInsightsOpen] = useState(false);

  // Narrative insights â€” generated from calculations context
  const narrativeInsights = useMemo(() => {
    const insights: Array<{ text: string; type: "tip" | "warning" | "positive" | "neutral"; sparkData?: number[]; icon: LucideIcon }> = [];
    const active = expenses.filter((e) => !e.deletedAt);
    if (active.length === 0) return insights;

    // Time-sensitive insights only make sense for the current month
    const today = isCurrentMonth ? new Date().getDate() : daysInMonth;

    // Category spike detection
    if (prevMonthExpenses.length > 0) {
      const catTotals = new Map<string, number>();
      const prevCatTotals = new Map<string, number>();
      for (const e of active) catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount);
      for (const e of prevMonthExpenses.filter((e) => !e.deletedAt))
        prevCatTotals.set(e.category, (prevCatTotals.get(e.category) ?? 0) + e.amount);

      const dayRatio = daysInMonth / Math.max(today, 1);
      for (const [cat, amount] of catTotals) {
        const prevAmt = prevCatTotals.get(cat);
        if (prevAmt && prevAmt > 0) {
          const projectedPct = ((amount * dayRatio - prevAmt) / prevAmt) * 100;
          if (projectedPct > 30) {
            const catMeta = allCategories.find((c) => c.id === cat);
            const name = catMeta?.label ?? cat;
            insights.push({
              text: `${name} is up ${Math.round(projectedPct)}% compared to last month.`,
              type: "warning",
              icon: AlertTriangle,
              sparkData: dailyTotals
                .filter((dt) => dt.day <= today)
                .map((dt) => active.filter((e) => e.day === dt.day && e.category === cat).reduce((s, e) => s + e.amount, 0)),
            });
            break;
          }
        }
      }
    }

    // Budget pace insight
    if (effectiveBudget > 0 && today > 5) {
      const projected = avgDaily * daysInMonth;
      if (projected < effectiveBudget * 0.7) {
        const savings = effectiveBudget - projected;
        insights.push({
          text: `On track to save ${formatCurrency(Math.round(savings))} this month — keep it up!`,
          type: "positive",
          icon: TrendingUp,
        });
      } else if (forecast.projectedRemaining < 0) {
        insights.push({
          text: `At current pace, spending may run ${formatCurrency(Math.abs(Math.round(forecast.projectedRemaining)))} past budget — consider slowing down.`,
          type: "tip",
          icon: AlertTriangle,
        });
      }
    }

    // Spending slowdown (from SmartInsights — merged)
    if (prevMonthExpenses.length > 0) {
      const prevTotal = prevMonthExpenses.filter((e) => !e.deletedAt).reduce((s, e) => s + e.amount, 0);
      const currentTotal = active.reduce((s, e) => s + e.amount, 0);
      if (prevTotal > 0 && currentTotal < prevTotal * 0.7 && today > 15) {
        insights.push({
          text: `You've spent ${Math.round((1 - currentTotal / prevTotal) * 100)}% less than last month — lighter footprint.`,
          type: "positive",
          icon: Leaf,
        });
      }
    }

    // New month tip (from SmartInsights — merged)
    if (today <= 5 && effectiveBudget > 0 && insights.length === 0) {
      insights.push({
        text: `Fresh month ahead — ${formatCurrency(effectiveBudget)} to pace across ${daysInMonth} days.`,
        type: "neutral",
        icon: Sunrise,
      });
    }

    // Recurring coming up
    const recurringExpenses = settings.recurringExpenses ?? [];
    if (recurringExpenses.length > 0) {
      const upcomingTotal = recurringExpenses.reduce((s, r) => s + r.amount, 0);
      if (upcomingTotal > 0) {
        insights.push({
          text: `${formatCurrency(upcomingTotal)} in recurring bills across ${recurringExpenses.length} subscription${recurringExpenses.length !== 1 ? "s" : ""}.`,
          type: "neutral",
          icon: Repeat,
        });
      }
    }

    // Monthly reflection — last 3 days of month
    if (today >= daysInMonth - 2 && active.length > 0) {
      const topCat = [...new Map<string, number>()].length === 0 ? null : (() => {
        const cats = new Map<string, number>();
        for (const e of active) cats.set(e.category, (cats.get(e.category) ?? 0) + e.amount);
        let maxCat = "";
        let maxAmt = 0;
        for (const [c, a] of cats) { if (a > maxAmt) { maxCat = c; maxAmt = a; } }
        const meta = allCategories.find((c) => c.id === maxCat);
        return meta?.label ?? maxCat;
      })();
      const budgetNote = effectiveBudget > 0
        ? remaining >= 0
          ? ` with ${formatCurrency(remaining)} to spare`
          : ` — ${formatCurrency(Math.abs(remaining))} past your target`
        : "";
      insights.push({
        text: `Month wrapping up — ${formatCurrency(monthlyTotal)} spent${topCat ? `, mostly on ${topCat}` : ""}${budgetNote}.`,
        type: remaining >= 0 ? "positive" : "tip",
        icon: Flame,
      });
    }

    return insights.slice(0, 3);
  }, [expenses, prevMonthExpenses, effectiveBudget, avgDaily, daysInMonth, forecast, settings.recurringExpenses, dailyTotals, allCategories, formatCurrency, monthlyTotal, remaining, isCurrentMonth]);

  // Top category for stone marker
  const topCategory = useMemo(() => {
    if (categoryTotals.length === 0) return null;
    const sorted = [...categoryTotals].sort((a, b) => b.total - a.total);
    const top = sorted[0];
    const meta = allCategories.find((c) => c.id === top.category);
    return { slug: top.category, label: meta?.label ?? top.category, emoji: meta?.icon ?? "📦", total: top.total };
  }, [categoryTotals, allCategories]);

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/category/${encodeURIComponent(categorySlug)}?month=${currentMonth}&year=${currentYear}`);
  };

  const dailyValues = useMemo(
    () => dailyTotals.map((d) => d.total),
    [dailyTotals],
  );

  // Today's total — for "Quiet day" hero descriptor
  const todayTotal = useMemo(() => {
    const today = new Date().getDate();
    const todayDt = dailyTotals.find((d) => d.day === today);
    return todayDt?.total ?? 0;
  }, [dailyTotals]);

  // Yesterday's last expense — for quick repeat
  const yesterdayExpense = useMemo(() => {
    const yesterday = new Date().getDate() - 1;
    if (yesterday < 1) return null;
    const active = expenses.filter((e) => !e.deletedAt && e.day === yesterday);
    if (active.length === 0) return null;
    const last = active[active.length - 1];
    const meta = allCategories.find((c) => c.id === last.category);
    return { amount: last.amount, category: last.category, remark: last.remark || "", label: meta?.label ?? last.category };
  }, [expenses, allCategories]);

  return (
    <PageTransition className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-5xl space-y-5 p-4 sm:p-6 lg:p-8">

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          1. CANOPY HEADER â€” month name + sync
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <m.header
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="min-w-0 flex-1">
          <MonthSwitcher />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SyncIndicator />
          {!loading && expenses.length > 0 && <MonthlyPostcard />}
          {streak >= 2 && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }}
            >
              <Flame size={10} />
              {streak}d
            </span>
          )}
        </div>
      </m.header>

      {/* Install banner */}
      <InstallBanner />

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          2. HERO ZONE â€” total spent + spending stream
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <ErrorBoundary fallback={<SectionFallback />}>
        <AnimatePresence mode="wait">
          {loading ? (
            <m.div key="hero-skeleton" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SkeletonKpiCards />
            </m.div>
          ) : expenses.length === 0 ? (
            /* Empty state â€” the clearing awaits */
            <m.div
              key="hero-empty"
              className="card-terrain flex flex-col items-center p-8 text-center"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <ClearingScene className="mx-auto mb-4 w-48 sm:w-56" />
              <h2 className="font-display italic text-lg" style={{ color: "var(--text-primary)" }}>
                Start tracking
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Add your first expense to see your spending insights.
              </p>
              <m.button
                onClick={() => useUIStore.getState().openAddForm()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--accent-gradient)" }}
                whileTap={{ scale: 0.96 }}
              >
                <PlusCircle size={16} />
                Add First Expense
              </m.button>
            </m.div>
          ) : (
            <m.div
              key="hero-content"
              className="card-terrain relative overflow-hidden p-5 sm:p-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Greeting */}
              {user?.name && (
                <p className="mb-1 text-xs font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {(() => {
                    const h = new Date().getHours();
                    if (h < 5) return "Burning the midnight oil";
                    if (h < 12) return "Good morning";
                    if (h < 17) return "Good afternoon";
                    if (h < 21) return "Good evening";
                    return "Good night";
                  })()}, {user.name.split(" ")[0]}
                </p>
              )}

              {/* Hero amount */}
              <m.p
                layoutId="monthly-total"
                className="font-display text-hero-amount leading-none"
                style={{ color: "var(--text-primary)" }}
              >
                {formatCurrency(monthlyTotal)}
              </m.p>

              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {effectiveBudget > 0
                  ? remaining >= 0
                    ? `${formatCurrency(remaining)} remaining`
                    : `${formatCurrency(Math.abs(remaining))} past budget`
                  : `spent in ${getMonthName(currentMonth)}`}
                {daysRemaining > 0 && effectiveBudget > 0 && (
                  <span style={{ color: "var(--text-muted)" }}> · {daysRemaining}d left</span>
                )}
              </p>

              {/* Budget progress bar */}
              {effectiveBudget > 0 && (
                <div className="mt-3">
                  <div className="relative h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }} role="progressbar" aria-valuenow={Math.min(Math.round(budgetUsedPercent), 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
                    <m.div
                      className="h-full rounded-full"
                      style={{
                        background: budgetUsedPercent > 100 ? "var(--danger)" : budgetUsedPercent > 80 ? "var(--warning)" : "var(--accent)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                      transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {/* 75% milestone marker */}
                    <div className="absolute top-0 bottom-0 w-px" style={{ left: "75%", background: "var(--text-muted)", opacity: 0.4 }} />
                  </div>
                  <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>
                      {Math.round(budgetUsedPercent)}% used
                      {budgetUsedPercent >= 100 && (
                        <span style={{ color: "var(--danger)" }}> — over budget</span>
                      )}
                      {budgetUsedPercent >= 75 && budgetUsedPercent < 100 && (
                        <span style={{ color: "var(--warning)" }}> — nearing limit</span>
                      )}
                    </span>
                    <span>{formatCurrency(effectiveBudget)} budget</span>
                  </div>
                </div>
              )}

              {/* Quiet day acknowledgment + quick repeat */}
              {todayTotal === 0 && (
                <div className="mt-1.5 flex items-center gap-3">
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Coffee size={12} />
                    <span>Quiet day so far</span>
                  </p>
                  {yesterdayExpense && (
                    <button
                      onClick={() => useUIStore.getState().openAddForm({
                        amount: yesterdayExpense.amount,
                        category: yesterdayExpense.category,
                        remark: yesterdayExpense.remark,
                      })}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                      style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
                    >
                      Same as yesterday · {yesterdayExpense.label}
                    </button>
                  )}
                </div>
              )}

              {/* Spending Stream */}
              <div className="mt-3">
                <SpendingStream
                  budgetUsedPercent={budgetUsedPercent}
                  dailyValues={dailyValues}
                  daysInMonth={daysInMonth}
                  dailyBudgetPace={paceToStayUnder}
                  anomalyDays={anomalyDays}
                  effectiveBudget={effectiveBudget}
                  remaining={remaining}
                  daysRemaining={daysRemaining}
                  formatCurrency={formatCurrency}
                />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </ErrorBoundary>

      {/* 2b. MONTH START ANCHOR — new month context card */}
      {!loading && (
        <MonthStartAnchor
          prevMonthExpenses={prevMonthExpenses}
          prevMonthBudget={effectiveBudget}
          currentBudget={effectiveBudget}
          currentMonthTotal={monthlyTotal}
        />
      )}
      {/* 2c. NARRATIVE INSIGHTS — promoted to appear early */}
      {!loading && narrativeInsights.length > 0 && (
        <div className="space-y-3">
          {narrativeInsights.map((insight, i) => (
            <NarrativeInsight
              key={i}
              text={insight.text}
              type={insight.type}
              icon={insight.icon}
              sparkData={insight.sparkData}
            />
          ))}
        </div>
      )}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          3. STONE MARKERS â€” 2Ã—2 bento grid
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {!loading && expenses.length > 0 && (
        <m.div
          className="grid grid-cols-2 gap-3"
          initial="initial"
          animate="animate"
          variants={{ initial: {}, animate: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Budget Pace */}
          <m.div className="card-stone p-4" variants={stoneSettle}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Daily pace
            </p>
            <p className="mt-1 font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(Math.round(avgDaily))}
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>/day</span>
            </p>
            {effectiveBudget > 0 && paceToStayUnder > 0 && (
              <p className="mt-0.5 text-xs" style={{ color: avgDaily > paceToStayUnder ? "var(--warning)" : "var(--text-tertiary)" }}>
                target â‰¤ {formatCurrency(Math.round(paceToStayUnder))}
              </p>
            )}
          </m.div>

          {/* Top Category */}
          <m.div
            className="card-stone cursor-pointer p-4"
            variants={stoneSettle}
            onClick={() => topCategory && handleCategoryClick(topCategory.slug)}
            role="button"
            tabIndex={0}
          >
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Top category
            </p>
            {topCategory ? (
              <>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  <span>{topCategory.emoji}</span>
                  <span className="truncate">{topCategory.label}</span>
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {formatCurrency(topCategory.total)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>â€”</p>
            )}
          </m.div>

          {/* Recurring */}
          <m.div className="card-stone p-4" variants={stoneSettle}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Recurring
            </p>
            <p className="mt-1 font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {(settings.recurringExpenses ?? []).length}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {formatCurrency((settings.recurringExpenses ?? []).reduce((s, r) => s + r.amount, 0))}/mo
            </p>
          </m.div>

          {/* Streak / Achievement */}
          <m.div className="card-stone p-4" variants={stoneSettle}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {streak >= 2 ? "Streak" : "Expenses"}
            </p>
            <p className="mt-1 font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {streak >= 2 ? `${streak} days` : expenses.length}
            </p>
            {achievementsData.newlyUnlocked.length > 0 && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--accent)" }}>
                🏆 {achievementsData.newlyUnlocked[0]}
              </p>
            )}
          </m.div>
        </m.div>
      )}


      {/* 3b. UPCOMING STREAM — forward recurring calendar */}
      {!loading && <UpcomingStream />}

      {/* 3c. MONEY DNA — spending personality */}
      {!loading && expenses.length >= 5 && <MoneyDnaCard />}

      {/* 3d. SPENDING CHALLENGES — gamified sprints */}
      {!loading && <SpendingChallenges />}

      {/* Recurring suggestions */}
      {!loading && <RecurringSuggestions />}

      {/* ═══════════════════════════════════════════════════
          4b. MORE INSIGHTS — collapsible secondary sections
          ═══════════════════════════════════════════════════ */}
      {!loading && expenses.length > 0 && (
        <>
          <button
            onClick={() => setMoreInsightsOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
            style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
            aria-expanded={moreInsightsOpen}
          >
            <span>More insights</span>
            <ChevronDown
              size={18}
              className={cn("transition-transform duration-300", moreInsightsOpen && "rotate-180")}
            />
          </button>
          <AnimatePresence initial={false}>
            {moreInsightsOpen && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden space-y-4"
              >
                <RevealOnScroll>
                  <SpendingForecastCalendar />
                </RevealOnScroll>

                <RevealOnScroll>
                  <SavingsGoalsWidget />
                </RevealOnScroll>

                <PostcardPrompt month={currentMonth} year={currentYear} hasExpenses={expenses.length > 0} />
              </m.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          5. DIG DEEPER â€” expandable charts
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {!loading && expenses.length > 0 && (
        <RevealOnScroll>
          <div className="card-terrain overflow-hidden">
            <button
              onClick={() => setDigDeeperOpen((o) => !o)}
              className="flex w-full items-center justify-between p-4 text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
              aria-expanded={digDeeperOpen}
            >
              <span>See full breakdown</span>
              <ChevronDown
                size={18}
                className={cn("transition-transform duration-300", digDeeperOpen && "rotate-180")}
              />
            </button>

            <AnimatePresence>
              {digDeeperOpen && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t p-5" style={{ borderColor: "var(--border-default)" }}>
                    <Suspense fallback={<SkeletonChart />}>
                      <CategoryChart
                        categoryTotals={categoryTotals}
                        onCategoryClick={handleCategoryClick}
                        categoryBudgets={settings.categoryBudgets}
                        expenses={expenses}
                      />
                      <div className="mt-4">
                        <CategoryLegend categoryTotals={categoryTotals} onCategoryClick={handleCategoryClick} categoryBudgets={settings.categoryBudgets} />
                      </div>
                    </Suspense>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </RevealOnScroll>
      )}
    </PageTransition>
  );
}
