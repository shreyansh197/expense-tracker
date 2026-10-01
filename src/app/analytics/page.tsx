"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { FogOverlook } from "@/components/ui/illustrations/terrain";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsSection } from "@/components/analytics/AnalyticsSection";
import { ThisMonthOverview } from "@/components/analytics/ThisMonthOverview";
import { ComparisonView } from "@/components/analytics/ComparisonView";
import { MonthRidge } from "@/components/analytics/MonthRidge";
import { SpendingVelocity } from "@/components/analytics/SpendingVelocity";
import { BiggestExpenses } from "@/components/analytics/BiggestExpenses";
import { AnalyticsDeepDive } from "@/components/analytics/AnalyticsDeepDive";
import { useUIStore } from "@/stores/uiStore";
import { useMonthUrlSync } from "@/hooks/useMonthUrlSync";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useAnalyticsPeriod } from "@/hooks/useAnalyticsPeriod";
import { useAnalyticsShare } from "@/hooks/useAnalyticsShare";
import { buildCategoryMap } from "@/lib/categories";
import { buildMonthSummary } from "@/lib/analyticsSummary";
import { subMoney } from "@/lib/money";
import { getMonthName } from "@/lib/utils";

/** Analytics finds its feet after a few expenses in the selected month. */
const MIN_EXPENSES_FOR_FULL_VIEW = 3;

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AppShell>
        <AnalyticsContent />
      </AppShell>
    </Suspense>
  );
}

/**
 * Analytics answers "what did I spend on, over what period?" (SCREEN_GUIDELINES §6).
 * Hierarchy (UX-9.6): the month's number and projection first, then where it
 * went, the multi-month trend, weekly pace, and — behind a disclosure — the
 * exploratory charts.
 */
function AnalyticsContent() {
  usePageTitle("Analytics");
  useMonthUrlSync();
  const [period, setPeriod] = useAnalyticsPeriod();
  const { currentMonth, currentYear } = useUIStore();
  const { effectiveBudget, anomalies, forecast, monthlyTotal, elapsedDays, daysInMonth, daysRemaining } = useCalculationsContext();
  const { settings } = useSettings();
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const router = useRouter();
  const share = useAnalyticsShare();
  // `lookback` counts months before the selected one, so a 6-month period is 5 + the selected month.
  const history = useHistoricalData(currentMonth, currentYear, period - 1);

  const catMap = useMemo(
    () => buildCategoryMap(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );
  const categoryLabels = useMemo(() => Object.fromEntries(Object.entries(catMap).map(([id, c]) => [id, c.label])), [catMap]);
  const selected = useMemo(() => ({ month: currentMonth, year: currentYear }), [currentMonth, currentYear]);
  const monthName = getMonthName(currentMonth);
  const current = history.currentMonth;
  const previous = history.months.length >= 2 ? history.months[history.months.length - 2] : undefined;
  const topCategory = history.topCategoriesAllTime[0];
  const labelFor = useCallback((id: string) => catMap[id]?.label ?? id, [catMap]);

  const sentences = useMemo(
    () =>
      current && current.count >= MIN_EXPENSES_FOR_FULL_VIEW
        ? buildMonthSummary({
            monthOverMonthChange: history.monthOverMonthChange,
            currentBreakdown: current.categoryBreakdown,
            previousBreakdown: previous?.categoryBreakdown,
            categoryLabel: labelFor,
            budget: effectiveBudget,
            projectedTotal: forecast.projectedTotal,
            daysLeft: daysRemaining,
            formatCurrencyCompact,
          })
        : [],
    [current, previous, history.monthOverMonthChange, labelFor, effectiveBudget, forecast.projectedTotal, daysRemaining, formatCurrencyCompact],
  );

  const handleShare = useCallback(() => {
    const total = current?.total ?? 0;
    const remaining = effectiveBudget > 0 ? subMoney(effectiveBudget, total) : null;
    const mom = history.monthOverMonthChange;
    void share(
      {
        title: "Analytics",
        subtitle: `${monthName} ${currentYear}`,
        total: formatCurrency(total),
        budgetLine: remaining === null ? undefined : {
          text: remaining >= 0 ? `${formatCurrency(remaining)} under budget` : `${formatCurrency(Math.abs(remaining))} over budget`,
          over: remaining < 0,
        },
        ridgeTitle: `${period}-Month Ridge`,
        months: history.months.map((m) => ({
          label: m.label,
          total: m.total,
          totalLabel: formatCurrencyCompact(m.total),
          isSelected: m.month === currentMonth && m.year === currentYear,
        })),
        budget: effectiveBudget > 0 ? effectiveBudget : null,
        metrics: [
          { label: "Avg Monthly", value: formatCurrencyCompact(history.avgMonthlySpend) },
          { label: "vs Last Month", value: mom === null ? "—" : `${mom > 0 ? "+" : ""}${mom.toFixed(1)}%` },
          { label: "Recurring", value: formatCurrencyCompact(history.recurringVsOneTime.recurring) },
          { label: "Top Category", value: topCategory ? labelFor(topCategory.category) : "—" },
        ],
      },
      `expenstream-analytics-${monthName.toLowerCase()}-${currentYear}.png`,
    );
  }, [share, current, effectiveBudget, history, monthName, currentYear, currentMonth, period, formatCurrency, formatCurrencyCompact, topCategory, labelFor]);

  const hasAnyData = history.months.some((m) => m.count > 0);
  const count = current?.count ?? 0;

  return (
    <div className="relative mx-auto min-h-[80vh] max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8 xl:max-w-6xl">
      <h1 className="sr-only">Analytics</h1>
      <AnalyticsHeader period={period} onPeriodChange={setPeriod} onShare={hasAnyData ? handleShare : undefined} />

      {!hasAnyData ? (
        <EmptyState
          icon={BarChart3}
          illustration={<FogOverlook />}
          title="Your spending insights will appear here"
          description="Come back after a few expenses — Analytics finds its feet with more data."
          action={{ label: "Add an expense", onClick: () => router.push("/?action=add") }}
        />
      ) : (
        <>
          {count > 0 && count < MIN_EXPENSES_FOR_FULL_VIEW && (
            <p
              role="status"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: "var(--accent-soft)", color: "var(--text-secondary)" }}
            >
              <BarChart3 size={15} aria-hidden="true" style={{ color: "var(--accent)" }} />
              <span>
                Add <strong>{MIN_EXPENSES_FOR_FULL_VIEW - count} more expense{MIN_EXPENSES_FOR_FULL_VIEW - count > 1 ? "s" : ""}</strong> to unlock the full read of this month.
              </span>
            </p>
          )}

          <ThisMonthOverview
            monthName={monthName}
            year={currentYear}
            total={monthlyTotal}
            budget={effectiveBudget}
            daysLeft={daysRemaining}
            elapsedDays={elapsedDays}
            daysInMonth={daysInMonth}
            forecast={forecast}
            anomalies={anomalies}
            sentences={sentences}
            categoryLabels={categoryLabels}
            formatCurrency={formatCurrency}
          />

          {current && previous && (
            <AnalyticsSection title="Month vs Month" icon={GitCompareArrows}>
              <ComparisonView current={current} previous={previous} categoryLabels={categoryLabels} formatCurrency={formatCurrency} />
            </AnalyticsSection>
          )}

          <MonthRidge
            months={history.months}
            selected={selected}
            period={period}
            budget={effectiveBudget}
            formatCurrency={formatCurrency}
            formatCurrencyCompact={formatCurrencyCompact}
            footer={
              topCategory ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Top category over {period} months:{" "}
                  <Link
                    href={`/expenses?category=${encodeURIComponent(topCategory.category)}`}
                    className="inline-flex min-h-[44px] items-center font-semibold underline-offset-2 hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {labelFor(topCategory.category)} ({formatCurrencyCompact(topCategory.total)})
                  </Link>
                </p>
              ) : null
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <SpendingVelocity
              weeks={history.spendingByWeek}
              budget={effectiveBudget}
              daysInMonth={daysInMonth}
              formatCurrency={formatCurrency}
              formatCurrencyCompact={formatCurrencyCompact}
            />
            <BiggestExpenses expenses={history.biggestExpenses} categories={catMap} formatCurrency={formatCurrency} />
          </div>

          <AnalyticsDeepDive month={currentMonth} year={currentYear} monthExpenses={current?.expenses ?? []} categories={catMap} />
        </>
      )}
    </div>
  );
}
