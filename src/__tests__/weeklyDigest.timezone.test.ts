/// <reference types="jest" />

/**
 * Weekly Digest — Timezone & Locale-Correct Week Bounds (Sprint 3.2 / T-3.2.4, T-3.2.6)
 *
 * Verifies `getWeekBounds` in `src/lib/calculations.ts`:
 *
 *   1. Week bounds are computed from the user's *local* calendar date, not
 *      the server's UTC "today" — two users on either side of a UTC day
 *      boundary can land in different weeks for the same instant.
 *   2. A Sunday-first locale (`weekStartsOn: 0`) and a Monday-first locale
 *      (`weekStartsOn: 1`) resolve to different week bounds for the same
 *      instant/timezone, exactly as required by the acceptance criteria.
 *   3. `getWeeklyTotal` sums only the expenses that actually fall inside the
 *      resolved week.
 */

import { getWeekBounds, isDateWithinWeekBounds, getWeeklyTotal, type CalendarDate } from "@/lib/calculations";
import type { Expense } from "@/types";

function makeExpense(overrides: Partial<Expense> & Pick<Expense, "day" | "month" | "year" | "amount">): Expense {
  return {
    id: `exp-${overrides.day}-${overrides.month}-${overrides.year}-${Math.random()}`,
    category: "food",
    remark: "",
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    deviceId: "device-1",
    ...overrides,
  };
}

// =========================================================================
// Locale week-start divergence (T-3.2.4 acceptance criterion)
// =========================================================================

describe("getWeekBounds — locale week-start divergence", () => {
  test("Sunday-first and Monday-first locales resolve to different bounds for the same instant", () => {
    // 2026-01-15 is a Thursday.
    const now = new Date("2026-01-15T12:00:00Z");
    const sundayFirst = getWeekBounds(now, "UTC", 0);
    const mondayFirst = getWeekBounds(now, "UTC", 1);

    expect(sundayFirst).toEqual({ start: { year: 2026, month: 1, day: 11 }, end: { year: 2026, month: 1, day: 17 } });
    expect(mondayFirst).toEqual({ start: { year: 2026, month: 1, day: 12 }, end: { year: 2026, month: 1, day: 18 } });
    expect(sundayFirst).not.toEqual(mondayFirst);
  });

  test("defaults to Sunday-first when weekStartsOn is omitted", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    expect(getWeekBounds(now, "UTC")).toEqual(getWeekBounds(now, "UTC", 0));
  });

  test("a date that is itself the week start returns a 7-day window starting on it", () => {
    // 2026-01-11 is a Sunday.
    const now = new Date("2026-01-11T12:00:00Z");
    expect(getWeekBounds(now, "UTC", 0)).toEqual({
      start: { year: 2026, month: 1, day: 11 },
      end: { year: 2026, month: 1, day: 17 },
    });
  });

  test("a date that is itself the Monday week start returns a 7-day window starting on it", () => {
    // 2026-01-12 is a Monday.
    const now = new Date("2026-01-12T12:00:00Z");
    expect(getWeekBounds(now, "UTC", 1)).toEqual({
      start: { year: 2026, month: 1, day: 12 },
      end: { year: 2026, month: 1, day: 18 },
    });
  });
});

// =========================================================================
// Timezone correctness — not the server's UTC clock (T-3.2.4)
// =========================================================================

describe("getWeekBounds — timezone correctness", () => {
  test("a UTC instant just before midnight can fall on the next local calendar day east of UTC", () => {
    // 23:30 UTC on Saturday 2026-01-17 is already 05:00 Sunday 2026-01-18 in
    // Asia/Kolkata (UTC+5:30). A UTC-only implementation would place this
    // instant in the week ending Jan-17; the tz-correct answer starts a new
    // (Sunday-first) week on Jan-18.
    const now = new Date("2026-01-17T23:30:00Z");
    const utcBounds = getWeekBounds(now, "UTC", 0);
    const istBounds = getWeekBounds(now, "Asia/Kolkata", 0);

    expect(utcBounds.end).toEqual({ year: 2026, month: 1, day: 17 });
    expect(istBounds.start).toEqual({ year: 2026, month: 1, day: 18 });
    expect(utcBounds).not.toEqual(istBounds);
  });

  test("a UTC instant just after midnight can still be the previous local calendar day west of UTC", () => {
    // 00:30 UTC on Sunday 2026-01-18 is 19:30 Saturday 2026-01-17 in
    // America/New_York (UTC-5 in January, no DST).
    const now = new Date("2026-01-18T00:30:00Z");
    const utcBounds = getWeekBounds(now, "UTC", 0);
    const nyBounds = getWeekBounds(now, "America/New_York", 0);

    expect(utcBounds.start).toEqual({ year: 2026, month: 1, day: 18 });
    expect(nyBounds.end).toEqual({ year: 2026, month: 1, day: 17 });
    expect(utcBounds).not.toEqual(nyBounds);
  });

  test("week bounds correctly cross a month boundary", () => {
    // 2026-02-01 is a Sunday.
    const now = new Date("2026-02-01T12:00:00Z");
    expect(getWeekBounds(now, "UTC", 1)).toEqual({
      // Monday-first week containing Sunday Feb 1 starts the prior Monday (Jan 26).
      start: { year: 2026, month: 1, day: 26 },
      end: { year: 2026, month: 2, day: 1 },
    });
  });

  test("week bounds correctly cross a year boundary", () => {
    // 2026-01-01 is a Thursday.
    const now = new Date("2026-01-01T12:00:00Z");
    expect(getWeekBounds(now, "UTC", 0)).toEqual({
      start: { year: 2025, month: 12, day: 28 },
      end: { year: 2026, month: 1, day: 3 },
    });
  });

  test("falls back to UTC for an invalid IANA timezone rather than throwing", () => {
    expect(() => getWeekBounds(new Date("2026-01-15T12:00:00Z"), "Not/AZone", 0)).not.toThrow();
  });
});

// =========================================================================
// isDateWithinWeekBounds / getWeeklyTotal
// =========================================================================

describe("isDateWithinWeekBounds", () => {
  const bounds = { start: { year: 2026, month: 1, day: 11 }, end: { year: 2026, month: 1, day: 17 } };

  test("accepts the boundary dates (inclusive)", () => {
    expect(isDateWithinWeekBounds({ year: 2026, month: 1, day: 11 }, bounds)).toBe(true);
    expect(isDateWithinWeekBounds({ year: 2026, month: 1, day: 17 }, bounds)).toBe(true);
  });

  test("rejects dates outside the range", () => {
    expect(isDateWithinWeekBounds({ year: 2026, month: 1, day: 10 }, bounds)).toBe(false);
    expect(isDateWithinWeekBounds({ year: 2026, month: 1, day: 18 }, bounds)).toBe(false);
  });

  test("correctly compares across a month/year boundary", () => {
    const crossYear = { start: { year: 2025, month: 12, day: 28 }, end: { year: 2026, month: 1, day: 3 } };
    expect(isDateWithinWeekBounds({ year: 2025, month: 12, day: 31 }, crossYear)).toBe(true);
    expect(isDateWithinWeekBounds({ year: 2026, month: 1, day: 2 }, crossYear)).toBe(true);
    expect(isDateWithinWeekBounds({ year: 2026, month: 1, day: 4 }, crossYear)).toBe(false);
  });
});

describe("getWeeklyTotal", () => {
  const bounds = { start: { year: 2026, month: 1, day: 11 }, end: { year: 2026, month: 1, day: 17 } };

  test("sums only expenses whose date falls inside the week", () => {
    const expenses: Expense[] = [
      makeExpense({ day: 11, month: 1, year: 2026, amount: 100 }), // in range (start)
      makeExpense({ day: 14, month: 1, year: 2026, amount: 50 }), // in range
      makeExpense({ day: 17, month: 1, year: 2026, amount: 25 }), // in range (end)
      makeExpense({ day: 10, month: 1, year: 2026, amount: 999 }), // before range
      makeExpense({ day: 18, month: 1, year: 2026, amount: 999 }), // after range
    ];
    expect(getWeeklyTotal(expenses, bounds)).toBe(175);
  });

  test("excludes soft-deleted expenses even if the date is in range", () => {
    const expenses: Expense[] = [
      makeExpense({ day: 12, month: 1, year: 2026, amount: 100 }),
      makeExpense({ day: 12, month: 1, year: 2026, amount: 500, deletedAt: Date.now() }),
    ];
    expect(getWeeklyTotal(expenses, bounds)).toBe(100);
  });

  test("returns 0 for an empty expense list", () => {
    expect(getWeeklyTotal([], bounds)).toBe(0);
  });
});

// Type-only import sanity check — ensures CalendarDate is exported as documented.
const _typeCheck: CalendarDate = { year: 2026, month: 1, day: 1 };
void _typeCheck;
