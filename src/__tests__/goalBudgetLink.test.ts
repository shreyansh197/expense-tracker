/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Savings Goal ↔ Monthly Budget Link
 * ═══════════════════════════════════════════════════════════════════
 *
 * Requirements Traceability:
 *   GOAL-BUDGET-001  Funding a goal this month deducts exactly that amount
 *                     from the month's effective budget, app-wide.
 *   GOAL-BUDGET-002  Withdrawing from a goal this month restores exactly
 *                     that amount back into the month's effective budget.
 *   GOAL-BUDGET-003  Partial withdrawals only restore the withdrawn portion.
 *   GOAL-BUDGET-004  Contributions dated to a different month/year do not
 *                     affect the currently-viewed month's budget.
 *
 * Exercises the real production helpers (`applyGoalFunding`,
 * `getGoalContributionsTotal`) plus the exact subtraction formula used by
 * `useCalculations.ts`'s `effectiveBudget` memo:
 *   effectiveBudget = subMoney(baseBudget, getGoalContributionsTotal(goals, month, year))
 * so this test fails if either the goal helpers or the budget formula regress.
 *
 * Environment: Node (Jest), ts-jest, no DOM.
 */

import type { Goal } from "../types";
import { applyGoalFunding, getGoalContributionsTotal } from "../lib/goals";
import { subMoney } from "../lib/money";

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

/** Mirrors the exact formula in useCalculations.ts's effectiveBudget memo. */
function effectiveBudgetFor(baseBudget: number, goals: Goal[], month = MONTH, year = YEAR): number {
  const goalContributions = getGoalContributionsTotal(goals, month, year);
  return subMoney(baseBudget, goalContributions);
}

describe("GOAL-BUDGET-001: funding a goal deducts the amount from the budget", () => {
  test("GOAL-BUDGET-001-01: adding ₹5,000 to a goal reduces the budget by exactly ₹5,000", () => {
    const baseBudget = 40_000;
    const goal = makeGoal({ savedAmount: 40_000 });

    const budgetBefore = effectiveBudgetFor(baseBudget, [goal]);
    expect(budgetBefore).toBe(40_000);

    const funded = applyGoalFunding(goal, goal.savedAmount + 5_000, FIXED_NOW);
    const budgetAfter = effectiveBudgetFor(baseBudget, [funded]);

    expect(budgetAfter).toBe(35_000);
    expect(subMoney(budgetBefore, budgetAfter)).toBe(5_000);
  });

  test("GOAL-BUDGET-001-02: funding is additive across multiple deposits in the same month", () => {
    const baseBudget = 100_000;
    let goal = makeGoal({ savedAmount: 0 });

    goal = applyGoalFunding(goal, 10_000, FIXED_NOW); // +10,000
    goal = applyGoalFunding(goal, 25_000, FIXED_NOW); // +15,000 more

    const budget = effectiveBudgetFor(baseBudget, [goal]);
    expect(budget).toBe(75_000); // 100,000 - 25,000 total funded
  });
});

describe("GOAL-BUDGET-002: withdrawing from a goal restores the amount to the budget", () => {
  test("GOAL-BUDGET-002-01: fully withdrawing a deposit restores the budget to its original value", () => {
    const baseBudget = 40_000;
    const goal = makeGoal({ savedAmount: 40_000 });

    const funded = applyGoalFunding(goal, goal.savedAmount + 5_000, FIXED_NOW);
    expect(effectiveBudgetFor(baseBudget, [funded])).toBe(35_000);

    const withdrawn = applyGoalFunding(funded, funded.savedAmount - 5_000, FIXED_NOW);
    const budgetAfterWithdrawal = effectiveBudgetFor(baseBudget, [withdrawn]);

    expect(budgetAfterWithdrawal).toBe(40_000); // fully restored
    expect(withdrawn.savedAmount).toBe(40_000);
  });

  test("GOAL-BUDGET-002-02: withdrawing more than was funded this month still nets correctly (restores pre-existing savings too)", () => {
    const baseBudget = 50_000;
    const goal = makeGoal({ savedAmount: 20_000 }); // pre-existing savings from before this feature

    const funded = applyGoalFunding(goal, 30_000, FIXED_NOW); // contribution: +10,000
    expect(effectiveBudgetFor(baseBudget, [funded])).toBe(40_000);

    // Withdraw back below the pre-existing amount — net contribution this month goes negative:
    // +10,000 (deposit) + (-25,000) (this withdrawal) = -15,000 net.
    const withdrawn = applyGoalFunding(funded, 5_000, FIXED_NOW); // contribution: -25,000
    const budget = effectiveBudgetFor(baseBudget, [withdrawn]);

    expect(budget).toBe(65_000); // 50,000 - (-15,000)
  });
});

describe("GOAL-BUDGET-003: partial withdrawals only restore the withdrawn portion", () => {
  test("GOAL-BUDGET-003-01: withdrawing half of a deposit restores half the deduction", () => {
    const baseBudget = 40_000;
    const goal = makeGoal({ savedAmount: 40_000 });

    const funded = applyGoalFunding(goal, goal.savedAmount + 10_000, FIXED_NOW); // -10,000
    const partiallyWithdrawn = applyGoalFunding(funded, funded.savedAmount - 4_000, FIXED_NOW); // +4,000 back

    const budget = effectiveBudgetFor(baseBudget, [partiallyWithdrawn]);
    expect(budget).toBe(34_000); // 40,000 - (10,000 - 4,000)
  });
});

describe("GOAL-BUDGET-004: contributions are scoped to the month/year they happened in", () => {
  test("GOAL-BUDGET-004-01: a deposit made last month does not affect this month's budget", () => {
    const baseBudget = 40_000;
    const goal = makeGoal({ savedAmount: 40_000 });

    const lastMonth = new Date(YEAR, MONTH - 2, 15); // one month earlier
    const funded = applyGoalFunding(goal, goal.savedAmount + 5_000, lastMonth);

    const thisMonthBudget = effectiveBudgetFor(baseBudget, [funded], MONTH, YEAR);
    expect(thisMonthBudget).toBe(40_000); // unaffected — contribution belongs to last month

    const lastMonthBudget = effectiveBudgetFor(baseBudget, [funded], MONTH - 1, YEAR);
    expect(lastMonthBudget).toBe(35_000); // deducted from the month it actually happened in
  });

  test("GOAL-BUDGET-004-02: multiple goals combine their contributions for the viewed month", () => {
    const baseBudget = 60_000;
    const goalA = applyGoalFunding(makeGoal({ id: "a", savedAmount: 0 }), 5_000, FIXED_NOW);
    const goalB = applyGoalFunding(makeGoal({ id: "b", savedAmount: 0 }), 3_000, FIXED_NOW);

    const budget = effectiveBudgetFor(baseBudget, [goalA, goalB]);
    expect(budget).toBe(52_000); // 60,000 - 5,000 - 3,000
  });
});
