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
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            hasActiveFilters
              ? "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
              : ""
          }`}
          style={!hasActiveFilters ? { color: 'var(--text-secondary)' } : undefined}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-600 px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
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
            <label className="mb-2 block text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
              Amount Range
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={amountMin}
                  onChange={(e) => onAmountMinChange(e.target.value)}
                  className="w-full rounded-xl py-2.5 pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>to</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={amountMax}
                  onChange={(e) => onAmountMaxChange(e.target.value)}
                  className="w-full rounded-xl py-2.5 pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Day range */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
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
                className="w-full flex-1 rounded-xl py-2.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>to</span>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="To"
                value={dayMax}
                onChange={(e) => onDayMaxChange(e.target.value)}
                className="w-full flex-1 rounded-xl py-2.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Save current filter */}
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
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
                  className="flex-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={handleSaveFilter}
                  disabled={!saveName.trim()}
                  className="rounded px-2.5 py-1.5 text-xs font-medium text-cyan-600 hover:bg-cyan-50 disabled:opacity-40 dark:text-cyan-400"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                disabled={!hasActiveFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-cyan-600 hover:text-cyan-700 disabled:opacity-40 dark:text-cyan-400"
              >
                <Bookmark size={12} />
                Save Current Filter
              </button>
            )}
          </div>

          {/* Saved filters */}
          {savedFilters.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                Saved Filters
              </p>
              <div className="space-y-1">
                {savedFilters.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <BookmarkCheck size={12} className="shrink-0 text-cyan-500" />
                    <button
                      onClick={() => handleApplyFilter(f)}
                      className="flex-1 text-left text-xs font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300"
                    >
                      {f.name}
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(f.id)}
                      className="rounded p-0.5 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={12} />
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
