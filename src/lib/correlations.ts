import type { Expense } from "@/types";

export interface CorrelationResult {
  category1: string;
  category2: string;
  coefficient: number; // Pearson r (-1 to 1)
  direction: "positive" | "negative";
  strength: "strong" | "moderate";
}

/**
 * Detect spending correlations between category pairs using daily totals.
 * Returns pairs with |r| > threshold, sorted by strength.
 */
export function detectCorrelations(
  expenses: Expense[],
  threshold = 0.55,
): CorrelationResult[] {
  const active = expenses.filter((e) => !e.deletedAt);
  if (active.length < 10) return [];

  // Build per-day per-category totals
  const catDays: Record<string, Record<number, number>> = {};
  const allDays = new Set<number>();

  for (const e of active) {
    if (!catDays[e.category]) catDays[e.category] = {};
    catDays[e.category][e.day] = (catDays[e.category][e.day] || 0) + e.amount;
    allDays.add(e.day);
  }

  const days = Array.from(allDays).sort((a, b) => a - b);
  if (days.length < 5) return [];

  const categories = Object.keys(catDays).filter((cat) => {
    // Only consider categories with activity on 3+ days
    const activeDays = days.filter((d) => (catDays[cat][d] || 0) > 0);
    return activeDays.length >= 3;
  });

  if (categories.length < 2) return [];

  // Compute daily vectors
  const vectors: Record<string, number[]> = {};
  for (const cat of categories) {
    vectors[cat] = days.map((d) => catDays[cat][d] || 0);
  }

  const results: CorrelationResult[] = [];

  // Pearson correlation between all pairs
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const r = pearson(vectors[categories[i]], vectors[categories[j]]);
      if (Math.abs(r) >= threshold) {
        results.push({
          category1: categories[i],
          category2: categories[j],
          coefficient: r,
          direction: r > 0 ? "positive" : "negative",
          strength: Math.abs(r) >= 0.7 ? "strong" : "moderate",
        });
      }
    }
  }

  return results.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denom === 0) return 0;

  return (n * sumXY - sumX * sumY) / denom;
}
