import { detectRecurringPatterns } from "../lib/recurringDetection";
import type { Expense } from "../types";

function makeExpense(overrides: Partial<Expense> & { category: string; amount: number; month: number; year: number; day: number }): Expense {
  return {
    id: `${overrides.category}-${overrides.year}-${overrides.month}-${overrides.day}-${overrides.amount}`,
    remark: "",
    isRecurring: false,
    recurringId: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    deviceId: "test",
    ...overrides,
  };
}

describe("detectRecurringPatterns", () => {
  it("returns empty for fewer than 2 expenses", () => {
    expect(detectRecurringPatterns([])).toEqual([]);
    expect(
      detectRecurringPatterns([
        makeExpense({ category: "food", amount: 500, month: 1, year: 2025, day: 15 }),
      ]),
    ).toEqual([]);
  });

  it("detects a simple 3-month recurring pattern", () => {
    const expenses = [
      makeExpense({ category: "subscriptions", amount: 199, month: 1, year: 2025, day: 5, remark: "Netflix" }),
      makeExpense({ category: "subscriptions", amount: 199, month: 2, year: 2025, day: 5, remark: "Netflix" }),
      makeExpense({ category: "subscriptions", amount: 199, month: 3, year: 2025, day: 5, remark: "Netflix" }),
    ];

    const result = detectRecurringPatterns(expenses);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("subscriptions");
    expect(result[0].averageAmount).toBe(199);
    expect(result[0].averageDay).toBe(5);
    expect(result[0].matchCount).toBe(3);
    expect(result[0].confidence).toBe(0.5); // 3/6
    expect(result[0].remark).toBe("Netflix");
  });

  it("allows ±5% amount tolerance", () => {
    const expenses = [
      makeExpense({ category: "utilities", amount: 1000, month: 1, year: 2025, day: 10 }),
      makeExpense({ category: "utilities", amount: 1040, month: 2, year: 2025, day: 10 }),
      makeExpense({ category: "utilities", amount: 980, month: 3, year: 2025, day: 11 }),
    ];

    const result = detectRecurringPatterns(expenses);
    expect(result).toHaveLength(1);
    expect(result[0].matchCount).toBe(3);
  });

  it("allows ±5 day tolerance", () => {
    const expenses = [
      makeExpense({ category: "rent", amount: 15000, month: 1, year: 2025, day: 1 }),
      makeExpense({ category: "rent", amount: 15000, month: 2, year: 2025, day: 3 }),
      makeExpense({ category: "rent", amount: 15000, month: 3, year: 2025, day: 6 }),
    ];

    const result = detectRecurringPatterns(expenses);
    expect(result).toHaveLength(1);
    expect(result[0].matchCount).toBe(3);
  });

  it("rejects if day difference exceeds tolerance", () => {
    const expenses = [
      makeExpense({ category: "food", amount: 500, month: 1, year: 2025, day: 1 }),
      makeExpense({ category: "food", amount: 500, month: 2, year: 2025, day: 20 }),
      makeExpense({ category: "food", amount: 500, month: 3, year: 2025, day: 1 }),
    ];

    const result = detectRecurringPatterns(expenses);
    // Non-consecutive monthly chain due to day gap, shouldn't form a 3-month pattern
    expect(result.every((s) => s.matchCount < 3)).toBe(true);
  });

  it("requires consecutive months", () => {
    const expenses = [
      makeExpense({ category: "subscriptions", amount: 299, month: 1, year: 2025, day: 10 }),
      makeExpense({ category: "subscriptions", amount: 299, month: 3, year: 2025, day: 10 }),
      makeExpense({ category: "subscriptions", amount: 299, month: 5, year: 2025, day: 10 }),
    ];

    const result = detectRecurringPatterns(expenses);
    // Months 1, 3, 5 are not consecutive
    expect(result.every((s) => s.matchCount < 3)).toBe(true);
  });

  it("excludes already-recurring (isRecurring=true) expenses", () => {
    const expenses = [
      makeExpense({ category: "subscriptions", amount: 199, month: 1, year: 2025, day: 5, isRecurring: true }),
      makeExpense({ category: "subscriptions", amount: 199, month: 2, year: 2025, day: 5, isRecurring: true }),
      makeExpense({ category: "subscriptions", amount: 199, month: 3, year: 2025, day: 5, isRecurring: true }),
    ];

    expect(detectRecurringPatterns(expenses)).toEqual([]);
  });

  it("excludes soft-deleted expenses", () => {
    const expenses = [
      makeExpense({ category: "subscriptions", amount: 199, month: 1, year: 2025, day: 5, deletedAt: Date.now() }),
      makeExpense({ category: "subscriptions", amount: 199, month: 2, year: 2025, day: 5 }),
      makeExpense({ category: "subscriptions", amount: 199, month: 3, year: 2025, day: 5 }),
    ];

    const result = detectRecurringPatterns(expenses);
    // Only 2 eligible expenses, forming a 2-month chain
    expect(result).toHaveLength(1);
    expect(result[0].matchCount).toBe(2);
  });

  it("respects dismissed suggestions", () => {
    const expenses = [
      makeExpense({ category: "subscriptions", amount: 199, month: 1, year: 2025, day: 5 }),
      makeExpense({ category: "subscriptions", amount: 199, month: 2, year: 2025, day: 5 }),
      makeExpense({ category: "subscriptions", amount: 199, month: 3, year: 2025, day: 5 }),
    ];

    const result = detectRecurringPatterns(expenses, ["subscriptions|199"]);
    expect(result).toEqual([]);
  });

  it("detects multiple patterns from different categories", () => {
    const expenses = [
      // Pattern 1: subscriptions
      makeExpense({ category: "subscriptions", amount: 199, month: 1, year: 2025, day: 5 }),
      makeExpense({ category: "subscriptions", amount: 199, month: 2, year: 2025, day: 5 }),
      makeExpense({ category: "subscriptions", amount: 199, month: 3, year: 2025, day: 5 }),
      // Pattern 2: rent
      makeExpense({ category: "rent", amount: 15000, month: 1, year: 2025, day: 1 }),
      makeExpense({ category: "rent", amount: 15000, month: 2, year: 2025, day: 1 }),
      makeExpense({ category: "rent", amount: 15000, month: 3, year: 2025, day: 1 }),
      // Random non-recurring food expenses
      makeExpense({ category: "food", amount: 150, month: 1, year: 2025, day: 3 }),
      makeExpense({ category: "food", amount: 800, month: 2, year: 2025, day: 17 }),
    ];

    const result = detectRecurringPatterns(expenses);
    expect(result).toHaveLength(2);
    const categories = result.map((r) => r.category).sort();
    expect(categories).toEqual(["rent", "subscriptions"]);
  });

  it("caps confidence at 1.0 for 6+ months", () => {
    const expenses = Array.from({ length: 8 }, (_, i) => {
      const m = (i % 12) + 1;
      const y = 2025 + Math.floor(i / 12);
      return makeExpense({ category: "gym", amount: 2000, month: m, year: y, day: 1, remark: "Gym membership" });
    });

    const result = detectRecurringPatterns(expenses);
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(1);
    expect(result[0].remark).toBe("Gym membership");
  });

  it("picks the most common remark", () => {
    const expenses = [
      makeExpense({ category: "subscriptions", amount: 199, month: 1, year: 2025, day: 5, remark: "Netflix" }),
      makeExpense({ category: "subscriptions", amount: 199, month: 2, year: 2025, day: 5, remark: "Netflix" }),
      makeExpense({ category: "subscriptions", amount: 199, month: 3, year: 2025, day: 5, remark: "Streaming" }),
    ];

    const result = detectRecurringPatterns(expenses);
    expect(result[0].remark).toBe("Netflix");
  });

  it("handles year boundary (Dec → Jan)", () => {
    const expenses = [
      makeExpense({ category: "insurance", amount: 5000, month: 11, year: 2024, day: 15 }),
      makeExpense({ category: "insurance", amount: 5000, month: 12, year: 2024, day: 15 }),
      makeExpense({ category: "insurance", amount: 5000, month: 1, year: 2025, day: 15 }),
    ];

    const result = detectRecurringPatterns(expenses);
    expect(result).toHaveLength(1);
    expect(result[0].matchCount).toBe(3);
  });
});
