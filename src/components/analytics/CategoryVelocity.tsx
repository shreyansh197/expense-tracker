"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Sparkline } from "@/components/ui/charts/Sparkline";
import { DataTableView, type DataTableColumn } from "@/components/ui/DataTableView";
import { buildCategoryVelocity, formatSignedPercent, type CategoryVelocityRow } from "@/lib/analyticsCharts";
import type { Expense } from "@/types";

interface CategoryVelocityProps {
  /** Raw expenses covering at least the four weeks before `anchor`. */
  expenses: readonly Expense[];
  /** Last day of the comparison (today for the current month, else the month's last day). */
  anchor: Date;
  /** Category id → label and colour. */
  categoryLabels: Record<string, { label: string; color: string }>;
  formatCurrency: (n: number) => string;
}

const TREND_THRESHOLD = 5;

/**
 * Week-over-week movement per category for the four weeks ending at the
 * selected month's anchor day. Direction is shown by icon and sign, never by
 * colour alone.
 */
export function CategoryVelocity({ expenses, anchor, categoryLabels, formatCurrency }: CategoryVelocityProps) {
  const anchorKey = anchor.getTime();
  const rows = useMemo(
    () => buildCategoryVelocity(expenses, new Date(anchorKey), Object.keys(categoryLabels)),
    [expenses, anchorKey, categoryLabels],
  );

  if (rows.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        No category spending in the last four weeks.
      </p>
    );
  }

  const label = (id: string) => categoryLabels[id]?.label ?? id;
  const columns: DataTableColumn<CategoryVelocityRow>[] = [
    { header: "Category", rowHeader: true, cell: (r) => label(r.id) },
    { header: "This week", align: "end", cell: (r) => formatCurrency(r.thisWeek) },
    { header: "Last week", align: "end", cell: (r) => formatCurrency(r.lastWeek) },
    { header: "Change", align: "end", cell: (r) => (r.deltaPct === null ? "—" : formatSignedPercent(r.deltaPct)) },
  ];

  return (
    <DataTableView title="Category velocity, week over week" columns={columns} rows={rows} getRowKey={(r) => r.id}>
      <ul className="space-y-2.5">
        {rows.map((r) => {
          const meta = categoryLabels[r.id];
          const isUp = r.deltaPct !== null && r.deltaPct > TREND_THRESHOLD;
          const isDown = r.deltaPct !== null && r.deltaPct < -TREND_THRESHOLD;
          const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
          const trendColor = isUp ? "var(--danger-text)" : isDown ? "var(--success-text)" : "var(--text-muted)";
          return (
            <li key={r.id} className="flex items-center gap-3">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta?.color ?? "var(--text-muted)" }} />
              <span className="flex-1 truncate text-sm" style={{ color: "var(--text-primary)" }}>{label(r.id)}</span>
              <Sparkline data={r.weeks} width={56} height={20} color={meta?.color ?? "var(--accent)"} strokeWidth={1.5} />
              <span className="w-16 shrink-0 text-right text-xs font-semibold font-numeric" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(r.thisWeek)}
              </span>
              <span className="flex w-14 shrink-0 items-center justify-end gap-0.5 text-xs font-medium" style={{ color: trendColor }}>
                <TrendIcon size={12} aria-hidden="true" />
                {r.deltaPct === null ? "—" : formatSignedPercent(r.deltaPct)}
              </span>
            </li>
          );
        })}
      </ul>
    </DataTableView>
  );
}
