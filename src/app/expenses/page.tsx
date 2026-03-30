"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
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
import { Search, PlusCircle } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import debounce from "lodash/debounce";

type SortOption = "day-desc" | "day-asc" | "amount-desc" | "amount-asc";

export default function ExpensesPage() {
  const { formatCurrency } = useCurrency();
  const {
    currentMonth,
    currentYear,
    activeCategories,
    searchQuery,
    setSearchQuery,
    setActiveCategories,
    openAddForm,
  } = useUIStore();
  const { expenses, syncStatus, deleteExpense, deleteExpenses } = useExpenses(currentMonth, currentYear);
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
  const [dayMin, setDayMin] = useState("");
  const [dayMax, setDayMax] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window === "undefined") return "day-desc";
    return (localStorage.getItem("expenstream-expenses-sort") as SortOption) || "day-desc";
  });
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((val: string) => setSearchQuery(val), 300),
    []
  );

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    debouncedSetSearch(val);
  };

  const handleClearFilters = () => {
    setActiveCategories([]);
    setSearchQuery("");
    setLocalSearch("");
    setAmountMin("");
    setAmountMax("");
    setDayMin("");
    setDayMax("");
  };

  return (
    <AppShell>
      <div className="fade-in mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-4 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <MonthSwitcher />
          <div className="flex items-center gap-3">
            <SyncIndicator syncStatus={syncStatus} />
            <button
              onClick={openAddForm}
              className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.97] lg:flex"
            >
              <PlusCircle size={16} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Total summary */}
        <div className="card flex items-center justify-between px-5 py-3.5">
          <span className="text-section-title">
            Monthly Total
          </span>
          <span className="tabular-nums text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(monthlyTotal)}
          </span>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="Search expenses... (try day:15)"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              aria-label="Search expenses"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => { const v = e.target.value as SortOption; setSortBy(v); localStorage.setItem("expenstream-expenses-sort", v); }}
            aria-label="Sort order"
            className="rounded-xl px-3 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
          dayMin={dayMin}
          dayMax={dayMax}
          onDayMinChange={setDayMin}
          onDayMaxChange={setDayMax}
          onClear={handleClearFilters}
        />

        {/* Category Chips */}
        <CategoryChips />

        {/* Expense List */}
        <ExpenseList
          expenses={expenses}
          onDelete={deleteExpense}
          onDeleteMany={deleteExpenses}
          activeCategories={activeCategories}
          searchQuery={searchQuery}
          amountMin={amountMin ? parseFloat(amountMin) : undefined}
          amountMax={amountMax ? parseFloat(amountMax) : undefined}
          dayMin={dayMin ? parseInt(dayMin, 10) : undefined}
          dayMax={dayMax ? parseInt(dayMax, 10) : undefined}
          sortBy={sortBy}
        />
      </div>
    </AppShell>
  );
}
