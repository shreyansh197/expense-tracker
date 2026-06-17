"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getMonthName } from "@/lib/utils";

interface MonthSnapshot {
  month: number;
  year: number;
  total: number;
  count: number;
  categoryBreakdown: Record<string, number>;
}

interface ComparisonViewProps {
  current: MonthSnapshot;
  previous: MonthSnapshot;
  categoryLabels: Record<string, string>;
  formatCurrency: (n: number) => string;
}

export function ComparisonView({ current, previous, categoryLabels, formatCurrency }: ComparisonViewProps) {
  const change = previous.total > 0
    ? ((current.total - previous.total) / previous.total) * 100
    : null;

  const increased = change !== null && change > 0;
  const decreased = change !== null && change < 0;

  // Top categories across both months
  const allCatIds = Array.from(
    new Set([
      ...Object.keys(current.categoryBreakdown),
      ...Object.keys(previous.categoryBreakdown),
    ])
  );
  const catRows = useMemo(() => {
    return allCatIds
      .map((id) => ({
        id,
        label: categoryLabels[id] ?? id,
        cur: current.categoryBreakdown[id] ?? 0,
        prev: previous.categoryBreakdown[id] ?? 0,
      }))
      .filter((r) => r.cur > 0 || r.prev > 0)
      .sort((a, b) => (b.cur + b.prev) - (a.cur + a.prev))
      .slice(0, 6);
  }, [allCatIds, current.categoryBreakdown, previous.categoryBreakdown, categoryLabels]);

  const maxBar = Math.max(...catRows.flatMap((r) => [r.cur, r.prev]), 1);

  const curLabel = getMonthName(current.month);
  const prevLabel = getMonthName(previous.month);

  const avgCur = current.count > 0 ? current.total / current.count : 0;
  const avgPrev = previous.count > 0 ? previous.total / previous.count : 0;

  return (
    <div>
      {/* Headline metric */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[
          { label: prevLabel, total: previous.total, count: previous.count, avg: avgPrev, muted: true },
          { label: curLabel, total: current.total, count: current.count, avg: avgCur, muted: false },
        ].map((col) => (
          <div
            key={col.label}
            className="rounded-xl p-3"
            style={{ background: col.muted ? "var(--surface-secondary)" : "color-mix(in srgb, var(--accent) 8%, transparent)" }}
          >
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {col.label}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: col.muted ? "var(--text-secondary)" : "var(--text-primary)" }}>
              {formatCurrency(col.total)}
            </p>
            <p className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
              {col.count} expense{col.count !== 1 ? "s" : ""} · avg {formatCurrency(Math.round(col.avg))}
            </p>
          </div>
        ))}
      </div>

      {/* Change badge */}
      {change !== null && (
        <div className="mb-4 flex items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: increased
                ? "var(--danger-soft, rgba(239,68,68,0.1))"
                : decreased
                ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                : "var(--surface-secondary)",
              color: increased
                ? "var(--danger)"
                : decreased
                ? "var(--accent)"
                : "var(--text-muted)",
            }}
          >
            {increased ? <TrendingUp size={12} /> : decreased ? <TrendingDown size={12} /> : <Minus size={12} />}
            {increased ? "+" : ""}{Math.round(Math.abs(change))}%{" "}
            {increased ? "more" : decreased ? "less" : "same"} than {prevLabel}
          </div>
        </div>
      )}

      {/* Category comparison bars */}
      {catRows.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            By Category
          </p>
          {catRows.map((row) => (
            <div key={row.id}>
              <div className="mb-0.5 flex justify-between">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {row.label}
                </span>
                <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {formatCurrency(Math.round(row.cur))}
                </span>
              </div>
              <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
                {/* Previous month (muted) */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${(row.prev / maxBar) * 100}%`,
                    background: "var(--text-muted)",
                    opacity: 0.25,
                  }}
                />
                {/* Current month */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(row.cur / maxBar) * 100}%`,
                    background: "var(--accent)",
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--accent)", opacity: 0.8 }} />
              <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{curLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--text-muted)", opacity: 0.4 }} />
              <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{prevLabel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
