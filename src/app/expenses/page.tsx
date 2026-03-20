"use client";

export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { CategoryChips } from "@/components/expenses/CategoryChips";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useCalculations } from "@/hooks/useCalculations";
import { useUIStore } from "@/stores/uiStore";
import { Search, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ExpensesPage() {
  const {
    currentMonth,
    currentYear,
    activeCategories,
    searchQuery,
    setSearchQuery,
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

        {/* Search */}
        <div className="relative">
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

        {/* Category Chips */}
        <CategoryChips />

        {/* Expense List */}
        <ExpenseList
          expenses={expenses}
          onDelete={deleteExpense}
          activeCategories={activeCategories}
          searchQuery={searchQuery}
        />
      </div>
    </AppShell>
  );
}
