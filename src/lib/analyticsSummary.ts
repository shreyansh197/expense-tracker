/**
 * Plain-language summary for the Analytics hero (M4 · analytics hierarchy).
 *
 * Turns the month's numbers into at most three short, non-judgemental
 * sentences — the most actionable read of the month, answered in words
 * before any chart. Pure and unit-tested (`analyticsCharts.test.ts`).
 */
import { subMoney } from "@/lib/money";

export interface MonthSummaryInput {
  /** % change vs the previous month, `null` when there is no previous spend. */
  monthOverMonthChange: number | null;
  /** Category totals for the selected month and the month before it. */
  currentBreakdown?: Record<string, number>;
  previousBreakdown?: Record<string, number>;
  categoryLabel: (id: string) => string;
  budget: number;
  projectedTotal: number;
  daysLeft: number;
  formatCurrencyCompact: (n: number) => string;
}

/** Minimum category growth (%) worth calling out. */
const NOTABLE_GROWTH_PCT = 20;
/** Month-over-month change (%) treated as "roughly the same". */
const STEADY_BAND_PCT = 5;
/** Projections within the last few days are noise — skip them. */
const MIN_DAYS_FOR_PROJECTION = 4;

export function buildMonthSummary(input: MonthSummaryInput): string[] {
  const sentences: string[] = [];
  const { monthOverMonthChange: mom } = input;

  if (mom !== null) {
    const pct = Math.abs(Math.round(mom));
    if (mom > STEADY_BAND_PCT) sentences.push(`You spent ${pct}% more than last month.`);
    else if (mom < -STEADY_BAND_PCT) sentences.push(`You spent ${pct}% less than last month.`);
    else sentences.push("Spending is roughly in line with last month.");
  }

  if (input.currentBreakdown && input.previousBreakdown) {
    let topId = "";
    let topGrowth = 0;
    for (const [id, cur] of Object.entries(input.currentBreakdown)) {
      const prev = input.previousBreakdown[id] ?? 0;
      if (prev > 0 && cur > prev) {
        const growth = (subMoney(cur, prev) / prev) * 100;
        if (growth > topGrowth) {
          topGrowth = growth;
          topId = id;
        }
      }
    }
    if (topId && topGrowth > NOTABLE_GROWTH_PCT) {
      sentences.push(`${input.categoryLabel(topId)} saw the biggest jump (+${Math.round(topGrowth)}% vs last month).`);
    }
  }

  if (input.budget > 0 && input.projectedTotal > 0 && input.daysLeft >= MIN_DAYS_FOR_PROJECTION) {
    const projectedOver = subMoney(input.projectedTotal, input.budget);
    if (projectedOver > 0) {
      sentences.push(`At this pace you're projected to go ${input.formatCurrencyCompact(projectedOver)} over budget.`);
    } else if (projectedOver < 0) {
      sentences.push(`You're on track to finish ${input.formatCurrencyCompact(Math.abs(projectedOver))} under budget.`);
    }
  }

  return sentences;
}
