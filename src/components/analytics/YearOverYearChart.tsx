"use client";

import { useMemo } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useExpenseRange } from "@/hooks/useExpenseRange";
import { DataTableView, type DataTableColumn } from "@/components/ui/DataTableView";
import { buildYearOverYear, formatSignedPercent, type YearOverYearRow } from "@/lib/analyticsCharts";
import { addMoney } from "@/lib/money";
import { getShortMonthName } from "@/lib/utils";

interface YearOverYearChartProps {
  formatCurrency: (n: number) => string;
  formatCurrencyCompact: (n: number) => string;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Grouped bars comparing each month (Jan → selected month) of the selected
 * year with the same month a year earlier. One range query feeds both years.
 */
export function YearOverYearChart({ formatCurrency, formatCurrencyCompact }: YearOverYearChartProps) {
  const { currentMonth, currentYear } = useUIStore();
  const prevYear = currentYear - 1;
  const months = useMemo(
    () => [prevYear, currentYear].flatMap((year) => MONTHS.map((month) => ({ month, year }))),
    [prevYear, currentYear],
  );
  const expenses = useExpenseRange(months);

  const model = useMemo(() => {
    const cur = Array<number>(12).fill(0);
    const prev = Array<number>(12).fill(0);
    for (const e of expenses) {
      const bucket = e.year === currentYear ? cur : e.year === prevYear ? prev : null;
      if (bucket) bucket[e.month - 1] = addMoney(bucket[e.month - 1], e.amount);
    }
    return buildYearOverYear(cur, prev, currentMonth);
  }, [expenses, currentYear, prevYear, currentMonth]);

  const columns: DataTableColumn<YearOverYearRow>[] = [
    { header: "Month", rowHeader: true, cell: (r) => getShortMonthName(r.month) },
    { header: String(currentYear), align: "end", cell: (r) => formatCurrency(r.current) },
    { header: String(prevYear), align: "end", cell: (r) => formatCurrency(r.previous) },
    { header: "Change", align: "end", cell: (r) => (r.changePct === null ? "—" : formatSignedPercent(r.changePct)) },
  ];

  const summary = `${currentYear} to date ${formatCurrency(model.currentTotal)}, ${prevYear} same period ${formatCurrency(model.previousTotal)}${
    model.changePct === null ? "" : ` (${formatSignedPercent(model.changePct)})`
  }.`;

  return (
    <DataTableView title={`Year over year, ${currentYear} vs ${prevYear}`} summary={summary} columns={columns} rows={model.rows} getRowKey={(r) => String(r.month)}>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--accent)", opacity: 0.8 }} />
          {currentYear}: <span className="font-bold">{formatCurrencyCompact(model.currentTotal)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--text-muted)", opacity: 0.3 }} />
          {prevYear}: <span className="font-bold">{formatCurrencyCompact(model.previousTotal)}</span>
        </span>
        {model.changePct !== null && (
          <span className="text-xs font-semibold" style={{ color: model.changePct > 0 ? "var(--danger-text)" : "var(--success-text)" }}>
            {formatSignedPercent(model.changePct)} YoY
          </span>
        )}
      </div>
      <div className="flex items-end gap-1" aria-hidden="true">
        {model.rows.map((r) => (
          <div key={r.month} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <div className="flex w-full items-end justify-center gap-px" style={{ height: 72 }}>
              <div
                className="w-2/5 rounded-t-sm transition-[height] duration-500"
                style={{ height: `${Math.max((r.previous / model.maxValue) * 100, r.previous > 0 ? 3 : 0)}%`, background: "var(--text-muted)", opacity: 0.3 }}
              />
              <div
                className="w-2/5 rounded-t-sm transition-[height] duration-500"
                style={{ height: `${Math.max((r.current / model.maxValue) * 100, r.current > 0 ? 3 : 0)}%`, background: "var(--accent)", opacity: 0.8 }}
              />
            </div>
            <span className="text-caption font-medium" style={{ color: "var(--text-muted)" }}>
              {getShortMonthName(r.month).charAt(0)}
            </span>
          </div>
        ))}
      </div>
    </DataTableView>
  );
}
