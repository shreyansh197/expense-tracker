"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "lucide-react";

interface TagBreakdownProps {
  data: { tag: string; expected: number; received: number; count: number }[];
}

export function TagBreakdown({ data }: TagBreakdownProps) {
  const { formatCurrency } = useCurrency();
  if (data.length === 0) return (
    <div className="card p-5">
      <h3 className="text-card-title mb-3">By Tag</h3>
      <EmptyState
        icon={Tag}
        title="No tags yet"
        description="Tag your business ledgers to see breakdowns here."
      />
    </div>
  );

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
                  <span className="rounded-full px-2 py-0.5 text-caption font-medium" style={{ background: 'var(--biz-accent-soft)', color: 'var(--biz-accent-text)' }}>
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
                  className="h-2 rounded-full transition-all duration-500" style={{ background: 'var(--biz-accent)', width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
