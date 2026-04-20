"use client";

import { Suspense, useMemo, useState, useCallback } from "react";
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
import { getDaysInMonth, getMonthName } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Repeat,
  Zap,
  BarChart3,
  DollarSign,
  Award,
  ChevronDown,
  Share2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FogOverlook } from "@/components/ui/illustrations/terrain";
import { ChronicleView } from "@/components/dashboard/ChronicleView";
import { TimeMachine } from "@/components/analytics/TimeMachine";
import { CategorySeasons } from "@/components/analytics/CategorySeasons";

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

function AnalyticsContent() {
  usePageTitle("Analytics");
  useMonthUrlSync();
  const [deepCoreOpen, setDeepCoreOpen] = useState(false);
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

  const topCats = useMemo(() => {
    return history.topCategoriesAllTime.slice(0, 6);
  }, [history.topCategoriesAllTime]);

  // Share analytics summary
  const handleShareAnalytics = useCallback(async () => {
    const currentMd = history.currentMonth;
    const monthLabel = getMonthName(currentMonth);
    const total = currentMd ? formatCurrencyCompact(currentMd.expenses.reduce((s, e) => s + e.amount, 0)) : "0";
    const topCat = topCats.length > 0 ? catMap[topCats[0].category]?.label || topCats[0].category : "none";
    const mom = history.monthOverMonthChange !== null ? `${history.monthOverMonthChange > 0 ? "+" : ""}${history.monthOverMonthChange.toFixed(1)}%` : "N/A";

    const text = [
      `📊 ${monthLabel} ${currentYear} Spending Summary`,
      `Total: ${total}`,
      `Top category: ${topCat}`,
      `vs Last month: ${mom}`,
      `Avg monthly: ${formatCurrencyCompact(history.avgMonthlySpend)}`,
      `Recurring: ${formatCurrencyCompact(history.recurringVsOneTime.recurring)}`,
    ].join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch { /* user cancelled or not supported */ }
    }
    // Fallback: copy to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }, [history, currentMonth, currentYear, formatCurrencyCompact, topCats, catMap]);

  // Cumulative daily spend for burn chart
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
          ? "var(--success)"
          : "var(--text-secondary)";

  return (
      <PageTransition className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
        {/* ─── Overlook Header ─── */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display italic text-2xl" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
          <div className="flex items-center gap-2">
            {history.months.length > 0 && (
              <button
                type="button"
                onClick={handleShareAnalytics}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{ color: "var(--text-muted)" }}
                aria-label="Share analytics summary"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <SyncIndicator />
          </div>
        </div>
        <MonthSwitcher />

        {/* Empty state */}
        {history.months.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            illustration={<FogOverlook />}
            title="Clear skies ahead"
            description="Start adding expenses to see your terrain unfold — trends, patterns, and insights will appear here."
          />
        ) : (
        <>

        {/* ─── 1. RidgeLine Hero (6-month terrain ridge) ─── */}
        <m.div
          className="card-terrain p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              6-Month Ridge
            </h3>
          </div>
          <div className="mt-3 space-y-2">
            {history.months.map((md) => {
              const pct = (md.total / maxMonthTotal) * 100;
              const isCurrent = md.month === currentMonth && md.year === currentYear;
              return (
                <div key={`${md.year}-${md.month}`} className="flex items-center gap-3">
                  <span
                    className="w-14 shrink-0 text-xs font-medium text-right"
                    style={{ color: isCurrent ? "var(--text-primary)" : "var(--text-tertiary)" }}
                  >
                    {md.label}
                  </span>
                  <div className="relative flex-1 h-5 rounded-lg overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 1)}%`,
                        background: isCurrent ? "var(--accent)" : "var(--es-sage, var(--text-muted))",
                        opacity: isCurrent ? 1 : 0.4,
                      }}
                    />
                    {effectiveBudget > 0 && md.total > 0 && (
                      <div
                        className="absolute top-0 h-full w-0.5"
                        style={{
                          left: `${Math.min((effectiveBudget / maxMonthTotal) * 100, 100)}%`,
                          background: "var(--es-clay, var(--danger))",
                          opacity: 0.7,
                        }}
                      />
                    )}
                  </div>
                  <span className="w-20 shrink-0 text-xs font-numeric font-semibold tabular-nums text-right" style={{ color: "var(--text-secondary)" }}>
                    {formatCurrencyCompact(md.total)}
                  </span>
                </div>
              );
            })}
          </div>
          {effectiveBudget > 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Marker = budget ({formatCurrencyCompact(effectiveBudget)})
            </p>
          )}
        </m.div>

        {/* ─── 2. Weather Cards (budget health, pace, biggest move) ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <m.div
            className="card-stone p-4 flex flex-col gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-1.5">
              <DollarSign size={14} style={{ color: "var(--text-muted)" }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Avg Monthly
              </span>
            </div>
            <span className="text-lg font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
              {formatCurrencyCompact(history.avgMonthlySpend)}
            </span>
          </m.div>

          <m.div
            className="card-stone p-4 flex flex-col gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-1.5">
              <MoMIcon size={14} style={{ color: momColor }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                vs Last Month
              </span>
            </div>
            <span className="text-lg font-bold font-numeric" style={{ color: momColor }}>
              {history.monthOverMonthChange !== null
                ? `${history.monthOverMonthChange > 0 ? "+" : ""}${history.monthOverMonthChange.toFixed(1)}%`
                : "—"}
            </span>
          </m.div>

          <m.div
            className="card-stone p-4 flex flex-col gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-1.5">
              <Repeat size={14} style={{ color: "var(--text-muted)" }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Recurring
              </span>
            </div>
            <span className="text-lg font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
              {formatCurrencyCompact(history.recurringVsOneTime.recurring)}
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              vs {formatCurrencyCompact(history.recurringVsOneTime.oneTime)} one-time
            </span>
          </m.div>

          <m.div
            className="card-stone p-4 flex flex-col gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1.5">
              <Zap size={14} style={{ color: "var(--text-muted)" }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Top Category
              </span>
            </div>
            <span className="text-lg font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
              {topCats.length > 0
                ? (catMap[topCats[0].category]?.label ?? topCats[0].category)
                : "—"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {topCats.length > 0 ? `${formatCurrencyCompact(topCats[0].total)} all-time` : "no data"}
            </span>
          </m.div>
        </div>

        {/* ─── 3. Strata — Spending Velocity + Biggest Expenses ─── */}
        <div className="grid gap-4 md:grid-cols-2">
          <m.div
            className="card-terrain p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Spending Velocity
              </h3>
            </div>
            {history.spendingByWeek.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Not enough data yet</p>
            ) : (() => {
              const weeks = history.spendingByWeek;
              const maxWeekTotal = Math.max(...weeks.map((w) => w.total), 1);
              const idealWeekly = effectiveBudget > 0 ? effectiveBudget / Math.ceil(getDaysInMonth(currentMonth, currentYear) / 7) : 0;
              return (
                <>
                  <div className="flex items-end gap-3 h-28">
                    {weeks.map((w, i) => {
                      const pct = (w.total / maxWeekTotal) * 100;
                      const overBudget = idealWeekly > 0 && w.total > idealWeekly;
                      const prevTotal = i > 0 ? weeks[i - 1].total : null;
                      const delta = prevTotal !== null && prevTotal > 0 ? ((w.total - prevTotal) / prevTotal) * 100 : null;
                      return (
                        <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full relative" style={{ height: "80px" }}>
                            <div
                              className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                              style={{
                                height: `${Math.max(pct, 4)}%`,
                                background: overBudget ? "var(--es-clay)" : "var(--accent)",
                                opacity: i === weeks.length - 1 ? 0.9 : 0.45,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                            W{w.week}
                          </span>
                          <span className="text-[10px] font-numeric" style={{ color: "var(--text-muted)" }}>
                            {formatCurrencyCompact(w.total)}
                          </span>
                          {delta !== null && (
                            <span className="text-[9px] font-medium" style={{ color: delta > 10 ? "var(--es-clay)" : delta < -10 ? "var(--success)" : "var(--text-muted)" }}>
                              {delta > 0 ? "+" : ""}{Math.round(delta)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {idealWeekly > 0 && (
                    <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                      Budget pace: {formatCurrencyCompact(idealWeekly)}/week
                    </p>
                  )}
                  {idealWeekly === 0 && weeks.length >= 2 && (
                    <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                      {weeks[weeks.length - 1].total > weeks[weeks.length - 2].total
                        ? "Pace is rising — spending picked up this week"
                        : weeks[weeks.length - 1].total < weeks[weeks.length - 2].total * 0.7
                          ? "Pace slowed — lighter week"
                          : "Steady pace across weeks"}
                    </p>
                  )}
                </>
              );
            })()}
          </m.div>

          <m.div
            className="card-terrain p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Biggest This Month
              </h3>
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
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          background: cat?.bgColor || "var(--surface-secondary)",
                          color: cat?.color || "var(--text-muted)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {e.remark || cat?.label || e.category}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {cat?.label || e.category} · Day {e.day}
                        </p>
                      </div>
                      <span className="text-sm font-bold font-numeric shrink-0" style={{ color: cat?.color || "var(--text-primary)" }}>
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </m.div>
        </div>

        {/* ─── 4. Chronicle Section (inline) ─── */}
        <m.div
          className="card-parchment p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Chronicle
          </h3>
          <ChronicleView />
        </m.div>

        {/* ─── 4b. Time Machine — What If scenarios ─── */}
        <TimeMachine />

        {/* ─── 4c. Category Seasons — Annual Rhythm ─── */}
        <CategorySeasons />

        {/* ─── 5. Deep Core (expandable) ─── */}
        <m.div
          className="card-terrain overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            type="button"
            onClick={() => setDeepCoreOpen((v) => !v)}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Deep Core
            </h3>
            <m.span
              animate={{ rotate: deepCoreOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ color: "var(--text-muted)", display: "inline-flex" }}
            >
              <ChevronDown size={16} />
            </m.span>
          </button>

          {deepCoreOpen && (
            <div className="px-5 pb-5 space-y-5">
              {/* Cumulative Burn Chart */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                  <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Cumulative Spending
                  </h4>
                </div>
                {cumulativeData.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No spending data to chart yet
                  </p>
                ) : (
                  <div className="relative">
                    <svg viewBox="0 0 400 160" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                      {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                        <line
                          key={frac}
                          x1="40" y1={140 - frac * 120} x2="390" y2={140 - frac * 120}
                          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"
                        />
                      ))}
                      {effectiveBudget > 0 && (
                        <line
                          x1="40" y1={140 - (effectiveBudget / maxCumulative) * 120}
                          x2="390" y2={140 - (effectiveBudget / maxCumulative) * 120}
                          stroke="var(--es-clay)" strokeWidth="1" strokeDasharray="5 3" opacity="0.7"
                        />
                      )}
                      <path
                        d={`M40,140 ${cumulativeData
                          .map((d) => {
                            const x = 40 + ((d.day - 1) / Math.max(cumulativeData.length - 1, 1)) * 350;
                            const y = 140 - (d.cumulative / maxCumulative) * 120;
                            return `L${x},${y}`;
                          })
                          .join(" ")} L${40 + ((cumulativeData.length - 1) / Math.max(cumulativeData.length - 1, 1)) * 350},140 Z`}
                        fill="var(--accent)" opacity="0.12"
                      />
                      <path
                        d={cumulativeData
                          .map((d, i) => {
                            const x = 40 + ((d.day - 1) / Math.max(cumulativeData.length - 1, 1)) * 350;
                            const y = 140 - (d.cumulative / maxCumulative) * 120;
                            return `${i === 0 ? "M" : "L"}${x},${y}`;
                          })
                          .join(" ")}
                        fill="none" stroke="var(--accent)" strokeWidth="2"
                      />
                      <text x="36" y="143" textAnchor="end" fill="var(--text-muted)" fontSize="8">0</text>
                      <text x="36" y={143 - 120} textAnchor="end" fill="var(--text-muted)" fontSize="8">
                        {formatCurrencyCompact(maxCumulative)}
                      </text>
                      <text x="40" y="155" textAnchor="middle" fill="var(--text-muted)" fontSize="8">1</text>
                      <text x="390" y="155" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                        {cumulativeData.length}
                      </text>
                    </svg>
                  </div>
                )}
              </div>

              {/* Anomaly Detection */}
              {anomalies.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} style={{ color: "var(--es-clay)" }} />
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Unusual Spending
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {anomalies.slice(0, 5).map((a) => {
                      const e = a.expense;
                      const cat = catMap[e.category];
                      return (
                        <div key={e.id} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "var(--surface-secondary)" }}>
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: a.zScore >= 4 ? "var(--es-clay)" : "var(--warning, #EAB308)" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {e.remark || cat?.label || e.category}
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                              {cat?.label || e.category} · Day {e.day} · {a.zScore.toFixed(1)}σ above avg
                            </p>
                          </div>
                          <span className="text-sm font-bold font-numeric shrink-0" style={{ color: "var(--es-clay)" }}>
                            {formatCurrency(e.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
                    Expenses significantly above your typical pattern
                  </p>
                </div>
              )}
            </div>
          )}
        </m.div>

        </>
        )}
      </PageTransition>
  );
}
