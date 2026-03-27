"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Table2, BarChart3, Layers } from "lucide-react";
import { buildCategoryMap } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import type { DailyTotal, StackedDailyTotal, CategoryId } from "@/types";

interface DailyTrendChartProps {
  dailyTotals: DailyTotal[];
  stackedDailyTotals?: StackedDailyTotal[];
  activeCategories?: CategoryId[];
  onBarClick?: (day: number) => void;
}

function StackedTooltip({ active, payload, label, catMap }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
  catMap: Record<string, { label: string; color: string }>;
}) {
  const { formatCurrency } = useCurrency();
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  const nonZero = payload.filter((p) => p.value > 0);

  return (
    <div className="rounded-xl px-3 py-2 shadow-lg text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Day {label}</p>
      {nonZero.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>
            {catMap[p.dataKey]?.label || p.dataKey}
          </span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
      {nonZero.length > 1 && (
        <div className="mt-1 pt-1 flex justify-between gap-4 font-semibold" style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Total</span>
          <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  );
}

export function DailyTrendChart({ dailyTotals, stackedDailyTotals, activeCategories, onBarClick }: DailyTrendChartProps) {
  const [stacked, setStacked] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const catMap = buildCategoryMap(settings.customCategories);

  const hasData = dailyTotals.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="flex min-h-[180px] flex-1 items-center justify-center text-sm text-slate-400">
        No spending data yet
      </div>
    );
  }

  // Determine which categories appear in stacked data
  const catKeys: string[] = [];
  if (stacked && stackedDailyTotals) {
    const catSet = new Set<string>();
    for (const row of stackedDailyTotals) {
      for (const key of Object.keys(row)) {
        if (key !== "day" && key !== "total" && row[key] > 0) catSet.add(key);
      }
    }
    // Filter to active categories if set
    const filtered = activeCategories?.length
      ? [...catSet].filter((c) => activeCategories.includes(c))
      : [...catSet];
    // Sort by total descending
    filtered.sort((a, b) => {
      const totalA = stackedDailyTotals.reduce((s, r) => s + ((r[a] as number) || 0), 0);
      const totalB = stackedDailyTotals.reduce((s, r) => s + ((r[b] as number) || 0), 0);
      return totalB - totalA;
    });
    catKeys.push(...filtered);
  }

  const hasStackedData = !!stackedDailyTotals && stackedDailyTotals.some((d) => d.total > 0);

  // Table data - filter days with data
  const tableDays = dailyTotals.filter((d) => d.total > 0);

  return (
    <div role="img" aria-label="Daily spending trend chart" className="flex h-full flex-col">
      <div className="mb-2 flex justify-end gap-1">
        {hasStackedData && (
          <button
            onClick={() => { setStacked((v) => !v); setShowTable(false); }}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
              stacked
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
            aria-label={stacked ? "Show simple bars" : "Stack by category"}
            aria-pressed={stacked}
          >
            <Layers size={13} />
            Stacked
          </button>
        )}
        <div className="segmented-control">
          <button
            onClick={() => setShowTable(false)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              !showTable
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : ""
            )}
            style={showTable ? { color: 'var(--text-secondary)' } : undefined}
          >
            <BarChart3 size={13} />
            Chart
          </button>
          <button
            onClick={() => setShowTable(true)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              showTable
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : ""
            )}
            style={!showTable ? { color: 'var(--text-secondary)' } : undefined}
          >
            <Table2 size={13} />
            Table
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="flex-1 min-h-[180px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead className="sticky top-0 bg-white dark:bg-slate-900">
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="pb-2 font-medium">Day</th>
                <th className="pb-2 text-right font-medium">Spent</th>
              </tr>
            </thead>
            <tbody>
              {tableDays.map((d) => (
                <tr
                  key={d.day}
                  className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30 cursor-pointer"
                  onClick={() => onBarClick?.(d.day)}
                >
                  <td className="py-1.5 text-slate-700 dark:text-slate-300">{d.day}</td>
                  <td className="py-1.5 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(d.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : stacked && stackedDailyTotals && catKeys.length > 0 ? (
        <div className="flex-1 min-h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stackedDailyTotals}
              barSize={8}
              onClick={(state) => {
                if (state?.activePayload?.[0]?.payload && onBarClick) {
                  onBarClick(state.activePayload[0].payload.day);
                }
              }}
              style={{ cursor: onBarClick ? "pointer" : undefined }}
            >
              <CartesianGrid vertical={false} />
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
                content={<StackedTooltip catMap={catMap as Record<string, { label: string; color: string }>} />}
              />
              {catKeys.map((cat) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="stack"
                  fill={catMap[cat]?.color || "#6B7280"}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 min-h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyTotals}
              barSize={8}
              onClick={(state) => {
                if (state?.activePayload?.[0]?.payload && onBarClick) {
                  onBarClick(state.activePayload[0].payload.day);
                }
              }}
              style={{ cursor: onBarClick ? "pointer" : undefined }}
            >
              <CartesianGrid vertical={false} />
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
                  border: "1px solid var(--chart-tooltip-border, #e5e7eb)",
                  fontSize: "13px",
                  backgroundColor: "var(--chart-tooltip-bg, #fff)",
                  color: "var(--chart-tooltip-fg, #111827)",
                }}
                labelStyle={{ color: "var(--chart-tooltip-fg, #111827)" }}
                itemStyle={{ color: "#3B82F6" }}
              />
              <Bar
                dataKey="total"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
