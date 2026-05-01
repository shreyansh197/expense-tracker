"use client";

import { useMemo, useState } from "react";
import { m } from "framer-motion";
import { Layers } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useCurrency } from "@/hooks/useCurrency";
import { buildCategoryMap } from "@/lib/categories";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CategorySeasons() {
  const { currentMonth, currentYear } = useUIStore();
  const { settings } = useSettings();
  const { formatCurrencyCompact } = useCurrency();
  // 11 months lookback = 12 total months
  const history = useHistoricalData(currentMonth, currentYear, 11);

  const catMap = useMemo(
    () => buildCategoryMap(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  const months = history.months;

  // Find top 6 categories across all months
  const topCats = useMemo(() => {
    if (months.length < 3) return [];
    const catTotals: Record<string, number> = {};
    for (const md of months) {
      for (const [cat, amt] of Object.entries(md.categoryBreakdown)) {
        catTotals[cat] = (catTotals[cat] || 0) + amt;
      }
    }
    return Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);
  }, [months]);

  // Build stacked data per month
  const { stackedData, maxTotal, stacks, catColors } = useMemo(() => {
    if (months.length < 3 || topCats.length === 0) {
      return { stackedData: [], maxTotal: 1, stacks: [], catColors: [] };
    }
    const sd: Array<Record<string, string | number>> = months.map((md) => {
      const row: Record<string, string | number> = { label: md.label, total: md.total };
      for (const cat of topCats) {
        row[cat] = md.categoryBreakdown[cat] || 0;
      }
      row._other = md.total - topCats.reduce((s, c) => s + (md.categoryBreakdown[c] || 0), 0);
      return row;
    });
    const mt = Math.max(...months.map((m) => m.total), 1);
    const colors = topCats.map((id) => catMap[id]?.color ?? "var(--text-muted)");
    const st = sd.map((row) => {
      let cumulative = 0;
      const layers: number[] = [];
      for (const cat of topCats) {
        cumulative += (row[cat] as number) || 0;
        layers.push(cumulative);
      }
      return layers;
    });
    return { stackedData: sd, maxTotal: mt, stacks: st, catColors: colors };
  }, [months, topCats, catMap]);

  // Seasonal insight
  const insight = useMemo(() => {
    if (months.length < 6 || topCats.length === 0) return null;
    // Find the month with highest and lowest spending
    const sorted = [...months].sort((a, b) => b.total - a.total);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    if (highest.total <= 0) return null;

    // Find category with biggest seasonal swing
    let maxSwing = 0;
    let swingCat = "";
    for (const cat of topCats) {
      const vals = months.map((m) => m.categoryBreakdown[cat] || 0);
      const swing = Math.max(...vals) - Math.min(...vals);
      if (swing > maxSwing) { maxSwing = swing; swingCat = cat; }
    }

    return {
      highMonth: highest.label,
      lowMonth: lowest.label,
      swingCategory: swingCat ? (catMap[swingCat]?.label ?? swingCat) : null,
      swingAmount: maxSwing,
    };
  }, [months, topCats, catMap]);

  // Early return AFTER all hooks
  if (months.length < 3 || topCats.length === 0) return null;

  // SVG dimensions
  const W = 400;
  const H = 200;
  const PADDING_LEFT = 45;
  const PADDING_RIGHT = 10;
  const PADDING_TOP = 10;
  const PADDING_BOTTOM = 25;
  const chartW = W - PADDING_LEFT - PADDING_RIGHT;
  const chartH = H - PADDING_TOP - PADDING_BOTTOM;

  const xScale = (i: number) => PADDING_LEFT + (i / Math.max(stackedData.length - 1, 1)) * chartW;
  const yScale = (val: number) => PADDING_TOP + chartH - (val / maxTotal) * chartH;

  // Y-axis ticks (0, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <m.div
      className="card-terrain p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Layers size={16} style={{ color: "var(--accent)" }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Category Seasons
        </h3>
      </div>

      {/* Stacked area chart */}
      <ChartWithTooltip
        W={W} H={H}
        PADDING_LEFT={PADDING_LEFT} PADDING_RIGHT={PADDING_RIGHT}
        PADDING_TOP={PADDING_TOP} PADDING_BOTTOM={PADDING_BOTTOM}
        chartW={chartW} chartH={chartH}
        yTicks={yTicks}
        xScale={xScale} yScale={yScale}
        maxTotal={maxTotal}
        stackedData={stackedData}
        stacks={stacks}
        topCats={topCats}
        catColors={catColors}
        catMap={catMap}
        formatCurrencyCompact={formatCurrencyCompact}
      />

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {topCats.map((cat, i) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: catColors[i], opacity: 0.6 }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {catMap[cat]?.label ?? cat}
            </span>
          </div>
        ))}
      </div>

      {/* Seasonal insight */}
      {insight && (
        <div className="mt-3 rounded-lg p-3" style={{ background: "var(--surface-secondary)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Highest spending in <strong>{insight.highMonth}</strong>, lowest in <strong>{insight.lowMonth}</strong>.
            {insight.swingCategory && insight.swingAmount > 0 && (
              <> <strong>{insight.swingCategory}</strong> has the biggest seasonal swing ({formatCurrencyCompact(insight.swingAmount)}).</>
            )}
          </p>
        </div>
      )}
    </m.div>
  );
}

/** Interactive SVG chart with hover tooltip */
function ChartWithTooltip({
  W, H, PADDING_LEFT, PADDING_RIGHT, PADDING_TOP, PADDING_BOTTOM,
  chartW, chartH, yTicks, xScale, yScale, maxTotal,
  stackedData, stacks, topCats, catColors, catMap, formatCurrencyCompact,
}: {
  W: number; H: number;
  PADDING_LEFT: number; PADDING_RIGHT: number;
  PADDING_TOP: number; PADDING_BOTTOM: number;
  chartW: number; chartH: number;
  yTicks: number[];
  xScale: (i: number) => number;
  yScale: (v: number) => number;
  maxTotal: number;
  stackedData: Array<Record<string, string | number>>;
  stacks: number[][];
  topCats: string[];
  catColors: string[];
  catMap: Record<string, { label?: string; color?: string }>;
  formatCurrencyCompact: (n: number) => string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const colWidth = chartW / Math.max(stackedData.length, 1);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines + Y-axis labels */}
        {yTicks.map((frac) => (
          <g key={frac}>
            <line
              x1={PADDING_LEFT} y1={yScale(frac * maxTotal)}
              x2={W - PADDING_RIGHT} y2={yScale(frac * maxTotal)}
              stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"
            />
            <text
              x={PADDING_LEFT - 4} y={yScale(frac * maxTotal) + 3}
              textAnchor="end" fill="var(--text-muted)" fontSize="7"
            >
              {formatCurrencyCompact(frac * maxTotal)}
            </text>
          </g>
        ))}

        {/* Stacked areas — render bottom to top */}
        {topCats.map((cat, catIdx) => {
          const bottomPoints = stacks.map((s, i) => ({
            x: xScale(i),
            y: yScale(catIdx > 0 ? s[catIdx - 1] : 0),
          }));
          const topPoints = stacks.map((s, i) => ({
            x: xScale(i),
            y: yScale(s[catIdx]),
          }));

          const d = [
            `M${topPoints[0].x},${topPoints[0].y}`,
            ...topPoints.slice(1).map((p) => `L${p.x},${p.y}`),
            ...bottomPoints.reverse().map((p) => `L${p.x},${p.y}`),
            "Z",
          ].join(" ");

          return (
            <path
              key={cat}
              d={d}
              fill={catColors[catIdx]}
              opacity={hoverIdx !== null ? 0.25 : 0.35}
              stroke={catColors[catIdx]}
              strokeWidth="1"
              strokeOpacity="0.6"
            >
              <title>{catMap[cat]?.label ?? cat}</title>
            </path>
          );
        })}

        {/* Hover highlight column */}
        {hoverIdx !== null && (
          <rect
            x={xScale(hoverIdx) - colWidth / 2}
            y={PADDING_TOP}
            width={colWidth}
            height={chartH}
            fill="var(--text-primary)"
            opacity="0.04"
            rx="2"
          />
        )}

        {/* Month labels */}
        {stackedData.map((row, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={H - 5}
            textAnchor="middle"
            fill={hoverIdx === i ? "var(--text-primary)" : "var(--text-muted)"}
            fontSize="8"
            fontWeight={hoverIdx === i ? "600" : "400"}
          >
            {(row.label as string).split(" ")[0]}
          </text>
        ))}

        {/* Invisible hover regions */}
        {stackedData.map((_, i) => (
          <rect
            key={i}
            x={xScale(i) - colWidth / 2}
            y={0}
            width={colWidth}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            onTouchStart={() => setHoverIdx(i)}
            onTouchEnd={() => setHoverIdx(null)}
            style={{ cursor: "crosshair" }}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && (() => {
        const pct = (xScale(hoverIdx) / W) * 100;
        const atLeft = pct < 20;
        const atRight = pct > 80;
        return (
          <div
            className="absolute pointer-events-none z-[60] rounded-lg p-2 shadow-md text-xs min-w-[120px]"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              left: atLeft ? `${pct}%` : atRight ? undefined : `${pct}%`,
              right: atRight ? `${100 - pct}%` : undefined,
              top: "8px",
              transform: atLeft || atRight ? undefined : "translateX(-50%)",
            }}
          >
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {stackedData[hoverIdx].label as string}
          </p>
          {topCats.map((cat, catIdx) => {
            const val = (stackedData[hoverIdx][cat] as number) || 0;
            if (val === 0) return null;
            return (
              <div key={cat} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm" style={{ background: catColors[catIdx] }} />
                  <span style={{ color: "var(--text-secondary)" }}>{catMap[cat]?.label ?? cat}</span>
                </span>
                <span className="font-medium font-numeric" style={{ color: "var(--text-primary)" }}>
                  {formatCurrencyCompact(val)}
                </span>
              </div>
            );
          })}
          <div className="mt-1 pt-1 flex justify-between font-semibold" style={{ borderTop: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <span>Total</span>
            <span className="font-numeric">{formatCurrencyCompact(stackedData[hoverIdx].total as number)}</span>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
