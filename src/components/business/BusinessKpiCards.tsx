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
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-800",
    },
    {
      label: "Total Received",
      value: formatCurrency(totalReceived),
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Collection %",
      value: `${collectionPercent.toFixed(0)}%`,
      icon: CheckCircle2,
      color: collectionPercent >= 80
        ? "text-emerald-600 dark:text-emerald-400"
        : collectionPercent >= 50
        ? "text-blue-600 dark:text-blue-400"
        : "text-amber-600 dark:text-amber-400",
      bg: collectionPercent >= 80
        ? "bg-emerald-50 dark:bg-emerald-900/20"
        : collectionPercent >= 50
        ? "bg-blue-50 dark:bg-blue-900/20"
        : "bg-amber-50 dark:bg-amber-900/20",
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
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
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
            className="rounded-2xl border border-slate-100 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-2">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", card.bg)}>
                <Icon size={14} className={card.color} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {card.label}
              </span>
            </div>
            <p className={cn("mt-2 text-lg font-bold", card.color)}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
