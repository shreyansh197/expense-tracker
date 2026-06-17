"use client";

import { useMemo, useState } from "react";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { Group } from "@visx/group";
import { m } from "framer-motion";

interface DayPoint {
  date: Date;
  value: number;
}

interface RollingAverageChartProps {
  /** Daily totals keyed by ISO date string (YYYY-MM-DD) */
  dailyTotals: Record<string, number>;
  formatCurrency: (n: number) => string;
  width?: number;
  height?: number;
}

type WindowDays = 30 | 60 | 90;

/** Compute rolling mean and ±1σ band for the given window */
function computeRolling(points: DayPoint[], window: number): Array<{ date: Date; mean: number; upper: number; lower: number }> {
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1).map((p) => p.value);
    const mean = slice.reduce((s, v) => s + v, 0) / slice.length;
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length;
    const sigma = Math.sqrt(variance);
    return { date: points[i].date, mean, upper: mean + sigma, lower: Math.max(0, mean - sigma) };
  });
}

export function RollingAverageChart({ dailyTotals, formatCurrency, width = 320, height = 120 }: RollingAverageChartProps) {
  const [window, setWindow] = useState<WindowDays>(30);

  const points = useMemo<DayPoint[]>(() => {
    return Object.entries(dailyTotals)
      .map(([date, value]) => ({ date: new Date(date), value }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [dailyTotals]);

  const rolling = useMemo(() => computeRolling(points, window), [points, window]);

  const margin = { top: 8, right: 8, bottom: 24, left: 40 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xScale = useMemo(() => {
    if (rolling.length < 2) return null;
    return scaleTime({
      domain: [rolling[0].date, rolling[rolling.length - 1].date],
      range: [0, innerW],
    });
  }, [rolling, innerW]);

  const yMax = useMemo(() => Math.max(...rolling.map((d) => d.upper), 1), [rolling]);

  const yScale = useMemo(() =>
    scaleLinear({ domain: [0, yMax * 1.1], range: [innerH, 0], nice: true }),
    [yMax, innerH],
  );

  if (!xScale || rolling.length < 2 || width < 80) return null;

  return (
    <div>
      {/* Segmented control — connected pill style */}
      <div className="mb-2 inline-flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {([30, 60, 90] as WindowDays[]).map((w, i) => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            className="px-2.5 py-1 text-xs font-semibold transition-colors"
            style={{
              background: window === w ? "var(--accent)" : "var(--surface-secondary)",
              color: window === w ? "#fff" : "var(--text-muted)",
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
            }}
            aria-pressed={window === w}
          >
            {w}d
          </button>
        ))}
      </div>

      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${window}-day rolling average spending chart`}
      >
        <defs>
          <LinearGradient id="rolling-band" from="var(--accent)" to="var(--accent)" fromOpacity={0.12} toOpacity={0.04} vertical />
          <LinearGradient id="rolling-line" from="var(--accent)" to="var(--accent)" fromOpacity={1} toOpacity={0.6} />
        </defs>
        <Group left={margin.left} top={margin.top}>
          {/* ±σ confidence band */}
          <AreaClosed
            data={rolling}
            x={(d) => xScale(d.date) ?? 0}
            y0={(d) => yScale(d.lower)}
            y1={(d) => yScale(d.upper)}
            yScale={yScale}
            fill="url(#rolling-band)"
            curve={curveMonotoneX}
          />
          {/* Rolling mean line */}
          <LinePath
            data={rolling}
            x={(d) => xScale(d.date) ?? 0}
            y={(d) => yScale(d.mean)}
            stroke="var(--accent)"
            strokeWidth={2}
            curve={curveMonotoneX}
            strokeLinecap="round"
          />
          {/* Axis labels */}
          {[0, 0.5, 1].map((pct) => {
            const val = yMax * pct;
            const y = yScale(val);
            return (
              <text key={pct} x={-6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="var(--text-muted)">
                {formatCurrency(val)}
              </text>
            );
          })}
        </Group>
      </svg>

      {/* Legend */}
      <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--accent)" }} />
          {window}d avg
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-4 rounded opacity-20" style={{ background: "var(--accent)" }} />
          ±1σ band
        </span>
      </div>
    </div>
  );
}
