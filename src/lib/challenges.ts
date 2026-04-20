import type { Expense, Challenge } from "@/types";

// ── Challenge templates ──

export interface ChallengeTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  durationDays: number;
  evaluate: (expenses: Expense[], startDate: string, endDate: string) => number; // returns progress 0-100
  category?: string; // if category-specific
}

function filterDateRange(expenses: Expense[], startDate: string, endDate: string): Expense[] {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  return expenses.filter((e) => {
    if (e.deletedAt) return false;
    const d = new Date(e.year, e.month - 1, e.day);
    return d >= start && d <= end;
  });
}

function daysBetween(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const diff = new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

function daysElapsed(startDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: "no_eat_out_7",
    name: "No Eat-Out Week",
    emoji: "🍳",
    description: "Avoid ordering food or eating out for 7 days",
    durationDays: 7,
    category: "eat-out",
    evaluate: (expenses, startDate, endDate) => {
      const inRange = filterDateRange(expenses, startDate, endDate).filter((e) => e.category === "eat-out");
      if (inRange.length === 0) {
        // Progress based on days elapsed
        const elapsed = daysElapsed(startDate);
        const total = daysBetween(startDate, endDate);
        return Math.min(Math.round((elapsed / total) * 100), 100);
      }
      return 0; // failed — ate out
    },
  },
  {
    id: "daily_cap_7",
    name: "Daily Budget Cap",
    emoji: "📏",
    description: "Keep each day under your daily pace target for 7 days",
    durationDays: 7,
    evaluate: (expenses, startDate, endDate) => {
      const total = daysBetween(startDate, endDate);
      const elapsed = Math.min(daysElapsed(startDate), total);
      if (elapsed === 0) return 0;

      const inRange = filterDateRange(expenses, startDate, endDate);
      const dailyTotals: Record<number, number> = {};
      for (const e of inRange) dailyTotals[e.day] = (dailyTotals[e.day] || 0) + e.amount;

      // Calculate average to set cap
      const allAmounts = Object.values(dailyTotals);
      if (allAmounts.length === 0) return Math.round((elapsed / total) * 100);
      const avg = allAmounts.reduce((s, a) => s + a, 0) / allAmounts.length;

      let daysUnderCap = 0;
      for (let i = 0; i < elapsed; i++) {
        const [sy, sm, sd] = startDate.split("-").map(Number);
        const d = new Date(sy, sm - 1, sd);
        d.setDate(d.getDate() + i);
        const dayTotal = dailyTotals[d.getDate()] || 0;
        if (dayTotal <= avg * 1.2) daysUnderCap++; // 20% grace
      }
      return Math.round((daysUnderCap / total) * 100);
    },
  },
  {
    id: "no_impulse_3",
    name: "3-Day No-Impulse",
    emoji: "🧘",
    description: "Only planned/recurring expenses for 3 days",
    durationDays: 3,
    evaluate: (expenses, startDate, endDate) => {
      const total = daysBetween(startDate, endDate);
      const elapsed = Math.min(daysElapsed(startDate), total);
      if (elapsed === 0) return 0;

      const inRange = filterDateRange(expenses, startDate, endDate);
      const nonRecurring = inRange.filter((e) => !e.isRecurring);
      if (nonRecurring.length === 0) return Math.min(Math.round((elapsed / total) * 100), 100);
      // Each non-recurring expense deducts from progress
      return Math.max(0, Math.round(((elapsed / total) * 100) - (nonRecurring.length * 20)));
    },
  },
  {
    id: "zero_spend_day",
    name: "Zero Spend Day",
    emoji: "🎯",
    description: "Go one full day without spending anything",
    durationDays: 1,
    evaluate: (expenses, startDate, endDate) => {
      const inRange = filterDateRange(expenses, startDate, endDate);
      return inRange.length === 0 ? 100 : 0;
    },
  },
  {
    id: "no_shopping_7",
    name: "Shopping Detox",
    emoji: "🚫",
    description: "No shopping purchases for 7 days",
    durationDays: 7,
    category: "shopping",
    evaluate: (expenses, startDate, endDate) => {
      const inRange = filterDateRange(expenses, startDate, endDate).filter((e) => e.category === "shopping");
      if (inRange.length === 0) {
        const elapsed = daysElapsed(startDate);
        const total = daysBetween(startDate, endDate);
        return Math.min(Math.round((elapsed / total) * 100), 100);
      }
      return 0;
    },
  },
  {
    id: "log_streak_7",
    name: "Perfect Logger",
    emoji: "📝",
    description: "Log at least one expense every day for 7 days",
    durationDays: 7,
    evaluate: (expenses, startDate, endDate) => {
      const total = daysBetween(startDate, endDate);
      const elapsed = Math.min(daysElapsed(startDate), total);
      if (elapsed === 0) return 0;

      const inRange = filterDateRange(expenses, startDate, endDate);
      const loggedDays = new Set(inRange.map((e) => `${e.year}-${e.month}-${e.day}`));
      return Math.round((loggedDays.size / total) * 100);
    },
  },
];

// ── Helpers ──

export function getAvailableChallenges(activeChallenges: Challenge[]): ChallengeTemplate[] {
  const activeIds = new Set(activeChallenges.filter((c) => c.status === "active").map((c) => c.templateId));
  return CHALLENGE_TEMPLATES.filter((t) => !activeIds.has(t.id));
}

export function startChallenge(templateId: string): Challenge {
  const template = CHALLENGE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error(`Unknown challenge: ${templateId}`);

  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const end = new Date(now);
  end.setDate(end.getDate() + template.durationDays - 1);
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  return {
    id: `${templateId}_${Date.now()}`,
    templateId,
    startDate: start,
    endDate: endStr,
    status: "active",
    progress: 0,
  };
}

export function evaluateChallenge(challenge: Challenge, expenses: Expense[]): Challenge {
  const template = CHALLENGE_TEMPLATES.find((t) => t.id === challenge.templateId);
  if (!template || challenge.status !== "active") return challenge;

  const progress = template.evaluate(expenses, challenge.startDate, challenge.endDate);

  // Check if challenge period has ended
  const [ey, em, ed] = challenge.endDate.split("-").map(Number);
  const endDate = new Date(ey, em - 1, ed);
  endDate.setHours(23, 59, 59);
  const now = new Date();

  if (now > endDate) {
    return {
      ...challenge,
      progress,
      status: progress >= 80 ? "completed" : "failed",
      completedAt: progress >= 80 ? Date.now() : undefined,
    };
  }

  return { ...challenge, progress };
}
