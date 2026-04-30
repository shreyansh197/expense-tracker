"use client";

import { useCallback, useRef } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tv, Car, ShoppingCart, UtensilsCrossed, ShoppingBag,
  MoreHorizontal, CreditCard, Wifi, TrendingUp, Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryId } from "@/types";

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
}

export function CategorySelector({ categories, selected, onSelect, showError, categoryBudgets, categoryTotals, currencySymbol }: CategorySelectorProps) {
  const gridRef = useRef<HTMLDivElement>(null);
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
              onClick={() => onSelect(selected === cat.id ? ("" as CategoryId) : (cat.id as CategoryId))}
              role="radio"
              aria-checked={selected === cat.id}
              className={cn(
                "relative flex items-center gap-1.5 rounded-ui-full px-3 py-2 sm:py-2.5 text-xs font-medium transition-all",
                selected === cat.id ? "text-white shadow-sm" : ""
              )}
              style={
                selected === cat.id
                  ? { backgroundColor: cat.color }
                  : {
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-secondary)',
                      opacity: selected ? 0.2 : 1,
                      transition: 'opacity 0.2s ease',
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
            </m.button>
          );
        })}
      </div>

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
    </div>
  );
}
