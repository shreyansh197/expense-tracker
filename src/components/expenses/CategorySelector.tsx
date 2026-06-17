"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tv, Car, ShoppingCart, UtensilsCrossed, ShoppingBag,
  MoreHorizontal, CreditCard, Wifi, TrendingUp, Tag, Plus, Check, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryId } from "@/types";

const QUICK_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F59E0B", "#10B981", "#06B6D4", "#3B82F6",
];

/** Map icon name strings from categories.ts to lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  Tv, Car, ShoppingCart, UtensilsCrossed, ShoppingBag,
  MoreHorizontal, CreditCard, Wifi, TrendingUp,
};

interface CategoryItem {
  id: string;
  label: string;
  color: string;
  icon?: string;
}

interface CategoryTotal {
  category: string;
  total: number;
}

interface CategorySelectorProps {
  categories: CategoryItem[];
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
  showError?: boolean;
  /** Per-category budget limits from settings */
  categoryBudgets?: Record<string, number>;
  /** Per-category spend totals for the current month */
  categoryTotals?: CategoryTotal[];
  /** Currency symbol for display */
  currencySymbol?: string;
  /** Called when user creates a new category inline; receives name + color */
  onAddCategory?: (name: string, color: string) => void;
}

export function CategorySelector({ categories, selected, onSelect, showError, categoryBudgets, categoryTotals, currencySymbol, onAddCategory }: CategorySelectorProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(QUICK_COLORS[0]);

  const handleSelect = useCallback((id: CategoryId) => {
    onSelect(selected === id ? ("" as CategoryId) : id);
  }, [onSelect, selected]);

  // Build a lookup of spent per category
  const spentMap = new Map<string, number>();
  categoryTotals?.forEach((ct) => spentMap.set(ct.category, ct.total));

  const handleGridKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const buttons = Array.from(gridRef.current?.querySelectorAll<HTMLButtonElement>("[role=radio]") ?? []);
    const idx = buttons.findIndex((b) => b === document.activeElement);
    const next = e.key === "ArrowRight"
      ? buttons[(idx + 1) % buttons.length]
      : buttons[(idx - 1 + buttons.length) % buttons.length];
    next?.focus();
  }, []);

  const handleSaveNewCategory = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddCategory?.(trimmed, newColor);
    setNewName("");
    setNewColor(QUICK_COLORS[0]);
    setShowCreate(false);
  };

  // Compute budget remaining for the selected category
  const selectedBudget = selected && categoryBudgets?.[selected] ? categoryBudgets[selected] : 0;
  const selectedSpent = selected ? (spentMap.get(selected) ?? 0) : 0;
  const selectedRemaining = selectedBudget - selectedSpent;
  const selectedPct = selectedBudget > 0 ? (selectedSpent / selectedBudget) * 100 : 0;
  const showBudgetHint = selected && selectedBudget > 0;

  return (
    <div className="-mx-1 rounded-ui-lg px-3 py-2" style={{ background: 'var(--section-moss)' }}>
      <label className="form-label mb-1.5 uppercase">
        Category {showError && <span className="text-err normal-case">— please select</span>}
      </label>

      <div ref={gridRef} onKeyDown={handleGridKeyDown} className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto" role="radiogroup" aria-label="Select category">
        {categories.map((cat) => {
          const budget = categoryBudgets?.[cat.id] ?? 0;
          const spent = spentMap.get(cat.id) ?? 0;
          const pct = budget > 0 ? (spent / budget) * 100 : 0;
          const nearLimit = budget > 0 && pct >= 80;
          const overLimit = budget > 0 && pct >= 100;

          return (
            <m.button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.id as CategoryId)}
              role="radio"
              aria-checked={selected === cat.id}
              className={cn(
                "relative flex items-center gap-1.5 rounded-ui-full px-3 py-2 sm:py-2.5 text-xs font-medium transition-all overflow-hidden",
                selected === cat.id ? "text-white shadow-sm" : ""
              )}
              style={
                selected === cat.id
                  ? { backgroundColor: cat.color }
                  : {
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-secondary)',
                      opacity: selected ? 0.55 : 1,
                      transform: selected ? 'scale(0.95)' : 'scale(1)',
                      transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }
              }
              onMouseEnter={selected !== cat.id ? (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--surface-tertiary)'; } : undefined}
              onMouseLeave={selected !== cat.id ? (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--surface-secondary)'; } : undefined}
              whileTap={{ scale: 0.92 }}
              animate={selected === cat.id ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              {(() => { const Icon = cat.icon ? ICON_MAP[cat.icon] ?? Tag : Tag; return <Icon size={12} className="shrink-0" />; })()}
              {cat.label}
              {/* Budget proximity dot */}
              {nearLimit && selected !== cat.id && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-ui-full"
                  style={{ background: overLimit ? "var(--danger)" : "var(--warning)" }}
                  aria-label={overLimit ? "Over budget" : "Near budget limit"}
                />
              )}
              {/* Budget mini-bar at the bottom of the chip */}
              {budget > 0 && (
                <span
                  className="absolute bottom-0 left-0 h-0.5"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: overLimit ? "var(--danger)" : pct >= 80 ? "var(--warning)" : (selected === cat.id ? "rgba(255,255,255,0.5)" : "var(--accent)"),
                  }}
                  aria-hidden
                />
              )}
            </m.button>
          );
        })}

        {/* + New category chip */}
        {onAddCategory && !showCreate && (
          <m.button
            type="button"
            onClick={() => { setShowCreate(true); setTimeout(() => newNameRef.current?.focus(), 50); }}
            className="flex items-center gap-1 rounded-ui-full px-3 py-2 text-xs font-medium border border-dashed transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }}
            whileTap={{ scale: 0.94 }}
            aria-label="Add new category"
          >
            <Plus size={11} />
            New
          </m.button>
        )}
      </div>

      {/* Inline new-category form */}
      <AnimatePresence>
        {showCreate && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-col gap-2 rounded-xl p-3" style={{ background: "var(--surface-secondary)" }}>
              <div className="flex items-center gap-2">
                <input
                  ref={newNameRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveNewCategory(); } if (e.key === "Escape") { setShowCreate(false); setNewName(""); } }}
                  placeholder="Category name"
                  maxLength={32}
                  className="flex-1 rounded-lg bg-transparent px-2 py-1 text-xs outline-none"
                  style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  aria-label="New category name"
                />
                <button
                  type="button"
                  onClick={handleSaveNewCategory}
                  disabled={!newName.trim()}
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "#fff" }}
                  aria-label="Save new category"
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewName(""); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                  style={{ background: "var(--surface-tertiary)", color: "var(--text-muted)" }}
                  aria-label="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
              {/* Color swatches */}
              <div className="flex gap-1.5">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="h-5 w-5 rounded-full transition-transform"
                    style={{
                      background: c,
                      transform: newColor === c ? "scale(1.25)" : "scale(1)",
                      outline: newColor === c ? `2px solid var(--accent)` : "none",
                      outlineOffset: "1px",
                    }}
                    aria-label={`Color ${c}`}
                    aria-pressed={newColor === c}
                  />
                ))}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Budget remaining hint for selected category */}
      {showBudgetHint && (
        <p
          className="mt-1.5 text-xs"
          style={{ color: selectedPct >= 100 ? "var(--danger)" : selectedPct >= 80 ? "var(--warning-text)" : "var(--text-muted)" }}
        >
          {selectedRemaining >= 0
            ? `${currencySymbol ?? ""}${Math.round(selectedRemaining).toLocaleString()} left in ${categories.find((c) => c.id === selected)?.label ?? "this category"}`
            : `${currencySymbol ?? ""}${Math.round(Math.abs(selectedRemaining)).toLocaleString()} over budget in ${categories.find((c) => c.id === selected)?.label ?? "this category"}`}
        </p>
      )}
      {!showBudgetHint && selected && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          No budget set for {categories.find((c) => c.id === selected)?.label ?? "this category"}
        </p>
      )}
    </div>
  );
}
