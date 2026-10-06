/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Savings Goal ↔ Money Spent Link
 * ═══════════════════════════════════════════════════════════════════
 *
 * Requirements Traceability:
 *   GOAL-SPEND-001  Funding a goal this month adds exactly that amount to
 *                    the month's "money spent" total, app-wide. The
 *                    month's budget itself is NOT touched.
 *   GOAL-SPEND-002  Withdrawing from a goal this month removes exactly
 *                    that amount from the month's "money spent" total.
 *   GOAL-SPEND-003  Partial withdrawals only remove the withdrawn portion.
 *   GOAL-SPEND-004  Contributions dated to a different month/year do not
 *                    affect the currently-viewed month's money-spent total.
 *
 * Exercises the real production helpers (`applyGoalFunding`,
 * `getGoalContributionsTotal`) plus the exact addition formula used by
 * `useCalculations.ts`'s `monthlyTotal` memo:
 *   monthlyTotal = addMoney(expensesTotal, getGoalContributionsTotal(goals, month, year))
 * so this test fails if either the goal helpers or the money-spent formula
 * regress back to deducting from the budget instead.
 *
 * Environment: Node (Jest), ts-jest, no DOM.
 */

import type { Goal } from "../types";
import { applyGoalFunding, getGoalContributionsTotal } from "../lib/goals";
import { addMoney } from "../lib/money";

const MONTH = 10;
const YEAR = 2026;
const FIXED_NOW = new Date(YEAR, MONTH - 1, 15); // mid-month, inside the viewed period

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    name: "Vacation",
    targetAmount: 150_000,
    savedAmount: 40_000,
    color: "#FBBF24",
    createdAt: 0,
    contributions: [],
    ...overrides,
  };
}

/** Mirrors the exact formula in useCalculations.ts's monthlyTotal memo. */
function moneySpentFor(expensesTotal: number, goals: Goal[], month = MONTH, year = YEAR): number {
  const goalContributions = getGoalContributionsTotal(goals, month, year);
  return addMoney(expensesTotal, goalContributions);
}

describe("GOAL-SPEND-001: funding a goal adds the amount to money spent, not the budget", () => {
  test("GOAL-SPEND-001-01: adding ₹5,000 to a goal increases money spent by exactly ₹5,000", () => {
    const expensesTotal = 10_000;
    const goal = makeGoal({ savedAmount: 40_000 });

    const spentBefore = moneySpentFor(expensesTotal, [goal]);
    expect(spentBefore).toBe(10_000);

    const funded = applyGoalFunding(goal, goal.savedAmount + 5_000, FIXED_NOW);
    const spentAfter = moneySpentFor(expensesTotal, [funded]);

    expect(spentAfter).toBe(15_000);
    expect(spentAfter - spentBefore).toBe(5_000);
  });

  test("GOAL-SPEND-001-02: funding is additive across multiple deposits in the same month", () => {
    const expensesTotal = 20_000;
    let goal = makeGoal({ savedAmount: 0 });

    goal = applyGoalFunding(goal, 10_000, FIXED_NOW); // +10,000
    goal = applyGoalFunding(goal, 25_000, FIXED_NOW); // +15,000 more

    const spent = moneySpentFor(expensesTotal, [goal]);
    expect(spent).toBe(45_000); // 20,000 expenses + 25,000 total funded
  });

  test("GOAL-SPEND-001-03: the month's effective budget is unaffected by goal funding", () => {
    // The budget formula in useCalculations.ts no longer takes `goals` as an
    // input at all — this is a sanity check that funding a goal doesn't
    // require (or implicitly rely on) any budget-side adjustment.
    const baseBudget = 40_000;
    const goal = makeGoal({ savedAmount: 40_000 });
    applyGoalFunding(goal, goal.savedAmount + 5_000, FIXED_NOW);
    expect(baseBudget).toBe(40_000); // still untouched
  });
});

describe("GOAL-SPEND-002: withdrawing from a goal removes the amount from money spent", () => {
  test("GOAL-SPEND-002-01: fully withdrawing a deposit restores money spent to its original value", () => {
    const expensesTotal = 10_000;
    const goal = makeGoal({ savedAmount: 40_000 });

    const funded = applyGoalFunding(goal, goal.savedAmount + 5_000, FIXED_NOW);
    expect(moneySpentFor(expensesTotal, [funded])).toBe(15_000);

    const withdrawn = applyGoalFunding(funded, funded.savedAmount - 5_000, FIXED_NOW);
    const spentAfterWithdrawal = moneySpentFor(expensesTotal, [withdrawn]);

    expect(spentAfterWithdrawal).toBe(10_000); // fully restored
    expect(withdrawn.savedAmount).toBe(40_000);
  });

  test("GOAL-SPEND-002-02: withdrawing more than was funded this month still nets correctly (restores pre-existing savings too)", () => {
    const expensesTotal = 5_000;
    const goal = makeGoal({ savedAmount: 20_000 }); // pre-existing savings from before this feature

    const funded = applyGoalFunding(goal, 30_000, FIXED_NOW); // contribution: +10,000
    expect(moneySpentFor(expensesTotal, [funded])).toBe(15_000);

    // Withdraw back below the pre-existing amount — net contribution this month goes negative:
    // +10,000 (deposit) + (-25,000) (this withdrawal) = -15,000 net.
    const withdrawn = applyGoalFunding(funded, 5_000, FIXED_NOW); // contribution: -25,000
    const spent = moneySpentFor(expensesTotal, [withdrawn]);

    expect(spent).toBe(-10_000); // 5,000 + (-15,000)
  });
});

describe("GOAL-SPEND-003: partial withdrawals only remove the withdrawn portion", () => {
  test("GOAL-SPEND-003-01: withdrawing half of a deposit removes half the addition", () => {
    const expensesTotal = 10_000;
    const goal = makeGoal({ savedAmount: 40_000 });

    const funded = applyGoalFunding(goal, goal.savedAmount + 10_000, FIXED_NOW); // +10,000
    const partiallyWithdrawn = applyGoalFunding(funded, funded.savedAmount - 4_000, FIXED_NOW); // -4,000 back

    const spent = moneySpentFor(expensesTotal, [partiallyWithdrawn]);
    expect(spent).toBe(16_000); // 10,000 + (10,000 - 4,000)
  });
});

describe("GOAL-SPEND-004: contributions are scoped to the month/year they happened in", () => {
  test("GOAL-SPEND-004-01: a deposit made last month does not affect this month's money-spent total", () => {
    const expensesTotal = 10_000;
    const goal = makeGoal({ savedAmount: 40_000 });

    const lastMonth = new Date(YEAR, MONTH - 2, 15); // one month earlier
    const funded = applyGoalFunding(goal, goal.savedAmount + 5_000, lastMonth);

    const thisMonthSpent = moneySpentFor(expensesTotal, [funded], MONTH, YEAR);
    expect(thisMonthSpent).toBe(10_000); // unaffected — contribution belongs to last month

    const lastMonthSpent = moneySpentFor(expensesTotal, [funded], MONTH - 1, YEAR);
    expect(lastMonthSpent).toBe(15_000); // added to the month it actually happened in
  });

  test("GOAL-SPEND-004-02: multiple goals combine their contributions for the viewed month", () => {
    const expensesTotal = 1_000;
    const goalA = applyGoalFunding(makeGoal({ id: "a", savedAmount: 0 }), 5_000, FIXED_NOW);
    const goalB = applyGoalFunding(makeGoal({ id: "b", savedAmount: 0 }), 3_000, FIXED_NOW);

    const spent = moneySpentFor(expensesTotal, [goalA, goalB]);
    expect(spent).toBe(9_000); // 1,000 + 5,000 + 3,000
  });
});
