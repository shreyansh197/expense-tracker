"use client";

import { useMemo } from "react";
import type { Expense } from "@/types";

interface MerchantRow {
  name: string;
  total: number;
  count: number;
}

interface MerchantBreakdownProps {
  expenses: Expense[];
  formatCurrency: (n: number) => string;
}

/**
 * Top-10 merchants/payees derived from the `remark` field.
 * Expenses without a remark are grouped under "Other".
 */
export function MerchantBreakdown({ expenses, formatCurrency }: MerchantBreakdownProps) {
  const rows = useMemo<MerchantRow[]>(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      const key = e.remark?.trim() || "Other";
      const existing = map.get(key);
      if (existing) {
        existing.total += e.amount;
        existing.count += 1;
      } else {
        map.set(key, { total: e.amount, count: 1 });
      }
    }
    return [...map.entries()]
      .map(([name, { total, count }]) => ({ name, total, count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [expenses]);

  if (rows.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
        No expense data yet.
      </p>
    );
  }

  const maxTotal = rows[0]?.total ?? 1;

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.name} className="space-y-0.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium truncate max-w-[65%]" style={{ color: "var(--text-primary)" }}>
              {row.name}
            </span>
            <span className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {formatCurrency(Math.round(row.total))}
              <span className="ml-1 text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                ×{row.count}
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(row.total / maxTotal) * 100}%`,
                background: "var(--accent)",
                opacity: 0.6,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
