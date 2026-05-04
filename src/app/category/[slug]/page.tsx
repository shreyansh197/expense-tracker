"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useExpenses } from "@/hooks/useExpenses";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSettings } from "@/hooks/useSettings";
import { useCalculations } from "@/hooks/useCalculations";
import { buildCategoryMap } from "@/lib/categories";
import { getMonthName } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { getCategoryTotal } from "@/lib/calculations";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
import { SkeletonCategoryDetail } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { TargetIllustration } from "@/components/ui/illustrations";
import { RevealOnScroll } from "@/components/motion/RevealOnScroll";
import { RidgeLine } from "@/components/ui/RidgeLine";
import {
  ArrowLeft,
  Tv, Car, ShoppingCart, UtensilsCrossed, ShoppingBag,
  MoreHorizontal, CreditCard, Wifi, TrendingUp, Tag, Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Tv, Car, ShoppingCart, UtensilsCrossed, ShoppingBag,
  MoreHorizontal, CreditCard, Wifi, TrendingUp, Tag, Package,
};

function CategoryIcon({ icon, color, size = 32 }: { icon?: string; color?: string; size?: number }) {
  if (!icon) return <span style={{ fontSize: size }}>💳</span>;
  const Icon = ICON_MAP[icon];
  if (Icon) return <Icon size={size} style={{ color: color || "currentColor" }} />;
  // Emoji fallback
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { formatCurrency } = useCurrency();
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const month = parseInt(searchParams.get("month") || `${new Date().getMonth() + 1}`, 10);
  const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10);

  const { expenses, loading } = useExpenses(month, year);
  const { settings } = useSettings();
  const { monthlyTotal } = useCalculations(expenses, settings.categories, settings.salary, month, year, undefined, undefined, settings.currency, settings.multiCurrencyEnabled);
  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);
  const meta = catMap[slug];
  const categoryLabel = meta?.label || slug;
  const categoryColor = meta?.color || "var(--category-fallback)";
  usePageTitle(categoryLabel);

  const categoryExpenses = expenses
    .filter((e) => e.category === slug)
    .sort((a, b) => b.day - a.day || b.createdAt - a.createdAt);

  const categoryTotal = getCategoryTotal(expenses, slug, month, year);
  const pctOfTotal = monthlyTotal > 0 ? Math.round((categoryTotal / monthlyTotal) * 100) : 0;
  const expenseCount = categoryExpenses.length;
  const categoryBudget = (settings.categoryBudgets || {})[slug];
  const budgetPct = categoryBudget ? Math.round((categoryTotal / categoryBudget) * 100) : 0;
  const isOverBudget = categoryBudget && categoryTotal > categoryBudget;

  // Enhanced stats
  const enhancedStats = useMemo(() => {
    if (categoryExpenses.length === 0) return null;
    const amounts = categoryExpenses.map((e) => e.amount);
    const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const largest = categoryExpenses.reduce((a, b) => (a.amount > b.amount ? a : b));
    const smallest = categoryExpenses.reduce((a, b) => (a.amount < b.amount ? a : b));
    return { avg, largest, smallest };
  }, [categoryExpenses]);

  // Build last 6 months trend — fetch previous 5 months from Supabase
  const [trendData, setTrendData] = useState<{ label: string; total: number; month: number; year: number }[]>([]);

  useEffect(() => {
    const months: { m: number; y: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m <= 0) { m += 12; y -= 1; }
      months.push({ m, y });
    }

    const initial = months.map((my) => ({
      label: getMonthName(my.m).slice(0, 3),
      total: 0,
      month: my.m,
      year: my.y,
    }));

    // Fill current month from existing data
    const currentEntry = initial.find((t) => t.month === month && t.year === year);
    if (currentEntry) currentEntry.total = categoryTotal;

    // Fetch previous months from API
    async function fetchTrend() {
      const wid = getActiveWorkspaceId();
      if (!wid) { setTrendData(initial); return; }

      const prev = months.filter((my) => !(my.m === month && my.y === year));
      const promises = prev.map(async ({ m, y }) => {
        try {
          const params = new URLSearchParams({ workspaceId: wid });
          const res = await authFetch(`/api/sync/changes?${params}`);
          if (!res.ok) return { m, y, total: 0 };
          const data = await res.json();
          const expenses = (data.changes?.expenses ?? [])
            .filter((e: Record<string, unknown>) => !e.deletedAt)
            .filter((e: Record<string, unknown>) => e.month === m && e.year === y && e.category === slug);
          const total = expenses.reduce((sum: number, e: Record<string, unknown>) => sum + Number(e.amount), 0);
          return { m, y, total };
        } catch {
          return { m, y, total: 0 };
        }
      });

      const results = await Promise.all(promises);
      for (const r of results) {
        const entry = initial.find((t) => t.month === r.m && t.year === r.y);
        if (entry) entry.total = r.total;
      }
      setTrendData([...initial]);
    }

    fetchTrend();
  }, [month, year, slug, categoryTotal]);

  // Pattern Whisper — pure client-side insight from expense data
  const patternWhisper = useMemo(() => {
    if (categoryExpenses.length < 10) return null;
    const dayOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const byday: number[] = Array(7).fill(0);
    const countByDay: number[] = Array(7).fill(0);
    for (const e of categoryExpenses) {
      const d = new Date(year, month - 1, e.day).getDay();
      byday[d] += e.amount;
      countByDay[d]++;
    }
    const maxDay = byday.indexOf(Math.max(...byday));
    const maxAvg = countByDay[maxDay] > 0 ? byday[maxDay] / countByDay[maxDay] : 0;
    if (maxAvg === 0) return null;
    const weekTotal = byday.reduce((a, b) => a + b, 0);
    const pct = Math.round((byday[maxDay] / weekTotal) * 100);
    if (pct < 25) return null;
    return `You spend most here on ${dayOfWeek[maxDay]}s — ${pct}% of your ${meta?.label || slug} spending.`;
  }, [categoryExpenses, month, year, slug, meta]);

  return (
    <AppShell>
      <PageTransition className="mx-auto max-w-4xl xl:max-w-6xl space-y-5 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
          style={{ color: "var(--text-muted)" }}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        {loading ? (
          <SkeletonCategoryDetail />
        ) : (
        <>
        {/* Portrait header — category color gradient wash */}
        <div
          className="card-terrain relative overflow-hidden px-6 py-7"
          style={{ background: `color-mix(in srgb, ${categoryColor} 10%, var(--surface))` }}
        >
          {/* Category icon watermark */}
          <span
            className="pointer-events-none absolute right-4 top-4 leading-none"
            aria-hidden="true"
            style={{ opacity: 0.12 }}
          >
            <CategoryIcon icon={meta?.icon} color={categoryColor} size={72} />
          </span>

          <span className="mb-2 block leading-none">
            <CategoryIcon icon={meta?.icon} color={categoryColor} size={32} />
          </span>
          <h1
            className="font-display italic text-2xl leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {categoryLabel}
          </h1>
          <p className="mt-0.5 font-body-terrain text-sm" style={{ color: "var(--text-secondary)" }}>
            {getMonthName(month)} {year}
          </p>

          {/* Inline typographic KPI row */}
          <div className="mt-5 flex flex-wrap gap-6">
            <div>
              <p className="font-numeric text-2xl font-semibold tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(categoryTotal)}
              </p>
              <p className="mt-0.5 text-xs font-body-terrain" style={{ color: "var(--text-muted)" }}>spent</p>
            </div>
            <div>
              <p className="font-numeric text-2xl font-semibold tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>
                {expenseCount}
              </p>
              <p className="mt-0.5 text-xs font-body-terrain" style={{ color: "var(--text-muted)" }}>transactions</p>
            </div>
            <div>
              <p className="font-numeric text-2xl font-semibold tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>
                {pctOfTotal}%
              </p>
              <p className="mt-0.5 text-xs font-body-terrain" style={{ color: "var(--text-muted)" }}>of monthly total</p>
            </div>
          </div>

          {/* Pattern Whisper ambient insight */}
          {patternWhisper && (
            <p
              className="mt-4 font-display italic text-sm"
              style={{ color: "var(--text-secondary)", opacity: 0.75 }}
            >
              {patternWhisper}
            </p>
          )}

          {/* Budget progress if set */}
          {categoryBudget && (
            <div className="mt-4">
              <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(budgetPct, 100)}%`,
                    background: isOverBudget ? "var(--status-err)" : budgetPct >= 80 ? "var(--status-warn)" : categoryColor,
                  }}
                />
              </div>
              <p className="mt-1 text-xs font-body-terrain" style={{ color: "var(--text-muted)" }}>
                {budgetPct}% of {formatCurrency(categoryBudget)} budget
              </p>
            </div>
          )}
        </div>

        {/* Enhanced stats — avg/largest/smallest as inline typographic row */}
        {enhancedStats && (
          <div className="flex flex-wrap gap-6 px-1">
            {[
              { label: "avg", val: formatCurrency(enhancedStats.avg) },
              { label: "largest", val: formatCurrency(enhancedStats.largest.amount) },
              { label: "smallest", val: formatCurrency(enhancedStats.smallest.amount) },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="font-numeric text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{val}</p>
                <p className="text-xs font-body-terrain" style={{ color: "var(--text-muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* RidgeLine 6-month trend */}
        {trendData.some((d) => d.total > 0) ? (
          <RevealOnScroll className="card-terrain p-5">
            <h3 className="mb-1 font-display italic text-sm" style={{ color: "var(--text-secondary)" }}>
              6-month trend
            </h3>
            <RidgeLine
              dailyTotals={trendData.map((d, i) => ({ day: i + 1, total: d.total }))}
              maxDays={6}
              progress={1}
              height={56}
            />
            <div className="mt-2 flex justify-between">
              {trendData.map((d) => (
                <span key={d.month} className="text-xs font-body-terrain" style={{ color: "var(--text-muted)" }}>{d.label}</span>
              ))}
            </div>
          </RevealOnScroll>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <TargetIllustration size={80} />
            <p className="text-xs font-body-terrain" style={{ color: "var(--text-muted)" }}>
              No trend data yet — keep logging to see monthly patterns.
            </p>
          </div>
        )}

        {/* Clean ledger-style expense rows */}
        {categoryExpenses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <TargetIllustration size={80} />
            <p className="font-display italic text-sm" style={{ color: "var(--text-muted)" }}>
              No expenses in {categoryLabel} this month.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="mb-3 px-1 font-display italic text-sm" style={{ color: "var(--text-secondary)" }}>
              All transactions
            </h3>
            <div>
              {categoryExpenses.map((e, idx) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between px-1 py-3 transition-colors"
                  style={{
                    borderBottom: idx < categoryExpenses.length - 1 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    {e.remark ? (
                      <p className="truncate text-sm font-body-terrain" style={{ color: "var(--text-primary)" }}>{e.remark}</p>
                    ) : (
                      <p className="font-display italic text-sm" style={{ color: "var(--text-muted)" }}>No remark</p>
                    )}
                    <p className="text-xs font-body-terrain" style={{ color: "var(--text-muted)" }}>
                      {e.day} {getMonthName(month).slice(0, 3)}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 font-numeric text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </PageTransition>
    </AppShell>
  );
}
