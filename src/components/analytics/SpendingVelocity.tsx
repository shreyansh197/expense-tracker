"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { AnalyticsSection } from "@/components/analytics/AnalyticsSection";
import { DataTableView, type DataTableColumn } from "@/components/ui/DataTableView";
import { buildWeeklyVelocity, formatSignedPercent, type VelocityRow } from "@/lib/analyticsCharts";

export interface SpendingVelocityProps {
  weeks: readonly { week: number; total: number }[];
  budget: number;
  daysInMonth: number;
  formatCurrency: (n: number) => string;
  formatCurrencyCompact: (n: number) => string;
}

/**
 * Weekly spend for the selected month against the budget pace. Bars live in a
 * fixed, clipped plot area whose scale includes the pace line, and every label
 * sits below that area in normal flow — so no value can render over the text,
 * however far a week exceeds the budget.
 */
export function SpendingVelocity({ weeks, budget, daysInMonth, formatCurrency, formatCurrencyCompact }: SpendingVelocityProps) {
  const model = useMemo(() => buildWeeklyVelocity(weeks, budget, daysInMonth), [weeks, budget, daysInMonth]);
  const hasSpend = model.rows.some((r) => r.total > 0);

  const columns: DataTableColumn<VelocityRow>[] = [
    { header: "Week", rowHeader: true, cell: (r) => `${r.label} (days ${r.range})` },
    { header: "Spent", align: "end", cell: (r) => formatCurrency(r.total) },
    { header: "vs prev.", align: "end", cell: (r) => (r.changePct === null ? "—" : formatSignedPercent(r.changePct)) },
    ...(model.idealWeekly > 0
      ? [{ header: "Pace", align: "end" as const, cell: (r: VelocityRow) => (r.overPace ? "Over" : "Within") }]
      : []),
  ];

  return (
    <AnalyticsSection
      title="Spending Velocity"
      icon={TrendingUp}
      info={
        <p className="text-xs leading-relaxed">
          This month split into weekly buckets. The dashed line is your budget pace (budget ÷ number of weeks);
          weeks above it are marked <strong>over pace</strong>. Percentages compare each week with the one before.
        </p>
      }
    >
      {!hasSpend ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>No spending logged this month yet.</p>
      ) : (
        <DataTableView
          title="Spending velocity"
          summary={model.idealWeekly > 0 ? `Budget pace ${formatCurrency(model.idealWeekly)} per week.` : undefined}
          columns={columns}
          rows={model.rows}
          getRowKey={(r) => r.label}
        >
          <div aria-hidden="true">
            <div className="relative h-24 overflow-hidden">
              <div className="flex h-full items-end gap-3">
                {model.rows.map((r, i) => (
                  <div key={r.label} className="flex h-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md transition-[height] duration-500"
                      style={{
                        height: `${Math.max(r.pct, r.total > 0 ? 4 : 0)}%`,
                        background: r.overPace ? "var(--es-clay)" : "var(--accent)",
                        opacity: i === model.rows.length - 1 ? 0.9 : 0.5,
                      }}
                    />
                  </div>
                ))}
              </div>
              {model.paceLinePct !== null && (
                <div
                  className="absolute inset-x-0 border-t-2 border-dashed"
                  style={{ bottom: `${model.paceLinePct}%`, borderColor: "var(--text-muted)" }}
                />
              )}
            </div>
            <div className="mt-2 flex gap-3">
              {model.rows.map((r) => (
                <div key={r.label} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
                  <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{r.label}</span>
                  <span
                    className="text-caption font-numeric tabular-nums"
                    style={{ color: r.overPace ? "var(--danger-text)" : "var(--text-secondary)" }}
                  >
                    {formatCurrencyCompact(r.total)}
                  </span>
                  {r.overPace && (
                    <span className="text-caption font-semibold" style={{ color: "var(--danger-text)" }}>▲ pace</span>
                  )}
                  {r.changePct !== null && (
                    <span className="text-caption" style={{ color: "var(--text-muted)" }}>{formatSignedPercent(r.changePct)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {model.idealWeekly > 0 ? (
              <>
                <span aria-hidden="true" className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: "var(--text-muted)" }} />
                Budget pace {formatCurrencyCompact(model.idealWeekly)}/week
              </>
            ) : (
              "Set a monthly budget to see your weekly pace."
            )}
          </p>
        </DataTableView>
      )}
    </AnalyticsSection>
  );
}
