/// <reference types="jest" />
import {
  getCategoryTotal,
  getDailyTotal,
  getMonthlyTotal,
  getMonthlySaving,
  getAllCategoryTotals,
  getAllDailyTotals,
  getAverageDailySpend,
  getBudgetUsedPercent,
  getTopCategory,
  getEomForecast,
  detectAnomalies,
} from "../lib/calculations";
import type { Expense, CategoryId } from "../types";

// Helper to create test expenses
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

const ALL_CATEGORIES: CategoryId[] = [
  "subscriptions", "transport", "groceries", "eat-out", "shopping",
  "miscellaneous", "credit-card", "internet", "sip-nps",
];

// ---- Excel parity test data ----
// Simulates a month with known totals to verify against hand-calculatedvalues
const testExpenses: Expense[] = [
  // Day 1
  makeExpense({ category: "subscriptions", amount: 199, day: 1 }),
  makeExpense({ category: "transport", amount: 50, day: 1 }),
  // Day 2
  makeExpense({ category: "groceries", amount: 800, day: 2 }),
  makeExpense({ category: "eat-out", amount: 350, day: 2 }),
  // Day 5
  makeExpense({ category: "shopping", amount: 2500, day: 5 }),
  // Day 10
  makeExpense({ category: "internet", amount: 599, day: 10 }),
  makeExpense({ category: "credit-card", amount: 3000, day: 10 }),
  // Day 15
  makeExpense({ category: "sip-nps", amount: 5000, day: 15 }),
  makeExpense({ category: "miscellaneous", amount: 200, day: 15 }),
  makeExpense({ category: "transport", amount: 150, day: 15 }),
  // Day 20
  makeExpense({ category: "groceries", amount: 600, day: 20 }),
  makeExpense({ category: "eat-out", amount: 500, day: 20 }),
  // Day 28
  makeExpense({ category: "subscriptions", amount: 299, day: 28 }),
  // Soft-deleted expense (should be excluded)
  makeExpense({ category: "shopping", amount: 999, day: 3, deletedAt: Date.now() }),
];

// Expected values (Excel parity):
// Subscriptions: 199 + 299 = 498
// Transport: 50 + 150 = 200
// Groceries: 800 + 600 = 1400
// Eat Out: 350 + 500 = 850
// Shopping: 2500
// Miscellaneous: 200
// Credit Card: 3000
// Internet: 599
// SIP & NPS: 5000

// Grand Total: 498 + 200 + 1400 + 850 + 2500 + 200 + 3000 + 599 + 5000 = 14247
// Salary: 59400
// Month Saving: 59400 - 14247 = 45153

// Daily totals:
// Day 1: 199+50 = 249
// Day 2: 800+350 = 1150
// Day 5: 2500
// Day 10: 599+3000 = 3599
// Day 15: 5000+200+150 = 5350
// Day 20: 600+500 = 1100
// Day 28: 299

const SALARY = 59400;
const MONTH = 3;
const YEAR = 2026;

// =========== Tests ===========

describe("getCategoryTotal", () => {
  test("Subscriptions total matches Excel", () => {
    expect(getCategoryTotal(testExpenses, "subscriptions", MONTH, YEAR)).toBe(498);
  });

  test("Transport total matches Excel", () => {
    expect(getCategoryTotal(testExpenses, "transport", MONTH, YEAR)).toBe(200);
  });

  test("Groceries total matches Excel", () => {
    expect(getCategoryTotal(testExpenses, "groceries", MONTH, YEAR)).toBe(1400);
  });

  test("Eat Out total matches Excel", () => {
    expect(getCategoryTotal(testExpenses, "eat-out", MONTH, YEAR)).toBe(850);
  });

  test("Shopping total matches Excel (excludes soft-deleted)", () => {
    expect(getCategoryTotal(testExpenses, "shopping", MONTH, YEAR)).toBe(2500);
  });

  test("Miscellaneous total matches Excel", () => {
    expect(getCategoryTotal(testExpenses, "miscellaneous", MONTH, YEAR)).toBe(200);
  });

  test("Credit Card total matches Excel", () => {
    expect(getCategoryTotal(testExpenses, "credit-card", MONTH, YEAR)).toBe(3000);
  });

  test("Internet total matches Excel", () => {
    expect(getCategoryTotal(testExpenses, "internet", MONTH, YEAR)).toBe(599);
  });

  test("SIP & NPS total matches Excel", () => {
    expect(getCategoryTotal(testExpenses, "sip-nps", MONTH, YEAR)).toBe(5000);
  });
});

describe("getDailyTotal", () => {
  test("Day 1 total", () => {
    expect(getDailyTotal(testExpenses, 1, MONTH, YEAR)).toBe(249);
  });
  test("Day 2 total", () => {
    expect(getDailyTotal(testExpenses, 2, MONTH, YEAR)).toBe(1150);
  });
  test("Day 3 (only soft-deleted) = 0", () => {
    expect(getDailyTotal(testExpenses, 3, MONTH, YEAR)).toBe(0);
  });
  test("Day 5 total", () => {
    expect(getDailyTotal(testExpenses, 5, MONTH, YEAR)).toBe(2500);
  });
  test("Day 10 total", () => {
    expect(getDailyTotal(testExpenses, 10, MONTH, YEAR)).toBe(3599);
  });
  test("Day 15 total", () => {
    expect(getDailyTotal(testExpenses, 15, MONTH, YEAR)).toBe(5350);
  });
  test("Day 20 total", () => {
    expect(getDailyTotal(testExpenses, 20, MONTH, YEAR)).toBe(1100);
  });
  test("Day 28 total", () => {
    expect(getDailyTotal(testExpenses, 28, MONTH, YEAR)).toBe(299);
  });
  test("Day with no expenses = 0", () => {
    expect(getDailyTotal(testExpenses, 7, MONTH, YEAR)).toBe(0);
  });
});

describe("getMonthlyTotal", () => {
  test("Grand total matches Excel", () => {
    expect(getMonthlyTotal(testExpenses, MONTH, YEAR)).toBe(14247);
  });

  test("Cross-check: sum of category totals === grand total", () => {
    const catTotals = getAllCategoryTotals(testExpenses, ALL_CATEGORIES, MONTH, YEAR);
    const sumOfCategories = catTotals.reduce((s, c) => s + c.total, 0);
    expect(sumOfCategories).toBe(14247);
  });

  test("Cross-check: sum of daily totals === grand total", () => {
    const dailyTotals = getAllDailyTotals(testExpenses, MONTH, YEAR, 31);
    const sumOfDays = dailyTotals.reduce((s, d) => s + d.total, 0);
    expect(sumOfDays).toBe(14247);
  });
});

describe("getMonthlySaving", () => {
  test("Month saving matches Excel (salary - total)", () => {
    const total = getMonthlyTotal(testExpenses, MONTH, YEAR);
    expect(getMonthlySaving(SALARY, total)).toBe(45153);
  });

  test("Overspent returns negative", () => {
    expect(getMonthlySaving(10000, 15000)).toBe(-5000);
  });
});

describe("getAverageDailySpend", () => {
  test("Calculates correct average", () => {
    expect(getAverageDailySpend(14247, 19)).toBe(750);
  });

  test("Returns 0 when no elapsed days", () => {
    expect(getAverageDailySpend(14247, 0)).toBe(0);
  });
});

describe("getBudgetUsedPercent", () => {
  test("Calculates correct percentage", () => {
    expect(getBudgetUsedPercent(14247, SALARY)).toBe(24);
  });

  test("Returns 0 when salary is 0", () => {
    expect(getBudgetUsedPercent(14247, 0)).toBe(0);
  });
});

describe("getTopCategory", () => {
  test("Returns SIP & NPS as top category", () => {
    const result = getTopCategory(testExpenses, ALL_CATEGORIES, MONTH, YEAR);
    expect(result).not.toBeNull();
    expect(result!.category).toBe("sip-nps");
    expect(result!.total).toBe(5000);
  });

  test("Returns null when no expenses", () => {
    expect(getTopCategory([], ALL_CATEGORIES, MONTH, YEAR)).toBeNull();
  });
});

describe("Edge cases", () => {
  test("Empty expenses returns 0 for all KPIs", () => {
    expect(getMonthlyTotal([], MONTH, YEAR)).toBe(0);
    expect(getCategoryTotal([], "groceries", MONTH, YEAR)).toBe(0);
    expect(getDailyTotal([], 1, MONTH, YEAR)).toBe(0);
  });

  test("Wrong month returns 0", () => {
    expect(getMonthlyTotal(testExpenses, 4, YEAR)).toBe(0);
  });

  test("Wrong year returns 0", () => {
    expect(getMonthlyTotal(testExpenses, MONTH, 2025)).toBe(0);
  });

  test("February (28 days) works correctly", () => {
    const febExpenses = [
      makeExpense({ amount: 100, day: 28, month: 2, year: 2026 }),
    ];
    const dailyTotals = getAllDailyTotals(febExpenses, 2, 2026, 28);
    expect(dailyTotals).toHaveLength(28);
    expect(dailyTotals[27].total).toBe(100);
  });

  test("Single expense gives correct totals", () => {
    const single = [makeExpense({ amount: 500, day: 15, category: "groceries" })];
    expect(getMonthlyTotal(single, MONTH, YEAR)).toBe(500);
    expect(getCategoryTotal(single, "groceries", MONTH, YEAR)).toBe(500);
    expect(getDailyTotal(single, 15, MONTH, YEAR)).toBe(500);
    expect(getMonthlySaving(SALARY, 500)).toBe(58900);
  });
});

describe("getEomForecast", () => {
  test("projects correctly with given daily avg", () => {
    // getEomForecast(monthlyTotal, salary, elapsedDays, daysInMonth)
    // 14247 total, salary=59400, 20 elapsed days, 31 total days
    const result = getEomForecast(14247, SALARY, 20, 31);
    expect(result.projectedTotal).toBeCloseTo(14247 / 20 * 31, 0);
    expect(result.projectedRemaining).toBeCloseTo(SALARY - result.projectedTotal, 0);
  });

  test("returns zero forecast when 0 days elapsed", () => {
    const result = getEomForecast(0, SALARY, 0, 31);
    expect(result.projectedTotal).toBe(0);
    expect(result.confidence).toBe("low");
  });

  test("confidence is high when daysElapsed >= 15", () => {
    const result = getEomForecast(14247, SALARY, 20, 31);
    expect(result.confidence).toBe("high");
  });

  test("confidence is low when daysElapsed < 7", () => {
    const result = getEomForecast(2000, SALARY, 3, 31);
    expect(result.confidence).toBe("low");
  });
});

describe("detectAnomalies", () => {
  test("returns empty for fewer than 3 expenses in category", () => {
    const few = [
      makeExpense({ category: "groceries", amount: 100 }),
      makeExpense({ category: "groceries", amount: 200 }),
    ];
    expect(detectAnomalies(few, MONTH, YEAR)).toHaveLength(0);
  });

  test("flags an outlier expense", () => {
    const normal = Array.from({ length: 5 }, (_, i) =>
      makeExpense({ category: "groceries", amount: 100 + i * 10 })
    );
    const outlier = makeExpense({ category: "groceries", amount: 10000, id: "outlier" });
    const all = [...normal, outlier];
    const result = detectAnomalies(all, MONTH, YEAR);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((a) => a.expense.id === "outlier")).toBe(true);
  });

  test("does not flag normal expenses", () => {
    const normal = Array.from({ length: 10 }, (_, i) =>
      makeExpense({ category: "groceries", amount: 100 + i * 5 })
    );
    const result = detectAnomalies(normal, MONTH, YEAR);
    expect(result).toHaveLength(0);
  });
});
