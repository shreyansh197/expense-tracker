"use client";

import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import type { CategoryId } from "@/types";

export function CategoryChips() {
  const { activeCategories, toggleCategory } = useUIStore();

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const isActive =
          activeCategories.length === 0 || activeCategories.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => toggleCategory(cat.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all",
              isActive
                ? "text-white shadow-sm"
                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            )}
            style={isActive ? { backgroundColor: cat.color } : undefined}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

export function CategoryBadge({ category }: { category: CategoryId }) {
  const meta = CATEGORY_MAP[category];
  if (!meta) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: meta.bgColor,
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
}
