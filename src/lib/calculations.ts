import type { Expense, CategoryId, DailyTotal, CategoryTotal, StackedDailyTotal, Forecast, AnomalyResult } from "@/types";

/** Filter active (non-deleted) expenses for a given month/year */
function activeExpenses(expenses: Expense[], month: number, year: number): Expense[] {
  return expenses.filter(
    (e) => e.month === month && e.year === year && e.deletedAt === null
  );
}

/**
 * Category Total — Excel: SUM of a category row across days 1–31
 */
export function getCategoryTotal(
  expenses: Expense[],
  category: CategoryId,
  month: number,
  year: number
): number {
  return activeExpenses(expenses, month, year)
    .filter((e) => e.category === category)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Daily Total — Excel: SUM of all categories for one day
 */
export function getDailyTotal(
  expenses: Expense[],
  day: number,
  month: number,
  year: number
): number {
  return activeExpenses(expenses, month, year)
    .filter((e) => e.day === day)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Grand Total (Monthly Spend) — Excel: SUM of all category totals
 */
export function getMonthlyTotal(
  expenses: Expense[],
  month: number,
  year: number
): number {
  return activeExpenses(expenses, month, year).reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Month Saving (Remaining Budget) — Excel: Salary − Grand Total
 */
export function getMonthlySaving(salary: number, monthlyTotal: number): number {
  return salary - monthlyTotal;
}

/**
 * All category totals for a month — includes orphan categories from expenses
 * that aren't in the local categories list (e.g. before settings sync completes)
 */
export function getAllCategoryTotals(
  expenses: Expense[],
  categories: CategoryId[],
  month: number,
  year: number
): CategoryTotal[] {
  const knownSet = new Set(categories);
  const result: CategoryTotal[] = categories.map((category) => ({
    category,
    total: getCategoryTotal(expenses, category, month, year),
  }));

  // Find categories present in expenses but missing from settings
  const active = activeExpenses(expenses, month, year);
  const orphanMap = new Map<string, number>();
  for (const e of active) {
    if (!knownSet.has(e.category)) {
      orphanMap.set(e.category, (orphanMap.get(e.category) || 0) + e.amount);
    }
  }
  for (const [category, total] of orphanMap) {
    result.push({ category, total });
  }

  return result;
}

/**
 * All daily totals for a month
 */
export function getAllDailyTotals(
  expenses: Expense[],
  month: number,
  year: number,
  daysInMonth: number
): DailyTotal[] {
  const result: DailyTotal[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    result.push({
      day,
      total: getDailyTotal(expenses, day, month, year),
    });
  }
  return result;
}

// --- Derived KPIs (not in Excel, marked optional) ---

/**
 * Average daily spend (total / elapsed days)
 */
export function getAverageDailySpend(monthlyTotal: number, daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  return Math.round(monthlyTotal / daysElapsed);
}

/**
 * Budget utilization percentage
 */
export function getBudgetUsedPercent(monthlyTotal: number, salary: number): number {
  if (salary <= 0) return 0;
  return Math.round((monthlyTotal / salary) * 100);
}

/**
 * Top spending category
 */
export function getTopCategory(
  expenses: Expense[],
  categories: CategoryId[],
  month: number,
  year: number
): CategoryTotal | null {
  // getAllCategoryTotals already includes orphan categories
  const totals = getAllCategoryTotals(expenses, categories, month, year);
  const nonZero = totals.filter((t) => t.total > 0);
  if (nonZero.length === 0) return null;
  return nonZero.reduce((max, t) => (t.total > max.total ? t : max));
}

/**
 * Days remaining in month (including today)
 */
export function getDaysRemaining(month: number, year: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 0; // Past month
  }
  if (year === currentYear && month === currentMonth) {
    return Math.max(0, daysInMonth - now.getDate());
  }
  return daysInMonth; // Future month
}

/**
 * Daily pace needed to stay under budget
 */
export function getPaceToStayUnder(remaining: number, daysRemaining: number): number {
  if (daysRemaining <= 0) return 0;
  return Math.max(0, Math.round(remaining / daysRemaining));
}

/**
 * Elapsed days in month (for avg/day calculation)
 */
export function getElapsedDays(month: number, year: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Past month: use total days in month
    return new Date(year, month, 0).getDate();
  }
  if (year === currentYear && month === currentMonth) {
    return now.getDate();
  }
  // Future month
  return 0;
}

/**
 * Stacked daily totals — each day has a total + per-category breakdown
 */
export function getStackedDailyTotals(
  expenses: Expense[],
  categories: CategoryId[],
  month: number,
  year: number,
  daysInMonth: number
): StackedDailyTotal[] {
  const active = activeExpenses(expenses, month, year);
  const result: StackedDailyTotal[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const row: StackedDailyTotal = { day, total: 0 };
    const dayExpenses = active.filter((e) => e.day === day);
    for (const e of dayExpenses) {
      row[e.category] = (row[e.category] as number || 0) + e.amount;
      row.total += e.amount;
    }
    result.push(row);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// EOM FORECAST — linear projection: (totalSoFar / elapsedDays) × daysInMonth
// ═══════════════════════════════════════════════════════════════

/**
 * Project end-of-month spend using simple daily-average extrapolation.
 *
 * Formula:  projected = (monthlyTotal / elapsedDays) × daysInMonth
 *
 * Confidence tiers:
 *   - "low"    if elapsed <  7 days  (too little data)
 *   - "medium" if elapsed < 15 days
 *   - "high"   if elapsed >= 15 days
 */
export function getEomForecast(
  monthlyTotal: number,
  salary: number,
  elapsedDays: number,
  daysInMonth: number
): Forecast {
  if (elapsedDays <= 0) {
    return { projectedTotal: 0, projectedRemaining: salary, confidence: "low", method: "linear", historicalMonths: 0 };
  }
  const avgPerDay = monthlyTotal / elapsedDays;
  const projectedTotal = Math.round(avgPerDay * daysInMonth);
  const projectedRemaining = salary - projectedTotal;
  const confidence: Forecast["confidence"] =
    elapsedDays < 7 ? "low" : elapsedDays < 15 ? "medium" : "high";

  return { projectedTotal, projectedRemaining, confidence, method: "linear", historicalMonths: 0 };
}

// ═══════════════════════════════════════════════════════════════
// ANOMALY DETECTION — Median Absolute Deviation (MAD)
// ═══════════════════════════════════════════════════════════════

/** Compute the median of a sorted-ascending number array. */
function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Detect anomalously large expenses within each category using MAD.
 *
 * MAD = median(|xi − median(X)|)
 *
 * A "modified z-score" for each expense is:
 *   z = 0.6745 × (amount − categoryMedian) / MAD
 *
 * Expenses with z > threshold (default 3.0) are flagged.
 *
 * Returns only flagged expenses, sorted by z-score descending.
 */
export function detectAnomalies(
  expenses: Expense[],
  month: number,
  year: number,
  threshold: number = 3.0
): AnomalyResult[] {
  const active = activeExpenses(expenses, month, year);
  if (active.length < 3) return []; // need meaningful data

  // Group amounts by category
  const catAmounts = new Map<string, number[]>();
  for (const e of active) {
    const arr = catAmounts.get(e.category) || [];
    arr.push(e.amount);
    catAmounts.set(e.category, arr);
  }

  const anomalies: AnomalyResult[] = [];

  for (const [cat, amounts] of catAmounts) {
    if (amounts.length < 3) continue; // need at least 3 txns in category
    const sorted = [...amounts].sort((a, b) => a - b);
    const med = median(sorted);
    const deviations = sorted.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
    const mad = median(deviations);

    if (mad === 0) continue; // all same amount → no anomaly possible

    // Check each expense in this category
    for (const e of active.filter((x) => x.category === cat)) {
      const z = (0.6745 * (e.amount - med)) / mad;
      if (z > threshold) {
        anomalies.push({
          expense: e,
          zScore: Math.round(z * 10) / 10,
          categoryMedian: Math.round(med),
          categoryMad: Math.round(mad),
        });
      }
    }
  }

  // Highest z-score first
  anomalies.sort((a, b) => b.zScore - a.zScore);
  return anomalies;
}

// ═══════════════════════════════════════════════════════════════
// WEIGHTED FORECAST — Exponential moving average + day-of-week
// ═══════════════════════════════════════════════════════════════

/**
 * Compute exponential weighted average over monthly totals.
 * Most recent month gets highest weight.
 * @param monthlyTotals - array ordered oldest → newest
 * @param alpha - smoothing factor 0..1 (higher = more weight on recent)
 */
export function getExponentialWeightedAvg(monthlyTotals: number[], alpha = 0.3): number {
  if (monthlyTotals.length === 0) return 0;
  if (monthlyTotals.length === 1) return monthlyTotals[0];

  let ema = monthlyTotals[0];
  for (let i = 1; i < monthlyTotals.length; i++) {
    ema = alpha * monthlyTotals[i] + (1 - alpha) * ema;
  }
  return Math.round(ema);
}

/**
 * Compute day-of-week spending factors from expenses.
 * Returns a map: dayOfWeek (0=Sun..6=Sat) → factor.
 * Factor > 1 means that weekday has above-average spending.
 */
export function getDayOfWeekFactors(expenses: Expense[]): Record<number, number> {
  const sums: number[] = [0, 0, 0, 0, 0, 0, 0];
  const counts: number[] = [0, 0, 0, 0, 0, 0, 0];

  for (const e of expenses) {
    if (e.deletedAt) continue;
    const d = new Date(e.year, e.month - 1, e.day);
    const dow = d.getDay();
    sums[dow] += e.amount;
    counts[dow]++;
  }

  const avgPerDay: number[] = [];
  for (let i = 0; i < 7; i++) {
    avgPerDay[i] = counts[i] > 0 ? sums[i] / counts[i] : 0;
  }

  const overallAvg = avgPerDay.reduce((s, v) => s + v, 0) / 7;
  if (overallAvg === 0) return { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };

  const factors: Record<number, number> = {};
  for (let i = 0; i < 7; i++) {
    factors[i] = avgPerDay[i] / overallAvg;
  }
  return factors;
}

/**
 * Enhanced EOM forecast using weighted moving average + day-of-week patterns.
 * Falls back to linear projection when < 2 months of history.
 */
export function getWeightedForecast(
  monthlyTotal: number,
  salary: number,
  elapsedDays: number,
  daysInMonth: number,
  month: number,
  year: number,
  historicalTotals: number[], // oldest → newest, NOT including current month
  allExpenses: Expense[],     // all historical + current expenses for day-of-week
): Forecast {
  // Too early in the month or no historical data → fall back to linear
  if (elapsedDays <= 0 || historicalTotals.length < 2) {
    return getEomForecast(monthlyTotal, salary, elapsedDays, daysInMonth);
  }

  // Weighted average of historical monthly totals
  const weightedMonthlyAvg = getExponentialWeightedAvg(historicalTotals);

  // Day-of-week factors from all available expenses
  const dowFactors = getDayOfWeekFactors(allExpenses);

  // Calculate weighted daily average based on historical
  const avgDaysInMonth = 30.44;
  const historicalDailyAvg = weightedMonthlyAvg / avgDaysInMonth;

  // Project remaining days using day-of-week factors
  let remainingProjection = 0;
  for (let d = elapsedDays + 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    const factor = dowFactors[dow] ?? 1;
    remainingProjection += historicalDailyAvg * factor;
  }

  const projectedTotal = Math.round(monthlyTotal + remainingProjection);
  const projectedRemaining = salary - projectedTotal;

  const confidence: Forecast["confidence"] =
    historicalTotals.length >= 4 && elapsedDays >= 10
      ? "high"
      : historicalTotals.length >= 2 && elapsedDays >= 5
        ? "medium"
        : "low";

  return {
    projectedTotal,
    projectedRemaining,
    confidence,
    method: "weighted",
    historicalMonths: historicalTotals.length,
  };
}
