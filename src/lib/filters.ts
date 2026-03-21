import type { Expense, CategoryId } from "@/types";

interface FilterOptions {
  activeCategories: CategoryId[];
  searchQuery: string;
  amountMin?: number;
  amountMax?: number;
  dayMin?: number;
  dayMax?: number;
}

export interface DayGroup {
  day: number;
  total: number;
  expenses: Expense[];
}

export function filterExpenses(expenses: Expense[], opts: FilterOptions): Expense[] {
  let result = expenses;

  if (opts.activeCategories.length > 0) {
    result = result.filter((e) => opts.activeCategories.includes(e.category));
  }

  if (opts.searchQuery.trim()) {
    const q = opts.searchQuery.trim().toLowerCase();
    const dayMatch = q.match(/^day:(\d+)$/);
    if (dayMatch) {
      const targetDay = parseInt(dayMatch[1], 10);
      result = result.filter((e) => e.day === targetDay);
    } else {
      result = result.filter(
        (e) =>
          e.category.toLowerCase().includes(q) ||
          (e.remark && e.remark.toLowerCase().includes(q))
      );
    }
  }

  if (opts.amountMin !== undefined && !isNaN(opts.amountMin)) {
    result = result.filter((e) => e.amount >= opts.amountMin!);
  }
  if (opts.amountMax !== undefined && !isNaN(opts.amountMax)) {
    result = result.filter((e) => e.amount <= opts.amountMax!);
  }
  if (opts.dayMin !== undefined && !isNaN(opts.dayMin)) {
    result = result.filter((e) => e.day >= opts.dayMin!);
  }
  if (opts.dayMax !== undefined && !isNaN(opts.dayMax)) {
    result = result.filter((e) => e.day <= opts.dayMax!);
  }

  return result;
}

export function groupByDay(
  filtered: Expense[],
  sortBy: string = "day-desc"
): DayGroup[] {
  if (sortBy === "amount-desc" || sortBy === "amount-asc") {
    const sorted = [...filtered].sort((a, b) =>
      sortBy === "amount-desc" ? b.amount - a.amount : a.amount - b.amount
    );
    const map = new Map<number, Expense[]>();
    for (const e of sorted) {
      const arr = map.get(e.day) || [];
      arr.push(e);
      map.set(e.day, arr);
    }
    const groups: DayGroup[] = [];
    for (const [day, exps] of map) {
      groups.push({
        day,
        total: exps.reduce((s, e) => s + e.amount, 0),
        expenses: exps,
      });
    }
    return sortBy === "amount-desc"
      ? groups.sort((a, b) => b.total - a.total)
      : groups.sort((a, b) => a.total - b.total);
  }

  const map = new Map<number, Expense[]>();
  for (const e of filtered) {
    const arr = map.get(e.day) || [];
    arr.push(e);
    map.set(e.day, arr);
  }

  const groups: DayGroup[] = [];
  for (const [day, exps] of map) {
    groups.push({
      day,
      total: exps.reduce((s, e) => s + e.amount, 0),
      expenses: exps.sort((a, b) => b.amount - a.amount),
    });
  }

  return sortBy === "day-asc"
    ? groups.sort((a, b) => a.day - b.day)
    : groups.sort((a, b) => b.day - a.day);
}
