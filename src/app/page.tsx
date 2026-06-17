"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useMemo, useSyncExternalStore, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { m, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { RevealOnScroll } from "@/components/motion/RevealOnScroll";
import { MonthSummaryHero } from "@/components/dashboard/MonthSummaryHero";
import { SkeletonKpiCards, SkeletonChart } from "@/components/ui/Skeleton";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { ClearingScene } from "@/components/ui/illustrations/terrain/ClearingScene";
import { PlusCircle, ChevronDown, Flame, TrendingUp, AlertTriangle, Leaf, Sunrise } from "lucide-react";

// Skeleton used while "More Insights" dynamic components hydrate
function InsightSkeleton() {
  return <div className="h-36 rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />;
}

// Below-fold widgets — dynamic imports for faster initial paint
const SpendingForecastCalendar = dynamic(
  () => import("@/components/analytics/SpendingForecastCalendar").then(m => ({ default: m.SpendingForecastCalendar })),
  { loading: () => <InsightSkeleton /> }
);
const SavingsGoalsWidget = dynamic(
  () => import("@/components/dashboard/SavingsGoalsWidget").then(m => ({ default: m.SavingsGoalsWidget })),
  { loading: () => <InsightSkeleton /> }
);
const NarrativeInsight = dynamic(() => import("@/components/dashboard/NarrativeInsight").then(m => ({ default: m.NarrativeInsight })));
const MonthlyPostcard = dynamic(() => import("@/components/dashboard/MonthlyPostcard").then(m => ({ default: m.MonthlyPostcard })));
const PostcardPrompt = dynamic(
  () => import("@/components/dashboard/PostcardPrompt").then(m => ({ default: m.PostcardPrompt })),
  { loading: () => <InsightSkeleton /> }
);
const MoneyDnaCard = dynamic(
  () => import("@/components/dashboard/MoneyDnaCard").then(m => ({ default: m.MoneyDnaCard })),
  { loading: () => <InsightSkeleton /> }
);
const SpendingChallenges = dynamic(
  () => import("@/components/dashboard/SpendingChallenges").then(m => ({ default: m.SpendingChallenges })),
  { loading: () => <InsightSkeleton /> }
);
const RecurringSuggestions = dynamic(() => import("@/components/dashboard/RecurringSuggestions").then(m => ({ default: m.RecurringSuggestions })));
const UpcomingStream = dynamic(() => import("@/components/dashboard/UpcomingStream").then(m => ({ default: m.UpcomingStream })));
import { BudgetVsActuals } from "@/components/dashboard/BudgetVsActuals";
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
import { getActiveWorkspaceId, subscribeAuth } from "@/lib/authClient";
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
import { QuickHelpButton } from "@/components/ui/QuickHelpButton";
import { NewUserChecklist } from "@/components/onboarding/NewUserChecklist";

/* â”€â”€ Lightweight fallback for per-section ErrorBoundary â”€â”€â”€â”€â”€â”€ */
function SectionFallback() {
  return (
    <div className="card-stone flex items-center justify-center gap-2 py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
      <span>This section couldn&apos;t load.</span>
    </div>
  );
}

// Lazy-load heavy charts (only in "Dig Deeper" expandable)
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
  const { currentMonth, currentYear, setMonth, nextMonth, prevMonth } = useUIStore();
  const { expenses, loading } = useExpenses(currentMonth, currentYear);
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();

  // Guard against hydration mismatch: during SSR, workspaceId is null so
  // loading=false and expenses=[], which renders the empty state. On the
  // client the real wid loads immediately, but AnimatePresence can stall
  // during the rapid key transitions. By gating on `mounted` we show the
  // skeleton on both server and client until data is ready.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const heroLoading = !mounted || loading;

  // Sticky compact hero: appears when the full hero scrolls out of view
  const heroSentinelRef = useRef<HTMLDivElement>(null);
  const [heroScrolledOut, setHeroScrolledOut] = useState(false);

  // Swipe gesture for month navigation
  const swipeTouchStartX = useRef(0);
  const handleSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    swipeTouchStartX.current = e.touches[0].clientX;
  }, []);
  const handleSwipeTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - swipeTouchStartX.current;
    if (Math.abs(delta) < 60) return;
    if (delta > 0) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(20);
      prevMonth();
    } else {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(20);
      nextMonth();
    }
  }, [prevMonth, nextMonth]);
  useEffect(() => {
    const el = heroSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroScrolledOut(!entry.isIntersecting),
      // rootMargin + explicit root avoids iOS Safari firing issues with zero-height sentinels
      { threshold: 0, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!searchParams.get("m") && !searchParams.get("y")) {
      const now = new Date();
      setMonth(now.getMonth() + 1, now.getFullYear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle ?action=add deep-link (e.g. from Analytics empty state CTA)
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      useUIStore.getState().openAddForm();
      router.replace("/");
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
  const prevMonthNum = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYearNum = currentMonth === 1 ? currentYear - 1 : currentYear;
  const { expenses: prevMonthExpenses } = useExpenses(prevMonthNum, prevYearNum);

  const allCategories = useMemo(
    () => getAllCategories(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  // Spending streak — wid must be reactive so the liveQuery re-fires when auth loads
  const streakWid = useSyncExternalStore(subscribeAuth, getActiveWorkspaceId, () => null);
  const allExpenses = useDexieQuery(
    () => {
      if (!streakWid) return [] as { year: number; month: number; day: number; deletedAt: number | null }[];
      return db.expenses.where("workspaceId").equals(streakWid).toArray();
    },
    [streakWid],
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

  // "Explore" expandable state (was: "More Insights" + "Dig Deeper" as separate buttons)
  const [exploreOpen, setExploreOpen] = useState(false);
  const prefetchInsightsRef = useRef(false);

  const prefetchMoreInsights = () => {
    if (prefetchInsightsRef.current) return;
    prefetchInsightsRef.current = true;
    import("@/components/analytics/SpendingForecastCalendar");
    import("@/components/dashboard/SavingsGoalsWidget");
    import("@/components/dashboard/MoneyDnaCard");
    import("@/components/dashboard/SpendingChallenges");
    import("@/components/dashboard/PostcardPrompt");
    import("@/components/dashboard/CategoryChart");
  };

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
      } else if (forecast.projectedRemaining < 0 && !insights.some((i) => i.type === "warning")) {
        // Skip generic budget-overrun tip if a category-specific warning already fired
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
  }, [expenses, prevMonthExpenses, effectiveBudget, avgDaily, daysInMonth, forecast, dailyTotals, allCategories, formatCurrency, monthlyTotal, remaining, isCurrentMonth]);

  // Top category for stone marker
  const topCategory = useMemo(() => {
    if (categoryTotals.length === 0) return null;
    const sorted = [...categoryTotals].sort((a, b) => b.total - a.total);
    const top = sorted[0];
    const meta = allCategories.find((c) => c.id === top.category);
    return { slug: top.category, label: meta?.label ?? top.category, emoji: meta?.icon ?? "📦", total: top.total };
  }, [categoryTotals, allCategories]);

  const budgetVsActualsData = useMemo(() => {
    return categoryTotals.map((ct) => {
      const cat = allCategories.find((c) => c.id === ct.category);
      return {
        id: ct.category,
        label: cat?.label ?? ct.category,
        color: cat?.color ?? "var(--accent)",
        actual: ct.total,
        budget: (settings.categoryBudgets as Record<string, number> | undefined)?.[ct.category] ?? 0,
      };
    });
  }, [categoryTotals, allCategories, settings.categoryBudgets]);

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
    <div
      className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-5xl space-y-5 p-4 sm:p-6 lg:p-8"
      onTouchStart={handleSwipeTouchStart}
      onTouchEnd={handleSwipeTouchEnd}
    >

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
          {/* On desktop the sidebar already has Help & Tips — show only on mobile */}
          <div className="lg:hidden">
            <QuickHelpButton
              showGeneral
              pageTips={[
                "Tap any category chip under the spending stream to drill into those expenses",
                "The stream graph highlights days with unusually high spending in amber",
                "Set a monthly budget in Settings to unlock the forecast and pace bar",
                "Add recurring expenses in Settings → Recurring — they auto-log each month",
                "Pull down to sync the latest data from the cloud",
                "Tap the hero amount to edit your monthly budget inline",
              ]}
              pageLabel="Dashboard"
            />
          </div>
        </div>
      </m.header>

      {/* Install banner */}
      <InstallBanner />

      {/* Sentinel: when this leaves viewport, compact sticky hero appears. h-px required for iOS Safari IntersectionObserver */}
      <div ref={heroSentinelRef} aria-hidden="true" className="h-px" />

      {/* Sticky compact hero bar */}
      {heroScrolledOut && !heroLoading && expenses.length > 0 && (
        <MonthSummaryHero
          compact
          monthlyTotal={monthlyTotal}
          remaining={remaining}
          budgetUsedPercent={budgetUsedPercent}
          effectiveBudget={effectiveBudget}
          daysRemaining={daysRemaining}
          avgDaily={avgDaily}
          paceToStayUnder={paceToStayUnder}
          categoryTotals={categoryTotals}
          categories={allCategories}
          topCategory={topCategory}
          streak={streak}
          recurringCount={(settings.recurringExpenses ?? []).length}
          recurringTotal={(settings.recurringExpenses ?? []).reduce((s, r) => s + r.amount, 0)}
          formatCurrency={formatCurrency}
          onCategoryClick={handleCategoryClick}
          userName={user?.name}
          todayTotal={todayTotal}
          yesterdayExpense={yesterdayExpense}
          achievementLabel={achievementsData.newlyUnlocked.length > 0 ? achievementsData.newlyUnlocked[0] : undefined}
          dailyValues={dailyValues}
          daysInMonth={daysInMonth}
          anomalyDays={anomalyDays}
          monthName={getMonthName(currentMonth)}
          month={currentMonth}
          year={currentYear}
        />
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          2. HERO ZONE â€” total spent + spending stream
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <ErrorBoundary fallback={<SectionFallback />}>
        {heroLoading ? (
            <div>
              <SkeletonKpiCards />
            </div>
          ) : expenses.length === 0 ? (
            <NewUserChecklist
              userName={user?.name}
              hasBudget={!!settings.salary && settings.salary > 0}
              onAddExpense={() => useUIStore.getState().openAddForm()}
            />
          ) : (
            <MonthSummaryHero
              monthlyTotal={monthlyTotal}
              remaining={remaining}
              budgetUsedPercent={budgetUsedPercent}
              effectiveBudget={effectiveBudget}
              daysRemaining={daysRemaining}
              avgDaily={avgDaily}
              paceToStayUnder={paceToStayUnder}
              categoryTotals={categoryTotals}
              categories={allCategories}
              topCategory={topCategory}
              streak={streak}
              recurringCount={(settings.recurringExpenses ?? []).length}
              recurringTotal={(settings.recurringExpenses ?? []).reduce((s, r) => s + r.amount, 0)}
              formatCurrency={formatCurrency}
              onCategoryClick={handleCategoryClick}
              userName={user?.name}
              todayTotal={todayTotal}
              yesterdayExpense={yesterdayExpense}
              achievementLabel={achievementsData.newlyUnlocked.length > 0 ? achievementsData.newlyUnlocked[0] : undefined}
              dailyValues={dailyValues}
              daysInMonth={daysInMonth}
              anomalyDays={anomalyDays}
              monthName={getMonthName(currentMonth)}
              month={currentMonth}
              year={currentYear}
              onBudgetEdit={(val) => {
                const monthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
                updateSettings({
                  monthlyBudgets: { ...(settings.monthlyBudgets ?? {}), [monthKey]: val },
                });
              }}
            />
          )}
      </ErrorBoundary>

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

      {/* 3b. UPCOMING STREAM — forward recurring calendar */}
      {!loading && <UpcomingStream />}

      {/* Recurring suggestions */}
      {!loading && <RecurringSuggestions />}

      {/* ═══════════════════════════════════════════════════
          4b. MORE INSIGHTS — collapsible secondary sections
          ═══════════════════════════════════════════════════ */}
      {/* EXPLORE — unified expandable: breakdown + insights */}
      {!loading && expenses.length > 0 && (
        <RevealOnScroll>
          <>
            {/* Teaser: always show category breakdown, clipped when collapsed */}
            <div className="relative overflow-hidden rounded-xl" style={{ maxHeight: exploreOpen ? "none" : "80px" }}>
              <div className="card-terrain p-5">
                <Suspense fallback={<SkeletonChart />}>
                  <CategoryLegend categoryTotals={categoryTotals} onCategoryClick={handleCategoryClick} categoryBudgets={settings.categoryBudgets} />
                </Suspense>
              </div>
              {!exploreOpen && (
                <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, var(--surface))" }} />
              )}
            </div>
            <button
              onClick={() => setExploreOpen((o) => !o)}
              onPointerEnter={prefetchMoreInsights}
              onFocus={prefetchMoreInsights}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
              aria-expanded={exploreOpen}
            >
              <span>{exploreOpen ? "Show less" : "Explore more"}</span>
              <ChevronDown
                size={18}
                className={cn("transition-transform duration-300", exploreOpen && "rotate-180")}
              />
            </button>
          <AnimatePresence initial={false}>
              {exploreOpen && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden space-y-4 pt-1"
                >
                  <RevealOnScroll>
                    <SpendingForecastCalendar />
                  </RevealOnScroll>

                  <RevealOnScroll>
                    <SavingsGoalsWidget />
                  </RevealOnScroll>

                  {expenses.length >= 5 && (
                    <RevealOnScroll>
                      <MoneyDnaCard />
                    </RevealOnScroll>
                  )}

                  <RevealOnScroll>
                    <SpendingChallenges />
                  </RevealOnScroll>

                  <PostcardPrompt month={currentMonth} year={currentYear} hasExpenses={expenses.length > 0} />

                  {/* Budget vs Actuals */}
                  {budgetVsActualsData.length > 0 && (
                    <RevealOnScroll>
                      <div className="card-terrain p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
                          Budget vs Actuals
                        </h3>
                        <BudgetVsActuals data={budgetVsActualsData} formatCurrency={formatCurrency} />
                      </div>
                    </RevealOnScroll>
                  )}
                </m.div>
              )}
            </AnimatePresence>
          </>
        </RevealOnScroll>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          5. DIG DEEPER â€” expandable charts
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
    </div>
  );
}
