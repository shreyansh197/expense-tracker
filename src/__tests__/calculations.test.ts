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
  getStackedDailyTotals,
  getPaceToStayUnder,
  getExponentialWeightedAvg,
  getDayOfWeekFactors,
  getWeightedForecast,
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

  test("returns empty when all amounts are identical (MAD=0)", () => {
    const same = Array.from({ length: 5 }, () =>
      makeExpense({ category: "groceries", amount: 100 })
    );
    expect(detectAnomalies(same, MONTH, YEAR)).toHaveLength(0);
  });

  test("anomalies are sorted by z-score descending", () => {
    const normal = Array.from({ length: 6 }, () =>
      makeExpense({ category: "groceries", amount: 100 })
    );
    // Two outliers of different severity
    const outlier1 = makeExpense({ category: "groceries", amount: 5000, id: "o1" });
    const outlier2 = makeExpense({ category: "groceries", amount: 50000, id: "o2" });
    // MAD is 0 for identical values, so vary them slightly
    normal[0] = makeExpense({ category: "groceries", amount: 95 });
    normal[1] = makeExpense({ category: "groceries", amount: 105 });
    const all = [...normal, outlier1, outlier2];
    const result = detectAnomalies(all, MONTH, YEAR);
    if (result.length >= 2) {
      expect(result[0].zScore).toBeGreaterThanOrEqual(result[1].zScore);
    }
  });

  test("does not flag deleted expenses", () => {
    const normal = Array.from({ length: 5 }, (_, i) =>
      makeExpense({ category: "groceries", amount: 100 + i * 10 })
    );
    const deletedOutlier = makeExpense({
      category: "groceries", amount: 99999, deletedAt: Date.now(),
    });
    const result = detectAnomalies([...normal, deletedOutlier], MONTH, YEAR);
    expect(result.every((a) => a.expense.deletedAt === null)).toBe(true);
  });

  test("custom threshold changes sensitivity", () => {
    const normal = Array.from({ length: 6 }, (_, i) =>
      makeExpense({ category: "groceries", amount: 100 + i * 5 })
    );
    const mild = makeExpense({ category: "groceries", amount: 500 });
    const all = [...normal, mild];
    const strict = detectAnomalies(all, MONTH, YEAR, 1.0);
    const lenient = detectAnomalies(all, MONTH, YEAR, 10.0);
    expect(strict.length).toBeGreaterThanOrEqual(lenient.length);
  });
});

// =========== getAllCategoryTotals (orphan categories) ===========

describe("getAllCategoryTotals", () => {
  test("includes all listed categories even with 0 total", () => {
    const totals = getAllCategoryTotals([], ALL_CATEGORIES, MONTH, YEAR);
    expect(totals).toHaveLength(ALL_CATEGORIES.length);
    expect(totals.every((t) => t.total === 0)).toBe(true);
  });

  test("includes orphan categories not in settings list", () => {
    const orphanExpense = makeExpense({ category: "custom-cat" as CategoryId, amount: 777 });
    const totals = getAllCategoryTotals([orphanExpense], ALL_CATEGORIES, MONTH, YEAR);
    const orphan = totals.find((t) => t.category === "custom-cat");
    expect(orphan).toBeDefined();
    expect(orphan!.total).toBe(777);
  });

  test("orphan totals aggregate correctly", () => {
    const expenses = [
      makeExpense({ category: "custom-cat" as CategoryId, amount: 100 }),
      makeExpense({ category: "custom-cat" as CategoryId, amount: 200 }),
    ];
    const totals = getAllCategoryTotals(expenses, ALL_CATEGORIES, MONTH, YEAR);
    const orphan = totals.find((t) => t.category === "custom-cat");
    expect(orphan!.total).toBe(300);
  });

  test("known + orphan totals sum to monthly total", () => {
    const expenses = [
      ...testExpenses,
      makeExpense({ category: "custom-cat" as CategoryId, amount: 555 }),
    ];
    const totals = getAllCategoryTotals(expenses, ALL_CATEGORIES, MONTH, YEAR);
    const sum = totals.reduce((s, t) => s + t.total, 0);
    expect(sum).toBe(14247 + 555);
  });
});

// =========== getStackedDailyTotals ===========

describe("getStackedDailyTotals", () => {
  test("returns correct number of days", () => {
    const stacked = getStackedDailyTotals(testExpenses, ALL_CATEGORIES, MONTH, YEAR, 31);
    expect(stacked).toHaveLength(31);
  });

  test("each day has a total matching getDailyTotal", () => {
    const stacked = getStackedDailyTotals(testExpenses, ALL_CATEGORIES, MONTH, YEAR, 31);
    for (const row of stacked) {
      expect(row.total).toBe(getDailyTotal(testExpenses, row.day, MONTH, YEAR));
    }
  });

  test("category breakdown sums to day total", () => {
    const stacked = getStackedDailyTotals(testExpenses, ALL_CATEGORIES, MONTH, YEAR, 31);
    for (const row of stacked) {
      let catSum = 0;
      for (const key of Object.keys(row)) {
        if (key !== "day" && key !== "total") catSum += row[key] as number;
      }
      expect(catSum).toBe(row.total);
    }
  });

  test("empty expenses return zero totals for all days", () => {
    const stacked = getStackedDailyTotals([], ALL_CATEGORIES, MONTH, YEAR, 28);
    expect(stacked).toHaveLength(28);
    expect(stacked.every((row) => row.total === 0)).toBe(true);
  });

  test("excludes soft-deleted expenses", () => {
    const stacked = getStackedDailyTotals(testExpenses, ALL_CATEGORIES, MONTH, YEAR, 31);
    // Day 3 has only a deleted expense
    expect(stacked[2].total).toBe(0);
  });
});

// =========== getPaceToStayUnder ===========

describe("getPaceToStayUnder", () => {
  test("calculates correct daily pace", () => {
    expect(getPaceToStayUnder(10000, 10)).toBe(1000);
  });

  test("returns 0 when no days remaining", () => {
    expect(getPaceToStayUnder(10000, 0)).toBe(0);
  });

  test("returns 0 when remaining is negative (already over budget)", () => {
    expect(getPaceToStayUnder(-5000, 10)).toBe(0);
  });

  test("rounds to nearest integer", () => {
    expect(getPaceToStayUnder(10000, 3)).toBe(3333);
  });
});

// =========== getAllDailyTotals additional ===========

describe("getAllDailyTotals extended", () => {
  test("returns correct for leap year February (29 days)", () => {
    const febExpenses = [
      makeExpense({ amount: 50, day: 29, month: 2, year: 2028 }),
    ];
    const totals = getAllDailyTotals(febExpenses, 2, 2028, 29);
    expect(totals).toHaveLength(29);
    expect(totals[28].total).toBe(50);
  });

  test("daily totals sum correctly with multiple categories per day", () => {
    const totals = getAllDailyTotals(testExpenses, MONTH, YEAR, 31);
    const day10 = totals.find((d) => d.day === 10);
    expect(day10!.total).toBe(3599); // internet 599 + credit-card 3000
  });
});

// =========== getEomForecast additional ===========

describe("getEomForecast extended", () => {
  test("confidence is medium when 7 <= elapsed < 15", () => {
    const result = getEomForecast(5000, SALARY, 10, 31);
    expect(result.confidence).toBe("medium");
  });

  test("projectedRemaining is negative when overspending", () => {
    // Spend 50000 in 10 days of a 31-day month → projected ~155000 vs salary 59400
    const result = getEomForecast(50000, SALARY, 10, 31);
    expect(result.projectedRemaining).toBeLessThan(0);
  });

  test("projectedTotal equals monthlyTotal when all days elapsed", () => {
    const result = getEomForecast(14247, SALARY, 31, 31);
    expect(result.projectedTotal).toBe(14247);
  });
});

// =========== additional edge cases ===========

describe("additional edge cases", () => {
  test("very large amount does not cause overflow", () => {
    const bigExpense = [makeExpense({ amount: Number.MAX_SAFE_INTEGER / 2, day: 1 })];
    expect(getMonthlyTotal(bigExpense, MONTH, YEAR)).toBe(Number.MAX_SAFE_INTEGER / 2);
  });

  test("zero-amount expenses are counted (0 total)", () => {
    const zeroExp = [makeExpense({ amount: 0, day: 5 })];
    expect(getMonthlyTotal(zeroExp, MONTH, YEAR)).toBe(0);
    expect(getDailyTotal(zeroExp, 5, MONTH, YEAR)).toBe(0);
  });

  test("multiple categories on same day", () => {
    const exps = [
      makeExpense({ category: "groceries", amount: 100, day: 1 }),
      makeExpense({ category: "transport", amount: 200, day: 1 }),
      makeExpense({ category: "eat-out", amount: 300, day: 1 }),
    ];
    expect(getDailyTotal(exps, 1, MONTH, YEAR)).toBe(600);
  });

  test("getBudgetUsedPercent with negative salary returns 0", () => {
    expect(getBudgetUsedPercent(1000, -100)).toBe(0);
  });

  test("getMonthlySaving with zero salary", () => {
    expect(getMonthlySaving(0, 5000)).toBe(-5000);
  });

  test("getTopCategory with single category", () => {
    const exps = [makeExpense({ category: "groceries", amount: 500 })];
    const result = getTopCategory(exps, ["groceries"], MONTH, YEAR);
    expect(result).not.toBeNull();
    expect(result!.category).toBe("groceries");
  });

  test("getTopCategory with all-zero categories returns null", () => {
    const result = getTopCategory([], ALL_CATEGORIES, MONTH, YEAR);
    expect(result).toBeNull();
  });

  test("getAverageDailySpend rounds correctly", () => {
    // 14247 / 19 = 749.84... → rounds to 750
    expect(getAverageDailySpend(14247, 19)).toBe(750);
    // 100 / 3 = 33.33... → rounds to 33
    expect(getAverageDailySpend(100, 3)).toBe(33);
  });

  test("getBudgetUsedPercent rounds correctly", () => {
    // 14247 / 59400 = 23.98% → rounds to 24
    expect(getBudgetUsedPercent(14247, SALARY)).toBe(24);
    // 1 / 3 = 33.33% → rounds to 33
    expect(getBudgetUsedPercent(1, 3)).toBe(33);
  });
});

// ═══════════════════════════════════════════════════════════════
// WEIGHTED FORECAST TESTS
// ═══════════════════════════════════════════════════════════════

describe("getExponentialWeightedAvg", () => {
  test("returns 0 for empty array", () => {
    expect(getExponentialWeightedAvg([])).toBe(0);
  });

  test("returns the single value for length-1 array", () => {
    expect(getExponentialWeightedAvg([5000])).toBe(5000);
  });

  test("weights recent values more heavily", () => {
    // [10000, 20000, 30000] with alpha=0.3
    // ema0 = 10000
    // ema1 = 0.3*20000 + 0.7*10000 = 6000+7000 = 13000
    // ema2 = 0.3*30000 + 0.7*13000 = 9000+9100 = 18100
    expect(getExponentialWeightedAvg([10000, 20000, 30000], 0.3)).toBe(18100);
  });

  test("higher alpha gives more weight to recent", () => {
    const totals = [10000, 50000];
    const lowAlpha = getExponentialWeightedAvg(totals, 0.1);
    const highAlpha = getExponentialWeightedAvg(totals, 0.9);
    expect(highAlpha).toBeGreaterThan(lowAlpha);
  });
});

describe("getDayOfWeekFactors", () => {
  test("returns all 1.0 factors for empty expenses", () => {
    const factors = getDayOfWeekFactors([]);
    expect(Object.keys(factors)).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      expect(factors[i]).toBe(1);
    }
  });

  test("produces higher factor for day with more spending", () => {
    // Jan 6, 2025 is a Monday (dow=1), Jan 7 is Tuesday (dow=2)
    const expenses = [
      makeExpense({ amount: 1000, day: 6, month: 1, year: 2025 }), // Monday
      makeExpense({ amount: 100, day: 7, month: 1, year: 2025 }),  // Tuesday
    ];
    const factors = getDayOfWeekFactors(expenses);
    expect(factors[1]).toBeGreaterThan(factors[2]); // Monday > Tuesday
  });

  test("excludes soft-deleted expenses", () => {
    const expenses = [
      makeExpense({ amount: 1000, day: 6, month: 1, year: 2025, deletedAt: Date.now() }),
    ];
    const factors = getDayOfWeekFactors(expenses);
    // All should be 1 since the only expense is deleted
    for (let i = 0; i < 7; i++) {
      expect(factors[i]).toBe(1);
    }
  });
});

describe("getWeightedForecast", () => {
  test("falls back to linear with < 2 historical months", () => {
    const result = getWeightedForecast(10000, 50000, 15, 31, 3, 2025, [5000], []);
    expect(result.method).toBe("linear");
    expect(result.historicalMonths).toBe(0);
  });

  test("uses weighted method with ≥ 2 historical months", () => {
    const history = [40000, 45000, 42000]; // 3 months of data
    const expenses = [
      makeExpense({ amount: 200, day: 1, month: 1, year: 2025 }),
      makeExpense({ amount: 200, day: 15, month: 2, year: 2025 }),
    ];
    const result = getWeightedForecast(10000, 50000, 10, 31, 3, 2025, history, expenses);
    expect(result.method).toBe("weighted");
    expect(result.historicalMonths).toBe(3);
    expect(result.projectedTotal).toBeGreaterThan(0);
  });

  test("falls back to linear with 0 elapsed days", () => {
    const result = getWeightedForecast(0, 50000, 0, 31, 3, 2025, [40000, 45000], []);
    expect(result.method).toBe("linear");
    expect(result.projectedTotal).toBe(0);
  });

  test("higher historical spending projects higher totals", () => {
    const lowHistory = [20000, 22000];
    const highHistory = [80000, 85000];
    const lowResult = getWeightedForecast(10000, 100000, 10, 31, 3, 2025, lowHistory, []);
    const highResult = getWeightedForecast(10000, 100000, 10, 31, 3, 2025, highHistory, []);
    expect(highResult.projectedTotal).toBeGreaterThan(lowResult.projectedTotal);
  });

  test("confidence is high with ≥ 4 months and ≥ 10 elapsed days", () => {
    const history = [40000, 42000, 45000, 43000];
    const result = getWeightedForecast(15000, 50000, 15, 31, 3, 2025, history, []);
    expect(result.confidence).toBe("high");
  });

  test("confidence is medium with 2 months and ≥ 5 elapsed days", () => {
    const history = [40000, 42000];
    const result = getWeightedForecast(15000, 50000, 7, 31, 3, 2025, history, []);
    expect(result.confidence).toBe("medium");
  });
});
