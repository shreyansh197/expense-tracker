/// <reference types="jest" />
/**
 * M4 · Sprint 4.2 — analytics chart models and summary. Each chart and its
 * DataTableView render from these models, so "the table matches the chart"
 * reduces to the model being right. Also regression tests for the reported
 * analytics bugs (ridge period, velocity overflow, rolling-average period).
 */
import {
  buildCategoryVelocity,
  buildMerchantRows,
  buildMonthRidge,
  buildRollingSeries,
  buildWeeklyVelocity,
  dailyTotalsByDate,
  formatSignedPercent,
  monthsCovering,
  parseAnalyticsPeriod,
  periodAnchor,
  DEFAULT_ANALYTICS_PERIOD,
} from "../lib/analyticsCharts";
import { buildMonthSummary } from "../lib/analyticsSummary";
import type { Expense } from "../types";

function expense(year: number, month: number, day: number, amount: number, extra: Partial<Expense> = {}): Expense {
  return {
    id: `${year}-${month}-${day}-${amount}-${extra.category ?? "food"}-${extra.remark ?? ""}`,
    amount,
    category: "food",
    day,
    month,
    year,
    remark: "",
    isRecurring: false,
    createdAt: 0,
    updatedAt: 0,
    ...extra,
  } as Expense;
}

describe("parseAnalyticsPeriod (?period= search param)", () => {
  test.each([["3", 3], ["6", 6], ["12", 12]])("accepts %s", (raw, expected) => {
    expect(parseAnalyticsPeriod(raw)).toBe(expected);
  });

  test.each([[null], [undefined], [""], ["7"], ["12abc"], ["-6"]])("falls back to the default for %p", (raw) => {
    expect(parseAnalyticsPeriod(raw as string | null | undefined)).toBe(DEFAULT_ANALYTICS_PERIOD);
  });
});

describe("periodAnchor / monthsCovering", () => {
  const today = new Date(2026, 8, 30); // 30 Sep 2026

  test("anchors the in-progress month on today", () => {
    expect(periodAnchor(9, 2026, today)).toEqual(new Date(2026, 8, 30));
  });

  test("anchors a past month on its last day", () => {
    expect(periodAnchor(2, 2024, today)).toEqual(new Date(2024, 1, 29));
  });

  test("lists every calendar month a day range touches, oldest first", () => {
    expect(monthsCovering(new Date(2026, 2, 5), 10)).toEqual([
      { month: 2, year: 2026 },
      { month: 3, year: 2026 },
    ]);
    expect(monthsCovering(new Date(2026, 0, 15), 97).map((m) => `${m.year}-${m.month}`)).toEqual([
      "2025-10", "2025-11", "2025-12", "2026-1",
    ]);
  });
});

describe("buildMonthRidge (Month Ridge + its data table)", () => {
  const months = [
    { month: 7, year: 2026, label: "Jul 2026", total: 1000 },
    { month: 8, year: 2026, label: "Aug 2026", total: 4000 },
    { month: 9, year: 2026, label: "Sep 2026", total: 2000 },
  ];

  test("one row per month in the selected period, selected month flagged", () => {
    const model = buildMonthRidge(months, { month: 9, year: 2026 }, 0);
    expect(model.rows.map((r) => r.label)).toEqual(["Jul 2026", "Aug 2026", "Sep 2026"]);
    expect(model.rows.filter((r) => r.isSelected).map((r) => r.label)).toEqual(["Sep 2026"]);
    expect(model.budgetPct).toBeNull();
    expect(model.rows.every((r) => r.budgetDelta === null)).toBe(true);
  });

  test("bars and the budget marker share one scale and never exceed 100%", () => {
    const model = buildMonthRidge(months, { month: 9, year: 2026 }, 8000);
    expect(model.budgetPct).toBe(100);
    expect(model.rows.map((r) => r.pct)).toEqual([12.5, 50, 25]);
    expect(Math.max(...model.rows.map((r) => r.pct))).toBeLessThanOrEqual(100);
  });

  test("budget deltas are decimal-safe and flag months over budget", () => {
    const model = buildMonthRidge([{ month: 1, year: 2026, label: "Jan", total: 100.3 }], { month: 1, year: 2026 }, 100.1);
    expect(model.rows[0].budgetDelta).toBe(0.2);
    expect(model.rows[0].overBudget).toBe(true);
  });

  test("averages only the months before the selected one", () => {
    expect(buildMonthRidge(months, { month: 9, year: 2026 }, 0).averageBefore).toBe(2500);
    expect(buildMonthRidge(months.slice(2), { month: 9, year: 2026 }, 0).averageBefore).toBeNull();
  });
});

describe("buildWeeklyVelocity (Spending Velocity)", () => {
  test("a week far over budget stays inside the plot (regression: bar over text)", () => {
    const model = buildWeeklyVelocity([{ week: 1, total: 500 }, { week: 2, total: 50_000 }], 3000, 30);
    expect(model.idealWeekly).toBe(600);
    for (const row of model.rows) expect(row.pct).toBeLessThanOrEqual(100);
    expect(model.paceLinePct).toBeGreaterThan(0);
    expect(model.paceLinePct).toBeLessThanOrEqual(100);
    expect(model.rows.map((r) => r.overPace)).toEqual([false, true]);
  });

  test("the pace line stays on scale when every week is under it", () => {
    const model = buildWeeklyVelocity([{ week: 1, total: 100 }], 10_000, 28);
    expect(model.paceLinePct).toBe(100);
    expect(model.rows[0].pct).toBe(4);
  });

  test("labels, day ranges and week-over-week change", () => {
    const model = buildWeeklyVelocity(
      [{ week: 1, total: 100 }, { week: 2, total: 150 }, { week: 3, total: 0 }, { week: 4, total: 60 }, { week: 5, total: 10 }],
      0,
      31,
    );
    expect(model.rows.map((r) => r.range)).toEqual(["1–7", "8–14", "15–21", "22–28", "29–31"]);
    expect(model.rows.map((r) => r.changePct)).toEqual([null, 50, -100, null, expect.closeTo(-83.33, 1)]);
    expect(model.paceLinePct).toBeNull();
  });
});

describe("buildRollingSeries (Rolling Average)", () => {
  const anchor = new Date(2026, 8, 30);
  const data = [expense(2026, 9, 30, 70), expense(2026, 9, 29, 70), expense(2026, 7, 10, 700), expense(2026, 6, 20, 350)];

  test("the selected period sets the series length (regression: 30/60/90 did not change the graph)", () => {
    const s30 = buildRollingSeries(data, anchor, 30);
    const s60 = buildRollingSeries(data, anchor, 60);
    const s90 = buildRollingSeries(data, anchor, 90);
    expect([s30.length, s60.length, s90.length]).toEqual([30, 60, 90]);
    expect(s30[0].date).toBe("2026-09-01");
    expect(s60[0].date).toBe("2026-08-02");
    expect(s90[0].date).toBe("2026-07-03");
    expect(s90[s90.length - 1].date).toBe("2026-09-30");
    // Older spend only appears once the range reaches it.
    expect(s60.some((p) => p.dayTotal === 700)).toBe(false);
    expect(s90.some((p) => p.dayTotal === 700)).toBe(true);
  });

  test("each point is the trailing 7-day mean with a non-negative ±1σ band", () => {
    const series = buildRollingSeries(data, anchor, 3);
    const last = series[series.length - 1];
    expect(last.dayTotal).toBe(70);
    expect(last.mean).toBeCloseTo(20, 5);
    expect(last.lower).toBeGreaterThanOrEqual(0);
    expect(last.upper).toBeGreaterThan(last.mean);
  });

  test("windows reach into days before the period", () => {
    const series = buildRollingSeries([expense(2026, 9, 30, 700)], new Date(2026, 9, 3), 2);
    expect(series.map((p) => p.date)).toEqual(["2026-10-02", "2026-10-03"]);
    expect(series.map((p) => p.dayTotal)).toEqual([0, 0]);
    expect(series.map((p) => p.mean)).toEqual([100, 100]);
  });

  test("sums multiple expenses per day decimal-safely", () => {
    expect(dailyTotalsByDate([expense(2026, 1, 1, 0.1), expense(2026, 1, 1, 0.2)]).get("2026-01-01")).toBe(0.3);
  });
});

describe("buildCategoryVelocity", () => {
  const anchor = new Date(2026, 5, 30);

  test("anchors on the selected month, not today", () => {
    const rows = buildCategoryVelocity(
      [expense(2026, 6, 29, 100), expense(2026, 6, 20, 50), expense(2026, 6, 10, 999), expense(2026, 7, 1, 5)],
      anchor,
      ["food"],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].weeks).toEqual([0, 999, 50, 100]);
    expect(rows[0].thisWeek).toBe(100);
    expect(rows[0].deltaPct).toBe(100);
  });

  test("ignores unknown categories and ranks by this week", () => {
    const rows = buildCategoryVelocity(
      [expense(2026, 6, 30, 10, { category: "food" }), expense(2026, 6, 30, 20, { category: "travel" }), expense(2026, 6, 30, 30, { category: "ghost" })],
      anchor,
      ["food", "travel"],
    );
    expect(rows.map((r) => r.id)).toEqual(["travel", "food"]);
  });
});

describe("buildMerchantRows", () => {
  test("groups by remark (blank → Other), sorts, and scales to the largest", () => {
    const rows = buildMerchantRows([
      expense(2026, 1, 1, 10, { remark: "Cafe" }),
      expense(2026, 1, 2, 30, { remark: " Cafe " }),
      expense(2026, 1, 3, 80, { remark: "" }),
    ]);
    expect(rows).toEqual([
      { name: "Other", total: 80, count: 1, pct: 100 },
      { name: "Cafe", total: 40, count: 2, pct: 50 },
    ]);
  });
});

describe("formatSignedPercent", () => {
  test.each([[12.4, "+12%"], [-7.6, "−8%"], [0.2, "0%"]])("%p → %s", (input, expected) => {
    expect(formatSignedPercent(input)).toBe(expected);
  });
});

describe("buildMonthSummary (Analytics hero)", () => {
  const base = {
    categoryLabel: (id: string) => id.toUpperCase(),
    formatCurrencyCompact: (n: number) => `₹${n}`,
    budget: 0,
    projectedTotal: 0,
    daysLeft: 10,
  };

  test("describes month-over-month change without judgement", () => {
    expect(buildMonthSummary({ ...base, monthOverMonthChange: 12 })).toEqual(["You spent 12% more than last month."]);
    expect(buildMonthSummary({ ...base, monthOverMonthChange: -30 })).toEqual(["You spent 30% less than last month."]);
    expect(buildMonthSummary({ ...base, monthOverMonthChange: 2 })).toEqual(["Spending is roughly in line with last month."]);
  });

  test("names the fastest-growing category above the threshold", () => {
    const sentences = buildMonthSummary({
      ...base,
      monthOverMonthChange: null,
      currentBreakdown: { food: 300, rent: 1000 },
      previousBreakdown: { food: 100, rent: 1000 },
    });
    expect(sentences).toEqual(["FOOD saw the biggest jump (+200% vs last month)."]);
  });

  test("projects against the budget only while enough of the month remains", () => {
    expect(buildMonthSummary({ ...base, monthOverMonthChange: null, budget: 1000, projectedTotal: 1200 })).toEqual([
      "At this pace you're projected to go ₹200 over budget.",
    ]);
    expect(buildMonthSummary({ ...base, monthOverMonthChange: null, budget: 1000, projectedTotal: 800 })).toEqual([
      "You're on track to finish ₹200 under budget.",
    ]);
    expect(buildMonthSummary({ ...base, monthOverMonthChange: null, budget: 1000, projectedTotal: 1200, daysLeft: 2 })).toEqual([]);
  });
});
