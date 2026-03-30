"use client";

import Link from "next/link";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { LedgerProgressRing } from "./LedgerProgressRing";
import type { Ledger } from "@/types";

interface LedgerCardProps {
  ledger: Ledger;
  totalReceived: number;
}

export function LedgerCard({ ledger, totalReceived }: LedgerCardProps) {
  const { formatCurrency } = useCurrency();
  const percent = ledger.expectedAmount > 0 ? (totalReceived / ledger.expectedAmount) * 100 : 0;
  const isOverdue =
    ledger.status === "active" &&
    ledger.dueDate &&
    new Date(ledger.dueDate) < new Date() &&
    totalReceived < ledger.expectedAmount;
  const overdueDays = isOverdue && ledger.dueDate
    ? Math.max(1, Math.floor((new Date().getTime() - new Date(ledger.dueDate).getTime()) / 86400000))
    : 0;

  const statusConfig = {
    active: { icon: Clock, label: "Payment Pending", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
    completed: { icon: CheckCircle2, label: "Paid", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
    cancelled: { icon: XCircle, label: "Cancelled", color: "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400" },
  };

  const status = statusConfig[ledger.status];
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/business/${ledger.id}`}
      className="card block p-4 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <LedgerProgressRing received={totalReceived} expected={ledger.expectedAmount} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {ledger.name}
            </h3>
            {isOverdue && (
              <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <AlertTriangle size={10} />
                {overdueDays}d overdue
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", status.color)}>
              <StatusIcon size={10} />
              {status.label}
            </span>
            {ledger.dueDate && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Due {new Date(ledger.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(totalReceived)}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {ledger.expectedAmount > 0 ? `of ${formatCurrency(ledger.expectedAmount)}` : 'No target set'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 w-full rounded-full" style={{ background: 'var(--surface-secondary)' }}>
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              percent >= 100
                ? "bg-emerald-500"
                : isOverdue
                ? "bg-red-500"
                : "bg-blue-500"
            )}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      {/* Tags */}
      {ledger.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ledger.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full px-1.5 py-0.5 text-[10px]"
              style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
            >
              {tag}
            </span>
          ))}
          {ledger.tags.length > 3 && (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{ledger.tags.length - 3}</span>
          )}
        </div>
      )}
    </Link>
  );
}
