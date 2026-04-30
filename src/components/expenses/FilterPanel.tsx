"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { SavedFilter } from "@/types";

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
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { symbol } = useCurrency();
  const { activeCategories, searchQuery } = useUIStore();
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

          {/* Day range */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium uppercase text-[var(--text-secondary)]">
              Day Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="31"
                placeholder="From"
                value={dayMin}
                onChange={(e) => onDayMinChange(e.target.value)}
                className="w-full flex-1 rounded-ui-md border border-[var(--border)] bg-[var(--surface)] py-2.5 px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <span className="text-xs text-[var(--text-tertiary)]">to</span>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="To"
                value={dayMax}
                onChange={(e) => onDayMaxChange(e.target.value)}
                className="w-full flex-1 rounded-ui-md border border-[var(--border)] bg-[var(--surface)] py-2.5 px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/20"
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
