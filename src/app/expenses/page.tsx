"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { CategoryChips } from "@/components/expenses/CategoryChips";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useCalculations } from "@/hooks/useCalculations";
import { useUIStore } from "@/stores/uiStore";
import { Search, PlusCircle, ArrowUpDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SortOption = "day-desc" | "day-asc" | "amount-desc" | "amount-asc";

export default function ExpensesPage() {
  const {
    currentMonth,
    currentYear,
    activeCategories,
    searchQuery,
    setSearchQuery,
    setActiveCategories,
    openAddForm,
  } = useUIStore();
  const { expenses, syncStatus, deleteExpense } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();
  const { monthlyTotal } = useCalculations(
    expenses,
    settings.categories,
    settings.salary,
    currentMonth,
    currentYear
  );

  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("day-desc");

  const handleClearFilters = () => {
    setActiveCategories([]);
    setSearchQuery("");
    setAmountMin("");
    setAmountMax("");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <MonthSwitcher />
          <div className="flex items-center gap-3">
            <SyncIndicator syncStatus={syncStatus} />
            <button
              onClick={openAddForm}
              className="hidden items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 lg:flex"
            >
              <PlusCircle size={16} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Total summary */}
        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Monthly Total
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(monthlyTotal)}
          </span>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="day-desc">Newest first</option>
            <option value="day-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </div>

        {/* Filter panel */}
        <FilterPanel
          amountMin={amountMin}
          amountMax={amountMax}
          onAmountMinChange={setAmountMin}
          onAmountMaxChange={setAmountMax}
          onClear={handleClearFilters}
        />

        {/* Category Chips */}
        <CategoryChips />

        {/* Expense List */}
        <ExpenseList
          expenses={expenses}
          onDelete={deleteExpense}
          activeCategories={activeCategories}
          searchQuery={searchQuery}
          amountMin={amountMin ? parseFloat(amountMin) : undefined}
          amountMax={amountMax ? parseFloat(amountMax) : undefined}
          sortBy={sortBy}
        />
      </div>
    </AppShell>
  );
}
