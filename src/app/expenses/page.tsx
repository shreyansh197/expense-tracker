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
import { ExpenseExport } from "@/components/expenses/ExpenseExport";
import { useToast } from "@/components/ui/Toast";

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
  const { toast } = useToast();
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
    const prev = {
      categories: [...activeCategories],
      search: searchQuery,
      localSearch,
      amountMin,
      amountMax,
      dayMin,
      dayMax,
    };
    setActiveCategories([]);
    setSearchQuery("");
    setLocalSearch("");
    setAmountMin("");
    setAmountMax("");
    setDayMin("");
    setDayMax("");
    toast("Filters cleared", "info", {
      label: "Undo",
      onClick: () => {
        setActiveCategories(prev.categories);
        setSearchQuery(prev.search);
        setLocalSearch(prev.localSearch);
        setAmountMin(prev.amountMin);
        setAmountMax(prev.amountMax);
        setDayMin(prev.dayMin);
        setDayMax(prev.dayMax);
      },
    });
  };

  return (
      <PageTransition className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-4 sm:space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Stream Bed Header */}
        <div className="card-terrain p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <MonthSwitcher />
            <div className="flex items-center gap-3">
              <ExpenseExport expenses={expenses} month={currentMonth} year={currentYear} />
              <SyncIndicator />
              <button
                onClick={() => openAddForm()}
                className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.97] lg:flex"
                style={{ background: "var(--es-moss, #3D5A3E)" }}
              >
                <PlusCircle size={15} />
                Drop a Stone
              </button>
            </div>
          </div>
          {/* Hero total */}
          <div className="flex items-baseline gap-2">
            <span
              className="font-numeric text-3xl sm:text-4xl font-bold tabular-nums"
              style={{ color: "var(--es-moss, #3D5A3E)", letterSpacing: "-0.03em" }}
            >
              {formatCurrency(monthlyTotal)}
            </span>
            <span className="font-display italic text-sm" style={{ color: "var(--text-muted)" }}>
              this month
            </span>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search the stream bed…"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-2xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              aria-label="Search expenses"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => {
              const v = e.target.value as SortOption;
              setSortBy(v);
              localStorage.setItem("expenstream-expenses-sort", v);
            }}
            aria-label="Sort order"
            className="rounded-2xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2"
            style={{
              background: sortBy !== "day-desc" ? "var(--surface-secondary)" : "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
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

        {/* Filtered count indicator */}
        {(searchQuery || activeCategories.length > 0 || amountMin || amountMax || dayMin || dayMax) && (
          <p className="px-1 text-xs" style={{ color: "var(--text-muted)" }} aria-live="polite">
            Filtered results · some expenses may be hidden
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
