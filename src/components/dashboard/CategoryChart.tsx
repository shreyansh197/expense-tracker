"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Table2, PieChart as PieChartIcon } from "lucide-react";
import { buildCategoryMap } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import type { CategoryTotal, Expense } from "@/types";

interface CategoryChartProps {
  categoryTotals: CategoryTotal[];
  onCategoryClick?: (categorySlug: string) => void;
  categoryBudgets?: Record<string, number>;
  expenses?: Expense[];
}

function CustomTooltip({ active, payload, total, catMap, budgets, expenseCountMap }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { slug: string; color: string } }>;
  total: number;
  catMap: Record<string, { label: string; color: string }>;
  budgets: Record<string, number>;
  expenseCountMap: Record<string, number>;
}) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0];
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  const budget = budgets[item.payload.slug];
  const count = expenseCountMap[item.payload.slug] || 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs dark:border-gray-700 dark:bg-gray-900">
      <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
      <p className="text-gray-600 dark:text-gray-400">
        {formatCurrency(item.value)} · {pct}% · {count} txn{count !== 1 ? "s" : ""}
      </p>
      {budget && (
        <p className={item.value > budget ? "text-red-500 mt-0.5" : "text-gray-400 mt-0.5"}>
          Budget: {formatCurrency(budget)} ({Math.round((item.value / budget) * 100)}%)
        </p>
      )}
    </div>
  );
}

export function CategoryChart({ categoryTotals, onCategoryClick, categoryBudgets, expenses }: CategoryChartProps) {
  const [showTable, setShowTable] = useState(false);
  const { settings } = useSettings();
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
      <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
        No expenses yet this month
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setShowTable((v) => !v)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label={showTable ? "Show chart" : "Show table"}
        >
          {showTable ? <PieChartIcon size={13} /> : <Table2 size={13} />}
          {showTable ? "Chart" : "Table"}
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
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
                    className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/30 cursor-pointer"
                    onClick={() => onCategoryClick?.(d.slug)}
                  >
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-gray-700 dark:text-gray-300">{d.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(d.value)}
                    </td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">{pct}%</td>
                    <td className="py-2 text-right">
                      {budget ? (
                        <span className={budgetPct >= 100 ? "text-red-500" : budgetPct >= 80 ? "text-amber-500" : "text-gray-400"}>
                          {budgetPct}%
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td className="pt-2 text-gray-700 dark:text-gray-300">Total</td>
                <td className="pt-2 text-right text-gray-900 dark:text-white">{formatCurrency(total)}</td>
                <td className="pt-2 text-right text-gray-500">100%</td>
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
                    catMap={catMap as Record<string, { label: string; color: string }>}
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
              className="rounded-lg px-1 py-0.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {meta?.label || c.category}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(c.total)}
                </span>
                <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
              </div>
              {budget ? (
                <div className="ml-6 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          isOverBudget ? "bg-red-500" : isNearBudget ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(budgetPct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${
                      isOverBudget ? "text-red-500" : isNearBudget ? "text-amber-500" : "text-gray-400"
                    }`}>
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
