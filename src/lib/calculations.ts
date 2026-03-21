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
    return { projectedTotal: 0, projectedRemaining: salary, confidence: "low" };
  }
  const avgPerDay = monthlyTotal / elapsedDays;
  const projectedTotal = Math.round(avgPerDay * daysInMonth);
  const projectedRemaining = salary - projectedTotal;
  const confidence: Forecast["confidence"] =
    elapsedDays < 7 ? "low" : elapsedDays < 15 ? "medium" : "high";

  return { projectedTotal, projectedRemaining, confidence };
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
