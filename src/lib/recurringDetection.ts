import type { Expense, CategoryId } from "@/types";

export interface RecurringSuggestion {
  /** Stable key for dedup: `${category}|${roundedAmount}` */
  key: string;
  category: CategoryId;
  averageAmount: number;
  averageDay: number;
  remark: string;
  confidence: number; // 0–1
  matchCount: number;
  /** The expense ids that formed this pattern */
  matchedExpenseIds: string[];
}

const AMOUNT_TOLERANCE = 0.05; // ±5%
const DAY_TOLERANCE = 5; // ±5 days

/**
 * Detect recurring patterns from a flat list of expenses.
 * Expects expenses spanning multiple months (ideally 3–12).
 *
 * Algorithm:
 * 1. Group by (category, amount ±5%)
 * 2. For each group, check temporal pattern: entries in consecutive months, ±5 day
 * 3. ≥2 consecutive monthly matches → candidate
 * 4. Filter out already-linked recurringId expenses
 * 5. Confidence = min(1, matchCount / 6)
 */
export function detectRecurringPatterns(
  expenses: Expense[],
  dismissedKeys: string[] = [],
  existingRecurringIds: Set<string> = new Set(),
): RecurringSuggestion[] {
  // Filter out soft-deleted and already-recurring expenses
  const eligible = expenses.filter(
    (e) => !e.deletedAt && !e.isRecurring && !e.recurringId && !existingRecurringIds.has(e.id),
  );

  if (eligible.length < 2) return [];

  const dismissedSet = new Set(dismissedKeys);

  // Group by category
  const byCategory = new Map<CategoryId, Expense[]>();
  for (const e of eligible) {
    const list = byCategory.get(e.category) || [];
    list.push(e);
    byCategory.set(e.category, list);
  }

  const suggestions: RecurringSuggestion[] = [];

  for (const [category, catExpenses] of byCategory) {
    // Sort by time
    const sorted = [...catExpenses].sort(
      (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month) || a.day - b.day,
    );

    // Group by similar amount using a simple greedy cluster
    const clusters = clusterByAmount(sorted);

    for (const cluster of clusters) {
      if (cluster.length < 2) continue;

      // Check for monthly pattern
      const consecutive = findConsecutiveMonthlyEntries(cluster);
      if (consecutive.length < 2) continue;

      const avgAmount = Math.round(consecutive.reduce((s, e) => s + e.amount, 0) / consecutive.length);
      const avgDay = Math.round(consecutive.reduce((s, e) => s + e.day, 0) / consecutive.length);
      const key = `${category}|${avgAmount}`;

      if (dismissedSet.has(key)) continue;

      // Pick the most common remark
      const remark = getMostCommonRemark(consecutive);
      const confidence = Math.min(1, consecutive.length / 6);

      suggestions.push({
        key,
        category,
        averageAmount: avgAmount,
        averageDay: avgDay,
        remark,
        confidence,
        matchCount: consecutive.length,
        matchedExpenseIds: consecutive.map((e) => e.id),
      });
    }
  }

  // Sort by confidence (highest first), then by amount (highest first)
  return suggestions.sort((a, b) => b.confidence - a.confidence || b.averageAmount - a.averageAmount);
}

/** Group expenses with similar amounts (±5%) using greedy clustering */
function clusterByAmount(sorted: Expense[]): Expense[][] {
  const used = new Set<number>();
  const clusters: Expense[][] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue;
    const anchor = sorted[i].amount;
    const cluster = [sorted[i]];
    used.add(i);

    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(j)) continue;
      if (Math.abs(sorted[j].amount - anchor) / anchor <= AMOUNT_TOLERANCE) {
        cluster.push(sorted[j]);
        used.add(j);
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}

/**
 * From a cluster of same-category same-amount expenses, find the longest
 * chain of entries occurring in consecutive months within ±DAY_TOLERANCE days.
 */
function findConsecutiveMonthlyEntries(cluster: Expense[]): Expense[] {
  // Sort by month-index
  const sorted = [...cluster].sort(
    (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month),
  );

  // Deduplicate: keep one entry per month (closest to the median day)
  const perMonth = new Map<number, Expense>();
  for (const e of sorted) {
    const mi = e.year * 12 + e.month;
    if (!perMonth.has(mi)) {
      perMonth.set(mi, e);
    }
    // If already has one, keep the one with a more consistent day
    // (just keep the first — it's good enough)
  }

  const monthly = [...perMonth.values()].sort(
    (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month),
  );

  if (monthly.length < 2) return monthly;

  // Find the longest consecutive chain with day tolerance
  let bestChain: Expense[] = [];
  let currentChain: Expense[] = [monthly[0]];

  for (let i = 1; i < monthly.length; i++) {
    const prev = monthly[i - 1];
    const curr = monthly[i];
    const prevMi = prev.year * 12 + prev.month;
    const currMi = curr.year * 12 + curr.month;

    if (currMi - prevMi === 1 && Math.abs(curr.day - prev.day) <= DAY_TOLERANCE) {
      currentChain.push(curr);
    } else {
      if (currentChain.length > bestChain.length) bestChain = currentChain;
      currentChain = [curr];
    }
  }
  if (currentChain.length > bestChain.length) bestChain = currentChain;

  return bestChain;
}

function getMostCommonRemark(expenses: Expense[]): string {
  const counts = new Map<string, number>();
  for (const e of expenses) {
    const r = e.remark?.trim() || "";
    if (r) counts.set(r, (counts.get(r) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [r, c] of counts) {
    if (c > bestCount) { best = r; bestCount = c; }
  }
  return best;
}
