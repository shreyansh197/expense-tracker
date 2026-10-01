"use client";

import { m } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { duration, ease } from "@/lib/motion/tokens";
import { subMoney } from "@/lib/money";
import type { Forecast } from "@/types";

interface PredictiveBurnBarProps {
  actual: number;
  forecast: Forecast;
  budget: number;
  formatCurrency: (n: number) => string;
  /** Day of month for burn rate label */
  dayOfMonth: number;
  daysInMonth: number;
}

const CONFIDENCE_STYLE: Record<Forecast["confidence"], { bg: string; fg: string }> = {
  high: { bg: "var(--success-soft, var(--surface-secondary))", fg: "var(--success-text)" },
  medium: { bg: "var(--warning-soft, var(--surface-secondary))", fg: "var(--warning-text)" },
  low: { bg: "var(--surface-secondary)", fg: "var(--text-muted)" },
};

/**
 * Actual spend so far plus the projected (estimate) extension to month end,
 * on one scale with the budget marker. The projection is labelled as an
 * estimate with its confidence (FINANCIAL_PSYCHOLOGY §14).
 */
export function PredictiveBurnBar({ actual, forecast, budget, formatCurrency, dayOfMonth, daysInMonth }: PredictiveBurnBarProps) {
  const projected = forecast.projectedTotal;
  const maxValue = Math.max(actual, projected, budget > 0 ? budget : 0, 1);
  const actualPct = Math.min((actual / maxValue) * 100, 100);
  const projectedPct = Math.min((projected / maxValue) * 100, 100);
  const budgetPct = budget > 0 ? Math.min((budget / maxValue) * 100, 100) : 0;
  const isOverBudget = budget > 0 && projected > budget;
  const projectedColor = isOverBudget ? "var(--danger)" : "var(--accent)";
  const confidence = CONFIDENCE_STYLE[forecast.confidence];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} aria-hidden="true" style={{ color: "var(--accent)" }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Projected spend
          </h3>
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: confidence.bg, color: confidence.fg }}>
          {forecast.confidence} confidence estimate
        </span>
      </div>

      <div
        className="relative h-8 w-full overflow-hidden rounded-xl"
        style={{ background: "var(--surface-secondary)" }}
        role="img"
        aria-label={`Spent ${formatCurrency(actual)} by day ${dayOfMonth} of ${daysInMonth}; projected ${formatCurrency(projected)} by month end${
          budget > 0 ? ` against a ${formatCurrency(budget)} budget` : ""
        }.`}
      >
        <m.div
          className="absolute inset-y-0 left-0 rounded-xl"
          style={{ background: "var(--accent)" }}
          initial={{ width: 0 }}
          animate={{ width: `${actualPct}%` }}
          transition={{ duration: duration.slow, ease: ease.out }}
        />
        {projectedPct > actualPct && (
          <div
            className="absolute inset-y-0 rounded-r-xl border border-dashed"
            style={{
              left: `${actualPct}%`,
              width: `${projectedPct - actualPct}%`,
              borderColor: `color-mix(in srgb, ${projectedColor} 45%, transparent)`,
              background: `repeating-linear-gradient(45deg, color-mix(in srgb, ${projectedColor} 14%, transparent) 0 4px, color-mix(in srgb, ${projectedColor} 4%, transparent) 4px 8px)`,
            }}
          />
        )}
        {budgetPct > 0 && (
          <div className="absolute inset-y-0 w-0.5" style={{ left: `${budgetPct}%`, background: "var(--danger)", opacity: 0.6 }} />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <p>
          <span className="font-numeric font-semibold" style={{ color: "var(--text-primary)" }}>{formatCurrency(actual)}</span>
          <span style={{ color: "var(--text-muted)" }}> spent (day {dayOfMonth}/{daysInMonth})</span>
        </p>
        <p className="text-right">
          <span className="font-numeric font-semibold" style={{ color: isOverBudget ? "var(--danger-text)" : "var(--text-primary)" }}>
            ~{formatCurrency(projected)}
          </span>
          <span style={{ color: "var(--text-muted)" }}> projected</span>
        </p>
      </div>

      {isOverBudget && (
        <p className="mt-1.5 rounded-lg px-2.5 py-1.5 text-xs" style={{ background: "var(--danger-soft)", color: "var(--danger-text)" }}>
          On track to exceed budget by {formatCurrency(subMoney(projected, budget))}
        </p>
      )}
    </div>
  );
}
