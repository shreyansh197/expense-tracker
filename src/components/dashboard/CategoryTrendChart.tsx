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
    <div className="h-[160px] w-full" role="img" aria-label={`${categoryLabel} spending trend chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trendData} barSize={28}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}K` : `${v}`)}
            width={35}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), categoryLabel]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--chart-tooltip-border)",
              fontSize: "12px",
              padding: "8px 12px",
              backgroundColor: "var(--chart-tooltip-bg)",
              color: "var(--chart-tooltip-fg)",
            }}
            labelStyle={{ color: "var(--chart-tooltip-fg)" }}
          />
          <Bar dataKey="total" fill={categoryColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
