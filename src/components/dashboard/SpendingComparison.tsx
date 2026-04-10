"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface SpendingComparisonProps {
  currentTotal: number;
  previousTotal: number;
  className?: string;
}

/**
 * Compact "vs last month" comparison badge.
 * Shows percentage change with directional arrow and color coding.
 */
export function SpendingComparison({ currentTotal, previousTotal, className }: SpendingComparisonProps) {
  const { formatCurrency } = useCurrency();

  if (previousTotal === 0 && currentTotal === 0) return null;

  const diff = currentTotal - previousTotal;
  const pctChange = previousTotal > 0 ? ((diff / previousTotal) * 100) : 0;
  const absPct = Math.abs(Math.round(pctChange));

  // For spending: down is good, up is concerning
  const isDown = diff < 0;
  const isFlat = absPct < 2;

  const color = isFlat
    ? "var(--text-muted)"
    : isDown
      ? "var(--success-text)"
      : pctChange > 20
        ? "var(--danger-text)"
        : "var(--warning-text)";

  const bgColor = isFlat
    ? "var(--surface-secondary)"
    : isDown
      ? "var(--success-soft)"
      : pctChange > 20
        ? "var(--danger-soft)"
        : "var(--warning-soft)";

  const Icon = isFlat ? Minus : isDown ? TrendingDown : TrendingUp;

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className ?? ""}`}
      style={{ background: bgColor, color }}
      title={`${isDown ? "" : "+"}${formatCurrency(diff)} vs last month (${formatCurrency(previousTotal)})`}
    >
      <Icon size={12} />
      <span>{isFlat ? "Flat" : `${absPct}%`}</span>
      <span className="hidden sm:inline text-[10px] opacity-75">vs prev</span>
    </div>
  );
}
