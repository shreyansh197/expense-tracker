"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Trash2, Edit3, Repeat, Receipt, CheckSquare, Square, X, Wallet } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import { CategoryBadge } from "./CategoryChips";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { WalletIllustration } from "@/components/ui/illustrations";
import { ReceiptIllustration } from "@/components/ui/illustrations";
import { filterExpenses, groupByDay } from "@/lib/filters";
import { formatCurrency as fmtCurrency } from "@/lib/utils";
import { fetchRates, convert, getFallbackRates } from "@/lib/exchangeRates";
import type { Expense, CategoryId } from "@/types";

const SWIPE_THRESHOLD = 80;
const FULL_DELETE_THRESHOLD = 200;

function useSwipeToDelete(onDelete: () => void) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const lockedAxis = useRef<"x" | "y" | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (deleting) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    lockedAxis.current = null;
  }, [deleting]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (deleting) return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!lockedAxis.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        lockedAxis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      return;
    }

    if (lockedAxis.current === "y") return;

    // Stop propagation to prevent AppShell month-change swipe
    e.stopPropagation();

    // Only allow swipe left — add rubber-band resistance past threshold
    if (dx < 0) {
      const absDx = Math.abs(dx);
      if (absDx > FULL_DELETE_THRESHOLD) {
        // Rubber-band: diminishing returns past full threshold
        const over = absDx - FULL_DELETE_THRESHOLD;
        setOffsetX(-(FULL_DELETE_THRESHOLD + over * 0.3));
      } else {
        setOffsetX(dx);
      }
    }
  }, [deleting]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (deleting) return;
    if (lockedAxis.current === "x") {
      e.stopPropagation();
    }
    const absOffset = Math.abs(offsetX);

    if (absOffset >= FULL_DELETE_THRESHOLD) {
      // Full swipe — animate off-screen then delete
      setDeleting(true);
      setOffsetX(-9999);
      setTimeout(() => onDelete(), 300);
    } else if (absOffset >= SWIPE_THRESHOLD) {
      // Partial swipe — snap to reveal delete button
      setOffsetX(-SWIPE_THRESHOLD);
    } else {
      // Below threshold — snap back
      setOffsetX(0);
    }
    touchStartX.current = null;
    touchStartY.current = null;
    lockedAxis.current = null;
  }, [offsetX, onDelete, deleting]);

  const snapBack = useCallback(() => {
    setOffsetX(0);
  }, []);

  const confirmDelete = useCallback(() => {
    setDeleting(true);
    setOffsetX(-9999);
    setTimeout(() => onDelete(), 300);
  }, [onDelete]);

  return { offsetX, deleting, onTouchStart, onTouchMove, onTouchEnd, snapBack, confirmDelete };
}

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
  const { settings } = useSettings();
  const baseCurrency = settings.currency || "INR";
  const multiCurrency = settings.multiCurrencyEnabled ?? false;

  // Pre-fetch exchange rates when multi-currency is on
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!multiCurrency) return;
    let cancelled = false;
    fetchRates(baseCurrency).then((r) => {
      if (!cancelled) setRates(r);
    });
    return () => { cancelled = true; };
  }, [multiCurrency, baseCurrency]);
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // One-time swipe-to-delete hint on first expense
  const [swipeHintShown, setSwipeHintShown] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("expenstream-swipe-hint") === "1";
  });
  useEffect(() => {
    if (swipeHintShown) return;
    const timer = setTimeout(() => {
      localStorage.setItem("expenstream-swipe-hint", "1");
      setSwipeHintShown(true);
    }, 2500); // animation plays for ~1.5s, then mark as shown
    return () => clearTimeout(timer);
  }, [swipeHintShown]);

  const handleDelete = async (id: string) => {
    // Optimistically hide the expense and show undo toast
    setPendingDeletes((prev) => new Set(prev).add(id));
    const timer = setTimeout(() => {
      onDelete(id);
      setPendingDeletes((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      pendingTimers.current.delete(id);
    }, 5000);
    pendingTimers.current.set(id, timer);
    toast("Expense deleted", "error", {
      label: "Undo",
      onClick: () => {
        clearTimeout(pendingTimers.current.get(id));
        pendingTimers.current.delete(id);
        setPendingDeletes((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  const filtered = useMemo(
    () => filterExpenses(expenses, { activeCategories, searchQuery, amountMin, amountMax, dayMin, dayMax }).filter((e) => !pendingDeletes.has(e.id)),
    [expenses, activeCategories, searchQuery, amountMin, amountMax, dayMin, dayMax, pendingDeletes]
  );

  // Helper: convert an expense amount to base currency if needed
  const toBase = useCallback((e: Expense): number => {
    if (!multiCurrency || !baseCurrency || !e.currency || e.currency === baseCurrency) return e.amount;
    const effectiveRates = rates ?? getFallbackRates(baseCurrency);
    return convert(e.amount, e.currency, baseCurrency, effectiveRates);
  }, [multiCurrency, baseCurrency, rates]);

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
      const ids = [...selectedIds];
      if (onDeleteMany) {
        await onDeleteMany(ids);
      } else {
        for (const id of ids) {
          onDelete(id);
        }
      }
      setSelectedIds(new Set());
      toast(`${count} expense${count !== 1 ? "s" : ""} deleted`, "error");
    }
  };

  if (grouped.length === 0) {
    const hasFilters = !!(searchQuery || activeCategories.length > 0);
    return (
      <EmptyState
        icon={hasFilters ? Receipt : Wallet}
        illustration={hasFilters ? <ReceiptIllustration /> : <WalletIllustration />}
        title={hasFilters ? "No expenses found" : "No expenses yet"}
        description={
          hasFilters
            ? searchQuery
              ? `No results for "${searchQuery}". Try a different search term or adjust filters.`
              : "Try adjusting your filters or search terms."
            : "Track where your money goes \u2014 add your first expense to see insights here."
        }
        action={!hasFilters ? { label: "Add an Expense", onClick: openAddForm } : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-brand-border bg-brand-soft px-4 py-2.5">
          <span className="text-sm font-medium text-brand-text">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="btn-danger gap-1.5 rounded-lg px-3 py-1.5 text-xs"
            >
              <Trash2 size={12} />
              Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg p-1.5 text-brand hover:bg-brand-soft"
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {paginatedGroups.map((group, gIdx) => (
        <div key={group.day}>
          {/* Day header */}
          <div className="sticky top-0 z-[5] mb-2 flex items-center justify-between rounded-lg px-1 py-1.5 backdrop-blur-sm" style={{ background: 'color-mix(in srgb, var(--background) 90%, transparent)' }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSelectDay(group.expenses)}
                className="rounded p-0.5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                aria-label={`Select all day ${group.day}`}
              >
                {group.expenses.every((e) => selectedIds.has(e.id)) ? (
                  <CheckSquare size={14} className="text-data" />
                ) : (
                  <Square size={14} />
                )}
              </button>
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                Day {group.day}
              </span>
            </div>
            <span className="tabular-nums text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {formatCurrency(group.expenses.reduce((s, e) => s + toBase(e), 0))}
            </span>
          </div>

          {/* Expense items */}
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
            {group.expenses.map((expense, idx) => (
              <SwipeableExpenseItem
                key={expense.id}
                expense={expense}
                idx={idx}
                selectedIds={selectedIds}
                formatCurrency={formatCurrency}
                toggleSelect={toggleSelect}
                openEditForm={openEditForm}
                handleDelete={handleDelete}
                baseCurrency={baseCurrency}
                multiCurrency={multiCurrency}
                rates={rates}
                swipeHint={!swipeHintShown && gIdx === 0 && idx === 0}
              />
            ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="rounded-xl px-5 py-2.5 text-xs font-semibold transition-all"
            style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-secondary)'}
          >
            Show more ({totalCount - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

function SwipeableExpenseItem({
  expense,
  idx,
  selectedIds,
  formatCurrency,
  toggleSelect,
  openEditForm,
  handleDelete,
  baseCurrency,
  multiCurrency,
  rates,
  swipeHint = false,
}: {
  expense: Expense;
  idx: number;
  selectedIds: Set<string>;
  formatCurrency: (n: number) => string;
  toggleSelect: (id: string) => void;
  openEditForm: (id: string) => void;
  handleDelete: (id: string) => void;
  baseCurrency: string;
  multiCurrency: boolean;
  rates: Record<string, number> | null;
  swipeHint?: boolean;
}) {
  const deleteCallback = useCallback(() => handleDelete(expense.id), [handleDelete, expense.id]);
  const { offsetX, deleting, onTouchStart, onTouchMove, onTouchEnd, snapBack, confirmDelete } = useSwipeToDelete(deleteCallback);
  const isSelected = selectedIds.has(expense.id);
  const absOffset = Math.abs(offsetX);
  const isRevealing = absOffset > 10;
  const isFullSwipe = absOffset >= FULL_DELETE_THRESHOLD;
  const isDragging = absOffset > 0 && absOffset < 9000;

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={deleting ? { opacity: 0, height: 0, marginBottom: 0 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={deleting ? { duration: 0.3, ease: [0.22, 1, 0.36, 1] } : { delay: idx * 0.03, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Red delete action — full-width behind the row, revealed by card translate */}
      {(absOffset > 0 || swipeHint) && (
        <div
          className="absolute inset-0 flex items-center justify-end overflow-hidden rounded-2xl"
          style={{
            background: isFullSwipe
              ? '#EF4444'
              : 'linear-gradient(to left, #EF4444 0%, #F87171 40%, transparent 100%)',
            transition: isDragging ? 'none' : 'background 0.2s',
          }}
          aria-hidden
        >
          <button
            onClick={confirmDelete}
            className="flex h-full w-full items-center justify-end gap-1.5 pr-4 text-white"
            style={{ minWidth: '70px' }}
            tabIndex={-1}
          >
            <Trash2 size={15} strokeWidth={2.2} />
            <span className="text-xs font-bold tracking-wide">Delete</span>
          </button>
        </div>
      )}

      {/* Foreground expense card */}
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") openEditForm(expense.id);
          if (e.key === "Delete" || e.key === "Backspace") handleDelete(expense.id);
          if (e.key === " ") { e.preventDefault(); toggleSelect(expense.id); }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (absOffset === SWIPE_THRESHOLD) snapBack(); }}
        className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand/40 ${
          isSelected
            ? "border-brand-border"
            : ""
        }`}
        style={{
          background: isSelected
            ? 'color-mix(in srgb, var(--brand) 10%, var(--surface))'
            : 'var(--surface)',
          borderColor: isSelected ? undefined : 'var(--border)',
          transform: `translateX(${offsetX > -9000 ? offsetX : -window.innerWidth}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: isRevealing ? 'transform' : undefined,
          animation: swipeHint && absOffset === 0 ? 'swipe-hint 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.8s' : undefined,
        }}
      >
        <button
          onClick={() => toggleSelect(expense.id)}
          className="shrink-0 rounded p-0.5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          role="checkbox"
          aria-checked={isSelected}
          aria-label="Select expense"
        >
          {isSelected ? (
            <CheckSquare size={14} className="text-brand" />
          ) : (
            <Square size={14} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CategoryBadge category={expense.category} />
            {expense.isRecurring && (
              <span className="text-data-text" aria-label="Recurring">
                <Repeat size={10} />
              </span>
            )}
            {expense.remark && (
              <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                {expense.remark}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="tabular-nums text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {multiCurrency && expense.currency && expense.currency !== baseCurrency
              ? fmtCurrency(expense.amount, expense.currency)
              : formatCurrency(expense.amount)}
          </span>
          {multiCurrency && expense.currency && expense.currency !== baseCurrency && (
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              ≈ {fmtCurrency(convert(expense.amount, expense.currency, baseCurrency, rates ?? getFallbackRates(baseCurrency)), baseCurrency)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
          <button
            onClick={() => openEditForm(expense.id)}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
            aria-label="Edit expense"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => handleDelete(expense.id)}
            className="rounded-lg p-1.5 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Delete expense"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </m.div>
  );
}
