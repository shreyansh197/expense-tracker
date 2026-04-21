"use client";

import { useMemo, useRef, useCallback, useEffect } from "react";
import type { Achievement, Expense, UserSettings } from "@/types";

// ── Achievement definitions ──

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  totalExpenses: number;
  streak: number;
  uniqueCategoriesThisMonth: number;
  goalCount: number;
  completedGoals: number;
  activeRecurring: number;
  consecutiveMonthsUnderBudget: number;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "week_warrior", name: "Week Warrior", description: "7-day logging streak", icon: "🔥", check: (ctx) => ctx.streak >= 7 },
  { id: "monthly_master", name: "Monthly Master", description: "30-day logging streak", icon: "⭐", check: (ctx) => ctx.streak >= 30 },
  { id: "budget_hero", name: "Budget Hero", description: "Finish a month under budget", icon: "🛡️", check: (ctx) => ctx.consecutiveMonthsUnderBudget >= 1 },
  { id: "triple_crown", name: "Triple Crown", description: "3 months under budget in a row", icon: "👑", check: (ctx) => ctx.consecutiveMonthsUnderBudget >= 3 },
  { id: "goal_setter", name: "Goal Setter", description: "Create your first savings goal", icon: "🎯", check: (ctx) => ctx.goalCount >= 1 },
  { id: "goal_crusher", name: "Goal Crusher", description: "Complete a savings goal", icon: "💪", check: (ctx) => ctx.completedGoals >= 1 },
  { id: "recurring_pro", name: "Recurring Pro", description: "Set up 3+ recurring expenses", icon: "🔄", check: (ctx) => ctx.activeRecurring >= 3 },
];

// ── Helpers ──

function getConsecutiveMonthsUnderBudget(
  allExpenses: Expense[],
  salary: number,
  monthlyBudgets?: Record<string, number>,
): number {
  if (salary <= 0) return 0;

  const monthMap: Record<string, number> = {};
  for (const e of allExpenses) {
    if (e.deletedAt) continue;
    const key = `${e.year}-${String(e.month).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + e.amount;
  }

  const now = new Date();
  let m = now.getMonth(); // 0-indexed
  let y = now.getFullYear();

  // Start from previous month (current month not yet complete)
  m--;
  if (m < 0) { m = 11; y--; }

  let consecutive = 0;
  for (let i = 0; i < 12; i++) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    const budget = monthlyBudgets?.[key] ?? salary;
    const total = monthMap[key];
    if (total != null && total > 0 && total <= budget) {
      consecutive++;
    } else {
      break;
    }
    m--;
    if (m < 0) { m = 11; y--; }
  }

  return consecutive;
}

// ── Hook ──

export interface AchievementStatus {
  def: AchievementDef;
  unlocked: boolean;
  unlockedAt: number;
}

export function useAchievements(
  settings: UserSettings,
  allExpenses: Expense[],
  currentMonthExpenses: Expense[],
  streak: number,
  updateSettings: (updates: { achievements: Achievement[] }) => void,
) {
  const persisted = useMemo(() => settings.achievements ?? [], [settings.achievements]);
  const persistedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of persisted) map.set(a.id, a.unlockedAt);
    return map;
  }, [persisted]);

  const consecutiveUnderBudget = useMemo(
    () => getConsecutiveMonthsUnderBudget(allExpenses, settings.salary, settings.monthlyBudgets),
    [allExpenses, settings.salary, settings.monthlyBudgets],
  );

  const ctx: AchievementContext = useMemo(() => {
    const active = allExpenses.filter((e) => !e.deletedAt);
    const thisMonth = currentMonthExpenses.filter((e) => !e.deletedAt);
    const uniqueCategories = new Set(thisMonth.map((e) => e.category));
    return {
      totalExpenses: active.length,
      streak,
      uniqueCategoriesThisMonth: uniqueCategories.size,
      goalCount: settings.goals?.length ?? 0,
      completedGoals: settings.goals?.filter((g) => g.savedAmount >= g.targetAmount).length ?? 0,
      activeRecurring: settings.recurringExpenses?.filter((r) => r.active).length ?? 0,
      consecutiveMonthsUnderBudget: consecutiveUnderBudget,
    };
  }, [allExpenses, currentMonthExpenses, streak, settings.goals, settings.recurringExpenses, consecutiveUnderBudget]);

  // Evaluate all achievement defs — timestamps are assigned at persist time, not during render
  const { statuses, newlyUnlocked } = useMemo(() => {
    const newUnlocks: string[] = [];
    const statusList: AchievementStatus[] = ACHIEVEMENT_DEFS.map((def) => {
      const existingTs = persistedMap.get(def.id);
      if (existingTs) {
        return { def, unlocked: true, unlockedAt: existingTs };
      }
      const earned = def.check(ctx);
      if (earned) {
        newUnlocks.push(def.id);
        return { def, unlocked: true, unlockedAt: 0 };
      }
      return { def, unlocked: false, unlockedAt: 0 };
    });
    return { statuses: statusList, newlyUnlocked: newUnlocks };
  }, [ctx, persistedMap]);

  // Persist newly unlocked achievements (stable ref avoids re-triggering)
  const lastPersistedRef = useRef<string>("");
  const persistNew = useCallback(() => {
    if (newlyUnlocked.length === 0) return;
    const key = newlyUnlocked.join(",");
    if (key === lastPersistedRef.current) return;
    lastPersistedRef.current = key;
    const now = Date.now();
    const newAchievements: Achievement[] = newlyUnlocked.map((id) => ({ id, unlockedAt: now }));
    updateSettings({ achievements: [...persisted, ...newAchievements] });
  }, [newlyUnlocked, persisted, updateSettings]);

  // Auto-persist newly unlocked achievements
  useEffect(() => {
    if (newlyUnlocked.length > 0) persistNew();
  }, [newlyUnlocked, persistNew]);

  return {
    achievements: statuses,
    newlyUnlocked,
    persistNew,
    unlockedCount: statuses.filter((s) => s.unlocked).length,
    totalCount: ACHIEVEMENT_DEFS.length,
  };
}
