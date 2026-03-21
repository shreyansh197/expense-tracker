"use client";

import { AlertTriangle, TrendingUp, ArrowRight, Zap, Target } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { buildCategoryMap } from "@/lib/categories";
import { useSettings } from "@/hooks/useSettings";
import type { CategoryTotal, Forecast, AnomalyResult } from "@/types";

interface AlertsPanelProps {
  categoryTotals: CategoryTotal[];
  categoryBudgets: Record<string, number>;
  budgetUsedPercent: number;
  avgDaily: number;
  paceToStayUnder: number;
  forecast?: Forecast;
  anomalies?: AnomalyResult[];
  onCategoryClick?: (slug: string) => void;
}

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  detail?: string;
  action?: () => void;
}

export function AlertsPanel({
  categoryTotals,
  categoryBudgets,
  budgetUsedPercent,
  avgDaily,
  paceToStayUnder,
  forecast,
  anomalies,
  onCategoryClick,
}: AlertsPanelProps) {
  const { settings } = useSettings();
  const catMap = buildCategoryMap(settings.customCategories);

  const alerts: Alert[] = [];

  // Overall budget alert
  if (budgetUsedPercent >= 100) {
    alerts.push({
      id: "budget-over",
      severity: "critical",
      message: "You've exceeded your monthly budget!",
      detail: `${budgetUsedPercent}% spent`,
    });
  } else if (budgetUsedPercent >= 80) {
    alerts.push({
      id: "budget-warning",
      severity: "warning",
      message: `Budget ${budgetUsedPercent}% used — slow down spending`,
      detail: `${100 - budgetUsedPercent}% remaining`,
    });
  }

  // Pace alert
  if (paceToStayUnder > 0 && avgDaily > paceToStayUnder) {
    alerts.push({
      id: "pace",
      severity: "warning",
      message: `Spending ${formatCurrency(avgDaily)}/day — need ${formatCurrency(paceToStayUnder)}/day to stay on track`,
    });
  }

  // Per-category budget alerts
  for (const ct of categoryTotals) {
    const budget = categoryBudgets[ct.category];
    if (!budget || ct.total === 0) continue;
    const pct = Math.round((ct.total / budget) * 100);
    const label = catMap[ct.category]?.label || ct.category;

    if (pct >= 100) {
      alerts.push({
        id: `cat-over-${ct.category}`,
        severity: "critical",
        message: `${label} over budget by ${formatCurrency(ct.total - budget)}`,
        detail: `${formatCurrency(ct.total)} / ${formatCurrency(budget)}`,
        action: () => onCategoryClick?.(ct.category),
      });
    } else if (pct >= 80) {
      alerts.push({
        id: `cat-warn-${ct.category}`,
        severity: "warning",
        message: `${label} at ${pct}% of budget`,
        detail: `${formatCurrency(ct.total)} / ${formatCurrency(budget)}`,
        action: () => onCategoryClick?.(ct.category),
      });
    }
  }

  // ── EOM Forecast alert ──
  if (forecast && forecast.projectedTotal > 0 && forecast.confidence !== "low") {
    if (forecast.projectedRemaining < 0) {
      alerts.push({
        id: "forecast-over",
        severity: "warning",
        message: `On track to overspend by ${formatCurrency(Math.abs(forecast.projectedRemaining))} this month`,
        detail: `Projected: ${formatCurrency(forecast.projectedTotal)} · ${forecast.confidence} confidence`,
      });
    }
  }

  // ── Anomaly alerts (show top 3) ──
  if (anomalies && anomalies.length > 0) {
    for (const a of anomalies.slice(0, 3)) {
      const label = catMap[a.expense.category]?.label || a.expense.category;
      alerts.push({
        id: `anomaly-${a.expense.id}`,
        severity: "info",
        message: `Unusual: ${formatCurrency(a.expense.amount)} in ${label}${a.expense.remark ? ` — "${a.expense.remark}"` : ""}`,
        detail: `${a.zScore}× above typical (median ${formatCurrency(a.categoryMedian)})`,
        action: () => onCategoryClick?.(a.expense.category),
      });
    }
  }

  if (alerts.length === 0) return null;

  // Sort: critical first, then warning, then info
  const severity = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severity[a.severity] - severity[b.severity]);

  return (
    <div className="space-y-2" role="alert" aria-label="Budget alerts">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
            alert.severity === "critical"
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
              : alert.severity === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
          )}
        >
          {alert.severity === "critical" ? (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          ) : alert.severity === "info" ? (
            <Zap size={16} className="mt-0.5 shrink-0" />
          ) : (
            <TrendingUp size={16} className="mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium">{alert.message}</p>
            {alert.detail && (
              <p className="mt-0.5 text-xs opacity-75">{alert.detail}</p>
            )}
          </div>
          {alert.action && (
            <button
              onClick={alert.action}
              className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="View details"
            >
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
