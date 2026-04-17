/**
 * chronicle.ts — Pure string-template functions for The Chronicle narrative view.
 *
 * No LLM, no async, no API calls. Runs entirely from local calculation outputs.
 * Works fully offline. All functions are locale-aware via passed formatCurrency util.
 */

import { getMonthName } from "@/lib/utils";
import type { DailyTotal, CategoryTotal } from "@/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Personal narratives ──────────────────────────────────────

/**
 * Opening paragraph: how the month ended vs. plan.
 */
export function getMonthNarrative(
  total: number,
  salary: number,
  month: number,
  year: number,
  formatCurrency: (n: number) => string,
): string {
  const monthName = getMonthName(month);
  if (salary <= 0) {
    return `In ${monthName} ${year}, you tracked ${formatCurrency(total)} in spending.`;
  }
  const diff = salary - total;
  const absDiff = Math.abs(diff);
  if (diff >= 0) {
    return `In ${monthName} ${year}, you spent ${formatCurrency(total)} — ${formatCurrency(absDiff)} under your plan. Well held.`;
  }
  return `In ${monthName} ${year}, you spent ${formatCurrency(total)} — ${formatCurrency(absDiff)} over plan. Every month teaches something.`;
}

/**
 * Identifies the date and spend of the heaviest single day.
 */
export function getHeaviestDayNarrative(
  dailyTotals: DailyTotal[],
  month: number,
  year: number,
  transactionCounts: Record<number, number>,
  formatCurrency: (n: number) => string,
): string {
  if (!dailyTotals.length) return "";
  const heaviest = [...dailyTotals].sort((a, b) => b.total - a.total)[0];
  if (!heaviest || heaviest.total === 0) return "";

  const date = new Date(year, month - 1, heaviest.day);
  const dayName = DAY_NAMES[date.getDay()];
  const txCount = transactionCounts[heaviest.day] ?? 1;

  return `Your heaviest day was ${getMonthName(month)} ${heaviest.day}, a ${dayName} — ${formatCurrency(heaviest.total)} across ${txCount} transaction${txCount !== 1 ? "s" : ""}.`;
}

/**
 * Surfaces a surprising category insight: biggest absolute change from prior month.
 */
export function getSurpriseInsight(
  currentTotals: CategoryTotal[],
  previousTotals: CategoryTotal[],
  categoryLabels: Record<string, string>,
  formatCurrency: (n: number) => string,
): string {
  if (!currentTotals.length || !previousTotals.length) return "";

  let bestInsight: { text: string; magnitude: number } | null = null;

  for (const curr of currentTotals) {
    const prev = previousTotals.find((p) => p.category === curr.category);
    if (!prev || prev.total === 0) continue;

    const diff = curr.total - prev.total;
    const pct = Math.round((Math.abs(diff) / prev.total) * 100);
    if (pct < 15 || Math.abs(diff) < 100) continue;

    const label = categoryLabels[curr.category] ?? curr.category;

    const text =
      diff < 0
        ? `${label} cost ${pct}% less than last month — ${formatCurrency(Math.abs(diff))} back in your pocket.`
        : `${label} ran ${pct}% higher than last month — an extra ${formatCurrency(Math.abs(diff))}.`;

    if (!bestInsight || Math.abs(diff) > bestInsight.magnitude) {
      bestInsight = { text, magnitude: Math.abs(diff) };
    }
  }

  return bestInsight?.text ?? "";
}

/**
 * Returns a week-level sentence for the most expensive week.
 */
export function getWeekInsight(
  dailyTotals: DailyTotal[],
  formatCurrency: (n: number) => string,
): string {
  if (!dailyTotals.length) return "";

  // Bucket into 4 rough weeks
  const weeks = [0, 0, 0, 0];
  for (const d of dailyTotals) {
    const weekIdx = Math.min(Math.floor((d.day - 1) / 7), 3);
    weeks[weekIdx] += d.total;
  }

  const maxWeek = weeks.indexOf(Math.max(...weeks)) + 1;
  const maxWeekTotal = weeks[maxWeek - 1];
  if (maxWeekTotal === 0) return "";

  return `Week ${maxWeek} was your biggest — ${formatCurrency(maxWeekTotal)} spent.`;
}

// ── Business narratives ─────────────────────────────────────

/**
 * Revenue-first opening paragraph for business mode.
 */
export function getBusinessNarrative(
  totalExpenses: number,
  month: number,
  year: number,
  formatCurrency: (n: number) => string,
): string {
  const monthName = getMonthName(month);
  return `${monthName} ${year} — ${formatCurrency(totalExpenses)} tracked across all ledgers.`;
}
