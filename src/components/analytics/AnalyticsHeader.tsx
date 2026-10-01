"use client";

import { Share2 } from "lucide-react";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { QuickHelpButton } from "@/components/ui/QuickHelpButton";
import { AnalyticsPeriodSelector } from "@/components/analytics/AnalyticsPeriodSelector";
import type { AnalyticsPeriod } from "@/lib/analyticsCharts";

export interface AnalyticsHeaderProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  /** Omit to hide the share action (e.g. while there is no data). */
  onShare?: () => void;
}

const PAGE_TIPS = [
  "The top card answers “how is this month going?” — total, budget context and projection",
  "Use 3M / 6M / 12M to change how many months the Month Ridge compares",
  "Every chart has a Table button with the exact numbers",
  "Open Deep Dive for rolling averages, category velocity, merchants, seasons, year over year and the what-if Time Machine",
  "Share exports a branded image summary you can save or send",
];

/**
 * Analytics header. Mobile stacks the month switcher on its own row and gives
 * the period selector + actions a full-width second row, so no control is
 * squeezed or clipped; from `md` everything sits on one line. DOM order
 * matches visual order at every breakpoint.
 */
export function AnalyticsHeader({ period, onPeriodChange, onShare }: AnalyticsHeaderProps) {
  return (
    <header className="card-terrain p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 justify-center md:justify-start">
          <MonthSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <AnalyticsPeriodSelector value={period} onChange={onPeriodChange} className="flex-1 md:flex-none" />
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors hover:bg-[var(--surface-secondary)]"
              style={{ color: "var(--text-muted)" }}
              aria-label="Share analytics summary"
            >
              <Share2 size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          <SyncIndicator />
          <QuickHelpButton pageTips={PAGE_TIPS} pageLabel="Analytics" />
        </div>
      </div>
    </header>
  );
}
