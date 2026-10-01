"use client";

import { Award } from "lucide-react";
import { AnalyticsSection } from "@/components/analytics/AnalyticsSection";
import type { CategoryMeta, Expense } from "@/types";

export interface BiggestExpensesProps {
  expenses: readonly Expense[];
  categories: Record<string, Pick<CategoryMeta, "label" | "color" | "bgColor">>;
  formatCurrency: (n: number) => string;
}

/** The selected month's five largest expenses, ranked. */
export function BiggestExpenses({ expenses, categories, formatCurrency }: BiggestExpensesProps) {
  return (
    <AnalyticsSection
      title="Biggest This Month"
      icon={Award}
      info={<p className="text-xs leading-relaxed">Your five largest individual expenses this month, ranked by amount. Edit them from the Expenses page.</p>}
    >
      {expenses.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>No expenses yet this month.</p>
      ) : (
        <ol className="space-y-2.5">
          {expenses.map((e, i) => {
            const cat = categories[e.category];
            return (
              <li key={e.id} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-bold"
                  style={{ background: cat?.bgColor || "var(--surface-secondary)", color: cat?.color || "var(--text-muted)" }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {e.remark || cat?.label || e.category}
                  </p>
                  <p className="text-caption" style={{ color: "var(--text-tertiary)" }}>
                    {cat?.label || e.category} · Day {e.day}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(e.amount)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </AnalyticsSection>
  );
}
