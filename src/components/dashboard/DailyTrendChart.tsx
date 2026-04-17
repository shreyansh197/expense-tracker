"use client";

import { useState, useMemo } from "react";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { ParentSize } from "@visx/responsive";
import { Table2, BarChart3, Layers, TrendingUp } from "lucide-react";
import { buildCategoryMap } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIllustration } from "@/components/ui/illustrations";
import type { DailyTotal, StackedDailyTotal, CategoryId } from "@/types";
import type { ReactNode } from "react";

interface DailyTrendChartProps {
  dailyTotals: DailyTotal[];
  stackedDailyTotals?: StackedDailyTotal[];
  activeCategories?: CategoryId[];
  onBarClick?: (day: number) => void;
  paceTarget?: number;
  headerLeft?: ReactNode;
}

const MARGIN = { top: 8, right: 4, bottom: 24, left: 4 };

function SimpleBarChart({ data, onBarClick, paceTarget, width, height }: {
  data: DailyTotal[];
  onBarClick?: (day: number) => void;
  paceTarget?: number;
  width: number;
  height: number;
}) {
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const xScale = useMemo(
    () => scaleBand<number>({ domain: data.map((d) => d.day), range: [0, innerW], padding: 0.2 }),
    [data, innerW],
  );
  const maxVal = Math.max(...data.map((d) => d.total), paceTarget ?? 0, 1);
  const yScale = useMemo(
    () => scaleLinear<number>({ domain: [0, maxVal], range: [innerH, 0] }),
    [maxVal, innerH],
  );

  const today = new Date().getDate();

  return (
    <svg width={width} height={height}>
      <Group left={MARGIN.left} top={MARGIN.top}>
        {paceTarget && paceTarget > 0 && (
          <line
            x1={0} y1={yScale(paceTarget)} x2={innerW} y2={yScale(paceTarget)}
            stroke="var(--warning)" strokeDasharray="6 4" strokeWidth={1.5} opacity={0.6}
          />
        )}
        {data.map((d) => {
          const barH = innerH - (yScale(d.total) ?? 0);
          const x = xScale(d.day) ?? 0;
          const isToday = d.day === today;
          return (
            <Group key={d.day}>
              <Bar
                x={x}
                y={innerH - barH}
                width={xScale.bandwidth()}
                height={Math.max(barH, 0)}
                rx={3}
                fill={isToday ? "var(--es-moss)" : "var(--es-sage, var(--primary))"}
                opacity={isToday ? 1 : 0.6}
                style={{ cursor: onBarClick ? "pointer" : undefined }}
                onClick={() => onBarClick?.(d.day)}
              />
              {d.day % 5 === 1 && (
                <text
                  x={x + xScale.bandwidth() / 2}
                  y={innerH + 14}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize={9}
                >
                  {d.day}
                </text>
              )}
            </Group>
          );
        })}
      </Group>
    </svg>
  );
}

function StackedBarChart({ data, catKeys, catMap, onBarClick, width, height }: {
  data: StackedDailyTotal[];
  catKeys: string[];
  catMap: Record<string, { label: string; color: string }>;
  onBarClick?: (day: number) => void;
  width: number;
  height: number;
}) {
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const xScale = useMemo(
    () => scaleBand<number>({ domain: data.map((d) => d.day), range: [0, innerW], padding: 0.2 }),
    [data, innerW],
  );
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <svg width={width} height={height}>
      <Group left={MARGIN.left} top={MARGIN.top}>
        {data.map((d) => {
          const x = xScale(d.day) ?? 0;
          let cumY = innerH;
          return (
            <Group key={d.day}>
              {catKeys.map((cat) => {
                const val = (d[cat] as number) || 0;
                if (val <= 0) return null;
                const barH = (val / maxVal) * innerH;
                cumY -= barH;
                return (
                  <Bar
                    key={cat}
                    x={x}
                    y={cumY}
                    width={xScale.bandwidth()}
                    height={barH}
                    fill={catMap[cat]?.color || "var(--es-sage)"}
                    style={{ cursor: onBarClick ? "pointer" : undefined }}
                    onClick={() => onBarClick?.(d.day)}
                  />
                );
              })}
              {d.day % 5 === 1 && (
                <text
                  x={x + xScale.bandwidth() / 2}
                  y={innerH + 14}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize={9}
                >
                  {d.day}
                </text>
              )}
            </Group>
          );
        })}
      </Group>
    </svg>
  );
}

export function DailyTrendChart({ dailyTotals, stackedDailyTotals, activeCategories, onBarClick, paceTarget, headerLeft }: DailyTrendChartProps) {
  const [stacked, setStacked] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const catMap = buildCategoryMap(settings.customCategories);

  const hasData = dailyTotals.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <EmptyState
        icon={TrendingUp}
        secondaryIcon={BarChart3}
        illustration={<ChartIllustration />}
        title="No spending recorded yet"
        description="Your daily spending patterns will appear here as you add expenses."
      />
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

  const grandTotal = dailyTotals.reduce((s, d) => s + d.total, 0);
  const peakDay = tableDays.length > 0 ? tableDays.reduce((a, b) => (b.total > a.total ? b : a)) : null;
  const chartLabel = `Daily spending trend: ${tableDays.length} days with spending totalling ${formatCurrency(grandTotal)}${peakDay ? `. Peak: Day ${peakDay.day} at ${formatCurrency(peakDay.total)}` : ""}.`;

  return (
    <div role="img" aria-label={chartLabel} className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        {headerLeft}
        <div className="flex items-center gap-1">
        {hasStackedData && (
          <button
            onClick={() => { setStacked((v) => !v); setShowTable(false); }}
            className={cn(
              "flex items-center justify-center rounded-md p-1.5 text-xs transition-colors",
              stacked
                ? "bg-brand-soft text-brand"
                : ""
            )}
            style={!stacked ? { color: 'var(--text-secondary)' } : undefined}
            onMouseEnter={e => { if (!stacked) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
            onMouseLeave={e => { if (!stacked) e.currentTarget.style.background = ''; }}
            aria-label={stacked ? "Show simple bars" : "Stack by category"}
            aria-pressed={stacked}
            title={stacked ? "Show simple bars" : "Stack by category"}
          >
            <Layers size={14} />
          </button>
        )}
        <div className="segmented-control" role="group" aria-label="View mode">
          <button
            data-active={!showTable}
            onClick={() => setShowTable(false)}
            className="flex items-center gap-1"
            aria-pressed={!showTable}
          >
            <BarChart3 size={13} />
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
      </div>

      {showTable ? (
        <div className="flex-1 min-h-[180px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead className="sticky top-0" style={{ background: 'var(--surface)' }}>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }} className="text-left text-xs">
                <th className="pb-2 font-medium">Day</th>
                <th className="pb-2 text-right font-medium">Spent</th>
              </tr>
            </thead>
            <tbody>
              {tableDays.map((d) => (
                <tr
                  key={d.day}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  onClick={() => onBarClick?.(d.day)}
                  tabIndex={onBarClick ? 0 : undefined}
                  onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onBarClick) { e.preventDefault(); onBarClick(d.day); } }}
                  role={onBarClick ? "button" : undefined}
                >
                  <td className="py-3" style={{ color: 'var(--text-primary)' }}>{d.day}</td>
                  <td className="py-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(d.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : stacked && stackedDailyTotals && catKeys.length > 0 ? (
        <div className="flex-1 min-h-[220px] w-full">
          <p className="sr-only">
            Stacked bar chart showing daily spending by category. {tableDays.length} days with spending.
            Switch to Table view for full details.
          </p>
          <ParentSize>{({ width, height }) => (
            <StackedBarChart
              data={stackedDailyTotals}
              catKeys={catKeys}
              catMap={catMap as Record<string, { label: string; color: string }>}
              onBarClick={onBarClick}
              width={width}
              height={height}
            />
          )}</ParentSize>
        </div>
      ) : (
        <div className="flex-1 min-h-[180px] w-full">
          <p className="sr-only">
            Bar chart showing daily spending. {tableDays.length} days with spending totalling {formatCurrency(grandTotal)}.
            Switch to Table view for full details.
          </p>
          <ParentSize>{({ width, height }) => (
            <SimpleBarChart
              data={dailyTotals}
              onBarClick={onBarClick}
              paceTarget={paceTarget}
              width={width}
              height={height}
            />
          )}</ParentSize>
        </div>
      )}
    </div>
  );
}
