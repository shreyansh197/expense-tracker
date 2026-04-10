"use client";

import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Banknote } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

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
  const cards = [
    {
      label: "Total Expected",
      value: formatCurrency(totalExpected),
      icon: Banknote,
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-800",
    },
    {
      label: "Total Received",
      value: formatCurrency(totalReceived),
      icon: TrendingUp,
      color: "text-[var(--biz-accent-text)]",
      bg: "bg-[var(--biz-accent-soft)]",
    },
    {
      label: "Collection %",
      value: `${collectionPercent.toFixed(0)}%`,
      icon: CheckCircle2,
      color: collectionPercent >= 80
        ? "text-[var(--biz-accent-text)]"
        : collectionPercent >= 50
        ? "text-blue-600 dark:text-blue-400"
        : "text-[var(--warning-text)]",
      bg: collectionPercent >= 80
        ? "bg-[var(--biz-accent-soft)]"
        : collectionPercent >= 50
        ? "bg-blue-50 dark:bg-blue-900/20"
        : "bg-[var(--warning-soft)]",
    },
    {
      label: "Active",
      value: activeCount.toString(),
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    ...(overdueCount > 0
      ? [{
          label: "Overdue",
          value: overdueCount.toString(),
          icon: AlertTriangle,
          color: "text-[var(--danger-text)]",
          bg: "bg-[var(--danger-soft)]",
        }]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="card-sm p-3.5"
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
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
