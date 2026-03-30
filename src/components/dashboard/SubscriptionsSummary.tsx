"use client";

import { useMemo } from "react";
import { Repeat, Calendar, Pause, Play } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { buildCategoryMap } from "@/lib/categories";
import { useSettings } from "@/hooks/useSettings";

export function SubscriptionsSummary() {
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);
  const recurring = useMemo(() => settings.recurringExpenses || [], [settings.recurringExpenses]);

  const stats = useMemo(() => {
    const active = recurring.filter((r) => r.active);
    const paused = recurring.filter((r) => !r.active);
    const totalMonthly = active.reduce((s, r) => s + r.amount, 0);
    const pctOfBudget = settings.salary > 0 ? Math.round((totalMonthly / settings.salary) * 100) : 0;

    const today = new Date().getDate();
    const upcoming = active
      .filter((r) => r.day > today)
      .sort((a, b) => a.day - b.day);

    return { active, paused, totalMonthly, pctOfBudget, upcoming };
  }, [recurring, settings.salary]);

  if (recurring.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Repeat size={14} className="text-[#4C5CFF] dark:text-[#7B87FF]" />
        <h3 className="text-section-title">
          Recurring Summary
        </h3>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Monthly</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(stats.totalMonthly)}
          </p>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>% of Budget</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {stats.pctOfBudget}%
          </p>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Active / Paused</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.active.length} / {stats.paused.length}
          </p>
        </div>
      </div>

      {/* Upcoming */}
      {stats.upcoming.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase" style={{ color: 'var(--text-muted)' }}>
            Upcoming This Month
          </p>
          <div className="space-y-1">
            {stats.upcoming.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors"
                style={{ cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Day {r.day}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {catMap[r.category]?.label || r.category}
                  </span>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(r.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All recurring items */}
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] font-medium text-[#4C5CFF] hover:text-[#3d4de6] dark:text-[#7B87FF]">
          View all ({recurring.length})
        </summary>
        <div className="mt-2 space-y-1">
          {recurring.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                {r.active ? (
                  <Play size={10} className="text-[#4CAF50]" />
                ) : (
                  <Pause size={10} style={{ color: 'var(--text-muted)' }} />
                )}
                <span
                  className={r.active ? "" : "line-through"}
                  style={{ color: r.active ? 'var(--text-secondary)' : 'var(--text-muted)' }}
                >
                  {r.remark || catMap[r.category]?.label || r.category}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Day {r.day}</span>
              </div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(r.amount)}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
