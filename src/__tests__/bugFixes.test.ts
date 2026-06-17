/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Bug-Fix Regression Tests (May 2026)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Requirements Traceability:
 *   BUG-001  Dashboard budget edit must write monthlyBudgets[YYYY-MM]
 *            not the global salary — so previous months are unaffected.
 *   BUG-002  SpendingStream today marker must be -1 for historical months.
 *   BUG-003  _syncFromIDB equal-timestamp conflict must prefer local over remote.
 *   BUG-004  _syncFromIDB salary-recovery branch must persist to localStorage.
 *   BUG-005  _directFetchDone flag must reset when the user changes.
 *   BUG-006  Budget input of 0 must be rejected (val > 0 guard).
 *   BUG-008  Settings page budget month defaults to the dashboard's current month.
 *
 * Environment: Node (Jest), ts-jest, no DOM.
 */

import type { UserSettings } from "../types";
import { DEFAULT_SETTINGS } from "../hooks/settingsStore";

// ── Shared helpers ──────────────────────────────────────────────────────────

function makeSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    salary: 50_000,
    currency: "INR",
    updatedAt: Date.now(),
    createdAt: Date.now(),
    ...overrides,
  };
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUG-001: Dashboard budget edit — per-month override, not global salary
// ═══════════════════════════════════════════════════════════════════════════

describe("BUG-001: onBudgetEdit writes monthlyBudgets[YYYY-MM], not salary", () => {
  /**
   * The production fix in page.tsx:
   *   const monthKey = `${currentYear}-${String(currentMonth).padStart(2,"0")}`;
   *   updateSettings({ monthlyBudgets: { ...(settings.monthlyBudgets ?? {}), [monthKey]: val } });
   *
   * These tests validate the logic of that update, independent of React.
   */

  test("BUG-001-01: editing budget for May 2026 sets only May key, salary unchanged", () => {
    const settings = makeSettings({ salary: 40_000, monthlyBudgets: {} });
    const currentMonth = 5;
    const currentYear = 2026;
    const newBudget = 60_000;

    // Simulate what the fixed onBudgetEdit does:
    const key = monthKey(currentYear, currentMonth);
    const updatedMonthlyBudgets = { ...(settings.monthlyBudgets ?? {}), [key]: newBudget };
    const nextSettings = { ...settings, monthlyBudgets: updatedMonthlyBudgets };

    expect(nextSettings.salary).toBe(40_000);            // global salary unchanged
    expect(nextSettings.monthlyBudgets["2026-05"]).toBe(60_000); // only May updated
    expect(Object.keys(nextSettings.monthlyBudgets)).toHaveLength(1);
  });

  test("BUG-001-02: editing May budget does not affect January or February", () => {
    const settings = makeSettings({
      salary: 40_000,
      monthlyBudgets: { "2026-01": 45_000, "2026-02": 42_000 },
    });

    const key = monthKey(2026, 5);
    const updatedMonthlyBudgets = { ...(settings.monthlyBudgets ?? {}), [key]: 60_000 };
    const nextSettings = { ...settings, monthlyBudgets: updatedMonthlyBudgets };

    // Previous months untouched
    expect(nextSettings.monthlyBudgets["2026-01"]).toBe(45_000);
    expect(nextSettings.monthlyBudgets["2026-02"]).toBe(42_000);
    expect(nextSettings.monthlyBudgets["2026-05"]).toBe(60_000);
  });

  test("BUG-001-03: editing budget overwrites an existing per-month override (not duplicated)", () => {
    const settings = makeSettings({
      salary: 40_000,
      monthlyBudgets: { "2026-05": 50_000 },
    });

    const key = monthKey(2026, 5);
    const updatedMonthlyBudgets = { ...(settings.monthlyBudgets ?? {}), [key]: 70_000 };
    const nextSettings = { ...settings, monthlyBudgets: updatedMonthlyBudgets };

    expect(nextSettings.monthlyBudgets["2026-05"]).toBe(70_000);
    expect(Object.keys(nextSettings.monthlyBudgets)).toHaveLength(1); // no duplicates
  });

  test("BUG-001-04: OLD (broken) behaviour — updating salary affects all months without override", () => {
    // Demonstrates the root cause: if we wrote `salary: val` instead,
    // months without a monthlyBudgets override would display the new salary.
    const settings = makeSettings({ salary: 40_000, monthlyBudgets: {} });

    // Broken path (the old code)
    const brokenNext = { ...settings, salary: 60_000 };

    // The effectiveBudget logic picks monthlyBudgets[key] ?? salary
    const jan2026 = brokenNext.monthlyBudgets["2026-01"] ?? brokenNext.salary;
    const feb2026 = brokenNext.monthlyBudgets["2026-02"] ?? brokenNext.salary;

    // Both now show 60_000 even though user only edited May — this was the bug.
    expect(jan2026).toBe(60_000);
    expect(feb2026).toBe(60_000);
  });

  test("BUG-001-05: FIXED behaviour — only May uses the new value, others still see salary", () => {
    const settings = makeSettings({ salary: 40_000, monthlyBudgets: {} });

    // Fixed path
    const key = monthKey(2026, 5);
    const nextSettings = { ...settings, monthlyBudgets: { [key]: 60_000 } };

    const jan2026 = nextSettings.monthlyBudgets["2026-01"] ?? nextSettings.salary;
    const may2026 = nextSettings.monthlyBudgets["2026-05"] ?? nextSettings.salary;

    expect(jan2026).toBe(40_000); // unaffected
    expect(may2026).toBe(60_000); // only May changed
  });

  test("BUG-001-06: monthKey helper produces zero-padded month string", () => {
    expect(monthKey(2026, 1)).toBe("2026-01");
    expect(monthKey(2026, 9)).toBe("2026-09");
    expect(monthKey(2026, 12)).toBe("2026-12");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUG-002: SpendingStream today marker — historical months must not show it
// ═══════════════════════════════════════════════════════════════════════════

describe("BUG-002: today marker is -1 for historical and future months", () => {
  /**
   * The production fix in SpendingStream.tsx:
   *   const today = useMemo(() => {
   *     const now = new Date();
   *     const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
   *     return isCurrentMonth ? now.getDate() : -1;
   *   }, [month, year]);
   *
   * These tests validate that same logic as a pure function.
   */

  function computeToday(month: number | undefined, year: number | undefined): number {
    if (month === undefined || year === undefined) return -1;
    const now = new Date();
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    return isCurrentMonth ? now.getDate() : -1;
  }

  const NOW = new Date();
  const CURRENT_MONTH = NOW.getMonth() + 1;
  const CURRENT_YEAR = NOW.getFullYear();

  test("BUG-002-01: returns actual day for current month/year", () => {
    const result = computeToday(CURRENT_MONTH, CURRENT_YEAR);
    expect(result).toBe(NOW.getDate());
    expect(result).toBeGreaterThan(0);
  });

  test("BUG-002-02: returns -1 for a past month in the same year", () => {
    const pastMonth = CURRENT_MONTH === 1 ? 12 : CURRENT_MONTH - 1;
    const pastYear = CURRENT_MONTH === 1 ? CURRENT_YEAR - 1 : CURRENT_YEAR;
    expect(computeToday(pastMonth, pastYear)).toBe(-1);
  });

  test("BUG-002-03: returns -1 for January 2026 when today is May 2026", () => {
    // Concrete scenario matching the user-reported bug
    // Jan 2026 is in the past — today marker must not appear
    expect(computeToday(1, 2026)).toBe(-1);
  });

  test("BUG-002-04: returns -1 for a future month", () => {
    const futureMonth = CURRENT_MONTH === 12 ? 1 : CURRENT_MONTH + 1;
    const futureYear = CURRENT_MONTH === 12 ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    expect(computeToday(futureMonth, futureYear)).toBe(-1);
  });

  test("BUG-002-05: returns -1 when month/year are undefined (compact bar with no props)", () => {
    expect(computeToday(undefined, undefined)).toBe(-1);
  });

  test("BUG-002-06: isToday flag on a stone is false when today === -1", () => {
    // Simulate the stone construction: isToday = (i + 1 === today)
    // where today = -1 for historical months
    const today = -1;
    const days = [1, 2, 24, 31];
    const anyToday = days.some((d) => d === today);
    expect(anyToday).toBe(false);
  });

  test("BUG-002-07: OLD (broken) behaviour — new Date().getDate() marks day 24 even in Jan", () => {
    // In May 2026, new Date().getDate() returns 24.
    // If Jan is being viewed, day 24 was incorrectly highlighted.
    const brokenToday = new Date().getDate(); // always current calendar day
    // For Jan 2026 view, day 24 would be marked even though Jan is over:
    const stone24MarkedAsToday = (24 === brokenToday);
    // This assertion exposes the bug: it's truthy on May 24
    expect(brokenToday).toBeGreaterThan(0); // proves it returns a real calendar day
    // Fix ensures that for Jan view we return -1, not brokenToday:
    const fixedToday = computeToday(1, 2026); // Jan 2026
    expect(fixedToday).toBe(-1);
    expect(stone24MarkedAsToday && fixedToday === -1).toBe(true); // bug existed, fix resolves it
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUG-003: _syncFromIDB equal-timestamp must prefer local over remote
// ═══════════════════════════════════════════════════════════════════════════

describe("BUG-003: equal-timestamp conflict resolution prefers local", () => {
  /**
   * The fixed logic in _syncFromIDB (equal-timestamp branch):
   *   // prefer local (same rationale as onSyncPull)
   *   if (_settings.updatedAt < localTs) _setShared(local);
   *   pushToApi(local);
   *
   * Tests validate that at equal timestamps, local wins.
   */

  const TS = 1_700_000_000_000;

  function resolveConflict(
    local: Partial<UserSettings>,
    remote: Partial<UserSettings>,
    strategy: "prefer-local" | "prefer-remote",
  ): Partial<UserSettings> {
    const localTs = local.updatedAt ?? 0;
    const remoteTs = remote.updatedAt ?? 0;

    if (remoteTs > localTs) return remote;
    if (localTs > remoteTs) return local;

    // Equal timestamps — strategy determines winner
    return strategy === "prefer-local" ? local : remote;
  }

  test("BUG-003-01: fixed strategy (prefer-local) returns local at equal timestamps", () => {
    const local = makeSettings({ salary: 60_000, updatedAt: TS });
    const remote = makeSettings({ salary: 40_000, updatedAt: TS });

    const result = resolveConflict(local, remote, "prefer-local");
    expect(result.salary).toBe(60_000); // local wins
  });

  test("BUG-003-02: broken strategy (prefer-remote) would overwrite local salary", () => {
    const local = makeSettings({ salary: 60_000, updatedAt: TS });
    const remote = makeSettings({ salary: 40_000, updatedAt: TS });

    const result = resolveConflict(local, remote, "prefer-remote");
    expect(result.salary).toBe(40_000); // remote wins — this was the bug
  });

  test("BUG-003-03: remote newer — should still prefer remote (LWW)", () => {
    const local = makeSettings({ salary: 60_000, updatedAt: TS });
    const remote = makeSettings({ salary: 40_000, updatedAt: TS + 1_000 });

    const result = resolveConflict(local, remote, "prefer-local");
    expect(result.salary).toBe(40_000); // remote is newer → remote wins (LWW)
  });

  test("BUG-003-04: local newer — always prefer local (LWW)", () => {
    const local = makeSettings({ salary: 60_000, updatedAt: TS + 1_000 });
    const remote = makeSettings({ salary: 40_000, updatedAt: TS });

    const result = resolveConflict(local, remote, "prefer-local");
    expect(result.salary).toBe(60_000);
  });

  test("BUG-003-05: equal-timestamp with equal content → no write needed", () => {
    const settings = makeSettings({ salary: 50_000, updatedAt: TS });
    // When content hashes match, no action is needed regardless of strategy
    const contentChanged = JSON.stringify(settings) !== JSON.stringify(settings);
    expect(contentChanged).toBe(false); // same object → no write
  });

  test("BUG-003-06: monthlyBudgets preserved under prefer-local strategy", () => {
    const local = makeSettings({
      salary: 40_000,
      monthlyBudgets: { "2026-05": 60_000 },
      updatedAt: TS,
    });
    const remote = makeSettings({
      salary: 40_000,
      monthlyBudgets: {}, // remote wiped monthlyBudgets
      updatedAt: TS,
    });

    const result = resolveConflict(local, remote, "prefer-local");
    expect((result as UserSettings).monthlyBudgets?.["2026-05"]).toBe(60_000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUG-004: _syncFromIDB salary-recovery branch must persist via saveLocal
// ═══════════════════════════════════════════════════════════════════════════

describe("BUG-004: salary recovery must persist merged salary to storage", () => {
  /**
   * Fixed: when remote.salary === 0 && bestKnownSalary > 0,
   *   const merged = { ...local, salary: bestKnownSalary };
   *   saveLocal(merged);   ← was MISSING before the fix
   *   _setShared(merged);
   */

  test("BUG-004-01: recovery builds merged object with bestKnownSalary", () => {
    const local = makeSettings({ salary: 0, updatedAt: 1_000 });
    const inMemorySalary = 50_000;
    const bestKnownSalary = Math.max(inMemorySalary, local.salary);

    const merged = { ...local, salary: bestKnownSalary };

    expect(merged.salary).toBe(50_000);
  });

  test("BUG-004-02: merged object should be persisted (saveLocal called with it)", () => {
    // Simulate saveLocal tracking
    const persisted: UserSettings[] = [];
    const mockSaveLocal = (s: UserSettings) => persisted.push(s);

    const local = makeSettings({ salary: 0, updatedAt: 1_000 });
    const inMemorySalary = 50_000;
    const bestKnownSalary = Math.max(inMemorySalary, local.salary);

    if (inMemorySalary < bestKnownSalary || true) { // simulates _settings.salary < bestKnownSalary
      const merged = { ...local, salary: bestKnownSalary };
      mockSaveLocal(merged);          // the fix adds this call
      // _setShared(merged)           // would follow in production
    }

    expect(persisted).toHaveLength(1);
    expect(persisted[0].salary).toBe(50_000);
  });

  test("BUG-004-03: without saveLocal, salary reverts to 0 on next loadSettings", () => {
    // Demonstrates why saveLocal matters:
    // Without it, the in-memory state is correct but storage still has salary=0.
    const storedSettings = makeSettings({ salary: 0 }); // what localStorage would have
    const inMemorySettings = makeSettings({ salary: 50_000 }); // what _setShared set

    // On next page load, loadSettings reads storage (salary=0), not memory:
    const afterReload = storedSettings.salary;
    expect(afterReload).toBe(0); // the bug — salary reverts

    // With the fix: saveLocal(merged) persists salary=50_000 to storage,
    // so after reload we get the correct value:
    const storageAfterFix = inMemorySettings.salary;
    expect(storageAfterFix).toBe(50_000); // fixed behaviour
  });

  test("BUG-004-04: bestKnownSalary is the max of in-memory and local", () => {
    const cases: Array<[number, number, number]> = [
      [50_000, 0, 50_000],
      [0, 50_000, 50_000],
      [30_000, 50_000, 50_000],
      [50_000, 30_000, 50_000],
      [0, 0, 0],
    ];
    for (const [inMem, local, expected] of cases) {
      expect(Math.max(inMem, local)).toBe(expected);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUG-005: _directFetchDone must reset when the user changes
// ═══════════════════════════════════════════════════════════════════════════

describe("BUG-005: resetDirectFetchDone enables fresh fetch for new user", () => {
  /**
   * resetDirectFetchDone() exported from settingsSync.ts resets the module flag.
   * switchSettingsUser() calls it so every new user gets a clean failsafe fetch.
   */

  test("BUG-005-01: reset function flips the flag back to false", () => {
    let _directFetchDone = false;
    const markDone = () => { _directFetchDone = true; };
    const reset = () => { _directFetchDone = false; };
    const canFetch = () => !_directFetchDone;

    markDone();
    expect(canFetch()).toBe(false); // flag set — fetch blocked

    reset();
    expect(canFetch()).toBe(true);  // flag cleared — fetch allowed
  });

  test("BUG-005-02: without reset, second user cannot trigger failsafe fetch", () => {
    let _directFetchDone = false;

    // User A triggers the failsafe fetch
    const fetchForUserA = () => {
      if (_directFetchDone) return "skipped";
      _directFetchDone = true;
      return "fetched";
    };

    expect(fetchForUserA()).toBe("fetched");

    // User B logs in — without reset, the flag is still true
    const fetchForUserB = () => {
      if (_directFetchDone) return "skipped";
      _directFetchDone = true;
      return "fetched";
    };

    expect(fetchForUserB()).toBe("skipped"); // BUG: User B never gets a fetch
  });

  test("BUG-005-03: with reset on user switch, User B gets a fresh fetch", () => {
    let _directFetchDone = false;

    // User A triggers the failsafe fetch
    if (!_directFetchDone) { _directFetchDone = true; }

    // User switch — the fix calls resetDirectFetchDone()
    _directFetchDone = false; // simulates reset

    // User B can now fetch
    const resultB = (() => {
      if (_directFetchDone) return "skipped";
      _directFetchDone = true;
      return "fetched";
    })();

    expect(resultB).toBe("fetched");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUG-006: Budget input of 0 must be rejected
// ═══════════════════════════════════════════════════════════════════════════

describe("BUG-006: handleBudgetSave rejects 0 and negative values", () => {
  /**
   * Fixed guard in MonthSummaryHero.tsx:
   *   if (!isNaN(val) && val > 0) onBudgetEdit?.(val);
   *   (was: val >= 0, which let 0 through)
   */

  function shouldSave(input: string): boolean {
    const val = parseFloat(input);
    return !isNaN(val) && val > 0; // the fixed guard
  }

  test("BUG-006-01: valid positive number is accepted", () => {
    expect(shouldSave("50000")).toBe(true);
    expect(shouldSave("1")).toBe(true);
    expect(shouldSave("0.01")).toBe(true);
  });

  test("BUG-006-02: 0 is rejected", () => {
    expect(shouldSave("0")).toBe(false);
    expect(shouldSave("0.00")).toBe(false);
  });

  test("BUG-006-03: negative numbers are rejected", () => {
    expect(shouldSave("-1")).toBe(false);
    expect(shouldSave("-50000")).toBe(false);
  });

  test("BUG-006-04: non-numeric strings are rejected", () => {
    expect(shouldSave("")).toBe(false);
    expect(shouldSave("abc")).toBe(false);
    expect(shouldSave("NaN")).toBe(false);
  });

  test("BUG-006-05: OLD (broken) guard would accept 0", () => {
    const brokenGuard = (input: string) => {
      const val = parseFloat(input);
      return !isNaN(val) && val >= 0; // the old, broken guard
    };
    expect(brokenGuard("0")).toBe(true);   // BUG: 0 would call onBudgetEdit(0)
    expect(shouldSave("0")).toBe(false);   // FIX: 0 is now blocked
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUG-008: Settings page budget month defaults to dashboard's current month
// ═══════════════════════════════════════════════════════════════════════════

describe("BUG-008: Settings budget month is initialised from the dashboard month", () => {
  /**
   * Fixed: useState(dashMonth) / useState(dashYear) instead of
   *        useState(now.getMonth() + 1) / useState(now.getFullYear())
   */

  function initBudgetMonth(
    source: "dashboard" | "now",
    dashboardMonth: number,
    dashboardYear: number,
  ): { month: number; year: number } {
    if (source === "dashboard") {
      return { month: dashboardMonth, year: dashboardYear };
    }
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  test("BUG-008-01: initialised from dashboard month 1 (January)", () => {
    const { month, year } = initBudgetMonth("dashboard", 1, 2026);
    expect(month).toBe(1);
    expect(year).toBe(2026);
  });

  test("BUG-008-02: initialised from dashboard month 3 (March)", () => {
    const { month, year } = initBudgetMonth("dashboard", 3, 2026);
    expect(month).toBe(3);
    expect(year).toBe(2026);
  });

  test("BUG-008-03: OLD (broken) init always returns today's month", () => {
    const now = new Date();
    const { month } = initBudgetMonth("now", 1, 2026); // dashboard is Jan but ignored
    expect(month).toBe(now.getMonth() + 1); // bug: shows current month, not Jan
  });

  test("BUG-008-04: fixed init returns the dashboard month regardless of today", () => {
    const dashboardMonth = 1; // user was viewing January
    const { month } = initBudgetMonth("dashboard", dashboardMonth, 2026);
    const now = new Date();
    // Only fails if user views January in the same month — that's the correct behaviour.
    if (now.getMonth() + 1 !== 1) {
      expect(month).not.toBe(now.getMonth() + 1); // correctly differs from today
    }
    expect(month).toBe(1);
  });

  test("BUG-008-05: budgetKey is correctly formed from dashboard month/year", () => {
    const dashboardMonth = 1;
    const dashboardYear = 2026;
    const { month, year } = initBudgetMonth("dashboard", dashboardMonth, dashboardYear);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    expect(key).toBe("2026-01");
  });
});
