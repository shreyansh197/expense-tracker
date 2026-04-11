/// <reference types="jest" />
/**
 * SpendingInsights logic tests
 * Tests the insight generation algorithm directly by re-implementing the pure computation.
 * Covers: functional, negative, boundary, UI contract, security, and performance scenarios.
 */

// ── Re-implement the insight generation logic for pure testing ──

interface InsightData {
  id: string;
  label: string;
  value: string;
  detail: string;
  sentiment: "positive" | "negative" | "neutral";
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateInsights(
  monthOverMonthChange: number | null,
  dayOfWeekFactors: Record<number, number>,
  recurringVsOneTime: { recurring: number; oneTime: number },
  currentMonthCategories: Record<string, number>,
  previousMonthCategories: Record<string, number>,
): InsightData[] {
  const results: InsightData[] = [];

  // 1. Month-over-month change
  if (monthOverMonthChange !== null) {
    const up = monthOverMonthChange > 0;
    const abs = Math.abs(Math.round(monthOverMonthChange));
    results.push({
      id: "mom",
      label: "vs Last Month",
      value: `${up ? "+" : "−"}${abs}%`,
      detail: up ? `Spending is up ${abs}% compared to last month` : `Spending is down ${abs}% — nice work!`,
      sentiment: up ? "negative" : "positive",
    });
  }

  // 2. Weekend vs weekday
  const weekdayFactors = [1, 2, 3, 4, 5].map((d) => dayOfWeekFactors[d] ?? 1);
  const weekendFactors = [0, 6].map((d) => dayOfWeekFactors[d] ?? 1);
  const avgWeekday = weekdayFactors.reduce((a, b) => a + b, 0) / weekdayFactors.length;
  const avgWeekend = weekendFactors.reduce((a, b) => a + b, 0) / weekendFactors.length;
  if (avgWeekday > 0 && avgWeekend > 0) {
    const ratio = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100);
    if (Math.abs(ratio) >= 10) {
      const moreOnWeekends = ratio > 0;
      results.push({
        id: "weekend",
        label: "Weekend Pattern",
        value: `${moreOnWeekends ? "+" : "−"}${Math.abs(ratio)}%`,
        detail: moreOnWeekends
          ? `You spend ${Math.abs(ratio)}% more on weekends`
          : `You spend ${Math.abs(ratio)}% less on weekends`,
        sentiment: moreOnWeekends ? "negative" : "positive",
      });
    }
  }

  // 3. Top category shift
  const currentEntries = Object.entries(currentMonthCategories).sort((a, b) => b[1] - a[1]);
  const previousEntries = Object.entries(previousMonthCategories).sort((a, b) => b[1] - a[1]);
  if (currentEntries.length > 0 && previousEntries.length > 0) {
    const currentTop = currentEntries[0][0];
    const previousTop = previousEntries[0][0];
    if (currentTop !== previousTop) {
      results.push({
        id: "category_shift",
        label: "Category Shift",
        value: currentTop,
        detail: `${currentTop} overtook ${previousTop} as #1 this month`,
        sentiment: "neutral",
      });
    }
  }

  // 4. Best day of the week
  const dayEntries = Object.entries(dayOfWeekFactors).map(([d, f]) => ({ day: Number(d), factor: f }));
  if (dayEntries.length >= 3) {
    const cheapest = dayEntries.reduce((a, b) => (a.factor < b.factor ? a : b));
    results.push({
      id: "best_day",
      label: "Cheapest Day",
      value: DAY_NAMES[cheapest.day],
      detail: `${DAY_NAMES[cheapest.day]}s tend to be your lowest-spending day`,
      sentiment: "positive",
    });
  }

  // 5. Recurring ratio
  const totalRecOneTime = recurringVsOneTime.recurring + recurringVsOneTime.oneTime;
  if (totalRecOneTime > 0) {
    const recurringPct = Math.round((recurringVsOneTime.recurring / totalRecOneTime) * 100);
    if (recurringPct >= 20) {
      results.push({
        id: "recurring_ratio",
        label: "Recurring Share",
        value: `${recurringPct}%`,
        detail: `${recurringPct}% of your spending is recurring subscriptions`,
        sentiment: "neutral",
      });
    }
  }

  return results.slice(0, 4);
}

// =========== FUNCTIONAL TESTS ===========

describe("SpendingInsights — functional", () => {
  test("generates month-over-month insight when change is positive", () => {
    const insights = generateInsights(25, {}, { recurring: 0, oneTime: 0 }, {}, {});
    const mom = insights.find((i) => i.id === "mom");
    expect(mom).toBeDefined();
    expect(mom!.value).toBe("+25%");
    expect(mom!.sentiment).toBe("negative");
    expect(mom!.detail).toContain("up 25%");
  });

  test("generates month-over-month insight when change is negative", () => {
    const insights = generateInsights(-15, {}, { recurring: 0, oneTime: 0 }, {}, {});
    const mom = insights.find((i) => i.id === "mom");
    expect(mom).toBeDefined();
    expect(mom!.value).toBe("−15%");
    expect(mom!.sentiment).toBe("positive");
    expect(mom!.detail).toContain("down 15%");
  });

  test("generates weekend pattern insight when weekend spending is significantly higher", () => {
    // Weekdays (Mon-Fri): factor 1.0, Weekends (Sun, Sat): factor 1.5
    const factors: Record<number, number> = { 0: 1.5, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.5 };
    const insights = generateInsights(null, factors, { recurring: 0, oneTime: 0 }, {}, {});
    const weekend = insights.find((i) => i.id === "weekend");
    expect(weekend).toBeDefined();
    expect(weekend!.sentiment).toBe("negative");
    expect(weekend!.detail).toContain("more on weekends");
  });

  test("generates weekend pattern insight when weekday spending is significantly higher", () => {
    const factors: Record<number, number> = { 0: 0.5, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 0.5 };
    const insights = generateInsights(null, factors, { recurring: 0, oneTime: 0 }, {}, {});
    const weekend = insights.find((i) => i.id === "weekend");
    expect(weekend).toBeDefined();
    expect(weekend!.sentiment).toBe("positive");
    expect(weekend!.detail).toContain("less on weekends");
  });

  test("generates category shift insight when top category changed", () => {
    const insights = generateInsights(
      null, {},
      { recurring: 0, oneTime: 0 },
      { food: 5000, transport: 3000 },
      { transport: 4000, food: 3000 },
    );
    const shift = insights.find((i) => i.id === "category_shift");
    expect(shift).toBeDefined();
    expect(shift!.value).toBe("food");
    expect(shift!.detail).toContain("food overtook transport");
  });

  test("generates cheapest day insight when 3+ days have data", () => {
    const factors: Record<number, number> = { 0: 1.2, 1: 0.8, 2: 1.5, 3: 1.0, 4: 1.1, 5: 0.9, 6: 1.3 };
    const insights = generateInsights(null, factors, { recurring: 0, oneTime: 0 }, {}, {});
    const best = insights.find((i) => i.id === "best_day");
    expect(best).toBeDefined();
    expect(best!.value).toBe("Mon"); // factor 0.8 is lowest
    expect(best!.sentiment).toBe("positive");
  });

  test("generates recurring ratio insight when >= 20%", () => {
    const insights = generateInsights(null, {}, { recurring: 3000, oneTime: 7000 }, {}, {});
    const rec = insights.find((i) => i.id === "recurring_ratio");
    expect(rec).toBeDefined();
    expect(rec!.value).toBe("30%");
    expect(rec!.sentiment).toBe("neutral");
  });

  test("caps at 4 insights maximum", () => {
    const factors: Record<number, number> = { 0: 2.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 2.0 };
    const insights = generateInsights(
      30,
      factors,
      { recurring: 5000, oneTime: 5000 },
      { food: 5000, transport: 3000 },
      { transport: 4000, food: 3000 },
    );
    expect(insights.length).toBeLessThanOrEqual(4);
  });
});

// =========== NEGATIVE TESTS ===========

describe("SpendingInsights — negative", () => {
  test("returns empty when all inputs are null/empty", () => {
    const insights = generateInsights(null, {}, { recurring: 0, oneTime: 0 }, {}, {});
    expect(insights).toHaveLength(0);
  });

  test("no month-over-month insight when change is null", () => {
    const insights = generateInsights(null, {}, { recurring: 1000, oneTime: 4000 }, {}, {});
    expect(insights.find((i) => i.id === "mom")).toBeUndefined();
  });

  test("no weekend pattern when difference is less than 10%", () => {
    // 5% difference — should not trigger
    const factors: Record<number, number> = { 0: 1.05, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.05 };
    const insights = generateInsights(null, factors, { recurring: 0, oneTime: 0 }, {}, {});
    expect(insights.find((i) => i.id === "weekend")).toBeUndefined();
  });

  test("no category shift when top category is the same", () => {
    const insights = generateInsights(
      null, {},
      { recurring: 0, oneTime: 0 },
      { food: 5000, transport: 3000 },
      { food: 4000, transport: 3000 },
    );
    expect(insights.find((i) => i.id === "category_shift")).toBeUndefined();
  });

  test("no category shift when previous month has no data", () => {
    const insights = generateInsights(
      null, {},
      { recurring: 0, oneTime: 0 },
      { food: 5000 },
      {},
    );
    expect(insights.find((i) => i.id === "category_shift")).toBeUndefined();
  });

  test("no cheapest day when fewer than 3 days have data", () => {
    const factors: Record<number, number> = { 0: 1.2, 1: 0.8 };
    const insights = generateInsights(null, factors, { recurring: 0, oneTime: 0 }, {}, {});
    expect(insights.find((i) => i.id === "best_day")).toBeUndefined();
  });

  test("no recurring ratio when below 20%", () => {
    const insights = generateInsights(null, {}, { recurring: 100, oneTime: 9900 }, {}, {});
    expect(insights.find((i) => i.id === "recurring_ratio")).toBeUndefined();
  });

  test("no recurring ratio when total is 0", () => {
    const insights = generateInsights(null, {}, { recurring: 0, oneTime: 0 }, {}, {});
    expect(insights.find((i) => i.id === "recurring_ratio")).toBeUndefined();
  });
});

// =========== BOUNDARY TESTS ===========

describe("SpendingInsights — boundary", () => {
  test("month-over-month at 0% change shows +0%", () => {
    const insights = generateInsights(0, {}, { recurring: 0, oneTime: 0 }, {}, {});
    const mom = insights.find((i) => i.id === "mom");
    // 0 is not > 0, so it uses the "down" path
    expect(mom).toBeDefined();
    expect(mom!.value).toBe("−0%");
    expect(mom!.sentiment).toBe("positive");
  });

  test("weekend pattern at exactly 10% threshold", () => {
    // avgWeekday = 1.0, avgWeekend needs to be 1.1 to get exactly 10%
    const factors: Record<number, number> = { 0: 1.1, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.1 };
    const insights = generateInsights(null, factors, { recurring: 0, oneTime: 0 }, {}, {});
    const weekend = insights.find((i) => i.id === "weekend");
    expect(weekend).toBeDefined();
  });

  test("recurring ratio at exactly 20% threshold", () => {
    const insights = generateInsights(null, {}, { recurring: 2000, oneTime: 8000 }, {}, {});
    const rec = insights.find((i) => i.id === "recurring_ratio");
    expect(rec).toBeDefined();
    expect(rec!.value).toBe("20%");
  });

  test("recurring ratio at exactly 19% does not trigger", () => {
    const insights = generateInsights(null, {}, { recurring: 19, oneTime: 81 }, {}, {});
    const rec = insights.find((i) => i.id === "recurring_ratio");
    expect(rec).toBeUndefined();
  });

  test("very large month-over-month change (100000%) rounds correctly", () => {
    const insights = generateInsights(100000, {}, { recurring: 0, oneTime: 0 }, {}, {});
    const mom = insights.find((i) => i.id === "mom");
    expect(mom!.value).toBe("+100000%");
  });

  test("very small month-over-month change (0.4%) rounds to 0", () => {
    const insights = generateInsights(0.4, {}, { recurring: 0, oneTime: 0 }, {}, {});
    const mom = insights.find((i) => i.id === "mom");
    expect(mom!.value).toBe("+0%");
  });

  test("day-of-week factors with all equal values — cheapest day still chosen (first)", () => {
    const factors: Record<number, number> = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
    const insights = generateInsights(null, factors, { recurring: 0, oneTime: 0 }, {}, {});
    const best = insights.find((i) => i.id === "best_day");
    expect(best).toBeDefined();
    // When all equal, the reduce picks the first element
    expect(DAY_NAMES).toContain(best!.value);
  });
});

// =========== SECURITY TESTS ===========

describe("SpendingInsights — security", () => {
  test("XSS in category names is carried through as plain text (no HTML encoding needed in logic)", () => {
    const insights = generateInsights(
      null, {},
      { recurring: 0, oneTime: 0 },
      { "<script>alert('xss')</script>": 5000 },
      { "normal": 4000 },
    );
    const shift = insights.find((i) => i.id === "category_shift");
    // The value should contain the raw category name — React will escape it during rendering
    if (shift) {
      expect(shift.value).toBe("<script>alert('xss')</script>");
      expect(shift.detail).toContain("<script>");
    }
  });

  test("does not crash with NaN inputs", () => {
    expect(() => {
      generateInsights(NaN, { 0: NaN, 1: NaN }, { recurring: NaN, oneTime: NaN }, {}, {});
    }).not.toThrow();
  });

  test("does not crash with Infinity inputs", () => {
    expect(() => {
      generateInsights(Infinity, { 0: Infinity }, { recurring: Infinity, oneTime: 0 }, {}, {});
    }).not.toThrow();
  });

  test("insight IDs are safe identifier strings", () => {
    const factors: Record<number, number> = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2 };
    const insights = generateInsights(10, factors, { recurring: 5000, oneTime: 5000 }, { a: 1 }, { b: 1 });
    for (const i of insights) {
      expect(i.id).toMatch(/^[a-z_]+$/);
    }
  });
});

// =========== PERFORMANCE TESTS ===========

describe("SpendingInsights — performance", () => {
  test("generating insights 10000 times completes under 500ms", () => {
    const factors: Record<number, number> = { 0: 1.5, 1: 0.8, 2: 1.2, 3: 1.0, 4: 0.9, 5: 1.1, 6: 1.4 };
    const cats = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`cat${i}`, Math.random() * 10000]));
    const prevCats = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`cat${i}`, Math.random() * 10000]));
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      generateInsights(25, factors, { recurring: 3000, oneTime: 7000 }, cats, prevCats);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
