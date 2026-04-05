"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
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
import { ArrowLeft } from "lucide-react";

const CategoryTrendChart = dynamic(
  () => import("@/components/dashboard/CategoryTrendChart").then((m) => m.CategoryTrendChart),
  { ssr: false },
);

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { formatCurrency } = useCurrency();
  const { slug } = use(params);
  const router = useRouter();
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

  return (
    <AppShell>
      <PageTransition className="mx-auto max-w-4xl xl:max-w-6xl space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white" style={{ color: categoryColor }}>
              {categoryLabel}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {getMonthName(month)} {year}
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonCategoryDetail />
        ) : (
        <>
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card relative overflow-hidden p-4">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: categoryColor }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Spent</p>
            <p className={`mt-1 text-xl font-bold ${isOverBudget ? "text-red-500" : ""}`} style={!isOverBudget ? { color: 'var(--text-primary)' } : undefined}>
              {formatCurrency(categoryTotal)}
            </p>
            {categoryBudget ? (
              <div className="mt-2">
                <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                  <div
                    className={`h-1.5 rounded-full ${isOverBudget ? "bg-red-500" : budgetPct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(budgetPct, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {budgetPct}% of {formatCurrency(categoryBudget)} budget
                </p>
              </div>
            ) : null}
          </div>
          <div className="card p-4">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>% of Total</p>
            <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {pctOfTotal}%
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Transactions</p>
            <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {expenseCount}
            </p>
          </div>
        </div>

        {/* Enhanced stats */}
        {enhancedStats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avg Transaction</p>
              <p className="mt-1 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(enhancedStats.avg)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Largest</p>
              <p className="mt-1 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(enhancedStats.largest.amount)}
              </p>
              {enhancedStats.largest.remark && (
                <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>{enhancedStats.largest.remark}</p>
              )}
            </div>
            <div className="card p-4">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Smallest</p>
              <p className="mt-1 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(enhancedStats.smallest.amount)}
              </p>
              {enhancedStats.smallest.remark && (
                <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>{enhancedStats.smallest.remark}</p>
              )}
            </div>
          </div>
        )}

        {/* Monthly trend chart */}
        <RevealOnScroll className="card p-4">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Monthly Trend
          </h3>
          {trendData.some((d) => d.total > 0) ? (
            <CategoryTrendChart
              trendData={trendData}
              categoryLabel={categoryLabel}
              categoryColor={categoryColor}
              formatCurrency={formatCurrency}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <TargetIllustration size={100} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No trend data yet — keep logging expenses to see monthly patterns.</p>
            </div>
          )}
        </RevealOnScroll>

        {/* Expenses list */}
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Expenses in {categoryLabel}
          </h3>
          {categoryExpenses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <TargetIllustration size={90} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No expenses in {categoryLabel} this month.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {categoryExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                >
                  <div className="min-w-0">
                    {e.remark ? (
                      <p className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>{e.remark}</p>
                    ) : (
                      <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No remark</p>
                    )}
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {e.day} {getMonthName(month).slice(0, 3)} {year}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}
      </PageTransition>
    </AppShell>
  );
}
