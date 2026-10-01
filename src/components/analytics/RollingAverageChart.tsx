"use client";

import { useId, useMemo, useState } from "react";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { DataTableView, type DataTableColumn } from "@/components/ui/DataTableView";
import {
  buildRollingSeries,
  DEFAULT_ROLLING_PERIOD,
  ROLLING_PERIODS,
  ROLLING_WINDOW_DAYS,
  type RollingPeriod,
  type RollingPoint,
} from "@/lib/analyticsCharts";
import type { Expense } from "@/types";

interface RollingAverageChartProps {
  /** Raw expenses covering at least the longest period plus the smoothing window. */
  expenses: readonly Expense[];
  /** Last day of the series (today for the current month, else the month's last day). */
  anchor: Date;
  formatCurrency: (n: number) => string;
  formatCurrencyCompact: (n: number) => string;
  height?: number;
}

const MARGIN = { top: 8, right: 8, bottom: 22, left: 44 };

function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Round a mean to minor units for display. */
function toCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function Plot({ points, width, height, formatCurrencyCompact }: { points: RollingPoint[]; width: number; height: number; formatCurrencyCompact: (n: number) => string }) {
  const gradientId = `rolling-band-${useId().replace(/:/g, "")}`;
  const innerW = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const yMax = Math.max(...points.map((p) => p.upper), 1);
  const xScale = scaleLinear({ domain: [0, Math.max(points.length - 1, 1)], range: [0, innerW] });
  const yScale = scaleLinear({ domain: [0, yMax * 1.1], range: [innerH, 0], nice: true });
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.14} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <Group left={MARGIN.left} top={MARGIN.top}>
        <AreaClosed
          data={points}
          x={(_, i) => xScale(i)}
          y0={(d) => yScale(d.lower)}
          y1={(d) => yScale(d.upper)}
          yScale={yScale}
          fill={`url(#${gradientId})`}
          curve={curveMonotoneX}
        />
        <LinePath
          data={points}
          x={(_, i) => xScale(i)}
          y={(d) => yScale(d.mean)}
          stroke="var(--accent)"
          strokeWidth={2}
          curve={curveMonotoneX}
          strokeLinecap="round"
        />
        {[0, 0.5, 1].map((pct) => (
          <text key={pct} x={-6} y={yScale(yMax * pct)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--text-muted)">
            {formatCurrencyCompact(yMax * pct)}
          </text>
        ))}
        {first && last && (
          <>
            <text x={0} y={innerH + 16} fontSize={10} fill="var(--text-muted)">{formatDay(first.date)}</text>
            <text x={innerW} y={innerH + 16} fontSize={10} textAnchor="end" fill="var(--text-muted)">{formatDay(last.date)}</text>
          </>
        )}
      </Group>
    </svg>
  );
}

/**
 * Daily spend over the last 30 / 60 / 90 days, smoothed by a trailing 7-day
 * mean with a ±1σ band. The selected period sets the visible date range, so
 * switching it always redraws the chart and its data table.
 */
export function RollingAverageChart({ expenses, anchor, formatCurrency, formatCurrencyCompact, height = 140 }: RollingAverageChartProps) {
  const [period, setPeriod] = useState<RollingPeriod>(DEFAULT_ROLLING_PERIOD);
  const anchorKey = anchor.getTime();
  const points = useMemo(() => buildRollingSeries(expenses, new Date(anchorKey), period), [expenses, anchorKey, period]);
  const latest = points[points.length - 1];
  const title = `${ROLLING_WINDOW_DAYS}-day rolling average, last ${period} days`;

  const columns: DataTableColumn<RollingPoint>[] = [
    { header: "Date", rowHeader: true, cell: (p) => formatDay(p.date) },
    { header: "Spent", align: "end", cell: (p) => formatCurrency(p.dayTotal) },
    { header: `${ROLLING_WINDOW_DAYS}-day avg`, align: "end", cell: (p) => formatCurrency(toCents(p.mean)) },
  ];

  return (
    <div>
      <div role="group" aria-label="Rolling average period" className="mb-2 inline-flex overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
        {ROLLING_PERIODS.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            aria-label={`Last ${p} days`}
            className="min-h-[44px] min-w-[44px] px-3 text-xs font-semibold transition-colors"
            style={{
              background: period === p ? "var(--accent)" : "var(--surface-secondary)",
              color: period === p ? "var(--text-inverse)" : "var(--text-muted)",
              borderRight: i < ROLLING_PERIODS.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            {p}d
          </button>
        ))}
      </div>

      <DataTableView
        title={title}
        summary={latest ? `Latest ${ROLLING_WINDOW_DAYS}-day average ${formatCurrency(toCents(latest.mean))} per day.` : undefined}
        columns={columns}
        rows={points}
        getRowKey={(p) => p.date}
      >
        <div style={{ height }}>
          <ParentSize>
            {({ width }) => (width < 80 ? null : <Plot points={points} width={width} height={height} formatCurrencyCompact={formatCurrencyCompact} />)}
          </ParentSize>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--accent)" }} />
            {ROLLING_WINDOW_DAYS}-day avg
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="inline-block h-3 w-4 rounded opacity-20" style={{ background: "var(--accent)" }} />
            ±1σ band
          </span>
        </div>
      </DataTableView>
    </div>
  );
}
