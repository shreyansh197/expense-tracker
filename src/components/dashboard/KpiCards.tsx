"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  AlertTriangle,
  ShieldAlert,
  Clock,
  TrendingUp,
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
import { duration, ease, stagger as motionStagger } from "@/lib/motion/tokens";

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
  if (isOverspent) return "Spending\u2019s ahead of plan this month";
  if (daysRemaining === 0) return "This month has wrapped up";
  if (forecastOverBudget) return "At this pace, you may go a bit over before month end";
  if (isWarning) return `Aim for \u2264 ${formatCurrency(paceToStayUnder)}/day to stay on track`;
  if (daysRemaining <= 3) return `Almost there \u2014 ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`;
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
    safe: { text: "text-[var(--status-ok-text)]", bg: "border-[var(--status-ok-border)] bg-[var(--status-ok-bg)]", bar: "bg-gradient-to-r from-emerald-500 to-teal-400" },
    caution: { text: "text-[var(--status-warn-text)]", bg: "border-[var(--status-warn-border)] bg-[var(--status-warn-bg)]", bar: "bg-gradient-to-r from-amber-500 to-orange-400" },
    danger: { text: "text-[var(--status-err-text)]", bg: "border-[var(--status-err-border)] bg-[var(--status-err-bg)]", bar: "bg-gradient-to-r from-red-500 to-rose-400" },
  };
  const sc = statusColors[status];

  return (
    <m.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: motionStagger.normal } } }}
    >
      {/* ── Budget-not-set banner ── */}
      {salary <= 0 && (
        <m.div
          className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{ background: 'var(--warning-soft)', borderColor: 'var(--warning)', color: 'var(--text-primary)' }}
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: ease.out } } }}
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
        className={cn("card-hero relative overflow-hidden rounded-2xl border-l-[3px] p-5 sm:p-6", sc.bg)}
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: duration.emphasis, ease: ease.out } } }}
      >
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2 text-sm font-semibold", sc.text)}>
            {status !== "safe" ? <ShieldAlert size={15} className={status === "danger" ? "animate-pulse" : ""} /> : isOverspent ? <AlertTriangle size={15} /> : <PiggyBank size={15} />}
            <span>{isOverspent ? "Ahead of plan" : "You still have"}</span>
          </div>
          {daysRemaining > 0 && (
            <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption font-medium" style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
            <Clock size={11} />
              {daysRemaining}d left
            </span>
          )}
        </div>
        <p className={cn("text-amount mt-1.5 text-3xl sm:text-4xl font-extrabold tracking-tight", sc.text)}>
          <AnimatedNumber value={Math.abs(remaining)} format={formatCurrency} />
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {getStatusCopy(isOverspent, isWarning, daysRemaining, paceToStayUnder, forecastOverBudget, formatCurrency)}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }} role="progressbar" aria-valuenow={Math.min(budgetUsedPercent, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
          <m.div
            className={cn("h-full rounded-full", isOverspent ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-brand")}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            transition={{ delay: 0.3, duration: duration.slow, ease: ease.out }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="text-amount">{formatCurrency(monthlyTotal)} of {formatCurrency(salary)} spent</span>
          <span>{expenseCount} transaction{expenseCount !== 1 ? "s" : ""}</span>
        </div>
        {rolloverAmount > 0 && (
          <p className="mt-1 text-xs font-medium text-brand">
            Includes +{formatCurrency(rolloverAmount)} rollover from last month
          </p>
        )}
      </m.div>

      {/* ── SECONDARY: Supporting Metrics (compact inline) ── */}
      <m.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: duration.emphasis, delay: 0.1, ease: ease.out } } }}
      >
        <div className="rounded-xl p-3 sm:p-3.5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-meta font-medium">Daily Pace</p>
          <p className={cn(
            "text-amount mt-1 text-base sm:text-lg font-bold",
            paceToStayUnder <= 0 ? "text-red-600 dark:text-red-400"
              : paceExceeded ? "text-amber-600 dark:text-amber-400" : ""
          )} style={paceToStayUnder > 0 && !paceExceeded ? { color: 'var(--text-primary)' } : undefined}>
            <AnimatedNumber value={avgDaily} format={(n) => `${formatCurrency(n)}/d`} />
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {paceToStayUnder > 0 ? `Target \u2264 ${formatCurrency(paceToStayUnder)}/d` : "Budget fully committed"}
          </p>
        </div>

        <div className="relative rounded-xl p-3 sm:p-3.5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-meta font-medium">Saving</p>
          <p className={cn(
            "text-amount mt-1 text-base sm:text-lg font-bold",
            savingsRate < 0 ? "text-red-600 dark:text-red-400"
              : savingsRate < 20 ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          )}>
            <AnimatedNumber value={savingsRate} format={(n) => `${Math.round(n)}%`} />
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
              <span className="ml-auto text-xs font-normal opacity-60">
                {forecast.historicalMonths}mo avg
              </span>
            )}
          </div>
          <p className={cn(
            "text-amount mt-1 text-base sm:text-lg font-bold",
            forecastOverBudget ? "text-red-700 dark:text-red-400"
              : forecastWarning ? "text-amber-700 dark:text-amber-400" : ""
          )} style={!forecastOverBudget && !forecastWarning ? { color: 'var(--text-primary)' } : undefined}>
            {forecast.projectedTotal > 0 ? <AnimatedNumber value={forecast.projectedTotal} format={formatCurrency} /> : "\u2014"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {forecast.projectedTotal > 0 && forecast.confidence !== "low"
              ? (forecastOverBudget
                  ? `${formatCurrency(Math.abs(forecast.projectedRemaining))} above your rhythm`
                  : `${formatCurrency(forecast.projectedRemaining)} under budget`)
              : forecast.confidence === "low" ? "Not enough data yet" : "\u00A0"}
          </p>
        </div>
      </m.div>

      {/* ── Toggle: Extra Details ── */}
      <div>
        <button
          onClick={toggleExpanded}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors hover:text-[var(--text-secondary)]"
          style={{ color: 'var(--text-tertiary)' }}
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
                  <p className="text-amount mt-1 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {budgetUsedPercent}%
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
                  <p className="text-amount mt-1 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {forecast.projectedTotal > 0 ? formatCurrency(forecast.projectedTotal) : "\u2014"}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
