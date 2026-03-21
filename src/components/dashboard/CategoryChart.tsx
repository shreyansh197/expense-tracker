"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { buildCategoryMap } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import type { CategoryTotal } from "@/types";

interface CategoryChartProps {
  categoryTotals: CategoryTotal[];
  onCategoryClick?: (categorySlug: string) => void;
  categoryBudgets?: Record<string, number>;
}

export function CategoryChart({ categoryTotals, onCategoryClick }: CategoryChartProps) {
  const { settings } = useSettings();
  const catMap = buildCategoryMap(settings.customCategories);
  const data = categoryTotals
    .filter((c) => c.total > 0)
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
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
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
