"use client";

import { useMemo, type ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { AnalyticsSection } from "@/components/analytics/AnalyticsSection";
import { DataTableView, type DataTableColumn } from "@/components/ui/DataTableView";
import { buildMonthRidge, type RidgeMonthInput, type RidgeRow } from "@/lib/analyticsCharts";

export interface MonthRidgeProps {
  months: readonly RidgeMonthInput[];
  selected: { month: number; year: number };
  /** Number of months in the selected period (3 / 6 / 12). */
  period: number;
  budget: number;
  formatCurrency: (n: number) => string;
  formatCurrencyCompact: (n: number) => string;
  /** Optional line under the chart (e.g. the period's top category). */
  footer?: ReactNode;
}

/**
 * Monthly totals for the selected period as horizontal bars, with the budget
 * marker on the same scale. The title, bars, and data table all follow the
 * 3M / 6M / 12M selection.
 */
export function MonthRidge({ months, selected, period, budget, formatCurrency, formatCurrencyCompact, footer }: MonthRidgeProps) {
  const model = useMemo(() => buildMonthRidge(months, selected, budget), [months, selected, budget]);
  const title = `${period}-Month Ridge`;

  const columns: DataTableColumn<RidgeRow>[] = [
    { header: "Month", rowHeader: true, cell: (r) => (r.isSelected ? `${r.label} (selected)` : r.label) },
    { header: "Spent", align: "end", cell: (r) => formatCurrency(r.total) },
    ...(model.budgetPct !== null
      ? [{
          header: "vs budget",
          align: "end" as const,
          cell: (r: RidgeRow) =>
            r.budgetDelta === null || r.budgetDelta === 0
              ? "On budget"
              : r.budgetDelta > 0
                ? `${formatCurrency(r.budgetDelta)} over`
                : `${formatCurrency(Math.abs(r.budgetDelta))} under`,
        }]
      : []),
  ];

  return (
    <AnalyticsSection
      title={title}
      icon={BarChart3}
      info={
        <p className="text-xs leading-relaxed">
          Total spend per month for the last {period} months, on one shared scale. The dashed marker is your
          budget; the selected month is highlighted.
        </p>
      }
    >
      <DataTableView
        title={title}
        summary={budget > 0 ? `Budget ${formatCurrency(budget)} per month.` : undefined}
        columns={columns}
        rows={model.rows}
        getRowKey={(r) => r.key}
      >
        <ul className="mt-1 space-y-2" aria-label={`${title}, ${model.rows.length} months`}>
          {model.rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3">
              <span
                className="w-16 shrink-0 text-right text-xs font-medium"
                style={{ color: r.isSelected ? "var(--text-primary)" : "var(--text-tertiary)" }}
              >
                {r.label}
              </span>
              <div
                className="relative h-5 flex-1 overflow-hidden rounded-lg"
                style={{ background: "var(--surface-secondary)" }}
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-lg transition-[width] duration-500"
                  style={{
                    width: `${Math.max(r.pct, r.total > 0 ? 1 : 0)}%`,
                    background: r.isSelected ? "var(--accent)" : "var(--es-sage, var(--text-muted))",
                    opacity: r.isSelected ? 1 : 0.45,
                  }}
                />
                {model.budgetPct !== null && (
                  <div
                    className="absolute inset-y-0 border-l-2 border-dashed"
                    style={{ left: `${model.budgetPct}%`, borderColor: "var(--es-clay, var(--danger))" }}
                  />
                )}
              </div>
              <span
                className="w-20 shrink-0 text-right text-xs font-semibold font-numeric tabular-nums"
                style={{ color: r.overBudget ? "var(--danger-text)" : "var(--text-secondary)" }}
              >
                {formatCurrencyCompact(r.total)}
                {r.overBudget && <span className="sr-only"> (over budget)</span>}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {model.budgetPct !== null && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-3 border-l-2 border-dashed" style={{ borderColor: "var(--es-clay, var(--danger))" }} />
              Budget {formatCurrencyCompact(budget)}
            </span>
          )}
          {model.averageBefore !== null && (
            <span>Avg of earlier months {formatCurrencyCompact(model.averageBefore)}</span>
          )}
        </div>
      </DataTableView>
      {footer}
    </AnalyticsSection>
  );
}
