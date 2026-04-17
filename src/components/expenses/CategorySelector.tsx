"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/types";

interface CategoryItem {
  id: string;
  label: string;
  color: string;
}

interface CategorySelectorProps {
  categories: CategoryItem[];
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
  showError?: boolean;
}

export function CategorySelector({ categories, selected, onSelect, showError }: CategorySelectorProps) {
  return (
    <div className="-mx-1 rounded-xl p-3" style={{ background: 'var(--section-moss)' }}>
      <label className="form-label mb-2 uppercase">
        Category {showError && <span className="text-err normal-case">— please select</span>}
      </label>
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto" role="radiogroup" aria-label="Select category">
        {categories.map((cat) => (
          <m.button
            key={cat.id}
            type="button"
            onClick={() => onSelect(selected === cat.id ? ("" as CategoryId) : (cat.id as CategoryId))}
            role="radio"
            aria-checked={selected === cat.id}
            className={cn(
              "rounded-full px-3 py-2 sm:py-2.5 text-xs font-medium transition-all",
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
            {cat.label}
          </m.button>
        ))}
      </div>
    </div>
  );
}
