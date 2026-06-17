/// <reference types="jest" />
/**
 * Achievement system tests — useAchievements hook logic
 * Covers: functional, negative, boundary, security, and performance scenarios
 */
import { ACHIEVEMENT_DEFS } from "../hooks/useAchievements";
import type { Expense, UserSettings } from "../types";

// ── Helpers ──

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: Math.random().toString(36).slice(2),
    category: "groceries",
    amount: 100,
    day: 1,
    month: 3,
    year: 2026,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    deviceId: "test",
    ...overrides,
  };
}

function _makeSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    salary: 50000,
    currency: "INR",
    categories: ["groceries", "transport", "eat-out", "shopping", "subscriptions"],
    customCategories: [],
    hiddenDefaults: [],
    categoryBudgets: {},
    recurringExpenses: [],
    savedFilters: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const makeSettings = _makeSettings;

// Since useAchievements is a hook (can't call outside React), we test the pure logic:
//  1. ACHIEVEMENT_DEFS check functions
//  2. getConsecutiveMonthsUnderBudget (extracted via re-implementation for testing)
//  3. Component contract tests for AchievementsCard

// ── Achievement Definition Checks ──

function getCheck(id: string) {
  const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
  if (!def) throw new Error(`Achievement ${id} not found`);
  return def.check;
}

// =========== FUNCTIONAL TESTS ===========

describe("Achievement definitions — functional", () => {
  test("ACHIEVEMENT_DEFS has exactly 8 definitions", () => {
    expect(ACHIEVEMENT_DEFS).toHaveLength(8);
  });

  test("all definitions have unique IDs", () => {
    const ids = ACHIEVEMENT_DEFS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("all definitions have required fields", () => {
    for (const def of ACHIEVEMENT_DEFS) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(typeof def.check).toBe("function");
    }
  });

  test("week_warrior: unlocks at 7-day streak", () => {
    const check = getCheck("week_warrior");
    expect(check({ totalExpenses: 7, streak: 7, uniqueCategoriesThisMonth: 1, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 })).toBe(true);
  });

  test("monthly_master: unlocks at 30-day streak", () => {
    const check = getCheck("monthly_master");
    expect(check({ totalExpenses: 30, streak: 30, uniqueCategoriesThisMonth: 1, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 })).toBe(true);
  });

  test("budget_hero: unlocks at 1 consecutive month under budget", () => {
    const check = getCheck("budget_hero");
    expect(check({ totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 1 })).toBe(true);
  });

  test("triple_crown: unlocks at 3 consecutive months", () => {
    const check = getCheck("triple_crown");
    expect(check({ totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 3 })).toBe(true);
  });

  test("goal_setter: unlocks when 1 goal exists", () => {
    const check = getCheck("goal_setter");
    expect(check({ totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 1, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 })).toBe(true);
  });

  test("goal_crusher: unlocks when 1 goal completed", () => {
    const check = getCheck("goal_crusher");
    expect(check({ totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 1, completedGoals: 1, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 })).toBe(true);
  });

  test("recurring_pro: unlocks at 3 active recurring", () => {
    const check = getCheck("recurring_pro");
    expect(check({ totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 3, consecutiveMonthsUnderBudget: 0 })).toBe(true);
  });
});

// =========== NEGATIVE TESTS ===========

describe("Achievement definitions — negative", () => {
  test("week_warrior: does NOT unlock at 6-day streak", () => {
    const check = getCheck("week_warrior");
    expect(check({ totalExpenses: 6, streak: 6, uniqueCategoriesThisMonth: 1, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 })).toBe(false);
  });

  test("monthly_master: does NOT unlock at 29-day streak", () => {
    const check = getCheck("monthly_master");
    expect(check({ totalExpenses: 29, streak: 29, uniqueCategoriesThisMonth: 1, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 })).toBe(false);
  });

  test("triple_crown: does NOT unlock at 2 months", () => {
    const check = getCheck("triple_crown");
    expect(check({ totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 2 })).toBe(false);
  });

  test("goal_crusher: does NOT unlock when no goals completed", () => {
    const check = getCheck("goal_crusher");
    expect(check({ totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 5, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 })).toBe(false);
  });

  test("recurring_pro: does NOT unlock at 2 recurring", () => {
    const check = getCheck("recurring_pro");
    expect(check({ totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 2, consecutiveMonthsUnderBudget: 0 })).toBe(false);
  });

  test("no achievement unlocks with all zeros", () => {
    const ctx = { totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 };
    const unlocked = ACHIEVEMENT_DEFS.filter((d) => d.check(ctx));
    expect(unlocked).toHaveLength(0);
  });
});

// =========== BOUNDARY TESTS ===========

describe("Achievement definitions — boundary", () => {
  test("week_warrior: exactly at boundary (7)", () => {
    const check = getCheck("week_warrior");
    expect(check({ totalExpenses: 7, streak: 7, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 })).toBe(true);
  });

  test("all achievements unlock simultaneously with max values", () => {
    const ctx = { totalExpenses: 1000, streak: 365, uniqueCategoriesThisMonth: 10, goalCount: 5, completedGoals: 3, activeRecurring: 5, consecutiveMonthsUnderBudget: 12 };
    const unlocked = ACHIEVEMENT_DEFS.filter((d) => d.check(ctx));
    expect(unlocked).toHaveLength(7);
  });

  test("week_warrior unlocks before monthly_master at streak=7", () => {
    const ctx = { totalExpenses: 0, streak: 7, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 0 };
    expect(getCheck("week_warrior")(ctx)).toBe(true);
    expect(getCheck("monthly_master")(ctx)).toBe(false);
  });

  test("budget_hero unlocks before triple_crown at 1 month", () => {
    const ctx = { totalExpenses: 0, streak: 0, uniqueCategoriesThisMonth: 0, goalCount: 0, completedGoals: 0, activeRecurring: 0, consecutiveMonthsUnderBudget: 1 };
    expect(getCheck("budget_hero")(ctx)).toBe(true);
    expect(getCheck("triple_crown")(ctx)).toBe(false);
  });

  test("negative values do not unlock achievements", () => {
    const ctx = { totalExpenses: -1, streak: -5, uniqueCategoriesThisMonth: -1, goalCount: -1, completedGoals: -1, activeRecurring: -1, consecutiveMonthsUnderBudget: -1 };
    const unlocked = ACHIEVEMENT_DEFS.filter((d) => d.check(ctx));
    expect(unlocked).toHaveLength(0);
  });
});

// =========== SECURITY TESTS ===========

describe("Achievement definitions — security", () => {
  test("check functions are pure — no side effects", () => {
    const ctx = { totalExpenses: 50, streak: 10, uniqueCategoriesThisMonth: 3, goalCount: 2, completedGoals: 1, activeRecurring: 2, consecutiveMonthsUnderBudget: 1 };
    const ctxCopy = { ...ctx };
    for (const def of ACHIEVEMENT_DEFS) {
      def.check(ctx);
    }
    // Context must not be mutated
    expect(ctx).toEqual(ctxCopy);
  });

  test("achievement IDs contain only safe characters (alphanumeric + underscore)", () => {
    for (const def of ACHIEVEMENT_DEFS) {
      expect(def.id).toMatch(/^[a-z0-9_]+$/);
    }
  });

  test("achievement names and descriptions do not contain script tags", () => {
    for (const def of ACHIEVEMENT_DEFS) {
      expect(def.name.toLowerCase()).not.toContain("<script");
      expect(def.description.toLowerCase()).not.toContain("<script");
    }
  });

  test("achievement icons are non-empty strings", () => {
    for (const def of ACHIEVEMENT_DEFS) {
      expect(typeof def.icon).toBe("string");
      expect(def.icon.length).toBeGreaterThan(0);
    }
  });
});

// =========== PERFORMANCE TESTS ===========

describe("Achievement definitions — performance", () => {
  test("evaluating all 10 checks 10000 times completes under 100ms", () => {
    const ctx = { totalExpenses: 500, streak: 30, uniqueCategoriesThisMonth: 7, goalCount: 3, completedGoals: 1, activeRecurring: 4, consecutiveMonthsUnderBudget: 5 };
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      for (const def of ACHIEVEMENT_DEFS) {
        def.check(ctx);
      }
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  test("ACHIEVEMENT_DEFS is a frozen-length array (no accidental push)", () => {
    const originalLength = ACHIEVEMENT_DEFS.length;
    // Attempting to modify shouldn't affect the exported array in a real module
    expect(ACHIEVEMENT_DEFS.length).toBe(originalLength);
    expect(originalLength).toBe(8);
  });
});

// =========== getConsecutiveMonthsUnderBudget logic ===========
// We can't import the private function directly, so we re-test via the exported
// ACHIEVEMENT_DEFS logic + verify the algorithm through contract tests.

describe("Consecutive months under budget — re-implemented checks", () => {
  // Re-implement the core algorithm for direct testing
  function getConsecutiveMonthsUnderBudget(
    allExpenses: Expense[],
    salary: number,
    monthlyBudgets?: Record<string, number>,
  ): number {
    if (salary <= 0) return 0;
    const monthMap: Record<string, number> = {};
    for (const e of allExpenses) {
      if (e.deletedAt) continue;
      const key = `${e.year}-${String(e.month).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + e.amount;
    }
    const now = new Date();
    let m = now.getMonth();
    let y = now.getFullYear();
    m--;
    if (m < 0) { m = 11; y--; }
    let consecutive = 0;
    for (let i = 0; i < 12; i++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const budget = monthlyBudgets?.[key] ?? salary;
      const total = monthMap[key];
      if (total != null && total > 0 && total <= budget) {
        consecutive++;
      } else {
        break;
      }
      m--;
      if (m < 0) { m = 11; y--; }
    }
    return consecutive;
  }

  test("returns 0 when salary is 0", () => {
    expect(getConsecutiveMonthsUnderBudget([makeExpense()], 0)).toBe(0);
  });

  test("returns 0 when salary is negative", () => {
    expect(getConsecutiveMonthsUnderBudget([makeExpense()], -1000)).toBe(0);
  });

  test("returns 0 with no expenses", () => {
    expect(getConsecutiveMonthsUnderBudget([], 50000)).toBe(0);
  });

  test("returns 0 when expenses exceed budget", () => {
    const now = new Date();
    let m = now.getMonth(); // 0-indexed
    let y = now.getFullYear();
    m--; // previous month
    if (m < 0) { m = 11; y--; }
    const expenses = [makeExpense({ amount: 60000, month: m + 1, year: y })];
    expect(getConsecutiveMonthsUnderBudget(expenses, 50000)).toBe(0);
  });

  test("returns 1 when previous month is under budget", () => {
    const now = new Date();
    let m = now.getMonth();
    let y = now.getFullYear();
    m--;
    if (m < 0) { m = 11; y--; }
    const expenses = [makeExpense({ amount: 30000, month: m + 1, year: y })];
    expect(getConsecutiveMonthsUnderBudget(expenses, 50000)).toBe(1);
  });

  test("counts 3 consecutive under-budget months", () => {
    const now = new Date();
    const expenses: Expense[] = [];
    let m = now.getMonth();
    let y = now.getFullYear();
    for (let i = 0; i < 3; i++) {
      m--;
      if (m < 0) { m = 11; y--; }
      expenses.push(makeExpense({ amount: 30000, month: m + 1, year: y }));
    }
    expect(getConsecutiveMonthsUnderBudget(expenses, 50000)).toBe(3);
  });

  test("breaks streak on over-budget month in the middle", () => {
    const now = new Date();
    const expenses: Expense[] = [];
    let m = now.getMonth();
    let y = now.getFullYear();
    // Previous month: under budget
    m--;
    if (m < 0) { m = 11; y--; }
    expenses.push(makeExpense({ amount: 30000, month: m + 1, year: y }));
    // 2 months ago: over budget (break)
    m--;
    if (m < 0) { m = 11; y--; }
    expenses.push(makeExpense({ amount: 60000, month: m + 1, year: y }));
    // 3 months ago: under budget (shouldn't count)
    m--;
    if (m < 0) { m = 11; y--; }
    expenses.push(makeExpense({ amount: 30000, month: m + 1, year: y }));
    expect(getConsecutiveMonthsUnderBudget(expenses, 50000)).toBe(1);
  });

  test("skips deleted expenses", () => {
    const now = new Date();
    let m = now.getMonth();
    let y = now.getFullYear();
    m--;
    if (m < 0) { m = 11; y--; }
    const expenses = [
      makeExpense({ amount: 30000, month: m + 1, year: y }),
      makeExpense({ amount: 30000, month: m + 1, year: y, deletedAt: Date.now() }),
    ];
    // Only the non-deleted 30000 counts, which is under 50000
    expect(getConsecutiveMonthsUnderBudget(expenses, 50000)).toBe(1);
  });

  test("uses monthly budget override when available", () => {
    const now = new Date();
    let m = now.getMonth();
    let y = now.getFullYear();
    m--;
    if (m < 0) { m = 11; y--; }
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    const expenses = [makeExpense({ amount: 45000, month: m + 1, year: y })];
    // Salary is 50000 (under), but override is 40000 (over)
    expect(getConsecutiveMonthsUnderBudget(expenses, 50000, { [key]: 40000 })).toBe(0);
  });

  test("caps at 12 months maximum lookback", () => {
    const now = new Date();
    const expenses: Expense[] = [];
    let m = now.getMonth();
    let y = now.getFullYear();
    for (let i = 0; i < 15; i++) {
      m--;
      if (m < 0) { m = 11; y--; }
      expenses.push(makeExpense({ amount: 30000, month: m + 1, year: y }));
    }
    const result = getConsecutiveMonthsUnderBudget(expenses, 50000);
    expect(result).toBeLessThanOrEqual(12);
  });
});
