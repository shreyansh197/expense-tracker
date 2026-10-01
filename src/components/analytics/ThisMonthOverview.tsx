"use client";

import { useId } from "react";
import { m } from "framer-motion";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { PredictiveBurnBar } from "@/components/analytics/PredictiveBurnBar";
import { AnomalyCallout } from "@/components/analytics/AnomalyCallout";
import { fadeUp } from "@/lib/motion/variants";
import { subMoney } from "@/lib/money";
import type { AnomalyResult, Forecast } from "@/types";

export interface ThisMonthOverviewProps {
  monthName: string;
  year: number;
  total: number;
  budget: number;
  daysLeft: number;
  elapsedDays: number;
  daysInMonth: number;
  forecast: Forecast;
  anomalies: AnomalyResult[];
  /** Plain-language summary sentences (see `buildMonthSummary`). */
  sentences: string[];
  categoryLabels: Record<string, string>;
  formatCurrency: (n: number) => string;
}

/**
 * The Analytics hero: one number — what the selected month has cost so far —
 * with its budget context, a plain-language read, the end-of-month projection,
 * and any anomalies. The most actionable information on the page, upfront.
 */
export function ThisMonthOverview({
  monthName,
  year,
  total,
  budget,
  daysLeft,
  elapsedDays,
  daysInMonth,
  forecast,
  anomalies,
  sentences,
  categoryLabels,
  formatCurrency,
}: ThisMonthOverviewProps) {
  const headingId = useId();
  const remaining = budget > 0 ? subMoney(budget, total) : null;

  return (
    <m.section aria-labelledby={headingId} className="card-terrain space-y-5 p-5" variants={fadeUp} initial="initial" animate="animate">
      <div>
        <div className="flex items-center gap-1.5">
          <h2 id={headingId} className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Spent in {monthName} {year}
          </h2>
          <InfoTooltip title="How this month is read">
            <p className="text-xs leading-relaxed">
              The <strong>projection</strong> extends your current daily average to the end of the month.
              <strong> Anomalies</strong> are single expenses well above your usual spend in that category
              (modified Z-score above your personal median).
            </p>
          </InfoTooltip>
        </div>
        <p className="mt-1 font-display text-hero-amount leading-none font-numeric" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(total)}
        </p>
        {remaining !== null && (
          <p className="mt-2 text-sm" style={{ color: remaining < 0 ? "var(--danger-text)" : "var(--text-secondary)" }}>
            {remaining >= 0
              ? `${formatCurrency(remaining)} left of ${formatCurrency(budget)}`
              : `${formatCurrency(Math.abs(remaining))} over the ${formatCurrency(budget)} budget`}
            {daysLeft > 0 && <span style={{ color: "var(--text-muted)" }}> · {daysLeft} days to go</span>}
          </p>
        )}
        {sentences.length > 0 && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {sentences.join(" ")}
          </p>
        )}
      </div>

      {budget > 0 || forecast.projectedTotal > 0 ? (
        <PredictiveBurnBar
          actual={total}
          forecast={forecast}
          budget={budget}
          formatCurrency={formatCurrency}
          dayOfMonth={elapsedDays}
          daysInMonth={daysInMonth}
        />
      ) : null}

      <AnomalyCallout anomalies={anomalies} formatCurrency={formatCurrency} categoryLabels={categoryLabels} />
    </m.section>
  );
}
