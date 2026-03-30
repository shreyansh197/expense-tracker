"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Table2, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { buildCategoryMap } from "@/lib/categories";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CategoryTotal, Expense } from "@/types";

interface CategoryChartProps {
  categoryTotals: CategoryTotal[];
  onCategoryClick?: (categorySlug: string) => void;
  categoryBudgets?: Record<string, number>;
  expenses?: Expense[];
}

function CustomTooltip({ active, payload, total, budgets, expenseCountMap }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { slug: string; color: string } }>;
  total: number;
  budgets: Record<string, number>;
  expenseCountMap: Record<string, number>;
}) {
  const { formatCurrency } = useCurrency();
  if (!active || !payload?.[0]) return null;
  const item = payload[0];
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  const budget = budgets[item.payload.slug];
  const count = expenseCountMap[item.payload.slug] || 0;

  return (
    <div className="rounded-xl px-3 py-2 shadow-lg text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
      <p style={{ color: 'var(--text-secondary)' }}>
        {formatCurrency(item.value)} · {pct}% · {count} txn{count !== 1 ? "s" : ""}
      </p>
      {budget && (
        <p className={item.value > budget ? "text-red-500 mt-0.5" : "mt-0.5"} style={item.value <= budget ? { color: 'var(--text-muted)' } : undefined}>
          Budget: {formatCurrency(budget)} ({Math.round((item.value / budget) * 100)}%)
        </p>
      )}
    </div>
  );
}

export function CategoryChart({ categoryTotals, onCategoryClick, categoryBudgets, expenses }: CategoryChartProps) {
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
      color: catMap[c.category]?.color || "#6B7280",
      slug: c.category,
    }));

  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        secondaryIcon={BarChart3}
        title="No spending yet"
        description="Your category breakdown will appear here as you add expenses."
      />
    );
  }

  return (
    <div role="img" aria-label="Category breakdown chart">
      <div className="mb-2 flex justify-end">
        <div className="segmented-control">
          <button
            data-active={!showTable}
            onClick={() => setShowTable(false)}
            className="flex items-center gap-1"
          >
            <PieChartIcon size={13} />
            Chart
          </button>
          <button
            data-active={showTable}
            onClick={() => setShowTable(true)}
            className="flex items-center gap-1"
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
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                    onClick={() => onCategoryClick?.(d.slug)}
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
                        <span className={budgetPct >= 100 ? "text-red-500" : budgetPct >= 80 ? "text-amber-500" : ""} style={budgetPct < 80 ? { color: 'var(--text-muted)' } : undefined}>
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
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={800}
                animationEasing="ease-out"
                activeShape={(props: unknown) => {
                  const p = props as Record<string, number>;
                  return (
                    <Sector
                      {...(props as Record<string, unknown>)}
                      innerRadius={p.innerRadius - 2}
                      outerRadius={p.outerRadius + 4}
                    />
                  );
                }}
                style={{ cursor: onCategoryClick ? "pointer" : undefined }}
                onClick={(_, idx) => onCategoryClick?.(data[idx].slug)}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <CustomTooltip
                    total={total}
                    budgets={budgets}
                    expenseCountMap={expenseCountMap}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
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
              className="rounded-lg px-1 py-0.5 transition-colors"
              style={{ cursor: onCategoryClick ? "pointer" : undefined }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
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
                        className={`h-1.5 rounded-full transition-all ${
                          isOverBudget ? "bg-red-500" : isNearBudget ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(budgetPct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${
                      isOverBudget ? "text-red-500" : isNearBudget ? "text-amber-500" : ""
                    }`} style={!isOverBudget && !isNearBudget ? { color: 'var(--text-muted)' } : undefined}>
                      {budgetPct}%
                    </span>
                  </div>
                  {isOverBudget && (
                    <p className="text-[10px] text-red-500 mt-0.5">
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
