"use client";

import { useMemo } from "react";
import { Activity, Zap } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Expense } from "@/types";

interface SpendingHeatmapProps {
  expenses: Expense[];
  month: number;
  year: number;
  onDayClick?: (day: number) => void;
  /** Today's total spending — used for pulse rate mood */
  todayTotal?: number;
  /** Average daily spending — used for pulse rate mood */
  avgDaily?: number;
}

/**
 * GitHub-style heatmap grid showing daily spending intensity for the current month.
 * Each cell represents one day, colored by spending intensity relative to the month's average.
 */
export function SpendingHeatmap({ expenses, month, year, onDayClick, todayTotal = 0, avgDaily = 0 }: SpendingHeatmapProps) {
  const { formatCurrency } = useCurrency();

  // Pulse rate — spending intensity metaphor (migrated from SpendingPulse)
  const pulseRate = useMemo(() => {
    if (avgDaily <= 0) return { label: "Calm", intensity: 0 };
    const ratio = todayTotal / avgDaily;
    if (ratio === 0) return { label: "Resting", intensity: 0 };
    if (ratio < 0.5) return { label: "Calm", intensity: 1 };
    if (ratio < 1) return { label: "Steady", intensity: 2 };
    if (ratio < 1.5) return { label: "Active", intensity: 3 };
    return { label: "Surging", intensity: 4 };
  }, [todayTotal, avgDaily]);

  const intensityColor = [
    "var(--es-mist)",     // 0 - resting
    "var(--es-sage)",     // 1 - calm
    "var(--es-moss)",     // 2 - steady
    "var(--es-clay)",     // 3 - active
    "var(--accent)",      // 4 - surging
  ][pulseRate.intensity];

  const { grid, maxSpend, daysInMonth } = useMemo(() => {
    const d = new Date(year, month, 0).getDate(); // days in month
    const dayTotals = new Map<number, number>();
    for (const exp of expenses) {
      if (exp.deletedAt) continue;
      dayTotals.set(exp.day, (dayTotals.get(exp.day) ?? 0) + exp.amount);
    }
    const maxS = Math.max(...Array.from(dayTotals.values()), 1);
    const cells = Array.from({ length: d }, (_, i) => {
      const day = i + 1;
      const total = dayTotals.get(day) ?? 0;
      return { day, total, intensity: total / maxS };
    });
    return { grid: cells, maxSpend: maxS, daysInMonth: d };
  }, [expenses, month, year]);

  // First day of month → weekday offset (0=Sun)
  const firstDayOffset = new Date(year, month - 1, 1).getDay();

  // Intensity → color opacity (4 levels + empty)
  const getColor = (intensity: number, total: number): string => {
    if (total === 0) return "var(--surface-secondary)";
    if (intensity < 0.25) return "color-mix(in srgb, var(--primary) 25%, var(--surface-secondary))";
    if (intensity < 0.5) return "color-mix(in srgb, var(--primary) 45%, var(--surface-secondary))";
    if (intensity < 0.75) return "color-mix(in srgb, var(--primary) 65%, var(--surface-secondary))";
    return "color-mix(in srgb, var(--primary) 85%, var(--surface-secondary))";
  };

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={15} style={{ color: intensityColor, opacity: 0.7 }} />
          <h3 className="text-card-title whitespace-nowrap">Spending Heatmap</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-caption">Less</span>
          {[0, 0.2, 0.45, 0.7, 0.9].map((v, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-sm"
              style={{ background: getColor(v, v > 0 ? 1 : 0) }}
            />
          ))}
          <span className="text-caption">More</span>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
        {dayLabels.map((d, i) => (
          <div key={i} className="flex items-center justify-center">
            <span className="text-overline font-medium" style={{ color: "var(--text-muted)" }}>{d}</span>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-7 gap-[3px]">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-sm" />
        ))}
        {/* Day cells */}
        {grid.map((cell) => (
          <button
            key={cell.day}
            onClick={() => onDayClick?.(cell.day)}
            className="group relative aspect-square min-h-[44px] min-w-[44px] rounded-sm transition-transform duration-100 hover:scale-110 active:scale-95"
            style={{ background: getColor(cell.intensity, cell.total) }}
            aria-label={`Day ${cell.day}: ${formatCurrency(cell.total)}`}
            title={`Day ${cell.day}: ${formatCurrency(cell.total)}`}
          >
            <span
              className="absolute inset-0 flex items-center justify-center text-xs font-medium opacity-30 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ color: cell.intensity > 0.5 ? "var(--text-inverse)" : "var(--text-secondary)" }}
            >
              {cell.day}
            </span>
          </button>
        ))}
      </div>

      {/* Summary stats row */}
      <div className="mt-3 flex items-center justify-between text-caption">
        <span>
          {grid.filter((c) => c.total > 0).length} of {daysInMonth} days with spending
        </span>
        <div className="flex items-center gap-2">
          {todayTotal > 0 && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `color-mix(in srgb, ${intensityColor} 15%, transparent)`, color: intensityColor }}
            >
              <Zap size={9} />
              {pulseRate.label}
            </span>
          )}
          <span>
            Peak: {formatCurrency(maxSpend)}
          </span>
        </div>
      </div>
    </div>
  );
}
