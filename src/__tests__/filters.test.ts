/// <reference types="jest" />
import { filterExpenses, groupByDay } from "../lib/filters";
import type { Expense } from "../types";

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

const expenses: Expense[] = [
  makeExpense({ category: "groceries", amount: 500, day: 1, remark: "Milk and eggs" }),
  makeExpense({ category: "transport", amount: 200, day: 1, remark: "Uber ride" }),
  makeExpense({ category: "groceries", amount: 300, day: 5, remark: "Veggies" }),
  makeExpense({ category: "eat-out", amount: 800, day: 10, remark: "Dinner" }),
  makeExpense({ category: "shopping", amount: 2000, day: 15 }),
  makeExpense({ category: "subscriptions", amount: 199, day: 20, remark: "Netflix" }),
];

describe("filterExpenses", () => {
  test("returns all when no filters applied", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "" });
    expect(result).toHaveLength(6);
  });

  test("filters by activeCategories", () => {
    const result = filterExpenses(expenses, { activeCategories: ["groceries"], searchQuery: "" });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.category === "groceries")).toBe(true);
  });

  test("filters by multiple categories", () => {
    const result = filterExpenses(expenses, {
      activeCategories: ["groceries", "transport"],
      searchQuery: "",
    });
    expect(result).toHaveLength(3);
  });

  test("filters by search query (remark)", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "netflix" });
    expect(result).toHaveLength(1);
    expect(result[0].remark).toBe("Netflix");
  });

  test("filters by search query (category name)", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "eat-out" });
    expect(result).toHaveLength(1);
  });

  test("filters by day:N syntax", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "day:5" });
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(5);
  });

  test("filters by amountMin", () => {
    const result = filterExpenses(expenses, {
      activeCategories: [],
      searchQuery: "",
      amountMin: 500,
    });
    expect(result).toHaveLength(3); // 500, 800, 2000
  });

  test("filters by amountMax", () => {
    const result = filterExpenses(expenses, {
      activeCategories: [],
      searchQuery: "",
      amountMax: 300,
    });
    expect(result).toHaveLength(3); // 200, 300, 199
  });

  test("filters by amount range", () => {
    const result = filterExpenses(expenses, {
      activeCategories: [],
      searchQuery: "",
      amountMin: 200,
      amountMax: 500,
    });
    expect(result).toHaveLength(3); // 500, 200, 300
  });

  test("filters by dayMin and dayMax", () => {
    const result = filterExpenses(expenses, {
      activeCategories: [],
      searchQuery: "",
      dayMin: 5,
      dayMax: 15,
    });
    expect(result).toHaveLength(3); // day 5, 10, 15
  });

  test("combines category + amount filters", () => {
    const result = filterExpenses(expenses, {
      activeCategories: ["groceries"],
      searchQuery: "",
      amountMin: 400,
    });
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(500);
  });
});

describe("groupByDay", () => {
  test("groups expenses by day descending", () => {
    const groups = groupByDay(expenses, "day-desc");
    expect(groups[0].day).toBeGreaterThan(groups[groups.length - 1].day);
  });

  test("groups expenses by day ascending", () => {
    const groups = groupByDay(expenses, "day-asc");
    expect(groups[0].day).toBeLessThan(groups[groups.length - 1].day);
  });

  test("day 1 group has correct total", () => {
    const groups = groupByDay(expenses, "day-desc");
    const day1 = groups.find((g) => g.day === 1);
    expect(day1).toBeDefined();
    expect(day1!.total).toBe(700); // 500 + 200
    expect(day1!.expenses).toHaveLength(2);
  });

  test("amount-desc sorts groups by total descending", () => {
    const groups = groupByDay(expenses, "amount-desc");
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].total).toBeGreaterThanOrEqual(groups[i].total);
    }
  });

  test("amount-asc sorts groups by total ascending", () => {
    const groups = groupByDay(expenses, "amount-asc");
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].total).toBeLessThanOrEqual(groups[i].total);
    }
  });
});

// =========== filterExpenses edge cases ===========

describe("filterExpenses edge cases", () => {
  test("returns empty array for empty expenses", () => {
    const result = filterExpenses([], { activeCategories: [], searchQuery: "" });
    expect(result).toHaveLength(0);
  });

  test("search with only whitespace returns all", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "   " });
    expect(result).toHaveLength(6);
  });

  test("search is case-insensitive", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "NETFLIX" });
    expect(result).toHaveLength(1);
  });

  test("day:0 matches no expenses", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "day:0" });
    expect(result).toHaveLength(0);
  });

  test("day:99 matches no expenses", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "day:99" });
    expect(result).toHaveLength(0);
  });

  test("non-existent category returns empty", () => {
    const result = filterExpenses(expenses, { activeCategories: ["nonexistent" as string], searchQuery: "" });
    expect(result).toHaveLength(0);
  });

  test("amountMin equal to amount includes it", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "", amountMin: 800 });
    expect(result.some((e) => e.amount === 800)).toBe(true);
  });

  test("amountMax equal to amount includes it", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "", amountMax: 200 });
    expect(result.some((e) => e.amount === 200)).toBe(true);
  });

  test("amountMin > amountMax returns empty", () => {
    const result = filterExpenses(expenses, {
      activeCategories: [],
      searchQuery: "",
      amountMin: 1000,
      amountMax: 100,
    });
    expect(result).toHaveLength(0);
  });

  test("NaN amountMin is ignored", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "", amountMin: NaN });
    expect(result).toHaveLength(6);
  });

  test("NaN amountMax is ignored", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "", amountMax: NaN });
    expect(result).toHaveLength(6);
  });

  test("dayMin equal to dayMax returns that day only", () => {
    const result = filterExpenses(expenses, {
      activeCategories: [],
      searchQuery: "",
      dayMin: 10,
      dayMax: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(10);
  });

  test("combines all filters: category + search + amount + day range", () => {
    const result = filterExpenses(expenses, {
      activeCategories: ["groceries"],
      searchQuery: "veggies",
      amountMin: 100,
      amountMax: 500,
      dayMin: 1,
      dayMax: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0].remark).toBe("Veggies");
  });

  test("search matches partial category name", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "grocer" });
    expect(result).toHaveLength(2);
  });

  test("search matches partial remark", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "milk" });
    expect(result).toHaveLength(1);
  });

  test("expenses without remark still matched by category search", () => {
    const result = filterExpenses(expenses, { activeCategories: [], searchQuery: "shopping" });
    expect(result).toHaveLength(1);
    expect(result[0].remark).toBeUndefined();
  });
});

// =========== groupByDay edge cases ===========

describe("groupByDay edge cases", () => {
  test("empty input returns empty groups", () => {
    expect(groupByDay([], "day-desc")).toHaveLength(0);
  });

  test("single expense creates one group", () => {
    const single = [makeExpense({ amount: 500, day: 3 })];
    const groups = groupByDay(single, "day-desc");
    expect(groups).toHaveLength(1);
    expect(groups[0].day).toBe(3);
    expect(groups[0].total).toBe(500);
    expect(groups[0].expenses).toHaveLength(1);
  });

  test("all expenses on same day creates one group", () => {
    const sameDayExpenses = [
      makeExpense({ amount: 100, day: 5 }),
      makeExpense({ amount: 200, day: 5 }),
      makeExpense({ amount: 300, day: 5 }),
    ];
    const groups = groupByDay(sameDayExpenses, "day-desc");
    expect(groups).toHaveLength(1);
    expect(groups[0].total).toBe(600);
    expect(groups[0].expenses).toHaveLength(3);
  });

  test("expenses within a day group are sorted by amount desc (day-desc mode)", () => {
    const dayExpenses = [
      makeExpense({ amount: 50, day: 1 }),
      makeExpense({ amount: 500, day: 1 }),
      makeExpense({ amount: 200, day: 1 }),
    ];
    const groups = groupByDay(dayExpenses, "day-desc");
    const amounts = groups[0].expenses.map((e) => e.amount);
    expect(amounts).toEqual([500, 200, 50]);
  });

  test("default sort is day-desc", () => {
    const groups = groupByDay(expenses);
    expect(groups[0].day).toBeGreaterThan(groups[groups.length - 1].day);
  });

  test("groupByDay sum of all group totals equals sum of all amounts", () => {
    const groups = groupByDay(expenses, "day-desc");
    const groupSum = groups.reduce((s, g) => s + g.total, 0);
    const expenseSum = expenses.reduce((s, e) => s + e.amount, 0);
    expect(groupSum).toBe(expenseSum);
  });
});
