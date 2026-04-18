"use client";

import { useMemo } from "react";
import { Calendar, Repeat } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { getAllCategories, buildCategoryMap } from "@/lib/categories";
import type { RecurringExpense } from "@/types";

interface UpcomingItem {
  recurring: RecurringExpense;
  daysUntil: number;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
}

/**
 * Upcoming Stream — shows the next 7 days of recurring expenses
 * that haven't been logged yet this month. Gives users forward
 * visibility into predictable outflows.
 */
export function UpcomingStream() {
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();

  const categoryMap = useMemo(
    () => buildCategoryMap(getAllCategories(settings.customCategories, settings.hiddenDefaults)),
    [settings.customCategories, settings.hiddenDefaults],
  );

  const upcoming = useMemo(() => {
    const recurringExpenses = settings.recurringExpenses ?? [];
    const active = recurringExpenses.filter((r: RecurringExpense) => r.active);
    if (active.length === 0) return [];

    const today = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const items: UpcomingItem[] = [];
    for (const r of active) {
      // Only show upcoming (today or later, within 7 days)
      const day = r.day > daysInMonth ? daysInMonth : r.day;
      const daysUntil = day - today;
      if (daysUntil < 0 || daysUntil > 7) continue;

      const meta = categoryMap[r.category];
      items.push({
        recurring: r,
        daysUntil,
        categoryLabel: meta?.label ?? r.category,
        categoryIcon: meta?.icon ?? "📦",
        categoryColor: meta?.color ?? "var(--text-muted)",
      });
    }

    // Sort by soonest first
    items.sort((a, b) => a.daysUntil - b.daysUntil);
    return items;
  }, [settings.recurringExpenses, categoryMap]);

  if (upcoming.length === 0) return null;

  const totalUpcoming = upcoming.reduce((sum, item) => sum + item.recurring.amount, 0);

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={15} style={{ color: "var(--es-sage)", opacity: 0.8 }} />
          <h3 className="text-card-title">Upcoming</h3>
        </div>
        <span className="text-caption font-numeric">{formatCurrency(totalUpcoming)} this week</span>
      </div>

      <div className="space-y-2">
        {upcoming.map((item) => (
          <div
            key={item.recurring.id}
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ background: "var(--surface-secondary)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-base shrink-0">{item.categoryIcon}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {item.recurring.remark || item.categoryLabel}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.daysUntil === 0 ? "Today" : item.daysUntil === 1 ? "Tomorrow" : `In ${item.daysUntil} days`}
                  <Repeat size={10} className="ml-1.5 inline-block" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold font-numeric shrink-0 ml-3" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(item.recurring.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
