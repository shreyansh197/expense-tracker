"use client";

import { useCurrency } from "@/hooks/useCurrency";

interface TagBreakdownProps {
  data: { tag: string; expected: number; received: number; count: number }[];
}

export function TagBreakdown({ data }: TagBreakdownProps) {
  const { formatCurrency } = useCurrency();
  if (data.length === 0) return null;

  return (
    <div className="card p-5">
      <h3 className="text-card-title mb-3">
        By Tag
      </h3>
      <div className="space-y-2">
        {data.map((item) => {
          const percent = item.expected > 0 ? (item.received / item.expected) * 100 : 0;
          return (
            <div key={item.tag} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-caption font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {item.tag}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.count} ledger{item.count !== 1 ? "s" : ""}</span>
                </div>
                <span className="text-xs font-medium text-amount" style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrency(item.received)} / {formatCurrency(item.expected)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
