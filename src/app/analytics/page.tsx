"use client";

import { Suspense, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { PageTransition } from "@/components/ui/PageTransition";
import { useUIStore } from "@/stores/uiStore";
import { useMonthUrlSync } from "@/hooks/useMonthUrlSync";
import { usePageTitle } from "@/hooks/usePageTitle";
import { m } from "framer-motion";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useSettings } from "@/hooks/useSettings";
import { buildCategoryMap } from "@/lib/categories";
import { useCurrency } from "@/hooks/useCurrency";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Repeat,
  Zap,
  Calendar,
  BarChart3,
  DollarSign,
  Award,
} from "lucide-react";

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsShell />
    </Suspense>
  );
}

/** Thin wrapper so AnalyticsContent renders INSIDE AppShell / CalculationsProvider */
function AnalyticsShell() {
  return (
    <AppShell>
      <AnalyticsContent />
    </AppShell>
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AnalyticsContent() {
  usePageTitle("Analytics");
  useMonthUrlSync();
  const { currentMonth, currentYear } = useUIStore();
  const { effectiveBudget, anomalies } = useCalculationsContext();
  const { settings } = useSettings();
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const history = useHistoricalData(currentMonth, currentYear, 6);

  const catMap = useMemo(
    () => buildCategoryMap(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  const maxMonthTotal = Math.max(...history.months.map((m) => m.total), 1);

  // Top 6 categories across all months for the trends section
  const topCats = useMemo(() => {
    return history.topCategoriesAllTime.slice(0, 6);
  }, [history.topCategoriesAllTime]);

  // Cumulative daily spend for current month burn chart
  const cumulativeData = useMemo(() => {
    if (!history.currentMonth) return [];
    const { expenses } = history.currentMonth;
    const byDay: Record<number, number> = {};
    for (const e of expenses) {
      byDay[e.day] = (byDay[e.day] || 0) + e.amount;
    }
    const today = new Date();
    const isCurrentMonth = currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();
    const lastDay = isCurrentMonth ? today.getDate() : 31;
    const result: { day: number; cumulative: number }[] = [];
    let cum = 0;
    for (let d = 1; d <= lastDay; d++) {
      cum += byDay[d] || 0;
      result.push({ day: d, cumulative: cum });
    }
    return result;
  }, [history.currentMonth, currentMonth, currentYear]);

  const maxCumulative = Math.max(
    cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].cumulative : 0,
    effectiveBudget,
    1,
  );

  const maxWeekTotal = Math.max(...history.spendingByWeek.map((w) => w.total), 1);
  const maxDayFactor = Math.max(...Object.values(history.dayOfWeekFactors), 1);

  const MoMIcon =
    history.monthOverMonthChange === null
      ? Minus
      : history.monthOverMonthChange > 0
        ? TrendingUp
        : history.monthOverMonthChange < 0
          ? TrendingDown
          : Minus;

  const momColor =
    history.monthOverMonthChange === null
      ? "var(--text-muted)"
      : history.monthOverMonthChange > 5
        ? "var(--danger)"
        : history.monthOverMonthChange < -5
          ? "#10B981"
          : "var(--text-secondary)";

  return (
      <PageTransition className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Analytics</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Deep dive into your spending patterns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MonthSwitcher />
            <SyncIndicator />
          </div>
        </div>

        {/* Monthly Spending Trend */}
        <m.div
          className="card p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: "var(--color-accent)" }} />
            <h3 className="text-section-title">Monthly Spending Trend</h3>
          </div>
          <div className="space-y-2">
            {history.months.map((md) => {
              const pct = (md.total / maxMonthTotal) * 100;
              const isCurrent = md.month === currentMonth && md.year === currentYear;
              return (
                <div key={`${md.year}-${md.month}`} className="flex items-center gap-3">
                  <span
                    className="w-16 shrink-0 text-xs font-medium text-right"
                    style={{ color: isCurrent ? "var(--text-primary)" : "var(--text-tertiary)" }}
                  >
                    {md.label}
                  </span>
                  <div className="relative flex-1 h-6 rounded-md overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 1)}%`,
                        background: isCurrent ? "var(--color-accent)" : "var(--text-muted)",
                        opacity: isCurrent ? 1 : 0.5,
                      }}
                    />
                    {effectiveBudget > 0 && md.total > 0 && (
                      <div
                        className="absolute top-0 h-full w-0.5"
                        style={{
                          left: `${Math.min((effectiveBudget / maxMonthTotal) * 100, 100)}%`,
                          background: "var(--danger)",
                          opacity: 0.7,
                        }}
                      />
                    )}
                  </div>
                  <span className="w-20 shrink-0 text-xs font-mono text-right" style={{ color: "var(--text-secondary)" }}>
                    {formatCurrencyCompact(md.total)}
                  </span>
                </div>
              );
            })}
          </div>
          {effectiveBudget > 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Red line = budget ({formatCurrencyCompact(effectiveBudget)})
            </p>
          )}
        </m.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <m.div
            className="card p-4 flex flex-col gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-1.5">
              <DollarSign size={13} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Avg Monthly
              </span>
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {formatCurrencyCompact(history.avgMonthlySpend)}
            </span>
          </m.div>

          <m.div
            className="card p-4 flex flex-col gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-1.5">
              <MoMIcon size={13} style={{ color: momColor }} />
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                vs Last Month
              </span>
            </div>
            <span className="text-lg font-bold" style={{ color: momColor }}>
              {history.monthOverMonthChange !== null
                ? `${history.monthOverMonthChange > 0 ? "+" : ""}${history.monthOverMonthChange.toFixed(1)}%`
                : "—"}
            </span>
          </m.div>

          <m.div
            className="card p-4 flex flex-col gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-1.5">
              <Repeat size={13} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Recurring
              </span>
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {formatCurrencyCompact(history.recurringVsOneTime.recurring)}
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              vs {formatCurrencyCompact(history.recurringVsOneTime.oneTime)} one-time
            </span>
          </m.div>

          <m.div
            className="card p-4 flex flex-col gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1.5">
              <Zap size={13} style={{ color: anomalies.length > 0 ? "#F59E0B" : "var(--text-muted)" }} />
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Anomalies
              </span>
            </div>
            <span className="text-lg font-bold" style={{ color: anomalies.length > 0 ? "#F59E0B" : "var(--text-primary)" }}>
              {anomalies.length}
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              unusual spikes
            </span>
          </m.div>
        </div>

        {/* Day-of-Week Pattern + Top Expenses */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Day of Week */}
          <m.div
            className="card p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} style={{ color: "var(--color-accent)" }} />
              <h3 className="text-section-title">Day-of-Week Pattern</h3>
            </div>
            <div className="flex items-end gap-2 h-28">
              {DAY_LABELS.map((label, i) => {
                const factor = history.dayOfWeekFactors[i] ?? 0;
                const pct = (factor / maxDayFactor) * 100;
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative" style={{ height: "80px" }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${Math.max(pct, 4)}%`,
                          background: factor >= 1.2 ? "var(--danger)" : factor >= 0.8 ? "var(--color-accent)" : "var(--text-muted)",
                          opacity: factor >= 0.8 ? 0.9 : 0.4,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                      {label}
                    </span>
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {factor.toFixed(1)}x
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
              1.0x = average · higher = you spend more on that day
            </p>
          </m.div>

          {/* Top 5 Biggest Expenses */}
          <m.div
            className="card p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} style={{ color: "var(--color-accent)" }} />
              <h3 className="text-section-title">Biggest Expenses This Month</h3>
            </div>
            {history.biggestExpenses.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No expenses yet this month
              </p>
            ) : (
              <div className="space-y-2.5">
                {history.biggestExpenses.map((e, i) => {
                  const cat = catMap[e.category];
                  return (
                    <div key={e.id} className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: cat?.bgColor || "var(--bg-secondary)",
                          color: cat?.color || "var(--text-muted)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {e.remark || cat?.label || e.category}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {cat?.label || e.category} · Day {e.day}
                        </p>
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: cat?.color || "var(--text-primary)" }}>
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </m.div>
        </div>

        {/* Cumulative Burn Chart */}
        <m.div
          className="card p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: "var(--color-accent)" }} />
            <h3 className="text-section-title">Cumulative Spending</h3>
          </div>
          {cumulativeData.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              No spending data to chart yet
            </p>
          ) : (
            <div className="relative">
              <svg viewBox="0 0 400 160" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                  <line
                    key={frac}
                    x1="40"
                    y1={140 - frac * 120}
                    x2="390"
                    y2={140 - frac * 120}
                    stroke="var(--border-primary)"
                    strokeWidth="0.5"
                    strokeDasharray="3 3"
                  />
                ))}
                {/* Budget line */}
                {effectiveBudget > 0 && (
                  <line
                    x1="40"
                    y1={140 - (effectiveBudget / maxCumulative) * 120}
                    x2="390"
                    y2={140 - (effectiveBudget / maxCumulative) * 120}
                    stroke="var(--danger)"
                    strokeWidth="1"
                    strokeDasharray="5 3"
                    opacity="0.7"
                  />
                )}
                {/* Area fill */}
                <path
                  d={`M40,140 ${cumulativeData
                    .map((d) => {
                      const x = 40 + ((d.day - 1) / Math.max(cumulativeData.length - 1, 1)) * 350;
                      const y = 140 - (d.cumulative / maxCumulative) * 120;
                      return `L${x},${y}`;
                    })
                    .join(" ")} L${40 + ((cumulativeData.length - 1) / Math.max(cumulativeData.length - 1, 1)) * 350},140 Z`}
                  fill="var(--color-accent)"
                  opacity="0.12"
                />
                {/* Line */}
                <path
                  d={cumulativeData
                    .map((d, i) => {
                      const x = 40 + ((d.day - 1) / Math.max(cumulativeData.length - 1, 1)) * 350;
                      const y = 140 - (d.cumulative / maxCumulative) * 120;
                      return `${i === 0 ? "M" : "L"}${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                />
                {/* Y-axis labels */}
                <text x="36" y="143" textAnchor="end" fill="var(--text-muted)" fontSize="8">
                  0
                </text>
                <text x="36" y={143 - 120} textAnchor="end" fill="var(--text-muted)" fontSize="8">
                  {formatCurrencyCompact(maxCumulative)}
                </text>
                {/* X-axis */}
                <text x="40" y="155" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                  1
                </text>
                <text x="390" y="155" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                  {cumulativeData.length}
                </text>
              </svg>
              {effectiveBudget > 0 && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Dashed red line = budget limit
                </p>
              )}
            </div>
          )}
        </m.div>

        {/* Weekly Breakdown */}
        {history.spendingByWeek.length > 0 && (
          <m.div
            className="card p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-section-title mb-3">Weekly Breakdown</h3>
            <div className="space-y-2">
              {history.spendingByWeek.map((w) => {
                const pct = (w.total / maxWeekTotal) * 100;
                return (
                  <div key={w.week} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                      Week {w.week}
                    </span>
                    <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          background: "var(--color-accent)",
                          opacity: 0.75,
                        }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-xs font-mono text-right" style={{ color: "var(--text-secondary)" }}>
                      {formatCurrencyCompact(w.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </m.div>
        )}

        {/* Category Trends Across Months */}
        {topCats.length > 0 && (
          <m.div
            className="card p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h3 className="text-section-title mb-4">Category Trends</h3>
            <div className="space-y-4">
              {topCats.map(({ category }) => {
                const cat = catMap[category];
                const monthValues = history.months.map((md) => md.categoryBreakdown[category] || 0);
                const catMax = Math.max(...monthValues, 1);
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: cat?.color || "var(--text-primary)" }}>
                        {cat?.label || category}
                      </span>
                      <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {formatCurrencyCompact(monthValues[monthValues.length - 1])} this month
                      </span>
                    </div>
                    <div className="flex items-end gap-1 h-8">
                      {history.months.map((md, j) => {
                        const val = monthValues[j];
                        const h = (val / catMax) * 100;
                        return (
                          <div
                            key={`${md.year}-${md.month}`}
                            className="flex-1 rounded-t-sm transition-all duration-500"
                            style={{
                              height: `${Math.max(h, 3)}%`,
                              background: cat?.color || "var(--text-muted)",
                              opacity: j === history.months.length - 1 ? 0.9 : 0.35,
                            }}
                            title={`${md.label}: ${formatCurrency(val)}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {history.months.map((md) => (
                        <span
                          key={`label-${md.year}-${md.month}`}
                          className="flex-1 text-center text-[7px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {md.label.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </m.div>
        )}
      </PageTransition>
  );
}
