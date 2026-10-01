"use client";

import { useMemo } from "react";
import { DataTableView, type DataTableColumn } from "@/components/ui/DataTableView";
import { buildMerchantRows, type MerchantRow } from "@/lib/analyticsCharts";
import type { Expense } from "@/types";

interface MerchantBreakdownProps {
  expenses: readonly Expense[];
  formatCurrency: (n: number) => string;
}

/**
 * Top-10 merchants/payees derived from the `remark` field.
 * Expenses without a remark are grouped under "Other".
 */
export function MerchantBreakdown({ expenses, formatCurrency }: MerchantBreakdownProps) {
  const rows = useMemo(() => buildMerchantRows(expenses), [expenses]);

  if (rows.length === 0) {
    return (
      <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        No expense data yet.
      </p>
    );
  }

  const columns: DataTableColumn<MerchantRow>[] = [
    { header: "Merchant / payee", rowHeader: true, cell: (r) => r.name },
    { header: "Spent", align: "end", cell: (r) => formatCurrency(r.total) },
    { header: "Expenses", align: "end", cell: (r) => String(r.count) },
  ];

  return (
    <DataTableView title="Top merchants and payees this month" columns={columns} rows={rows} getRowKey={(r) => r.name}>
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.name} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="max-w-[65%] truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {row.name}
              </span>
              <span className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(row.total)}
                <span className="ml-1 text-caption" style={{ color: "var(--text-muted)" }}>
                  ×{row.count}
                  <span className="sr-only"> expenses</span>
                </span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-secondary)" }} aria-hidden="true">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${row.pct}%`, background: "var(--accent)", opacity: 0.6 }}
              />
            </div>
          </li>
        ))}
      </ul>
    </DataTableView>
  );
}
