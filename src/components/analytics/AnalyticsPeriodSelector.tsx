"use client";

import { ANALYTICS_PERIODS, type AnalyticsPeriod } from "@/lib/analyticsCharts";
import { cn } from "@/lib/utils";

export interface AnalyticsPeriodSelectorProps {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
  className?: string;
}

/**
 * 3M / 6M / 12M history selector. A labelled group of toggle buttons with
 * 44 px targets; `flex-1` segments let it fill the row on narrow screens
 * instead of squeezing the month switcher.
 */
export function AnalyticsPeriodSelector({ value, onChange, className }: AnalyticsPeriodSelectorProps) {
  return (
    <div
      role="group"
      aria-label="History period"
      className={cn("flex items-center gap-0.5 rounded-xl p-0.5", className)}
      style={{ background: "var(--surface-secondary)" }}
    >
      {ANALYTICS_PERIODS.map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={active}
            aria-label={`Last ${n} months`}
            className="min-h-[44px] min-w-[44px] flex-1 rounded-lg px-3 text-xs font-semibold transition-colors"
            style={{
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
            }}
          >
            {n}M
          </button>
        );
      })}
    </div>
  );
}
