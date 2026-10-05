/**
 * Analytics chart models (M4 · Sprint 4.2).
 *
 * Every analytics visualisation and its `DataTableView` text alternative are
 * rendered from the same model built here, so the table always matches the
 * chart exactly. Pure, framework-agnostic, and unit-tested in
 * `src/__tests__/analyticsCharts.test.ts`.
 */
import { z } from "zod";
import { addMoney, subMoney, sumMoney } from "@/lib/money";
import type { Expense } from "@/types";

const DAY_MS = 86_400_000;

// ── Periods ──────────────────────────────────────────────────────────

/** Month-history periods offered on the Analytics page (months, inclusive of the selected month). */
export const ANALYTICS_PERIODS = [3, 6, 12] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];
export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriod = 6;

/** Day ranges offered by the Rolling Average chart. */
export const ROLLING_PERIODS = [30, 60, 90] as const;
export type RollingPeriod = (typeof ROLLING_PERIODS)[number];
export const DEFAULT_ROLLING_PERIOD: RollingPeriod = 30;
/** Trailing window (days) used to smooth the rolling average. */
export const ROLLING_WINDOW_DAYS = 7;

const periodParamSchema = z.enum(["3", "6", "12"]);

/** Parse the `?period=` search param; anything unexpected falls back to the default. */
export function parseAnalyticsPeriod(raw: string | null | undefined): AnalyticsPeriod {
  const parsed = periodParamSchema.safeParse(raw);
  return parsed.success ? (Number(parsed.data) as AnalyticsPeriod) : DEFAULT_ANALYTICS_PERIOD;
}

// ── Dates ────────────────────────────────────────────────────────────

/** `YYYY-MM-DD` for a local calendar date. */
export function isoDay(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toIso(date: Date): string {
  return isoDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The last day analytics should consider for a selected month: today for the
 * in-progress month, otherwise the month's final day.
 */
export function periodAnchor(month: number, year: number, today: Date): Date {
  if (today.getFullYear() === year && today.getMonth() + 1 === month) return startOfDay(today);
  return new Date(year, month, 0);
}

/** Calendar months (oldest first) needed to cover `days` ending at `anchor`. */
export function monthsCovering(anchor: Date, days: number): { month: number; year: number }[] {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - (days - 1));
  const result: { month: number; year: number }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= anchor) {
    result.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

/** Sum expenses per local calendar day (`YYYY-MM-DD`). */
export function dailyTotalsByDate(expenses: readonly Expense[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    const key = isoDay(e.year, e.month, e.day);
    totals.set(key, addMoney(totals.get(key) ?? 0, e.amount));
  }
  return totals;
}

// ── Month ridge ──────────────────────────────────────────────────────

export interface RidgeMonthInput {
  month: number;
  year: number;
  label: string;
  total: number;
}

export interface RidgeRow extends RidgeMonthInput {
  key: string;
  /** Bar length as a share of the chart scale (0–100). */
  pct: number;
  isSelected: boolean;
  overBudget: boolean;
  /** `total − budget` (positive = over budget); `null` without a budget. */
  budgetDelta: number | null;
}

export interface MonthRidgeModel {
  rows: RidgeRow[];
  /** Budget marker position (0–100) or `null` without a budget. */
  budgetPct: number | null;
  /** Mean of the months before the selected one, `null` when there are none. */
  averageBefore: number | null;
}

/**
 * Build the Month Ridge model. The scale includes the budget so neither a bar
 * nor the budget marker can ever run past the track.
 */
export function buildMonthRidge(
  months: readonly RidgeMonthInput[],
  selected: { month: number; year: number },
  budget: number,
): MonthRidgeModel {
  const hasBudget = budget > 0;
  const scaleMax = Math.max(...months.map((m) => m.total), hasBudget ? budget : 0, 1);
  const rows = months.map<RidgeRow>((m) => ({
    ...m,
    key: `${m.year}-${m.month}`,
    pct: (m.total / scaleMax) * 100,
    isSelected: m.month === selected.month && m.year === selected.year,
    overBudget: hasBudget && m.total > budget,
    budgetDelta: hasBudget ? subMoney(m.total, budget) : null,
  }));
  const before = rows.filter((r) => !r.isSelected);
  return {
    rows,
    budgetPct: hasBudget ? (budget / scaleMax) * 100 : null,
    averageBefore: before.length ? sumMoney(before.map((r) => r.total)) / before.length : null,
  };
}

// ── Weekly spending velocity ─────────────────────────────────────────

export interface VelocityRow {
  week: number;
  label: string;
  /** Day range covered by the bucket, e.g. `1–7`. */
  range: string;
  total: number;
  pct: number;
  overPace: boolean;
  /** Change vs the previous week in %, `null` for week 1 or an empty previous week. */
  changePct: number | null;
}

export interface WeeklyVelocityModel {
  rows: VelocityRow[];
  /** Budget ÷ number of weekly buckets; 0 without a budget. */
  idealWeekly: number;
  /** Budget-pace reference line position (0–100) or `null` without a budget. */
  paceLinePct: number | null;
}

/**
 * Build the weekly velocity model. The pace line shares the bars' scale, which
 * is capped by the largest of the weeks and the pace — bars never overflow.
 */
export function buildWeeklyVelocity(
  weeks: readonly { week: number; total: number }[],
  budget: number,
  daysInMonth: number,
): WeeklyVelocityModel {
  const buckets = Math.ceil(daysInMonth / 7);
  const idealWeekly = budget > 0 ? budget / buckets : 0;
  const scaleMax = Math.max(...weeks.map((w) => w.total), idealWeekly, 1);
  const rows = weeks.map<VelocityRow>((w, i) => {
    const prev = i > 0 ? weeks[i - 1].total : 0;
    const startDay = (w.week - 1) * 7 + 1;
    return {
      week: w.week,
      label: `W${w.week}`,
      range: `${startDay}–${Math.min(startDay + 6, daysInMonth)}`,
      total: w.total,
      pct: (w.total / scaleMax) * 100,
      overPace: idealWeekly > 0 && w.total > idealWeekly,
      changePct: i > 0 && prev > 0 ? (subMoney(w.total, prev) / prev) * 100 : null,
    };
  });
  return { rows, idealWeekly, paceLinePct: idealWeekly > 0 ? (idealWeekly / scaleMax) * 100 : null };
}

// ── Rolling average ──────────────────────────────────────────────────

export interface RollingPoint {
  date: string;
  /** Spend on this day alone. */
  dayTotal: number;
  /** Trailing `window`-day mean ending on this day. */
  mean: number;
  upper: number;
  lower: number;
}

/**
 * Daily spend for the `periodDays` ending at `anchor`, each smoothed by a
 * trailing `window`-day mean with a ±1σ band. Days before the period feed the
 * first windows, so the series length always equals `periodDays`.
 */
export function buildRollingSeries(
  expenses: readonly Expense[],
  anchor: Date,
  periodDays: number,
  window: number = ROLLING_WINDOW_DAYS,
): RollingPoint[] {
  const totals = dailyTotalsByDate(expenses);
  // Calendar arithmetic (not ms offsets) keeps days correct across DST changes.
  const dayBefore = (offset: number) => new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - offset);
  const valueAt = (offset: number) => totals.get(toIso(dayBefore(offset))) ?? 0;

  const points: RollingPoint[] = [];
  for (let back = periodDays - 1; back >= 0; back--) {
    const slice = Array.from({ length: window }, (_, k) => valueAt(back + k));
    const mean = slice.reduce((s, v) => s + v, 0) / window;
    const sigma = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / window);
    points.push({
      date: toIso(dayBefore(back)),
      dayTotal: valueAt(back),
      mean,
      upper: mean + sigma,
      lower: Math.max(0, mean - sigma),
    });
  }
  return points;
}

// ── Category velocity (week over week) ───────────────────────────────

export interface CategoryVelocityRow {
  id: string;
  /** Weekly totals, oldest first; the last entry is the week ending at the anchor. */
  weeks: number[];
  thisWeek: number;
  lastWeek: number;
  deltaPct: number | null;
}

/** Weekly totals per category for the `weeksBack` weeks ending at `anchor`. */
export function buildCategoryVelocity(
  expenses: readonly Expense[],
  anchor: Date,
  categoryIds: readonly string[],
  weeksBack = 4,
  limit = 8,
): CategoryVelocityRow[] {
  const end = startOfDay(anchor).getTime();
  const known = new Set(categoryIds);
  const byCategory = new Map<string, number[]>();

  for (const e of expenses) {
    if (!known.has(e.category)) continue;
    const diffDays = Math.round((end - new Date(e.year, e.month - 1, e.day).getTime()) / DAY_MS);
    if (diffDays < 0) continue;
    const weekIdx = Math.floor(diffDays / 7);
    if (weekIdx >= weeksBack) continue;
    const weeks = byCategory.get(e.category) ?? Array<number>(weeksBack).fill(0);
    weeks[weeksBack - 1 - weekIdx] = addMoney(weeks[weeksBack - 1 - weekIdx], e.amount);
    byCategory.set(e.category, weeks);
  }

  return [...byCategory.entries()]
    .map(([id, weeks]) => {
      const thisWeek = weeks[weeksBack - 1] ?? 0;
      const lastWeek = weeks[weeksBack - 2] ?? 0;
      return { id, weeks, thisWeek, lastWeek, deltaPct: lastWeek > 0 ? (subMoney(thisWeek, lastWeek) / lastWeek) * 100 : null };
    })
    .sort((a, b) => b.thisWeek - a.thisWeek)
    .slice(0, limit);
}

// ── Merchants / payees ───────────────────────────────────────────────

export interface MerchantRow {
  name: string;
  total: number;
  count: number;
  /** Share of the largest merchant (0–100). */
  pct: number;
}

/** Top merchants/payees grouped by remark; expenses without one fall under "Other". */
export function buildMerchantRows(expenses: readonly Expense[], limit = 10): MerchantRow[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const key = e.remark?.trim() || "Other";
    const existing = map.get(key) ?? { total: 0, count: 0 };
    map.set(key, { total: addMoney(existing.total, e.amount), count: existing.count + 1 });
  }
  const sorted = [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  const max = sorted[0]?.total || 1;
  return sorted.map((r) => ({ ...r, pct: (r.total / max) * 100 }));
}

/** `+12%` / `−8%` / `0%` — signed, rounded percentage for tables and labels. */
export function formatSignedPercent(pct: number): string {
  const rounded = Math.round(pct);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `−${Math.abs(rounded)}%`;
  return "0%";
}
