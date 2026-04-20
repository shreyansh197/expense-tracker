import type { Expense, CategoryId } from "@/types";
import { getDayOfWeekFactors } from "@/lib/calculations";

// ── Archetype definitions ──

export interface Archetype {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tip: string;
}

const ARCHETYPES: Record<string, Archetype> = {
  creature_of_habit: {
    id: "creature_of_habit",
    name: "Creature of Habit",
    emoji: "🦉",
    description: "You spend on the same things, the same way, every month. Predictable and steady.",
    tip: "Your consistency is a strength — try optimizing your top 2 categories for easy wins.",
  },
  impulse_explorer: {
    id: "impulse_explorer",
    name: "Impulse Explorer",
    emoji: "🧭",
    description: "Your spending is varied and spontaneous — lots of categories, uneven days.",
    tip: "Try a 24-hour rule for non-essential purchases over your daily average.",
  },
  weekend_warrior: {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    emoji: "🎯",
    description: "Weekends are your big spending days. Fri–Sun accounts for most of your budget.",
    tip: "Plan weekend activities with a set budget to keep the fun without the spike.",
  },
  front_loader: {
    id: "front_loader",
    name: "Front Loader",
    emoji: "🚀",
    description: "You spend heavily in the first half of the month, then slow down.",
    tip: "Consider spreading large purchases across the month to maintain a steady pace.",
  },
  back_loader: {
    id: "back_loader",
    name: "Back Loader",
    emoji: "🐢",
    description: "You're conservative early on but spend more as the month ends.",
    tip: "Your caution is great — just watch for end-of-month splurges erasing early savings.",
  },
  subscription_heavy: {
    id: "subscription_heavy",
    name: "Subscription Collector",
    emoji: "🔄",
    description: "A large portion of your spending is recurring. Your bills run on autopilot.",
    tip: "Audit your subscriptions quarterly — you may be paying for things you rarely use.",
  },
  minimalist: {
    id: "minimalist",
    name: "Mindful Minimalist",
    emoji: "🍃",
    description: "Low transaction count, deliberate spending. You think before you buy.",
    tip: "You're already efficient — consider investing the surplus towards your goals.",
  },
  big_ticket: {
    id: "big_ticket",
    name: "Big Ticket Buyer",
    emoji: "💎",
    description: "Fewer transactions but larger amounts. You go big when you spend.",
    tip: "Your large purchases move the needle — comparison shopping even once can save a lot.",
  },
};

// ── Scoring engine ──

interface DnaInput {
  expenses: Expense[];
  recurringRatio: number;         // recurring spend / total spend (0-1)
  categoriesUsed: number;         // unique categories used
  totalCategories: number;        // total available categories
  avgTransactionAmount: number;
  medianTransactionAmount: number;
}

interface DnaScore {
  archetypeId: string;
  confidence: number; // 0-100
}

function computeScores(input: DnaInput): DnaScore[] {
  const scores: Record<string, number> = {};
  const active = input.expenses.filter((e) => !e.deletedAt);
  if (active.length < 5) return []; // need meaningful data

  // Day-of-week factors
  const dowFactors = getDayOfWeekFactors(active);
  const weekendFactor = ((dowFactors[0] ?? 1) + (dowFactors[5] ?? 1) + (dowFactors[6] ?? 1)) / 3;

  // First half vs second half spending
  const firstHalf = active.filter((e) => e.day <= 15).reduce((s, e) => s + e.amount, 0);
  const secondHalf = active.filter((e) => e.day > 15).reduce((s, e) => s + e.amount, 0);
  const total = firstHalf + secondHalf;
  const firstHalfRatio = total > 0 ? firstHalf / total : 0.5;

  // Category concentration (Herfindahl index)
  const catTotals: Record<string, number> = {};
  for (const e of active) catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  const shares = Object.values(catTotals).map((v) => (total > 0 ? v / total : 0));
  const herfindahl = shares.reduce((s, sh) => s + sh * sh, 0);

  // Transaction frequency
  const uniqueDays = new Set(active.map((e) => e.day)).size;
  const daysInMonth = Math.max(...active.map((e) => e.day), 28);
  const frequencyRatio = uniqueDays / daysInMonth;

  // Amount variance
  const amounts = active.map((e) => e.amount);
  const avgAmt = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const variance = amounts.reduce((s, a) => s + (a - avgAmt) ** 2, 0) / amounts.length;
  const cv = avgAmt > 0 ? Math.sqrt(variance) / avgAmt : 0; // coefficient of variation

  // ── Score each archetype ──

  // Creature of Habit: high category concentration, low variance, regular frequency
  scores.creature_of_habit = (herfindahl > 0.25 ? 30 : 0) + (cv < 0.8 ? 25 : 0) + (frequencyRatio > 0.5 ? 20 : 0) + (input.categoriesUsed <= Math.ceil(input.totalCategories * 0.5) ? 15 : 0);

  // Impulse Explorer: many categories, high variance, spread across days
  scores.impulse_explorer = (input.categoriesUsed >= Math.ceil(input.totalCategories * 0.6) ? 25 : 0) + (cv > 1.2 ? 30 : 0) + (herfindahl < 0.2 ? 20 : 0) + (frequencyRatio > 0.6 ? 15 : 0);

  // Weekend Warrior: high weekend factor
  scores.weekend_warrior = weekendFactor > 1.3 ? 70 + Math.min((weekendFactor - 1.3) * 50, 30) : weekendFactor > 1.1 ? 40 : 0;

  // Front Loader
  scores.front_loader = firstHalfRatio > 0.65 ? 60 + Math.min((firstHalfRatio - 0.65) * 100, 30) : firstHalfRatio > 0.55 ? 30 : 0;

  // Back Loader
  scores.back_loader = firstHalfRatio < 0.35 ? 60 + Math.min((0.35 - firstHalfRatio) * 100, 30) : firstHalfRatio < 0.45 ? 30 : 0;

  // Subscription Collector
  scores.subscription_heavy = input.recurringRatio > 0.4 ? 60 + Math.min((input.recurringRatio - 0.4) * 100, 30) : input.recurringRatio > 0.25 ? 35 : 0;

  // Minimalist: low frequency, low total transactions
  scores.minimalist = (active.length < 15 ? 30 : 0) + (frequencyRatio < 0.4 ? 25 : 0) + (cv < 0.6 ? 20 : 0);

  // Big Ticket Buyer: high avg amount, low count, high variance
  scores.big_ticket = (input.avgTransactionAmount > input.medianTransactionAmount * 1.5 ? 30 : 0) + (cv > 1.0 ? 25 : 0) + (active.length < 20 ? 20 : 0);

  // Convert to sorted results
  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .map(([id, score]) => ({ archetypeId: id, confidence: Math.min(score, 100) }))
    .sort((a, b) => b.confidence - a.confidence);
}

// ── Public API ──

export interface MoneyDnaResult {
  primary: Archetype & { confidence: number };
  secondary: (Archetype & { confidence: number }) | null;
  traits: string[];
}

export function computeMoneyDna(
  expenses: Expense[],
  recurringExpenseTotal: number,
  categories: CategoryId[],
): MoneyDnaResult | null {
  const active = expenses.filter((e) => !e.deletedAt);
  if (active.length < 5) return null;

  const total = active.reduce((s, e) => s + e.amount, 0);
  const amounts = active.map((e) => e.amount);
  amounts.sort((a, b) => a - b);
  const median = amounts.length % 2 === 0
    ? (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2
    : amounts[Math.floor(amounts.length / 2)];

  const uniqueCategories = new Set(active.map((e) => e.category));

  const scores = computeScores({
    expenses: active,
    recurringRatio: total > 0 ? recurringExpenseTotal / total : 0,
    categoriesUsed: uniqueCategories.size,
    totalCategories: Math.max(categories.length, 1),
    avgTransactionAmount: total / active.length,
    medianTransactionAmount: median,
  });

  if (scores.length === 0) return null;

  const primary = ARCHETYPES[scores[0].archetypeId];
  const secondary = scores.length > 1 && scores[1].confidence > 30
    ? ARCHETYPES[scores[1].archetypeId]
    : null;

  // Derive quick trait labels
  const traits: string[] = [];
  const dowFactors = getDayOfWeekFactors(active);
  const weekendFactor = ((dowFactors[0] ?? 1) + (dowFactors[5] ?? 1) + (dowFactors[6] ?? 1)) / 3;
  if (weekendFactor > 1.2) traits.push("Weekend spender");
  if (weekendFactor < 0.8) traits.push("Weekday spender");
  if (recurringExpenseTotal / Math.max(total, 1) > 0.3) traits.push("Subscription-driven");
  if (active.length > 25) traits.push("High frequency");
  if (active.length < 10) traits.push("Selective buyer");
  if (uniqueCategories.size >= categories.length * 0.7) traits.push("Diversified");
  if (uniqueCategories.size <= 3) traits.push("Focused");

  return {
    primary: { ...primary, confidence: scores[0].confidence },
    secondary: secondary ? { ...secondary, confidence: scores[1].confidence } : null,
    traits: traits.slice(0, 4),
  };
}
