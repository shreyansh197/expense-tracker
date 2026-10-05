import type { Goal, GoalContribution } from "@/types";
import { addMoney, subMoney } from "@/lib/money";

/**
 * Applies a funding/withdrawal change to a goal and records a dated
 * contribution so the change can later be deducted from (or restored to)
 * the budget of whichever month it happened in. `newSaved` is the already
 * clamped target `savedAmount` chosen by the caller (e.g. GoalFundingSheet).
 */
export function applyGoalFunding(goal: Goal, newSaved: number, now: Date = new Date()): Goal {
  const delta = subMoney(newSaved, goal.savedAmount);
  if (delta === 0) return goal;

  const contribution: GoalContribution = {
    amount: delta,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    createdAt: now.getTime(),
  };

  return {
    ...goal,
    savedAmount: newSaved,
    contributions: [...(goal.contributions ?? []), contribution],
  };
}

/**
 * Net amount funded into (or withdrawn from, if negative) all goals during a
 * given month. Used to deduct that month's goal contributions from the
 * month's effective budget, app-wide.
 */
export function getGoalContributionsTotal(goals: readonly Goal[] | undefined, month: number, year: number): number {
  if (!goals || goals.length === 0) return 0;
  let total = 0;
  for (const goal of goals) {
    for (const c of goal.contributions ?? []) {
      if (c.month === month && c.year === year) total = addMoney(total, c.amount);
    }
  }
  return total;
}
