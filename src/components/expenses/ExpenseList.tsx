"use client";

import { useMemo } from "react";
import { Trash2, Edit3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CategoryBadge } from "./CategoryChips";
import { useUIStore } from "@/stores/uiStore";
import type { Expense, CategoryId } from "@/types";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  activeCategories: CategoryId[];
  searchQuery: string;
}

interface DayGroup {
  day: number;
  total: number;
  expenses: Expense[];
}

export function ExpenseList({
  expenses,
  onDelete,
  activeCategories,
  searchQuery,
}: ExpenseListProps) {
  const openEditForm = useUIStore((s) => s.openEditForm);

  const filtered = useMemo(() => {
    let result = expenses;

    if (activeCategories.length > 0) {
      result = result.filter((e) => activeCategories.includes(e.category));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.category.toLowerCase().includes(q) ||
          (e.remark && e.remark.toLowerCase().includes(q))
      );
    }

    return result;
  }, [expenses, activeCategories, searchQuery]);

  const grouped = useMemo(() => {
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

    return groups.sort((a, b) => b.day - a.day);
  }, [filtered]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-sm">No expenses found</p>
        <p className="mt-1 text-xs">Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.day}>
          {/* Day header */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              Day {group.day}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {formatCurrency(group.total)}
            </span>
          </div>

          {/* Expense items */}
          <div className="space-y-1.5">
            {group.expenses.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-colors hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={expense.category} />
                    {expense.remark && (
                      <span className="truncate text-xs text-gray-400">
                        {expense.remark}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(expense.amount)}
                </span>
                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                  <button
                    onClick={() => openEditForm(expense.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    aria-label="Edit expense"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
