"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { Coffee, Flame, TrendingUp } from "lucide-react";
import { DonutChart } from "@/components/ui/charts";
import { SpendingStream } from "@/components/dashboard/SpendingStream";
import { stoneSettle } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import type { CategoryTotal, CategoryMeta } from "@/types";

interface MonthSummaryHeroProps {
  monthlyTotal: number;
  remaining: number;
  budgetUsedPercent: number;
  effectiveBudget: number;
  daysRemaining: number;
  avgDaily: number;
  paceToStayUnder: number;
  categoryTotals: CategoryTotal[];
  categories: CategoryMeta[];
  topCategory: { slug: string; label: string; emoji: string; total: number } | null;
  streak: number;
  recurringCount: number;
  recurringTotal: number;
  formatCurrency: (n: number) => string;
  onCategoryClick: (slug: string) => void;
  userName?: string;
  todayTotal: number;
  yesterdayExpense?: { amount: number; category: string; remark: string; label: string } | null;
  achievementLabel?: string;
  // SpendingStream props
  dailyValues: number[];
  daysInMonth: number;
  anomalyDays: Set<number>;
  monthName: string;
  /** When true, renders a compact sticky bar instead of full hero */
  compact?: boolean;
}

export function MonthSummaryHero({
  monthlyTotal,
  remaining,
  budgetUsedPercent,
  effectiveBudget,
  daysRemaining,
  avgDaily,
  paceToStayUnder,
  categoryTotals,
  categories,
  topCategory,
  streak,
  recurringCount,
  recurringTotal,
  formatCurrency,
  onCategoryClick,
  userName,
  todayTotal,
  yesterdayExpense,
  achievementLabel,
  dailyValues,
  daysInMonth,
  anomalyDays,
  monthName,
  compact = false,
}: MonthSummaryHeroProps) {
  // Donut data for category ring
  const donutData = useMemo(() => {
    const nonZero = categoryTotals.filter((c) => c.total > 0);
    return nonZero
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map((c) => {
        const meta = categories.find((m) => m.id === c.category);
        return {
          value: c.total,
          color: meta?.color || "var(--category-fallback)",
          label: meta?.label || c.category,
        };
      });
  }, [categoryTotals, categories]);

  // Breathing ring class based on budget health
  const breathingClass = useMemo(() => {
    if (effectiveBudget <= 0) return "";
    if (budgetUsedPercent >= 85) return "budget-ring-alert";
    if (budgetUsedPercent >= 60) return "budget-ring-warn";
    return "budget-ring-calm";
  }, [budgetUsedPercent, effectiveBudget]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Burning the midnight oil";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Good night";
  }, []);

  // ─── Compact sticky bar ───────────────────────────────────
  if (compact) {
    return (
      <div
        className="sticky top-0 z-[var(--z-sticky)] backdrop-blur-md border-b"
        style={{
          background: "color-mix(in srgb, var(--surface) 85%, transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <p className="font-display text-lg font-bold font-numeric leading-none" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(monthlyTotal)}
            </p>
            {effectiveBudget > 0 && (
              <div className="flex items-center gap-1.5">
                <div
                  className="h-1.5 w-16 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(budgetUsedPercent, 100)}%`,
                      background: budgetUsedPercent > 100 ? "var(--danger)" : budgetUsedPercent > 80 ? "var(--warning)" : "var(--accent)",
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium font-numeric" style={{ color: "var(--text-muted)" }}>
                  {Math.round(budgetUsedPercent)}%
                </span>
              </div>
            )}
          </div>
          {daysRemaining > 0 && effectiveBudget > 0 && (
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
              {daysRemaining}d left
            </span>
          )}
        </div>
      </div>
    );
  }

  // ─── Full hero ────────────────────────────────────────────

  return (
    <m.div
      className="card-terrain relative overflow-hidden p-5 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Greeting */}
      {userName && (
        <p className="mb-1 text-xs font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>
          {greeting}, {userName.split(" ")[0]}
        </p>
      )}

      {/* Hero amount + donut ring */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
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
              : `spent in ${monthName}`}
            {daysRemaining > 0 && effectiveBudget > 0 && (
              <span style={{ color: "var(--text-muted)" }}> · {daysRemaining}d left</span>
            )}
          </p>
        </div>

        {/* Category donut ring with breathing glow */}
        {donutData.length > 0 && (
          <div className={cn("relative shrink-0", breathingClass)}>
            <div className="chart-container" style={{ width: 72, height: 72 }}>
              <DonutChart
                data={donutData}
                size={72}
                thickness={8}
                gap={4}
              />
            </div>
          </div>
        )}
      </div>

      {/* Budget progress bar */}
      {effectiveBudget > 0 && (
        <div className="mt-3">
          <div
            className="relative h-1.5 w-full rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
            role="progressbar"
            aria-valuenow={Math.min(Math.round(budgetUsedPercent), 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Budget used"
          >
            <m.div
              className="h-full rounded-full"
              style={{
                background: budgetUsedPercent > 100 ? "var(--danger)" : budgetUsedPercent > 80 ? "var(--warning)" : "var(--accent)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
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

      {/* Quiet day / yesterday repeat */}
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
              className="rounded-ui-md px-2.5 py-1 text-xs font-medium transition-colors"
              style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
            >
              Same as yesterday · {yesterdayExpense.label}
            </button>
          )}
        </div>
      )}

      {/* Spending stream visualization */}
      <div className="mt-3">
        <SpendingStream
          budgetUsedPercent={budgetUsedPercent}
          dailyValues={dailyValues}
          daysInMonth={daysInMonth}
          dailyBudgetPace={paceToStayUnder}
          anomalyDays={anomalyDays}
          effectiveBudget={effectiveBudget}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Compact 4-stat row */}
      <m.div
        className="mt-4 grid grid-cols-4 gap-2 border-t pt-3"
        style={{ borderColor: "var(--border-subtle)" }}
        initial="initial"
        animate="animate"
        variants={{ initial: {}, animate: { transition: { staggerChildren: 0.04 } } }}
      >
        {/* Daily pace */}
        <m.div className="text-center" variants={stoneSettle}>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Pace
          </p>
          <p className="mt-0.5 text-sm font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(Math.round(avgDaily))}
          </p>
          {effectiveBudget > 0 && paceToStayUnder > 0 && (
            <p className="text-[9px]" style={{ color: avgDaily > paceToStayUnder ? "var(--warning)" : "var(--text-muted)" }}>
              ≤ {formatCurrency(Math.round(paceToStayUnder))}
            </p>
          )}
        </m.div>

        {/* Top Category */}
        <m.div
          className="text-center cursor-pointer"
          variants={stoneSettle}
          onClick={() => topCategory && onCategoryClick(topCategory.slug)}
          role={topCategory ? "button" : undefined}
          tabIndex={topCategory ? 0 : undefined}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Top
          </p>
          {topCategory ? (
            <p className="mt-0.5 text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {topCategory.emoji} {topCategory.label}
            </p>
          ) : (
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>—</p>
          )}
        </m.div>

        {/* Recurring */}
        <m.div className="text-center" variants={stoneSettle}>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Recurring
          </p>
          <p className="mt-0.5 text-sm font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
            {recurringCount}
          </p>
          <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
            {formatCurrency(recurringTotal)}/mo
          </p>
        </m.div>

        {/* Streak / Achievement */}
        <m.div className="text-center" variants={stoneSettle}>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {streak >= 2 ? "Streak" : "Count"}
          </p>
          <p className="mt-0.5 text-sm font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
            {streak >= 2 ? (
              <span className="inline-flex items-center gap-0.5">
                <Flame size={12} className="text-warn" />
                {streak}d
              </span>
            ) : (
              <span>—</span>
            )}
          </p>
          {achievementLabel && (
            <p className="text-[9px] truncate" style={{ color: "var(--accent)" }}>
              🏆 {achievementLabel}
            </p>
          )}
        </m.div>
      </m.div>
    </m.div>
  );
}
