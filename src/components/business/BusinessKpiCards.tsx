"use client";

import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Banknote } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface BusinessKpiCardsProps {
  totalExpected: number;
  totalReceived: number;
  collectionPercent: number;
  activeCount: number;
  overdueCount: number;
  completedCount: number;
}

export function BusinessKpiCards({
  totalExpected,
  totalReceived,
  collectionPercent,
  activeCount,
  overdueCount,
}: BusinessKpiCardsProps) {
  const { formatCurrency } = useCurrency();

  type KpiCard = {
    label: string;
    rawValue?: number;
    format?: (n: number) => string;
    value?: string;
    icon: typeof Banknote;
    color: string;
    bg: string;
    hint?: string;
  };

  const cards: KpiCard[] = [
    {
      label: "Total Expected",
      rawValue: totalExpected,
      format: formatCurrency,
      icon: Banknote,
      color: "text-[var(--text-secondary)]",
      bg: "bg-[var(--surface-secondary)]",
    },
    {
      label: "Total Received",
      rawValue: totalReceived,
      format: formatCurrency,
      icon: TrendingUp,
      color: "text-[var(--biz-accent-text)]",
      bg: "bg-[var(--biz-accent-soft)]",
    },
    {
      label: "Collection %",
      value: `${collectionPercent.toFixed(0)}%`,
      icon: CheckCircle2,
      hint: collectionPercent >= 80 ? "On track" : collectionPercent >= 50 ? "In progress" : "Needs attention",
      color: collectionPercent >= 80
        ? "text-[var(--biz-accent-text)]"
        : collectionPercent >= 50
        ? "text-[var(--biz-pending-text)]"
        : "text-[var(--warning-text)]",
      bg: collectionPercent >= 80
        ? "bg-[var(--biz-accent-soft)]"
        : collectionPercent >= 50
        ? "bg-[var(--biz-pending-bg)]"
        : "bg-[var(--warning-soft)]",
    },
    {
      label: "Active",
      rawValue: activeCount,
      format: (n) => Math.round(n).toString(),
      icon: Clock,
      color: "text-[var(--biz-pending-text)]",
      bg: "bg-[var(--biz-pending-bg)]",
    },
    ...(overdueCount > 0
      ? [{
          label: "Overdue",
          rawValue: overdueCount,
          format: (n: number) => Math.round(n).toString(),
          icon: AlertTriangle,
          hint: "Action required",
          color: "text-[var(--danger-text)]",
          bg: "bg-[var(--danger-soft)]",
        } satisfies KpiCard]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border p-3.5"
            style={{ background: "var(--surface)", borderColor: "var(--border-card)" }}
          >
            <div className="flex items-center gap-2">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", card.bg)}>
                <Icon size={14} className={card.color} />
              </div>
              <span className="text-meta font-medium">
                {card.label}
              </span>
            </div>
            <p className={cn("mt-2 text-amount text-lg font-bold", card.color)}>
              {card.rawValue !== undefined && card.format ? (
                <AnimatedNumber value={card.rawValue} format={card.format} duration={450} />
              ) : (
                card.value
              )}
            </p>
            {card.hint && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{card.hint}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface BusinessKpiCardsProps {
  totalExpected: number;
  totalReceived: number;
  collectionPercent: number;
  activeCount: number;
  overdueCount: number;
  completedCount: number;
}
