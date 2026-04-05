"use client";

import { useMemo, useState } from "react";
import { Calendar, Pause, Play, ChevronDown } from "lucide-react";
import { IconRecurring } from "@/components/ui/icons";
import { CycleGraphic } from "@/components/ui/illustrations";
import { AnimatePresence, m } from "framer-motion";
import { useCurrency } from "@/hooks/useCurrency";
import { buildCategoryMap } from "@/lib/categories";
import { useSettings } from "@/hooks/useSettings";
import { duration, ease } from "@/lib/motion/tokens";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

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

  const [expanded, setExpanded] = useState(false);

  if (recurring.length === 0) return null;

  return (
    <div className="card relative overflow-hidden p-5">
      {/* Abstract cycle graphic */}
      <div className="pointer-events-none absolute -right-1 -top-1 sm:right-2 sm:top-1">
        <CycleGraphic />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <IconRecurring size={14} className="text-data-text" />
        <h3 className="text-section-title">
          Recurring Summary
        </h3>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Monthly</p>
          <p className="text-sm font-bold text-amount" style={{ color: 'var(--text-primary)' }}>
            <AnimatedNumber value={stats.totalMonthly} format={formatCurrency} />
          </p>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>% of Budget</p>
          <p className="text-sm font-bold text-amount" style={{ color: 'var(--text-primary)' }}>
            {stats.pctOfBudget}%
          </p>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Active / Paused</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.active.length} / {stats.paused.length}
          </p>
        </div>
      </div>

      {/* Upcoming */}
      {stats.upcoming.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>
            Upcoming This Month
          </p>
          <div className="space-y-1">
            {stats.upcoming.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-secondary)]"
                style={{ cursor: 'default' }}
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
      <div className="mt-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 cursor-pointer text-xs font-medium text-data-text hover:text-data-hover transition-colors"
        >
          <m.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: duration.fast, ease: ease.out }}
            className="inline-flex"
          >
            <ChevronDown size={12} />
          </m.span>
          View all ({recurring.length})
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: duration.normal, ease: ease.out }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-1">
                {recurring.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {r.active ? (
                        <Play size={10} className="text-ok" />
                      ) : (
                        <Pause size={10} style={{ color: 'var(--text-muted)' }} />
                      )}
                      <span className="w-5 shrink-0 text-center font-medium" style={{ color: 'var(--text-muted)' }}>{r.day}</span>
                      <span
                        className={r.active ? "" : "line-through"}
                        style={{ color: r.active ? 'var(--text-secondary)' : 'var(--text-muted)' }}
                      >
                        {r.remark || catMap[r.category]?.label || r.category}
                      </span>
                    </div>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(r.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
