"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronDown,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCurrency } from "@/hooks/useCurrency";
import { BUDGET_WARNING_THRESHOLD } from "@/lib/constants";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { Forecast } from "@/types";

interface KpiCardsProps {
  monthlyTotal: number;
  remaining: number;
  salary: number;
  avgDaily: number;
  budgetUsedPercent: number;
  daysRemaining: number;
  paceToStayUnder: number;
  expenseCount: number;
  forecast: Forecast;
  rolloverAmount?: number;
}

function getStatusCopy(
  isOverspent: boolean,
  isWarning: boolean,
  daysRemaining: number,
  paceToStayUnder: number,
  forecastOverBudget: boolean,
  formatCurrency: (n: number) => string,
): string {
  if (isOverspent) return "You\u2019ve gone over budget this month";
  if (daysRemaining === 0) return "This month has ended";
  if (forecastOverBudget) return "At this pace, you may overspend before month end";
  if (isWarning) return `Spend \u2264 ${formatCurrency(paceToStayUnder)}/day to stay on track`;
  if (daysRemaining <= 3) return `Only ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left this month`;
  return `You\u2019re on track \u2014 ${daysRemaining} days to go`;
}

export function KpiCards({
  monthlyTotal,
  remaining,
  salary,
  avgDaily,
  budgetUsedPercent,
  daysRemaining,
  paceToStayUnder,
  expenseCount,
  forecast,
  rolloverAmount = 0,
}: KpiCardsProps) {
  const { formatCurrency } = useCurrency();
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("expenstream-kpi-expanded") === "true";
  });

  const toggleExpanded = () => {
    setExpanded((prev) => {
      localStorage.setItem("expenstream-kpi-expanded", String(!prev));
      return !prev;
    });
  };

  const isOverspent = remaining < 0;
  const isWarning = !isOverspent && budgetUsedPercent >= BUDGET_WARNING_THRESHOLD;
  const paceExceeded = avgDaily > paceToStayUnder && paceToStayUnder > 0;
  const savingsRate = salary > 0 ? Math.round((remaining / salary) * 100) : 0;
  const forecastOverBudget = forecast.projectedRemaining < 0;
  const forecastWarning = !forecastOverBudget && salary > 0 && forecast.projectedTotal > salary * 0.8;

  const status: "safe" | "caution" | "danger" =
    isOverspent ? "danger" : (isWarning || forecastOverBudget) ? "caution" : "safe";

  const statusColors = {
    safe: { text: "text-emerald-700 dark:text-emerald-400", bg: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30", bar: "bg-gradient-to-r from-emerald-500 to-teal-400" },
    caution: { text: "text-amber-700 dark:text-amber-400", bg: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30", bar: "bg-gradient-to-r from-amber-500 to-orange-400" },
    danger: { text: "text-red-700 dark:text-red-400", bg: "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30", bar: "bg-gradient-to-r from-red-500 to-rose-400" },
  };
  const sc = statusColors[status];

  return (
    <m.div
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {/* ── Budget-not-set banner ── */}
      {salary <= 0 && (
        <m.div
          className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{ background: 'var(--warning-soft)', borderColor: 'var(--warning)', color: 'var(--text-primary)' }}
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } }}
        >
          <div className="flex items-center gap-2 text-sm">
            <Settings size={14} style={{ color: 'var(--warning)' }} />
            <span>Set a monthly budget to unlock forecasts and alerts</span>
          </div>
          <Link href="/settings#budget" className="shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition-colors" style={{ background: 'var(--warning)', color: '#fff' }}>
            Set Budget
          </Link>
        </m.div>
      )}

      {/* ── PRIMARY: Budget Status Hero ── */}
      <m.div
        className={cn("relative overflow-hidden rounded-2xl border p-4 sm:p-5", sc.bg)}
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }}
      >
        <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-2xl", sc.bar)} />
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2 text-sm font-semibold", sc.text)}>
            {isOverspent ? <AlertTriangle size={15} /> : <PiggyBank size={15} />}
            <span>{isOverspent ? "Over Budget" : "You still have"}</span>
          </div>
          {daysRemaining > 0 && (
            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
              <Clock size={11} />
              {daysRemaining}d left
            </span>
          )}
        </div>
        <p className={cn("tabular-nums mt-1.5 text-4xl sm:text-5xl font-extrabold tracking-tight", sc.text)}>
          <AnimatedNumber value={Math.abs(remaining)} format={formatCurrency} />
        </p>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {getStatusCopy(isOverspent, isWarning, daysRemaining, paceToStayUnder, forecastOverBudget, formatCurrency)}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }} role="progressbar" aria-valuenow={Math.min(budgetUsedPercent, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
          <m.div
            className={cn("h-full rounded-full", isOverspent ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-brand")}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="tabular-nums">{formatCurrency(monthlyTotal)} of {formatCurrency(salary)} spent</span>
          <span>{expenseCount} transaction{expenseCount !== 1 ? "s" : ""}</span>
        </div>
        {rolloverAmount > 0 && (
          <p className="mt-1 text-[10px] font-medium text-brand">
            Includes +{formatCurrency(rolloverAmount)} rollover from last month
          </p>
        )}
      </m.div>

      {/* ── SECONDARY: Supporting Metrics (compact inline) ── */}
      <m.div
        className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3"
        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] } } }}
      >
        <div className="rounded-xl border p-3 sm:p-3.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-meta font-medium">Daily Pace</p>
          <p className={cn(
            "tabular-nums mt-1 text-base sm:text-lg font-bold",
            paceToStayUnder <= 0 ? "text-red-600 dark:text-red-400"
              : paceExceeded ? "text-amber-600 dark:text-amber-400" : ""
          )} style={paceToStayUnder > 0 && !paceExceeded ? { color: 'var(--text-primary)' } : undefined}>
            {formatCurrency(avgDaily)}/d
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {paceToStayUnder > 0 ? `Target \u2264 ${formatCurrency(paceToStayUnder)}/d` : "No budget left"}
          </p>
        </div>

        <div className="rounded-xl border p-3 sm:p-3.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-meta font-medium">Saving</p>
          <p className={cn(
            "tabular-nums mt-1 text-base sm:text-lg font-bold",
            savingsRate < 0 ? "text-red-600 dark:text-red-400"
              : savingsRate < 20 ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          )}>
            {savingsRate}%
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {remaining >= 0 ? `${formatCurrency(remaining)} saved` : `${formatCurrency(Math.abs(remaining))} over`}
          </p>
        </div>

        <div className={cn(
          "rounded-[0.875rem] border p-3 sm:p-3.5",
          forecastOverBudget ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
            : forecastWarning ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30"
            : "card-sm"
        )}>
          <div className="flex items-center gap-1 text-meta font-medium">
            <TrendingUp size={12} />
            <span>Forecast</span>
            {forecast.method === "weighted" && forecast.historicalMonths > 0 && (
              <span className="ml-auto text-[9px] font-normal opacity-60">
                {forecast.historicalMonths}mo avg
              </span>
            )}
          </div>
          <p className={cn(
            "tabular-nums mt-1 text-base sm:text-lg font-bold",
            forecastOverBudget ? "text-red-700 dark:text-red-400"
              : forecastWarning ? "text-amber-700 dark:text-amber-400" : ""
          )} style={!forecastOverBudget && !forecastWarning ? { color: 'var(--text-primary)' } : undefined}>
            {forecast.projectedTotal > 0 ? formatCurrency(forecast.projectedTotal) : "\u2014"}
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {forecast.projectedTotal > 0 && forecast.confidence !== "low"
              ? (forecastOverBudget
                  ? `Over by ${formatCurrency(Math.abs(forecast.projectedRemaining))}`
                  : `${formatCurrency(forecast.projectedRemaining)} under budget`)
              : forecast.confidence === "low" ? "Not enough data yet" : "\u00A0"}
          </p>
        </div>
      </m.div>

      {/* ── Toggle: Extra Details ── */}
      <div>
        <button
          onClick={toggleExpanded}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          aria-expanded={expanded}
        >
          {expanded ? "Hide details" : "More details"}
          <ChevronDown size={14} className={cn("transition-transform duration-300", expanded && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-secondary)' }}>
                  <p className="text-meta font-medium">Budget Used</p>
                  <p className="tabular-nums mt-1 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {budgetUsedPercent}%
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {formatCurrency(monthlyTotal)} of {formatCurrency(salary)}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-secondary)' }}>
                  <div className="flex items-center gap-1">
                    <p className="text-meta font-medium">Projection Detail</p>
                    <InfoTooltip title="End-of-Month Forecast" className="mt-px shrink-0">
                      <p>Projects your total spend by month end using your average daily spending.</p>
                      <p className="mt-1"><strong>Confidence:</strong></p>
                      <ul className="ml-3 list-disc mt-0.5">
                        <li><strong>Low</strong> — less than 7 days of data</li>
                        <li><strong>Medium</strong> — 7–14 days of data</li>
                        <li><strong>High</strong> — 15+ days of data</li>
                      </ul>
                    </InfoTooltip>
                  </div>
                  <p className="tabular-nums mt-1 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {forecast.projectedTotal > 0 ? formatCurrency(forecast.projectedTotal) : "\u2014"}
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {forecast.confidence ? `${forecast.confidence[0].toUpperCase()}${forecast.confidence.slice(1)} confidence` : "\u00A0"}
                  </p>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}
