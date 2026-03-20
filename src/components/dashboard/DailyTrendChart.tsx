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
import { formatCurrency } from "@/lib/utils";
import type { DailyTotal } from "@/types";

interface DailyTrendChartProps {
  dailyTotals: DailyTotal[];
}

export function DailyTrendChart({ dailyTotals }: DailyTrendChartProps) {
  const hasData = dailyTotals.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-gray-400">
        No spending data yet
      </div>
    );
  }

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dailyTotals} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb40" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}K` : `${v}`)}
            width={35}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Spent"]}
            labelFormatter={(label: string) => `Day ${label}`}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
          />
          <Bar
            dataKey="total"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
