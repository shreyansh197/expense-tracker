"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CATEGORY_MAP } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import type { CategoryTotal } from "@/types";

interface CategoryChartProps {
  categoryTotals: CategoryTotal[];
}

export function CategoryChart({ categoryTotals }: CategoryChartProps) {
  const data = categoryTotals
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: CATEGORY_MAP[c.category]?.label || c.category,
      value: c.total,
      color: CATEGORY_MAP[c.category]?.color || "#6B7280",
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

export function CategoryLegend({ categoryTotals }: CategoryChartProps) {
  const nonZero = categoryTotals.filter((c) => c.total > 0);
  const total = nonZero.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="space-y-2">
      {nonZero
        .sort((a, b) => b.total - a.total)
        .map((c) => {
          const meta = CATEGORY_MAP[c.category];
          const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
          return (
            <div key={c.category} className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: meta?.color }}
              />
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                {meta?.label}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(c.total)}
              </span>
              <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
            </div>
          );
        })}
    </div>
  );
}
