"use client";

import { m } from "framer-motion";
import { TrendingUp } from "lucide-react";
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

export function PredictiveBurnBar({
  actual,
  forecast,
  budget,
  formatCurrency,
  dayOfMonth,
  daysInMonth,
}: PredictiveBurnBarProps) {
  const projected = forecast.projectedTotal;
  const maxValue = Math.max(actual, projected, budget > 0 ? budget : 0, 1);

  const actualPct = Math.min((actual / maxValue) * 100, 100);
  const projectedPct = Math.min((projected / maxValue) * 100, 100);
  const budgetPct = budget > 0 ? Math.min((budget / maxValue) * 100, 100) : 0;

  const isOverBudget = budget > 0 && projected > budget;
  const projectedColor = isOverBudget ? "var(--danger)" : "var(--accent)";
  const confidence = forecast.confidence;

  return (
    <div
      role="img"
      aria-label={`Predictive spend: actual ${formatCurrency(actual)}, projected ${formatCurrency(projected)} by end of month`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: "var(--accent)" }} />
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Projected Spend
          </h4>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            background: confidence === "high" ? "rgba(16,185,129,0.12)" : confidence === "medium" ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.12)",
            color: confidence === "high" ? "var(--success)" : confidence === "medium" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {confidence} confidence
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-8 w-full overflow-hidden rounded-xl" style={{ background: "var(--surface-secondary)" }}>
        {/* Actual spend — solid fill */}
        <m.div
          className="absolute inset-y-0 left-0 rounded-xl"
          style={{ background: "var(--accent)" }}
          initial={{ width: 0 }}
          animate={{ width: `${actualPct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Projected extension — ghost/hatched */}
        {projectedPct > actualPct && (
          <m.div
            className="absolute inset-y-0 rounded-r-xl"
            style={{
              left: `${actualPct}%`,
              width: `${projectedPct - actualPct}%`,
              background: `repeating-linear-gradient(
                45deg,
                ${projectedColor}18,
                ${projectedColor}18 4px,
                ${projectedColor}06 4px,
                ${projectedColor}06 8px
              )`,
              border: `1px dashed ${projectedColor}50`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          />
        )}

        {/* Budget line */}
        {budgetPct > 0 && (
          <div
            className="absolute inset-y-0 w-0.5"
            style={{ left: `${budgetPct}%`, background: "var(--danger)", opacity: 0.6 }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Labels */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <div>
          <span className="font-numeric font-semibold" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(actual)}
          </span>
          <span style={{ color: "var(--text-muted)" }}> spent (day {dayOfMonth}/{daysInMonth})</span>
        </div>
        <div className="text-right">
          <span className="font-numeric font-semibold" style={{ color: projectedColor }}>
            ~{formatCurrency(projected)}
          </span>
          <span style={{ color: "var(--text-muted)" }}> projected</span>
        </div>
      </div>

      {isOverBudget && budget > 0 && (
        <p className="mt-1.5 text-xs rounded-lg px-2.5 py-1.5" style={{ background: "var(--danger-soft)", color: "var(--danger-text)" }}>
          On track to exceed budget by {formatCurrency(projected - budget)}
        </p>
      )}
    </div>
  );
}
