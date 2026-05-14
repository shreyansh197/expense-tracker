"use client";

import { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/components/ui/Toast";
import {
  SlidersHorizontal,
  X,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Calendar,
} from "lucide-react";
import type { SavedFilter } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Compact month-locked calendar used for date range filtering */
function CalendarPicker({
  label,
  value,
  onChange,
  month,
  year,
  otherValue,
  isStart,
  alignRight = false,
}: {
  label: string;
  value: number | null;
  onChange: (day: number | null) => void;
  month: number;
  year: number;
  otherValue: number | null;
  isStart: boolean;
  alignRight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [openUpward, setOpenUpward] = useState(false);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const today = new Date();
  const isCurrentViewMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setOpenUpward(rect.bottom + 280 > window.innerHeight && rect.top > 280);
    }
    setOpen((o) => !o);
  };

  const handleSelect = (day: number) => {
    onChange(day);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-label={label}
        className="flex w-full items-center gap-1.5 rounded-ui-md border py-2 px-2.5 text-xs transition-colors"
        style={{
          borderColor: open ? "var(--accent)" : "var(--border)",
          background: "var(--surface)",
          color: value !== null ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        <Calendar size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span className="flex-1 text-left">{value !== null ? `Day ${value}` : label}</span>
        {value !== null && (
          <span
            role="button"
            aria-label={`Clear ${label}`}
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-secondary)]"
          >
            <X size={10} />
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 w-64 rounded-xl border p-3 shadow-xl ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${alignRight ? "right-0" : "left-0"}`}
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Month header — fixed to current month, no nav needed */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-0.5"
              style={{ color: "var(--text-muted)" }}
              aria-label="Close calendar"
            >
              <X size={13} />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DOW.map((d) => (
              <span key={d} className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{d}</span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <span key={i} />;
              const isSelected = day === value;
              const isToday = isCurrentViewMonth && day === today.getDate();
              const inRange = otherValue !== null && (
                isStart ? (day >= (value ?? day) && day <= otherValue)
                         : (day >= otherValue && day <= (value ?? day))
              );
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  aria-label={`${MONTH_NAMES[month - 1]} ${day}`}
                  aria-pressed={isSelected}
                  className="h-7 w-7 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: isSelected
                      ? "var(--accent)"
                      : inRange
                      ? "var(--accent-soft)"
                      : undefined,
                    color: isSelected
                      ? "white"
                      : isToday
                      ? "var(--accent)"
                      : "var(--text-primary)",
                    fontWeight: isToday ? 700 : undefined,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterPanelProps {
  amountMin: string;
  amountMax: string;
  onAmountMinChange: (v: string) => void;
  onAmountMaxChange: (v: string) => void;
  dayMin: string;
  dayMax: string;
  onDayMinChange: (v: string) => void;
  onDayMaxChange: (v: string) => void;
  onClear: () => void;
  rightSlot?: React.ReactNode;
}

export function FilterPanel({
  amountMin,
  amountMax,
  onAmountMinChange,
  onAmountMaxChange,
  dayMin,
  dayMax,
  onDayMinChange,
  onDayMaxChange,
  onClear,
  rightSlot,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { symbol } = useCurrency();
  const { activeCategories, searchQuery, currentMonth, currentYear } = useUIStore();
  const { toast } = useToast();
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const savedFilters = settings.savedFilters || [];
  const activeFilterCount = [amountMin !== "", amountMax !== "", dayMin !== "", dayMax !== "", activeCategories.length > 0, searchQuery.trim() !== ""].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const handleSaveFilter = () => {
    const name = saveName.trim();
    if (!name) return;
    if (savedFilters.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      toast("A filter with that name already exists", "error");
      return;
    }
    const filter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name,
      categories: [...activeCategories],
      searchQuery,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
    };
    updateSettings({ savedFilters: [...savedFilters, filter] });
    setSaveName("");
    setShowSaveInput(false);
    toast("Filter saved");
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    const store = useUIStore.getState();
    store.setActiveCategories(filter.categories);
    store.setSearchQuery(filter.searchQuery);
    onAmountMinChange(filter.amountMin?.toString() || "");
    onAmountMaxChange(filter.amountMax?.toString() || "");
    toast(`Applied: ${filter.name}`);
  };

  const handleDeleteFilter = (id: string) => {
    updateSettings({
      savedFilters: savedFilters.filter((f) => f.id !== id),
    });
    toast("Filter deleted", "error");
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 rounded-ui-md px-3 py-2 text-xs font-medium transition-colors ${
            hasActiveFilters
              ? "bg-brand-soft text-brand"
              : "text-[var(--text-secondary)]"
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-caption font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-ui-md px-2 py-1.5 text-xs text-[var(--text-tertiary)] transition-colors"
          >
            <X size={12} />
            Clear all filters
          </button>
        )}
        {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      </div>

      {open && (
        <div className="card mt-2 p-4">
          {/* Amount range */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium uppercase text-[var(--text-secondary)]">
              Amount Range
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">{symbol}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={amountMin}
                  onChange={(e) => onAmountMinChange(e.target.value)}
                  className="w-full rounded-ui-md border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-7 pr-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">to</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">{symbol}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={amountMax}
                  onChange={(e) => onAmountMaxChange(e.target.value)}
                  className="w-full rounded-ui-md border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-7 pr-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
          </div>

          {/* Date range */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium uppercase text-[var(--text-secondary)]">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <CalendarPicker
                label="From"
                value={dayMin ? parseInt(dayMin, 10) : null}
                onChange={(d) => onDayMinChange(d !== null ? String(d) : "")}
                month={currentMonth}
                year={currentYear}
                otherValue={dayMax ? parseInt(dayMax, 10) : null}
                isStart={true}
              />
              <span className="shrink-0 text-xs" style={{ color: "var(--text-tertiary)" }}>to</span>
              <CalendarPicker
                label="To"
                value={dayMax ? parseInt(dayMax, 10) : null}
                onChange={(d) => onDayMaxChange(d !== null ? String(d) : "")}
                month={currentMonth}
                year={currentYear}
                otherValue={dayMin ? parseInt(dayMin, 10) : null}
                isStart={false}
                alignRight
              />
            </div>
          </div>

          {/* Save current filter */}
          <div className="border-t border-[var(--border)] pt-3">
            {showSaveInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveFilter()}
                  autoFocus
                  maxLength={30}
                  className="flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  onClick={handleSaveFilter}
                  disabled={!saveName.trim()}
                  className="rounded px-2.5 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-secondary)]"
                  aria-label="Cancel save"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                disabled={!hasActiveFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover disabled:opacity-40"
              >
                <Bookmark size={12} />
                Save Current Filter
              </button>
            )}
          </div>

          {/* Saved filters */}
          {savedFilters.length > 0 && (
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">
                Saved Filters
              </p>
              <div className="space-y-1">
                {savedFilters.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-secondary)]"
                  >
                    <BookmarkCheck size={12} className="shrink-0 text-brand" />
                    <button
                      onClick={() => handleApplyFilter(f)}
                      className="flex-1 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
                    >
                      {f.name}
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(f.id)}
                      className="flex items-center justify-center rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                      aria-label={`Delete filter ${f.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
