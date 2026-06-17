"use client";

import { useState, useCallback, Suspense, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SkeletonExpenseList } from "@/components/ui/Skeleton";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { CategoryChips } from "@/components/expenses/CategoryChips";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { useExpenses } from "@/hooks/useExpenses";
import { useUIStore } from "@/stores/uiStore";
import { Search, PlusCircle, Globe, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from "lucide-react";
import { QuickTemplates } from "@/components/expenses/QuickTemplates";
import { useCurrency } from "@/hooks/useCurrency";
import { debounce } from "@/lib/debounce";
import { useMonthUrlSync } from "@/hooks/useMonthUrlSync";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { ExpenseExport } from "@/components/expenses/ExpenseExport";
import { CSVImportWizard } from "@/components/expenses/CSVImportWizard";
import { useToast } from "@/components/ui/Toast";
import { useCrossMonthSearch } from "@/hooks/useCrossMonthSearch";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { QuickHelpButton } from "@/components/ui/QuickHelpButton";

type SortOption = "day-desc" | "day-asc" | "amount-desc" | "amount-asc";
type ViewMode = "day" | "category";

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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "day";
    return (localStorage.getItem("expenstream-expenses-view") as ViewMode) || "day";
  });
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [crossMonthEnabled, setCrossMonthEnabled] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  // Tracks whether the mount-time URL-read effect has run.
  // The write-back effect only fires after this is set to true so it doesn't
  // clobber URL params with empty initial state before they've been read.
  const filterInitialized = useRef(false);

  const { results: crossMonthResults, loading: crossMonthLoading } = useCrossMonthSearch(
    {
      searchQuery,
      activeCategories,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
    },
    crossMonthEnabled,
  );

  // Pre-fill filters from URL params (e.g. from analytics drill-down or shared links)
  useEffect(() => {
    const dayParam = searchParams.get("day");
    if (dayParam) {
      const d = parseInt(dayParam, 10);
      if (d >= 1 && d <= 31) {
        setDayMin(String(d));
        setDayMax(String(d));
      }
    }
    const dminParam = searchParams.get("dmin");
    const dmaxParam = searchParams.get("dmax");
    if (dminParam) setDayMin(dminParam);
    if (dmaxParam) setDayMax(dmaxParam);
    const aminParam = searchParams.get("amin");
    const amaxParam = searchParams.get("amax");
    if (aminParam) setAmountMin(aminParam);
    if (amaxParam) setAmountMax(amaxParam);
    const sortParam = searchParams.get("sort") as SortOption | null;
    const validSorts: SortOption[] = ["day-desc", "day-asc", "amount-desc", "amount-asc"];
    if (sortParam && validSorts.includes(sortParam)) setSortBy(sortParam);
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setActiveCategories([categoryParam]);
    }
    const recurringParam = searchParams.get("recurring");
    if (recurringParam === "true") {
      setSearchQuery("recurring");
      setLocalSearch("recurring");
    }
    filterInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write filter state back to URL so filters survive page refresh and are shareable
  useEffect(() => {
    if (!filterInitialized.current) return;
    const params = new URLSearchParams(searchParams.toString());
    if (amountMin) params.set("amin", amountMin); else params.delete("amin");
    if (amountMax) params.set("amax", amountMax); else params.delete("amax");
    if (dayMin) params.set("dmin", dayMin); else params.delete("dmin");
    if (dayMax) params.set("dmax", dayMax); else params.delete("dmax");
    if (sortBy !== "day-desc") params.set("sort", sortBy); else params.delete("sort");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountMin, amountMax, dayMin, dayMax, sortBy]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((val: string) => setSearchQuery(val), 150),
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

  // Smart preset filter helpers
  const todayDay = new Date().getDate();
  const weekStart = Math.max(1, todayDay - new Date().getDay()); // Sunday-anchored

  const SMART_PRESETS = [
    {
      label: "Today",
      isActive: dayMin === String(todayDay) && dayMax === String(todayDay),
      apply: () => { setDayMin(String(todayDay)); setDayMax(String(todayDay)); setAmountMin(""); setAmountMax(""); },
    },
    {
      label: "This Week",
      isActive: dayMin === String(weekStart) && dayMax === String(todayDay),
      apply: () => { setDayMin(String(weekStart)); setDayMax(String(todayDay)); setAmountMin(""); setAmountMax(""); },
    },
    {
      label: "Big Spends",
      isActive: sortBy === "amount-desc" && amountMin !== "",
      apply: () => {
        preBigSpendSort.current = sortBy;
        setSortBy("amount-desc");
        setAmountMin("1000");
        setDayMin("");
        setDayMax("");
      },
      deactivate: () => {
        setAmountMin("");
        setSortBy(preBigSpendSort.current);
      },
    },
    {
      label: "Early Month",
      isActive: dayMax === "10" && dayMin === "",
      apply: () => { setDayMin(""); setDayMax("10"); setAmountMin(""); setAmountMax(""); },
    },
    {
      label: "Month End",
      isActive: dayMin === "20" && dayMax === "",
      apply: () => { setDayMin("20"); setDayMax(""); setAmountMin(""); setAmountMax(""); },
    },
  ];

  // Stop AppShell month-swipe from firing when user scrolls the preset chips row
  const presetSwipeX = useRef<number | null>(null);
  // Remember sort order before "Big Spends" overrides it so we can restore on deactivate
  const preBigSpendSort = useRef<SortOption>(sortBy);
  const onPresetTouchStart = useCallback((e: React.TouchEvent) => {
    presetSwipeX.current = e.touches[0].clientX;
  }, []);
  const onPresetTouchEnd = useCallback((e: React.TouchEvent) => {
    if (presetSwipeX.current === null) return;
    const dx = Math.abs(e.changedTouches[0].clientX - presetSwipeX.current);
    presetSwipeX.current = null;
    if (dx > 10) e.stopPropagation();
  }, []);

  return (
    <>
      <div className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-4 sm:space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Stream Bed Header */}
        <div className="card-terrain p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex flex-col gap-0.5">
              <MonthSwitcher />
              <div className="flex items-baseline gap-1.5 pl-0.5">
                <AnimatedNumber
                  value={monthlyTotal}
                  format={formatCurrency}
                  duration={450}
                  className="font-numeric text-2xl sm:text-3xl font-bold tabular-nums"
                  style={{ color: "var(--accent)", letterSpacing: "-0.03em" }}
                />
                <span className="font-display italic text-xs" style={{ color: "var(--text-muted)" }}>
                  this month
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <ExpenseExport expenses={expenses} month={currentMonth} year={currentYear} onImport={() => setShowImport(true)} />
              <QuickHelpButton
                pageTips={[
                  "Swipe an expense left to delete it, or tap to edit",
                  "Enable cross-month search (globe icon) to find any past expense",
                  "Sort by amount using the sort icon to spot your biggest expenses",
                  "Quick Templates (⚡) let you re-add common expenses in one tap",
                  "Filter by category using the chips below the search bar",
                  "Export or import data using the download icon on the right",
                ]}
                pageLabel="Expenses"
              />
              <SyncIndicator />
              <button
                onClick={() => openAddForm()}
                className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.97] lg:flex"
                style={{ background: "var(--accent)" }}
              >
                <PlusCircle size={15} />
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Controls cluster — tighter internal rhythm than the outer space-y-4 */}
        <div className="space-y-2">
          {/* Search + all-months globe */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search expenses…"
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
            <button
              onClick={() => setCrossMonthEnabled((v) => !v)}
              title={crossMonthEnabled ? "Showing all months" : "Search all months"}
              aria-pressed={crossMonthEnabled}
              className="flex shrink-0 items-center justify-center rounded-2xl p-2.5 transition-colors"
              style={{
                border: "1px solid var(--border)",
                background: crossMonthEnabled ? "var(--accent-soft)" : "var(--surface)",
                color: crossMonthEnabled ? "var(--accent)" : "var(--text-muted)",
                width: "42px",
                height: "42px",
              }}
            >
              <Globe size={16} />
            </button>
          </div>

          {/* Filters (left) + Sort (right) */}
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
            rightSlot={
              <div className="relative flex items-center">
                {(() => {
                  const SortIcon = sortBy.endsWith("-asc") ? ArrowUp : sortBy.endsWith("-desc") && sortBy !== "day-desc" ? ArrowDown : ArrowUpDown;
                  return <SortIcon size={13} className="pointer-events-none absolute left-2.5" style={{ color: sortBy !== "day-desc" ? "var(--accent)" : "var(--text-secondary)" }} />;
                })()}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const v = e.target.value as SortOption;
                    setSortBy(v);
                    localStorage.setItem("expenstream-expenses-sort", v);
                  }}
                  aria-label="Sort order"
                  className={`appearance-none cursor-pointer rounded-ui-md py-1.5 pl-7 pr-6 text-xs font-medium font-[inherit] focus:outline-none transition-colors ${
                    sortBy !== "day-desc" ? "bg-brand-soft text-brand" : "text-[var(--text-secondary)]"
                  }`}
                >
                  <option value="day-desc">Newest</option>
                  <option value="day-asc">Oldest</option>
                  <option value="amount-desc">Highest</option>
                  <option value="amount-asc">Lowest</option>
                </select>
                <ChevronDown
                  size={11}
                  className="pointer-events-none absolute right-1.5"
                  style={{ color: sortBy !== "day-desc" ? "var(--accent)" : "var(--text-secondary)" }}
                />
              </div>
            }
          />

        </div>

        {/* Smart preset filter chips — touch handlers stop AppShell month-swipe */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none" }}
          onTouchStart={onPresetTouchStart}
          onTouchEnd={onPresetTouchEnd}
        >
          {SMART_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => preset.isActive ? (preset.deactivate ? preset.deactivate() : handleClearFilters()) : preset.apply()}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: preset.isActive ? "var(--accent)" : "var(--surface-secondary)",
                color: preset.isActive ? "#fff" : "var(--text-secondary)",
                border: preset.isActive ? "none" : "1px solid var(--border)",
              }}
              aria-pressed={preset.isActive}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Quick expense templates + view-mode toggle (unified row) */}
        <QuickTemplates
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            localStorage.setItem("expenstream-expenses-view", mode);
          }}
        />

        <CategoryChips />

        {/* Filtered count indicator */}
        {(searchQuery || activeCategories.length > 0 || amountMin || amountMax || dayMin || dayMax) && (
          <p className="px-1 text-xs" style={{ color: "var(--text-muted)" }} aria-live="polite">
            Filtered results · some expenses may be hidden
          </p>
        )}

        {crossMonthEnabled && (
          <p className="px-1 text-xs font-medium" style={{ color: "var(--accent)" }} aria-live="polite">
            <Globe size={11} className="inline mr-1 -mt-0.5" />
            Searching all months
          </p>
        )}

        {/* Expense List */}
        {loading || crossMonthLoading ? (
          <SkeletonExpenseList />
        ) : (
          <ExpenseList
            expenses={crossMonthEnabled ? crossMonthResults : expenses}
            onDelete={deleteExpense}
            onDeleteMany={deleteExpenses}
            activeCategories={crossMonthEnabled ? [] : activeCategories}
            searchQuery={crossMonthEnabled ? "" : searchQuery}
            amountMin={amountMin ? parseFloat(amountMin) : undefined}
            amountMax={amountMax ? parseFloat(amountMax) : undefined}
            dayMin={crossMonthEnabled ? undefined : (dayMin ? parseInt(dayMin, 10) : undefined)}
            dayMax={crossMonthEnabled ? undefined : (dayMax ? parseInt(dayMax, 10) : undefined)}
            sortBy={sortBy}
            crossMonth={crossMonthEnabled}
            viewMode={viewMode}
          />
        )}
      </div>
      {showImport && (
        <CSVImportWizard
          month={currentMonth}
          year={currentYear}
          onClose={() => setShowImport(false)}
        />
      )}
    </>
  );
}
