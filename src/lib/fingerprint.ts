import type { Expense, CategoryId } from "@/types";
import { getDayOfWeekFactors } from "@/lib/calculations";

/**
 * 8 normalized axes (0–1) representing a user's spending behavioral fingerprint.
 */
export interface FingerprintAxes {
  automation: number;      // recurringRatio — autopilot spending
  focus: number;           // herfindahl index — category concentration
  weekendEnergy: number;   // weekend vs weekday factor
  frontLoading: number;    // first-half vs second-half
  frequency: number;       // active days ratio
  volatility: number;      // coefficient of variation (capped)
  diversification: number; // categories used ratio
  ticketSize: number;      // avg vs median ratio (normalized)
}

export const AXIS_LABELS: Record<keyof FingerprintAxes, string> = {
  automation: "Automation",
  focus: "Focus",
  weekendEnergy: "Weekend",
  frontLoading: "Front-load",
  frequency: "Frequency",
  volatility: "Volatility",
  diversification: "Diversity",
  ticketSize: "Ticket Size",
};

/**
 * Extracts 8 normalized behavioral axes from expense data.
 * Returns null if insufficient data (< 5 expenses).
 */
export function computeFingerprint(
  expenses: Expense[],
  recurringExpenseTotal: number,
  categories: CategoryId[],
): FingerprintAxes | null {
  const active = expenses.filter((e) => !e.deletedAt);
  if (active.length < 5) return null;

  const total = active.reduce((s, e) => s + e.amount, 0);
  if (total === 0) return null;

  // 1. Automation (recurring ratio)
  const automation = Math.min(recurringExpenseTotal / total, 1);

  // 2. Focus (Herfindahl index — ranges ~0.05 to 1.0, normalize)
  const catTotals: Record<string, number> = {};
  for (const e of active) catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  const shares = Object.values(catTotals).map((v) => v / total);
  const herfindahl = shares.reduce((s, sh) => s + sh * sh, 0);
  const focus = Math.min(herfindahl * 2, 1); // scale up — 0.5+ is very concentrated

  // 3. Weekend Energy (factor typically 0.5–2.0, normalize to 0–1)
  // getDay(): 0=Sunday, 6=Saturday
  const dowFactors = getDayOfWeekFactors(active);
  const weekendFactor = ((dowFactors[0] ?? 1) + (dowFactors[6] ?? 1)) / 2;
  const weekendEnergy = Math.min(Math.max((weekendFactor - 0.5) / 1.5, 0), 1);

  // 4. Front-loading (first-half ratio, already 0–1)
  const firstHalf = active.filter((e) => e.day <= 15).reduce((s, e) => s + e.amount, 0);
  const frontLoading = firstHalf / total;

  // 5. Frequency (unique spending days / days in month)
  const uniqueDays = new Set(active.map((e) => e.day)).size;
  const daysInMonth = Math.max(...active.map((e) => e.day), 28);
  const frequency = uniqueDays / daysInMonth;

  // 6. Volatility (CV, typically 0–3, cap at 2 for normalization)
  const amounts = active.map((e) => e.amount);
  const avgAmt = total / amounts.length;
  const variance = amounts.reduce((s, a) => s + (a - avgAmt) ** 2, 0) / amounts.length;
  const cv = avgAmt > 0 ? Math.sqrt(variance) / avgAmt : 0;
  const volatility = Math.min(cv / 2, 1);

  // 7. Diversification (categories used / total available)
  const uniqueCategories = new Set(active.map((e) => e.category)).size;
  const diversification = Math.min(uniqueCategories / Math.max(categories.length, 1), 1);

  // 8. Ticket Size (avg / median ratio — high means skewed by big purchases)
  const sorted = [...amounts].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const ticketSize = median > 0 ? Math.min((avgAmt / median - 1) / 2, 1) : 0;

  return {
    automation,
    focus,
    weekendEnergy,
    frontLoading,
    frequency,
    volatility,
    diversification,
    ticketSize,
  };
}
