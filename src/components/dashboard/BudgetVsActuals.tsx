"use client";

interface BudgetBarProps {
  label: string;
  actual: number;
  budget: number;
  color: string;
  formatCurrency: (n: number) => string;
}

function BudgetBar({ label, actual, budget, color, formatCurrency }: BudgetBarProps) {
  const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const over = actual > budget && budget > 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium truncate max-w-[60%]" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: over ? "var(--danger)" : "var(--text-muted)" }}>
          {formatCurrency(Math.round(actual))}
          {budget > 0 && (
            <span style={{ color: "var(--text-muted)" }}> / {formatCurrency(Math.round(budget))}</span>
          )}
        </span>
      </div>
      {budget > 0 && (
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: over ? "var(--danger)" : color || "var(--accent)",
              opacity: 0.8,
            }}
          />
        </div>
      )}
    </div>
  );
}

export interface CategoryActual {
  id: string;
  label: string;
  color: string;
  actual: number;
  budget: number;
}

interface BudgetVsActualsProps {
  data: CategoryActual[];
  formatCurrency: (n: number) => string;
}

/**
 * Horizontal bar chart showing budget vs actual spend per category.
 * Only shows categories with either a budget set or spend > 0.
 * Categories without a budget show spend amount but no bar.
 */
export function BudgetVsActuals({ data, formatCurrency }: BudgetVsActualsProps) {
  const visible = data
    .filter((d) => d.actual > 0 || d.budget > 0)
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 8);

  if (visible.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
        No category data yet for this month.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((item) => (
        <BudgetBar
          key={item.id}
          label={item.label}
          actual={item.actual}
          budget={item.budget}
          color={item.color}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  );
}
