import type { Expense, CategoryId, DailyTotal, CategoryTotal } from "@/types";

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
