"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
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
  const { activeCategories, searchQuery } = useUIStore();
  const { toast } = useToast();
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const savedFilters = settings.savedFilters || [];
  const hasActiveFilters = amountMin !== "" || amountMax !== "" || dayMin !== "" || dayMax !== "" || activeCategories.length > 0 || searchQuery.trim() !== "";

  const handleSaveFilter = () => {
    const name = saveName.trim();
    if (!name) return;
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
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
              !
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Amount range */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              Amount Range
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={amountMin}
                  onChange={(e) => onAmountMinChange(e.target.value)}
                  className="w-full rounded border border-gray-200 bg-white py-2 pl-6 pr-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <span className="text-xs text-gray-400">to</span>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={amountMax}
                  onChange={(e) => onAmountMaxChange(e.target.value)}
                  className="w-full rounded border border-gray-200 bg-white py-2 pl-6 pr-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Day range */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
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
                className="w-full flex-1 rounded border border-gray-200 bg-white py-2 px-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="To"
                value={dayMax}
                onChange={(e) => onDayMaxChange(e.target.value)}
                className="w-full flex-1 rounded border border-gray-200 bg-white py-2 px-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Save current filter */}
          <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
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
                  className="flex-1 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={handleSaveFilter}
                  disabled={!saveName.trim()}
                  className="rounded px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40 dark:text-blue-400"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                disabled={!hasActiveFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40 dark:text-blue-400"
              >
                <Bookmark size={12} />
                Save Current Filter
              </button>
            )}
          </div>

          {/* Saved filters */}
          {savedFilters.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Saved Filters
              </p>
              <div className="space-y-1">
                {savedFilters.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <BookmarkCheck size={12} className="shrink-0 text-blue-500" />
                    <button
                      onClick={() => handleApplyFilter(f)}
                      className="flex-1 text-left text-xs font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300"
                    >
                      {f.name}
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(f.id)}
                      className="rounded p-0.5 text-gray-400 hover:text-red-500"
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
