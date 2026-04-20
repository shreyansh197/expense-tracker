"use client";

import { useMemo } from "react";
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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1={PADDING_LEFT} y1={yScale(frac * maxTotal)}
            x2={W - PADDING_RIGHT} y2={yScale(frac * maxTotal)}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"
          />
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
              opacity={0.35}
              stroke={catColors[catIdx]}
              strokeWidth="1"
              strokeOpacity="0.6"
            />
          );
        })}

        {/* Month labels */}
        {stackedData.map((row, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={H - 5}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="8"
          >
            {(row.label as string).split(" ")[0]}
          </text>
        ))}

        {/* Y-axis labels */}
        <text x={PADDING_LEFT - 4} y={PADDING_TOP + 4} textAnchor="end" fill="var(--text-muted)" fontSize="8">
          {formatCurrencyCompact(maxTotal)}
        </text>
        <text x={PADDING_LEFT - 4} y={PADDING_TOP + chartH + 4} textAnchor="end" fill="var(--text-muted)" fontSize="8">
          0
        </text>
      </svg>

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
