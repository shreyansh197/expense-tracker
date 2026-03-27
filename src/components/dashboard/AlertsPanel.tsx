"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Zap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { buildCategoryMap } from "@/lib/categories";
import { useSettings } from "@/hooks/useSettings";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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

const MAX_VISIBLE = 2;

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
  const { formatCurrency } = useCurrency();
  const catMap = buildCategoryMap(settings.customCategories);
  const [expanded, setExpanded] = useState(false);

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

  const visibleAlerts = expanded ? alerts : alerts.slice(0, MAX_VISIBLE);
  const hiddenCount = alerts.length - MAX_VISIBLE;

  return (
    <div className="space-y-2" role="alert" aria-live="polite" aria-label="Budget alerts">
      {alerts.some((a) => a.id.startsWith("anomaly-")) && (
        <div className="flex items-center gap-1.5 mb-1">
          <InfoTooltip title="Anomaly Detection (MAD)">
            <p>Flags unusually large expenses compared to your typical spending in each category.</p>
            <p className="mt-1"><strong>How it works:</strong> For each category, we calculate the median amount and the Median Absolute Deviation (MAD). Expenses that are more than 3× MAD above the median are flagged.</p>
            <p className="mt-1">This helps you spot one-off big purchases or accidental double charges that stand out from your normal pattern.</p>
            <p className="mt-1 text-[10px] opacity-60">Requires at least 3 transactions per category to detect anomalies.</p>
          </InfoTooltip>
          <span className="text-[10px] text-gray-400">Anomaly detection active</span>
        </div>
      )}
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border-l-[3px] px-4 py-3 text-sm",
            alert.severity === "critical"
              ? "border-l-red-500 bg-red-50/70 text-red-800 dark:bg-red-950/20 dark:text-red-300"
              : alert.severity === "warning"
                ? "border-l-amber-500 bg-amber-50/70 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"
                : "border-l-indigo-500 bg-indigo-50/70 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-300"
          )}
          style={{ borderTop: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          {alert.severity === "critical" ? (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          ) : alert.severity === "info" ? (
            <Zap size={16} className="mt-0.5 shrink-0" />
          ) : (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
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
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Show {hiddenCount} more
          <ChevronDown size={12} />
        </button>
      )}
    </div>
  );
}
