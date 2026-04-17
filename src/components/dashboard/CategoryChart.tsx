"use client";

import { useState } from "react";
import { Table2, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { buildCategoryMap } from "@/lib/categories";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIllustration } from "@/components/ui/illustrations";
import { DonutChart } from "@/components/ui/charts";
import type { CategoryTotal, Expense } from "@/types";
import type { ReactNode } from "react";

interface CategoryChartProps {
  categoryTotals: CategoryTotal[];
  onCategoryClick?: (categorySlug: string) => void;
  categoryBudgets?: Record<string, number>;
  expenses?: Expense[];
  headerLeft?: ReactNode;
}

export function CategoryChart({ categoryTotals, onCategoryClick, categoryBudgets, expenses, headerLeft }: CategoryChartProps) {
  const [showTable, setShowTable] = useState(false);
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const catMap = buildCategoryMap(settings.customCategories);
  const budgets = categoryBudgets || {};

  const nonZero = categoryTotals.filter((c) => c.total > 0);
  const total = nonZero.reduce((sum, c) => sum + c.total, 0);

  // Count expenses per category
  const expenseCountMap: Record<string, number> = {};
  if (expenses) {
    for (const e of expenses) {
      if (e.deletedAt === null) {
        expenseCountMap[e.category] = (expenseCountMap[e.category] || 0) + 1;
      }
    }
  }

  const data = nonZero
    .sort((a, b) => b.total - a.total)
    .map((c) => ({
      name: catMap[c.category]?.label || c.category,
      value: c.total,
      color: catMap[c.category]?.color || "var(--category-fallback)",
      slug: c.category,
    }));

  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        secondaryIcon={BarChart3}
        illustration={<ChartIllustration />}
        title="No spending yet"
        description="Your category breakdown will appear here as you add expenses."
      />
    );
  }

  // Build screen-reader description
  const topThree = data.slice(0, 3).map((d) => `${d.name} ${formatCurrency(d.value)}`).join(", ");
  const chartLabel = `Category breakdown: ${data.length} categories totalling ${formatCurrency(total)}. Top: ${topThree}.`;

  return (
    <div role="img" aria-label={chartLabel}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {headerLeft}
        <div className="segmented-control" role="group" aria-label="View mode">
          <button
            data-active={!showTable}
            onClick={() => setShowTable(false)}
            className="flex items-center gap-1"
            aria-pressed={!showTable}
          >
            <PieChartIcon size={13} />
            Chart
          </button>
          <button
            data-active={showTable}
            onClick={() => setShowTable(true)}
            className="flex items-center gap-1"
            aria-pressed={showTable}
          >
            <Table2 size={13} />
            Table
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }} className="text-left text-xs">
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2 text-right font-medium">%</th>
                <th className="pb-2 text-right font-medium">Budget</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => {
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                const budget = budgets[d.slug];
                const budgetPct = budget ? Math.round((d.value / budget) * 100) : 0;
                return (
                  <tr
                    key={d.slug}
                    className="cursor-pointer transition-colors hover:bg-[var(--surface-secondary)]"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onClick={() => onCategoryClick?.(d.slug)}
                    tabIndex={onCategoryClick ? 0 : undefined}
                    onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onCategoryClick) { e.preventDefault(); onCategoryClick(d.slug); } }}
                    role={onCategoryClick ? "button" : undefined}
                  >
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(d.value)}
                    </td>
                    <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{pct}%</td>
                    <td className="py-2 text-right">
                      {budget ? (
                        <span className={budgetPct >= 100 ? "text-err" : budgetPct >= 80 ? "text-warn" : ""} style={budgetPct < 80 ? { color: 'var(--text-muted)' } : undefined}>
                          {budgetPct}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td className="pt-2" style={{ color: 'var(--text-primary)' }}>Total</td>
                <td className="pt-2 text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</td>
                <td className="pt-2 text-right" style={{ color: 'var(--text-secondary)' }}>100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center py-4">
          {/* Screen reader: summarize data in chart view */}
          <p className="sr-only">
            {data.map((d) => `${d.name}: ${formatCurrency(d.value)}`).join(". ")}. Switch to Table view for full details.
          </p>
          <DonutChart
            data={data.map((d) => ({ value: d.value, color: d.color, label: d.name }))}
            size={200}
            thickness={30}
          />
        </div>
      )}
    </div>
  );
}

export function CategoryLegend({ categoryTotals, onCategoryClick, categoryBudgets }: CategoryChartProps) {
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const catMap = buildCategoryMap(settings.customCategories);
  const budgets = categoryBudgets || {};
  const nonZero = categoryTotals.filter((c) => c.total > 0);
  const total = nonZero.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="space-y-2">
      {nonZero
        .sort((a, b) => b.total - a.total)
        .map((c) => {
          const meta = catMap[c.category];
          const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
          const budget = budgets[c.category];
          const budgetPct = budget ? Math.round((c.total / budget) * 100) : 0;
          const isOverBudget = budget && c.total > budget;
          const isNearBudget = budget && budgetPct >= 80 && !isOverBudget;
          return (
            <div
              key={c.category}
              className="rounded-lg px-1 py-0.5 transition-colors hover:bg-[var(--surface-secondary)]"
              style={{ cursor: onCategoryClick ? "pointer" : undefined }}
              onClick={() => onCategoryClick?.(c.category)}
              role={onCategoryClick ? "button" : undefined}
              tabIndex={onCategoryClick ? 0 : undefined}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onCategoryClick?.(c.category); }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: meta?.color }}
                />
                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {meta?.label || c.category}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(c.total)}
                </span>
                <span className="w-10 text-right text-xs" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
              </div>
              {budget ? (
                <div className="ml-6 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isOverBudget ? "bg-err" : isNearBudget ? "bg-warn" : "bg-ok"
                        }`}
                        style={{ width: `${Math.min(budgetPct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      isOverBudget ? "text-err" : isNearBudget ? "text-warn" : ""
                    }`} style={!isOverBudget && !isNearBudget ? { color: 'var(--text-muted)' } : undefined}>
                      {budgetPct}%
                    </span>
                  </div>
                  {isOverBudget && (
                    <p className="text-xs text-err mt-0.5">
                      Over by {formatCurrency(c.total - budget)}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
    </div>
  );
}
