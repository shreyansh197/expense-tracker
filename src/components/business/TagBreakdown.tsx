"use client";

import { useCurrency } from "@/hooks/useCurrency";

interface TagBreakdownProps {
  data: { tag: string; expected: number; received: number; count: number }[];
}

export function TagBreakdown({ data }: TagBreakdownProps) {
  const { formatCurrency } = useCurrency();
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        By Tag
      </h3>
      <div className="space-y-2">
        {data.map((item) => {
          const percent = item.expected > 0 ? (item.received / item.expected) * 100 : 0;
          return (
            <div key={item.tag} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {item.tag}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.count} ledger{item.count !== 1 ? "s" : ""}</span>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {formatCurrency(item.received)} / {formatCurrency(item.expected)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
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
