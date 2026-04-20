"use client";

import { useMemo, useState } from "react";
import { m, useInView } from "framer-motion";
import { useRef } from "react";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { Confetti } from "@/components/motion/Confetti";
import { useUIStore } from "@/stores/uiStore";
import { buildCategoryMap } from "@/lib/categories";
import { getMonthName } from "@/lib/utils";
import { RidgeLine } from "@/components/ui/RidgeLine";
import {
  getMonthNarrative,
  getHeaviestDayNarrative,
  getSurpriseInsight,
  getWeekInsight,
} from "@/lib/chronicle";
import { useExpenses } from "@/hooks/useExpenses";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The Chronicle — a scroll-narrative analytics document.
 *
 * Replaces the chart-grid mental model with prose + structural infographics.
 * Feels like reading a well-typeset monthly letter about your own finances.
 *
 * Typography rules:
 *  - Month heading: --font-display (Lora) italic, large
 *  - Prose paragraphs: --font-body, 300 weight, generous line-height
 *  - Currency amounts: --font-numeric (JetBrains Mono)
 *  - Category labels: --font-body, 500 weight
 */
export function ChronicleView() {
  const { currentMonth, currentYear } = useUIStore();
  const {
    monthlyTotal,
    effectiveBudget,
    dailyTotals,
    categoryTotals,
    daysInMonth,
  } = useCalculationsContext();
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const { expenses } = useExpenses(currentMonth, currentYear);
  const history = useHistoricalData(currentMonth, currentYear, 2);

  // Confetti: trigger when user finished under budget
  const isUnderBudget = effectiveBudget > 0 && monthlyTotal < effectiveBudget;
  const [confettiFired, setConfettiFired] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.5 });

  // Fire confetti once when hero scrolls into view and under budget
  const shouldConfetti = isUnderBudget && heroInView && !confettiFired;
  if (shouldConfetti && !confettiFired) {
    // defer to avoid setState-during-render
    setTimeout(() => setConfettiFired(true), 0);
  }

  const catMap = useMemo(
    () => buildCategoryMap(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [id, meta] of Object.entries(catMap)) {
      map[id] = meta.label;
    }
    return map;
  }, [catMap]);

  // Transaction counts per day
  const txCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const e of expenses.filter((e) => !e.deletedAt)) {
      counts[e.day] = (counts[e.day] ?? 0) + 1;
    }
    return counts;
  }, [expenses]);

  // Previous month category totals — built from categoryBreakdown
  const prevCategoryTotals = useMemo(() => {
    const prevMonth = history.months[1];
    if (!prevMonth) return [];
    return Object.entries(prevMonth.categoryBreakdown).map(([category, total]) => ({
      category,
      total,
    }));
  }, [history.months]);

  // Narratives
  const openingNarrative = useMemo(
    () => getMonthNarrative(monthlyTotal, effectiveBudget, currentMonth, currentYear, formatCurrency),
    [monthlyTotal, effectiveBudget, currentMonth, currentYear, formatCurrency],
  );
  const heaviestDayNarrative = useMemo(
    () => getHeaviestDayNarrative(dailyTotals, currentMonth, currentYear, txCounts, formatCurrency),
    [dailyTotals, currentMonth, currentYear, txCounts, formatCurrency],
  );
  const surpriseInsight = useMemo(
    () => getSurpriseInsight(categoryTotals, prevCategoryTotals, categoryLabels, formatCurrency),
    [categoryTotals, prevCategoryTotals, categoryLabels, formatCurrency],
  );
  const weekInsight = useMemo(
    () => getWeekInsight(dailyTotals, formatCurrency),
    [dailyTotals, formatCurrency],
  );

  // Category proportional bars — top 6 categories
  const topCategories = useMemo(
    () =>
      [...categoryTotals]
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 6),
    [categoryTotals],
  );
  const maxCategoryTotal = topCategories[0]?.total ?? 1;

  // Week grid (Sun→Sat columns, bucketed by calendar week)
  const weekGrid = useMemo(() => {
    const weeks: number[][] = [];
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    let week: number[] = new Array(firstDay).fill(0);
    for (let day = 1; day <= daysInMonth; day++) {
      const total = dailyTotals.find((d) => d.day === day)?.total ?? 0;
      week.push(total);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(-1); // -1 = out of month
      weeks.push(week);
    }
    return weeks;
  }, [dailyTotals, daysInMonth, currentMonth, currentYear]);

  const maxDayTotal = useMemo(
    () => Math.max(...dailyTotals.map((d) => d.total), 1),
    [dailyTotals],
  );

  const hasData = expenses.filter((e) => !e.deletedAt).length > 0;

  if (!hasData) {
    return (
      <div className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.125rem" }}>
          No expenses logged this month yet.
        </p>
        <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-body)" }}>
          Start tracking to see your Chronicle.
        </p>
      </div>
    );
  }

  return (
    <m.article
      className="mx-auto max-w-2xl space-y-8 px-4 pb-16 pt-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Confetti burst when under budget */}
      <Confetti active={confettiFired} />

      {/* ── Month heading ── */}
      <header ref={heroRef}>
        <h1
          className="text-4xl"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 400,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {getMonthName(currentMonth)} {currentYear}
        </h1>
        <div
          className="mt-1 h-px w-16"
          style={{ background: "var(--accent)", opacity: 0.4 }}
        />
      </header>

      {/* ── Opening narrative + inline ridge sparkline ── */}
      <section className="space-y-3">
        <p
          className="text-base leading-relaxed"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            lineHeight: 1.75,
            color: "var(--text-primary)",
            maxWidth: "56ch",
          }}
        >
          {openingNarrative}
        </p>

        {/* Inline ridge sparkline */}
        <div className="overflow-hidden rounded-md" style={{ height: 32 }}>
          <RidgeLine
            dailyTotals={dailyTotals}
            maxDays={daysInMonth}
            progress={effectiveBudget > 0 ? monthlyTotal / effectiveBudget : 1}
            height={32}
            variant="personal"
          />
        </div>

        {heaviestDayNarrative && (
          <p
            className="text-sm"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
            }}
          >
            {heaviestDayNarrative}
          </p>
        )}
      </section>

      {/* ── Divider ── */}
      <Divider />

      {/* ── Where it went ── */}
      {topCategories.length > 0 && (
        <section className="space-y-4">
          <SectionLabel>Where It Went</SectionLabel>
          <ul className="space-y-2.5">
            {topCategories.map((cat, catIdx) => {
              const label = categoryLabels[cat.category] ?? cat.category;
              const pct = Math.round((cat.total / monthlyTotal) * 100);
              const barWidth = `${Math.round((cat.total / maxCategoryTotal) * 100)}%`;
              return (
                <li key={cat.category} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-medium"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-sm"
                      style={{ fontFamily: "var(--font-numeric)", color: "var(--text-secondary)" }}
                    >
                      {formatCurrency(cat.total)}&nbsp;·&nbsp;{pct}%
                    </span>
                  </div>
                  <div
                    className="h-1 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--es-mist)" }}
                  >
                    <m.div
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)" }}
                      initial={{ width: 0 }}
                      whileInView={{ width: barWidth }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, delay: catIdx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Divider ── */}
      <Divider />

      {/* ── Week grid ── */}
      <section className="space-y-3">
        <SectionLabel>The Week View</SectionLabel>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAY_LABELS.map((d) => (
            <span
              key={d}
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Week rows */}
        {weekGrid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((dayTotal, di) => {
              if (dayTotal < 0) return <div key={di} />;
              const barH = dayTotal === 0 ? 2 : Math.max(4, Math.round((dayTotal / maxDayTotal) * 40));
              return (
                <div key={di} className="flex flex-col items-center gap-0.5">
                  <div
                    style={{
                      height: barH,
                      width: "100%",
                      background: dayTotal === 0 ? "var(--border)" : "var(--accent)",
                      borderRadius: 2,
                      opacity: dayTotal === 0 ? 0.3 : 0.8,
                      transition: "height 0.4s ease",
                    }}
                  />
                  {dayTotal > 0 && (
                    <span
                      className="truncate text-center"
                      style={{
                        fontSize: "0.6rem",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-numeric)",
                        maxWidth: "100%",
                      }}
                    >
                      {Math.round(dayTotal / 1000) > 0
                        ? `${Math.round(dayTotal / 1000)}k`
                        : dayTotal}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {weekInsight && (
          <p
            className="text-sm"
            style={{ fontFamily: "var(--font-body)", fontWeight: 300, color: "var(--text-secondary)" }}
          >
            {weekInsight}
          </p>
        )}
      </section>

      {/* ── Divider ── */}
      {surpriseInsight && <Divider />}

      {/* ── Surprise insight ── */}
      {surpriseInsight && (
        <section className="space-y-2">
          <SectionLabel>A Moment That Stood Out</SectionLabel>
          <p
            className="text-base"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              lineHeight: 1.75,
              color: "var(--text-primary)",
              maxWidth: "52ch",
            }}
          >
            {surpriseInsight}
          </p>
        </section>
      )}
    </m.article>
  );
}

// ── Sub-components ──────────────────────────────────────────

function Divider() {
  return (
    <div
      className="h-px w-full"
      style={{ background: "var(--border-subtle)", opacity: 0.6 }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest"
      style={{ color: "var(--accent)", fontFamily: "var(--font-body)" }}
    >
      {children}
    </p>
  );
}
