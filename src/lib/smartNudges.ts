import type { Expense } from "@/types";
import { getDayOfWeekFactors } from "@/lib/calculations";

// ── Smart Nudge Types ──

export interface SmartNudge {
  id: string;
  type: "weekend_forecast" | "category_frequency" | "streak_at_risk";
  title: string;
  body: string;
  priority: number; // higher = more important
}

// ── Frequency cap ──

const NUDGE_STORAGE_KEY = "expenstream-smart-nudges-sent";
const MAX_NUDGES_PER_WEEK = 3;

function getNudgesSentThisWeek(): number {
  try {
    const raw = localStorage.getItem(NUDGE_STORAGE_KEY);
    if (!raw) return 0;
    const { count, weekStart } = JSON.parse(raw);
    // Reset if we're in a new week (Monday-based)
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    currentWeekStart.setHours(0, 0, 0, 0);
    if (new Date(weekStart).getTime() < currentWeekStart.getTime()) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function recordNudgeSent(): void {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const current = getNudgesSentThisWeek();
    localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify({
      count: current + 1,
      weekStart: weekStart.toISOString(),
    }));
  } catch { /* ignore */ }
}

export function canSendNudge(): boolean {
  return getNudgesSentThisWeek() < MAX_NUDGES_PER_WEEK;
}

// ── Nudge Generators ──

/**
 * Weekend spending forecast — fires on Friday (day 5) evening.
 * Uses day-of-week factors to predict weekend spend.
 */
export function getWeekendForecastNudge(
  allExpenses: Expense[],
  budgetRemaining: number,
  formatCurrency: (n: number) => string,
): SmartNudge | null {
  const now = new Date();
  if (now.getDay() !== 5) return null; // Only on Fridays
  if (now.getHours() < 17) return null; // Only evening (5pm+)

  const factors = getDayOfWeekFactors(allExpenses);
  const weekendFactor = ((factors[0] ?? 1) + (factors[5] ?? 1) + (factors[6] ?? 1)) / 3;

  // Only nudge if weekends are notably heavier
  if (weekendFactor < 1.15) return null;

  const active = allExpenses.filter((e) => !e.deletedAt);
  if (active.length < 10) return null;

  const avgDaily = active.reduce((s, e) => s + e.amount, 0) / Math.max(new Set(active.map((e) => `${e.year}-${e.month}-${e.day}`)).size, 1);
  const predictedWeekend = Math.round(avgDaily * weekendFactor * 2); // Sat + Sun

  return {
    id: `weekend_forecast_${now.toISOString().slice(0, 10)}`,
    type: "weekend_forecast",
    title: "Weekend ahead",
    body: `Weekends typically cost ${formatCurrency(predictedWeekend)} — you have ${formatCurrency(Math.max(budgetRemaining, 0))} left in budget.`,
    priority: 2,
  };
}

/**
 * Category frequency alert — fires when a category's weekly count exceeds
 * the 4-week rolling average.
 */
export function getCategoryFrequencyNudge(
  expenses: Expense[],
  categoryLabels: Record<string, string>,
): SmartNudge | null {
  const active = expenses.filter((e) => !e.deletedAt);
  if (active.length < 15) return null;

  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  // Count this week per category
  const thisWeekCounts: Record<string, number> = {};
  for (const e of active) {
    const d = new Date(e.year, e.month - 1, e.day);
    if (d >= thisWeekStart) {
      thisWeekCounts[e.category] = (thisWeekCounts[e.category] || 0) + 1;
    }
  }

  // 4-week average per category
  const fourWeeksAgo = new Date(thisWeekStart);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const pastCounts: Record<string, number> = {};
  for (const e of active) {
    const d = new Date(e.year, e.month - 1, e.day);
    if (d >= fourWeeksAgo && d < thisWeekStart) {
      pastCounts[e.category] = (pastCounts[e.category] || 0) + 1;
    }
  }

  // Find category with biggest overshoot
  let bestCat = "";
  let bestOvershoot = 0;
  for (const [cat, count] of Object.entries(thisWeekCounts)) {
    const weeklyAvg = (pastCounts[cat] || 0) / 4;
    if (weeklyAvg >= 1 && count > weeklyAvg * 1.5) {
      const overshoot = count - weeklyAvg;
      if (overshoot > bestOvershoot) {
        bestOvershoot = overshoot;
        bestCat = cat;
      }
    }
  }

  if (!bestCat) return null;
  const label = categoryLabels[bestCat] || bestCat;
  const thisCount = thisWeekCounts[bestCat];
  const avgCount = Math.round((pastCounts[bestCat] || 0) / 4);

  return {
    id: `cat_freq_${bestCat}_${now.toISOString().slice(0, 10)}`,
    type: "category_frequency",
    title: `${label} is trending up`,
    body: `${thisCount} ${label.toLowerCase()} transactions this week vs your usual ${avgCount}.`,
    priority: 3,
  };
}

/**
 * Streak-at-risk nudge — fires if user hasn't logged today
 * and it's past their usual logging time.
 */
export function getStreakAtRiskNudge(
  allExpenses: Expense[],
  currentStreak: number,
): SmartNudge | null {
  if (currentStreak < 3) return null; // Only warn if streak worth preserving

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const active = allExpenses.filter((e) => !e.deletedAt);

  // Check if already logged today
  const loggedToday = active.some((e) => `${e.year}-${e.month}-${e.day}` === todayKey);
  if (loggedToday) return null;

  // Find usual logging hour from createdAt timestamps
  const recentHours: number[] = [];
  for (const e of active.slice(-50)) {
    if (e.createdAt) {
      recentHours.push(new Date(e.createdAt).getHours());
    }
  }
  if (recentHours.length < 5) return null;

  const medianHour = recentHours.sort((a, b) => a - b)[Math.floor(recentHours.length / 2)];
  if (now.getHours() < medianHour) return null; // Not past usual time yet

  return {
    id: `streak_risk_${todayKey}`,
    type: "streak_at_risk",
    title: "Streak at risk",
    body: `Your ${currentStreak}-day streak is at risk — quick log before the day ends?`,
    priority: 5,
  };
}

/**
 * Evaluate all smart nudges and return the highest-priority one
 * that hasn't been shown today and is within the weekly cap.
 */
export function evaluateSmartNudges(params: {
  allExpenses: Expense[];
  budgetRemaining: number;
  currentStreak: number;
  categoryLabels: Record<string, string>;
  formatCurrency: (n: number) => string;
}): SmartNudge | null {
  if (!canSendNudge()) return null;

  const candidates: SmartNudge[] = [];

  const weekend = getWeekendForecastNudge(params.allExpenses, params.budgetRemaining, params.formatCurrency);
  if (weekend) candidates.push(weekend);

  const catFreq = getCategoryFrequencyNudge(params.allExpenses, params.categoryLabels);
  if (catFreq) candidates.push(catFreq);

  const streakRisk = getStreakAtRiskNudge(params.allExpenses, params.currentStreak);
  if (streakRisk) candidates.push(streakRisk);

  if (candidates.length === 0) return null;

  // Check which have already been shown today
  const shownToday = getShownToday();
  const unshown = candidates.filter((n) => !shownToday.has(n.id));
  if (unshown.length === 0) return null;

  // Return highest priority
  unshown.sort((a, b) => b.priority - a.priority);
  return unshown[0];
}

/** Mark a nudge as sent (for dedup + frequency cap) */
export function markNudgeSent(nudgeId: string): void {
  recordNudgeSent();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `expenstream-nudge-shown-${today}`;
    const shown = JSON.parse(localStorage.getItem(key) || "[]");
    shown.push(nudgeId);
    localStorage.setItem(key, JSON.stringify(shown));
  } catch { /* ignore */ }
}

function getShownToday(): Set<string> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `expenstream-nudge-shown-${today}`;
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}
