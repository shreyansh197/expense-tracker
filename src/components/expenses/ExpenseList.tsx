"use client";

import { useMemo, useState, useCallback } from "react";
import { Trash2, Edit3, Repeat, Receipt, PlusCircle, CheckSquare, Square, X } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { CategoryBadge } from "./CategoryChips";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { filterExpenses, groupByDay } from "@/lib/filters";
import type { Expense, CategoryId } from "@/types";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onDeleteMany?: (ids: string[]) => void;
  activeCategories: CategoryId[];
  searchQuery: string;
  amountMin?: number;
  amountMax?: number;
  dayMin?: number;
  dayMax?: number;
  sortBy?: string;
}

interface DayGroup {
  day: number;
  total: number;
  expenses: Expense[];
}

const PAGE_SIZE = 20;

export function ExpenseList({
  expenses,
  onDelete,
  onDeleteMany,
  activeCategories,
  searchQuery,
  amountMin,
  amountMax,
  dayMin,
  dayMax,
  sortBy = "day-desc",
}: ExpenseListProps) {
  const openEditForm = useUIStore((s) => s.openEditForm);
  const openAddForm = useUIStore((s) => s.openAddForm);
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete expense",
      message: "Are you sure you want to delete this expense?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      onDelete(id);
      toast("Expense deleted", "error");
    }
  };

  const filtered = useMemo(
    () => filterExpenses(expenses, { activeCategories, searchQuery, amountMin, amountMax, dayMin, dayMax }),
    [expenses, activeCategories, searchQuery, amountMin, amountMax, dayMin, dayMax]
  );

  const grouped = useMemo(() => groupByDay(filtered, sortBy), [filtered, sortBy]);

  // Flatten for pagination count
  const totalCount = useMemo(() => {
    let c = 0;
    for (const g of grouped) c += g.expenses.length;
    return c;
  }, [grouped]);

  const hasMore = visibleCount < totalCount;

  // Paginated groups
  const paginatedGroups = useMemo(() => {
    let count = 0;
    const result: DayGroup[] = [];
    for (const g of grouped) {
      if (count >= visibleCount) break;
      const remaining = visibleCount - count;
      if (g.expenses.length <= remaining) {
        result.push(g);
        count += g.expenses.length;
      } else {
        result.push({
          day: g.day,
          expenses: g.expenses.slice(0, remaining),
          total: g.expenses.slice(0, remaining).reduce((s, e) => s + e.amount, 0),
        });
        count += remaining;
      }
    }
    return result;
  }, [grouped, visibleCount]);

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectDay = useCallback(
    (dayExpenses: Expense[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const allSelected = dayExpenses.every((e) => next.has(e.id));
        if (allSelected) {
          dayExpenses.forEach((e) => next.delete(e.id));
        } else {
          dayExpenses.forEach((e) => next.add(e.id));
        }
        return next;
      });
    },
    []
  );

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    const ok = await confirm({
      title: `Delete ${count} expense${count !== 1 ? "s" : ""}`,
      message: `Are you sure you want to delete ${count} selected expense${count !== 1 ? "s" : ""}? This cannot be undone.`,
      confirmLabel: "Delete All",
      variant: "danger",
    });
    if (ok) {
      if (onDeleteMany) {
        await onDeleteMany([...selectedIds]);
      } else {
        for (const id of selectedIds) {
          onDelete(id);
        }
      }
      setSelectedIds(new Set());
      toast(`${count} expense${count !== 1 ? "s" : ""} deleted`, "error");
    }
  };

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Receipt size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No expenses found</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {searchQuery || activeCategories.length > 0
              ? "Try adjusting your filters"
              : "Add your first expense to get started"}
          </p>
        </div>
        {!searchQuery && activeCategories.length === 0 && (
          <button
            onClick={openAddForm}
            className="mt-1 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <PlusCircle size={14} />
            Add Expense
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 dark:border-indigo-800 dark:bg-indigo-950/50">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
            >
              <Trash2 size={12} />
              Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {paginatedGroups.map((group) => (
        <div key={group.day}>
          {/* Day header */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSelectDay(group.expenses)}
                className="rounded p-0.5 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                aria-label={`Select all day ${group.day}`}
              >
                {group.expenses.every((e) => selectedIds.has(e.id)) ? (
                  <CheckSquare size={14} className="text-indigo-500" />
                ) : (
                  <Square size={14} />
                )}
              </button>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Day {group.day}
              </span>
            </div>
            <span className="tabular-nums text-xs font-medium text-slate-500 dark:text-slate-400">
              {formatCurrency(group.total)}
            </span>
          </div>

          {/* Expense items */}
          <div className="space-y-1.5">
            {group.expenses.map((expense) => (
              <div
                key={expense.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openEditForm(expense.id);
                  if (e.key === "Delete" || e.key === "Backspace") handleDelete(expense.id);
                  if (e.key === " ") { e.preventDefault(); toggleSelect(expense.id); }
                }}
                className={`group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                  selectedIds.has(expense.id)
                    ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30"
                    : "border-slate-100 bg-white hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                }`}
              >
                <button
                  onClick={() => toggleSelect(expense.id)}
                  className="shrink-0 rounded p-0.5 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                  aria-label="Select expense"
                >
                  {selectedIds.has(expense.id) ? (
                    <CheckSquare size={14} className="text-indigo-500" />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={expense.category} />
                    {expense.isRecurring && (
                      <span className="text-indigo-400" aria-label="Recurring">
                        <Repeat size={10} />
                      </span>
                    )}
                    {expense.remark && (
                      <span className="truncate text-xs text-slate-400">
                        {expense.remark}
                      </span>
                    )}
                  </div>
                </div>
                  <span className="tabular-nums text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(expense.amount)}
                </span>
                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                  <button
                    onClick={() => openEditForm(expense.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    aria-label="Edit expense"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
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

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Show more ({totalCount - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
