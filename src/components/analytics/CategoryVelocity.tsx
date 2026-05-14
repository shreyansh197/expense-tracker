"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Sparkline } from "@/components/ui/charts/Sparkline";
import type { Expense, CategoryId } from "@/types";

interface CategoryVelocityProps {
  expenses: Expense[];
  /** Category label map: id → label */
  categoryLabels: Record<string, { label: string; color: string }>;
  formatCurrency: (n: number) => string;
}

function getWeekTotals(expenses: Expense[], categoryId: CategoryId, weeksBack = 4): number[] {
  const now = new Date();
  const totals: number[] = Array(weeksBack).fill(0);

  for (const e of expenses) {
    if (e.category !== categoryId) continue;
    const expDate = new Date(e.year, e.month - 1, e.day);
    const diffDays = Math.floor((now.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIdx = Math.floor(diffDays / 7);
    if (weekIdx < weeksBack) {
      // weekIdx 0 = this week, we store oldest-first so reverse
      totals[weeksBack - 1 - weekIdx] += e.amount;
    }
  }
  return totals;
}

export function CategoryVelocity({ expenses, categoryLabels, formatCurrency }: CategoryVelocityProps) {
  const rows = useMemo(() => {
    const catIds = Object.keys(categoryLabels);

    return catIds
      .map((id) => {
        const weeks = getWeekTotals(expenses, id as CategoryId, 4);
        const thisWeek = weeks[weeks.length - 1] ?? 0;
        const lastWeek = weeks[weeks.length - 2] ?? 0;
        const delta = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : null;
        return { id, weeks, thisWeek, lastWeek, delta };
      })
      .filter((r) => r.weeks.some((v) => v > 0))
      .sort((a, b) => b.thisWeek - a.thisWeek)
      .slice(0, 8);
  }, [expenses, categoryLabels]);

  if (rows.length === 0) return null;

  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Category Velocity (week-over-week)
      </h4>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const meta = categoryLabels[r.id];
          const deltaAbs = r.delta !== null ? Math.abs(r.delta) : null;
          const isUp = r.delta !== null && r.delta > 5;
          const isDown = r.delta !== null && r.delta < -5;
          const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
          const trendColor = isUp ? "var(--danger)" : isDown ? "var(--success)" : "var(--text-muted)";

          return (
            <div key={r.id} className="flex items-center gap-3">
              {/* Color dot */}
              <span
                className="shrink-0 h-2 w-2 rounded-full"
                style={{ background: meta?.color ?? "var(--text-muted)" }}
              />

              {/* Category name */}
              <span className="flex-1 truncate text-sm" style={{ color: "var(--text-primary)" }}>
                {meta?.label ?? r.id}
              </span>

              {/* Sparkline */}
              <Sparkline
                data={r.weeks}
                width={56}
                height={20}
                color={meta?.color ?? "var(--accent)"}
                strokeWidth={1.5}
              />

              {/* This week total */}
              <span className="w-16 text-right text-xs font-numeric font-semibold shrink-0" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(r.thisWeek)}
              </span>

              {/* Delta arrow */}
              <span className="flex items-center gap-0.5 w-12 shrink-0 justify-end text-xs font-medium" style={{ color: trendColor }}>
                <TrendIcon size={12} />
                {deltaAbs !== null ? `${deltaAbs.toFixed(0)}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
