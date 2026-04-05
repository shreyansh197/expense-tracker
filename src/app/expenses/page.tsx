"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageTransition } from "@/components/ui/PageTransition";
import { SkeletonExpenseList } from "@/components/ui/Skeleton";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { CategoryChips } from "@/components/expenses/CategoryChips";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { useExpenses } from "@/hooks/useExpenses";
import { useUIStore } from "@/stores/uiStore";
import { Search, PlusCircle } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { debounce } from "@/lib/debounce";
import { useMonthUrlSync } from "@/hooks/useMonthUrlSync";
import { useSearchParams } from "next/navigation";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { ExpensesGraphic } from "@/components/ui/illustrations";

type SortOption = "day-desc" | "day-asc" | "amount-desc" | "amount-asc";

export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesShell />
    </Suspense>
  );
}

/** Thin wrapper so ExpensesContent renders INSIDE AppShell / CalculationsProvider */
function ExpensesShell() {
  return (
    <AppShell>
      <ExpensesContent />
    </AppShell>
  );
}

function ExpensesContent() {
  usePageTitle("Expenses");
  const { formatCurrency } = useCurrency();
  useMonthUrlSync();
  const searchParams = useSearchParams();
  const {
    currentMonth,
    currentYear,
    activeCategories,
    searchQuery,
    setSearchQuery,
    setActiveCategories,
    openAddForm,
  } = useUIStore();
  const { expenses, loading, deleteExpense, deleteExpenses } = useExpenses(currentMonth, currentYear);
  const { monthlyTotal } = useCalculationsContext();

  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [dayMin, setDayMin] = useState("");
  const [dayMax, setDayMax] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window === "undefined") return "day-desc";
    return (localStorage.getItem("expenstream-expenses-sort") as SortOption) || "day-desc";
  });
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Pre-fill day filter from URL ?day=N (e.g. from clicking a daily bar chart)
  useEffect(() => {
    const dayParam = searchParams.get("day");
    if (dayParam) {
      const d = parseInt(dayParam, 10);
      if (d >= 1 && d <= 31) {
        setDayMin(String(d));
        setDayMax(String(d));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <PageTransition className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-4 p-4 lg:p-6">
        {/* Header — hero zone */}
        <div className="zone-header relative overflow-hidden">
          {/* Abstract decorative graphic */}
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 sm:right-4">
            <ExpensesGraphic />
          </div>
          <div className="flex items-center justify-between">
            <MonthSwitcher />
            <div className="flex items-center gap-3">
              <SyncIndicator />
              <button
                onClick={openAddForm}
                className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.97] lg:flex"
                style={{ background: 'var(--accent-gradient)', boxShadow: '0 2px 8px rgba(255,138,101,0.2)' }}
              >
                <PlusCircle size={16} />
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Total summary — teal accent card */}
        <div className="card-accent-teal flex items-center justify-between px-5 py-3.5">
          <span className="text-section-title">
            Monthly Total
          </span>
          <span className="text-amount text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(monthlyTotal)}
          </span>
        </div>

        {/* Search + Sort + Filters — indigo zone */}
        <div className="section-zone section-indigo space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: 'none' }}
              aria-label="Search expenses"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => { const v = e.target.value as SortOption; setSortBy(v); localStorage.setItem("expenstream-expenses-sort", v); }}
            aria-label="Sort order"
            className="rounded-xl px-3 py-3 text-xs font-medium focus:outline-none focus:ring-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <option value="day-desc">Newest first</option>
            <option value="day-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </div>

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

        <CategoryChips />
        </div>

        {/* Filtered count indicator */}
        {(searchQuery || activeCategories.length > 0 || amountMin || amountMax || dayMin || dayMax) && (
          <p className="px-1 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Filtered results &middot; some expenses may be hidden
          </p>
        )}

        {/* Expense List */}
        {loading ? (
          <SkeletonExpenseList />
        ) : (
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
        )}
      </PageTransition>
  );
}
