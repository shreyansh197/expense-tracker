"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useExpenseRange } from "@/hooks/useExpenseRange";
import { useCurrency } from "@/hooks/useCurrency";
import { expandCollapse } from "@/lib/motion/variants";
import { ROLLING_PERIODS, ROLLING_WINDOW_DAYS, monthsCovering, periodAnchor } from "@/lib/analyticsCharts";
import type { CategoryMeta, Expense } from "@/types";

const RollingAverageChart = dynamic(() => import("@/components/analytics/RollingAverageChart").then((mod) => ({ default: mod.RollingAverageChart })), { ssr: false });
const CategoryVelocity = dynamic(() => import("@/components/analytics/CategoryVelocity").then((mod) => ({ default: mod.CategoryVelocity })), { ssr: false });
const MerchantBreakdown = dynamic(() => import("@/components/analytics/MerchantBreakdown").then((mod) => ({ default: mod.MerchantBreakdown })), { ssr: false });
const CategorySeasons = dynamic(() => import("@/components/analytics/CategorySeasons").then((mod) => ({ default: mod.CategorySeasons })), { ssr: false });
const YearOverYearChart = dynamic(() => import("@/components/analytics/YearOverYearChart").then((mod) => ({ default: mod.YearOverYearChart })), { ssr: false });
const TimeMachine = dynamic(() => import("@/components/analytics/TimeMachine").then((mod) => ({ default: mod.TimeMachine })), { ssr: false });

/** Days of history the rolling average and velocity views need (longest period + smoothing window). */
const RANGE_DAYS = Math.max(...ROLLING_PERIODS) + ROLLING_WINDOW_DAYS;

export interface AnalyticsDeepDiveProps {
  month: number;
  year: number;
  /** The selected month's expenses (merchants view). */
  monthExpenses: readonly Expense[];
  categories: Record<string, CategoryMeta>;
}

function DeepDiveBlock({ title, info, children }: { title: string; info: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-center gap-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{title}</h3>
        <InfoTooltip title={title}>{info}</InfoTooltip>
      </div>
      {children}
    </section>
  );
}

/** Loaded only when Deep Dive is open, so its range query and charts never cost the first paint. */
function DeepDiveContent({ month, year, monthExpenses, categories }: AnalyticsDeepDiveProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const anchor = useMemo(() => periodAnchor(month, year, new Date()), [month, year]);
  const rangeMonths = useMemo(() => monthsCovering(anchor, RANGE_DAYS), [anchor]);
  const rangeExpenses = useExpenseRange(rangeMonths);
  const velocityLabels = useMemo(
    () => Object.fromEntries(Object.entries(categories).map(([id, c]) => [id, { label: c.label, color: c.color }])),
    [categories],
  );

  return (
    <div className="space-y-6 px-5 pb-5">
      <DeepDiveBlock title="Rolling Average" info={<p className="text-xs leading-relaxed">Daily spend over the chosen 30, 60 or 90 days, smoothed by a trailing {ROLLING_WINDOW_DAYS}-day mean. The band shows ±1 standard deviation — wider means less predictable spending.</p>}>
        <RollingAverageChart expenses={rangeExpenses} anchor={anchor} formatCurrency={formatCurrency} formatCurrencyCompact={formatCurrencyCompact} />
      </DeepDiveBlock>
      <DeepDiveBlock title="Category Velocity" info={<p className="text-xs leading-relaxed">Spend per category in the week ending on this month&apos;s last tracked day, compared with the week before. Sparklines show the last four weeks.</p>}>
        <CategoryVelocity expenses={rangeExpenses} anchor={anchor} categoryLabels={velocityLabels} formatCurrency={formatCurrency} />
      </DeepDiveBlock>
      <DeepDiveBlock title="Top Merchants / Payees" info={<p className="text-xs leading-relaxed">This month&apos;s expenses grouped by their note / payee. Bars compare each one with your largest.</p>}>
        <MerchantBreakdown expenses={monthExpenses} formatCurrency={formatCurrency} />
      </DeepDiveBlock>
      <CategorySeasons />
      <DeepDiveBlock title="Year over Year" info={<p className="text-xs leading-relaxed">Each month this year (solid) against the same month last year (faded), January to the selected month.</p>}>
        <YearOverYearChart formatCurrency={formatCurrency} formatCurrencyCompact={formatCurrencyCompact} />
      </DeepDiveBlock>
      <TimeMachine />
    </div>
  );
}

/**
 * Progressive disclosure for secondary analytics (UX-9.6). Collapsed by
 * default; a real disclosure button inside the heading exposes its state.
 */
export function AnalyticsDeepDive(props: AnalyticsDeepDiveProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section className="card-terrain overflow-hidden" aria-labelledby={`${panelId}-heading`}>
      <h2 id={`${panelId}-heading`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          className="flex min-h-[44px] w-full items-center justify-between gap-3 p-5 text-left"
        >
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Deep Dive</span>
            <span className="mt-0.5 block text-xs font-normal normal-case" style={{ color: "var(--text-tertiary)" }}>
              Rolling average, category velocity, merchants, seasons, year over year and what-if scenarios
            </span>
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="shrink-0 transition-transform duration-200"
            style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : undefined }}
          />
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open && (
          <m.div id={panelId} key="deep-dive" variants={expandCollapse} initial="initial" animate="animate" exit="exit">
            <DeepDiveContent {...props} />
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
