"use client";

import { useMemo, useCallback } from "react";
import { Plus, X, TrendingUp } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import { useExpenses } from "@/hooks/useExpenses";
import { buildCategoryMap } from "@/lib/categories";
import { detectRecurringPatterns, type RecurringSuggestion } from "@/lib/recurringDetection";
import { useToast } from "@/components/ui/Toast";
import type { RecurringExpense } from "@/types";

export function RecurringSuggestions() {
  const { settings, updateSettings } = useSettings();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Gather expenses from the last 6 months for pattern analysis
  const months: Array<{ month: number; year: number }> = useMemo(() => {
    const result: Array<{ month: number; year: number }> = [];
    let m = currentMonth;
    let y = currentYear;
    for (let i = 0; i < 6; i++) {
      result.push({ month: m, year: y });
      m--;
      if (m <= 0) { m = 12; y--; }
    }
    return result;
  }, [currentMonth, currentYear]);

  // Load expenses for each month
  const { expenses: m0 } = useExpenses(months[0].month, months[0].year);
  const { expenses: m1 } = useExpenses(months[1].month, months[1].year);
  const { expenses: m2 } = useExpenses(months[2].month, months[2].year);
  const { expenses: m3 } = useExpenses(months[3].month, months[3].year);
  const { expenses: m4 } = useExpenses(months[4].month, months[4].year);
  const { expenses: m5 } = useExpenses(months[5].month, months[5].year);

  const allExpenses = useMemo(
    () => [...m0, ...m1, ...m2, ...m3, ...m4, ...m5],
    [m0, m1, m2, m3, m4, m5],
  );

  const existingRecurringIds = useMemo(
    () => new Set((settings.recurringExpenses || []).map((r) => r.id)),
    [settings.recurringExpenses],
  );

  const suggestions = useMemo(
    () => detectRecurringPatterns(
      allExpenses,
      settings.dismissedRecurringSuggestions ?? [],
      existingRecurringIds,
    ),
    [allExpenses, settings.dismissedRecurringSuggestions, existingRecurringIds],
  );

  const handleAccept = useCallback(
    (suggestion: RecurringSuggestion) => {
      const newRecurring: RecurringExpense = {
        id: crypto.randomUUID(),
        category: suggestion.category,
        amount: suggestion.averageAmount,
        day: suggestion.averageDay,
        remark: suggestion.remark,
        frequency: "monthly",
        active: true,
        createdAt: Date.now(),
      };
      updateSettings({
        recurringExpenses: [...(settings.recurringExpenses || []), newRecurring],
      });
      toast(`Added "${suggestion.remark || catMap[suggestion.category]?.label || suggestion.category}" as recurring`, "success");
    },
    [settings.recurringExpenses, updateSettings, toast, catMap],
  );

  const handleDismiss = useCallback(
    (key: string) => {
      updateSettings({
        dismissedRecurringSuggestions: [
          ...(settings.dismissedRecurringSuggestions ?? []),
          key,
        ],
      });
    },
    [settings.dismissedRecurringSuggestions, updateSettings],
  );

  if (suggestions.length === 0) {
    return (
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-data-text" />
          <h3 className="text-section-title">Recurring Patterns</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Decorative wave arc */}
          <svg width="40" height="32" viewBox="0 0 40 32" fill="none" aria-hidden="true" className="shrink-0">
            <path d="M4 24 Q 12 8, 20 16 Q 28 24, 36 8" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.15" />
            <circle cx="36" cy="8" r="3" fill="var(--secondary)" opacity="0.12" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            We&apos;ll spot your recurring expenses over time — keep logging to unlock insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={14} className="text-data-text" />
        <h3 className="text-section-title">Recurring Patterns Detected</h3>
      </div>

      <div className="space-y-2">
        {suggestions.slice(0, 3).map((s) => {
          const meta = catMap[s.category];
          const label = s.remark || meta?.label || s.category;
          const pct = Math.round(s.confidence * 100);

          return (
            <div
              key={s.key}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              {/* Category dot */}
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: meta?.color || "var(--category-fallback)" }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  ~{formatCurrency(s.averageAmount)} · Day {s.averageDay} · {s.matchCount} months · {pct}% confident
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAccept(s)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Add as recurring"
                  title="Add as recurring"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => handleDismiss(s.key)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Dismiss suggestion"
                  title="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {suggestions.length > 3 && (
        <p className="mt-2 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          +{suggestions.length - 3} more pattern{suggestions.length - 3 !== 1 ? "s" : ""} detected
        </p>
      )}
    </div>
  );
}
