"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface CategoryTrendChartProps {
  trendData: { label: string; total: number }[];
  categoryLabel: string;
  categoryColor: string;
  formatCurrency: (n: number) => string;
}

export function CategoryTrendChart({
  trendData,
  categoryLabel,
  categoryColor,
  formatCurrency,
}: CategoryTrendChartProps) {
  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trendData} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb40" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}K` : `${v}`)}
            width={35}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), categoryLabel]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--chart-tooltip-border, #e5e7eb)",
              fontSize: "13px",
              backgroundColor: "var(--chart-tooltip-bg, #fff)",
              color: "var(--chart-tooltip-fg, #111827)",
            }}
            labelStyle={{ color: "var(--chart-tooltip-fg, #111827)" }}
          />
          <Bar dataKey="total" fill={categoryColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
