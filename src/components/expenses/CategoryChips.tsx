"use client";

import { useRef, useCallback } from "react";
import { getAllCategories, buildCategoryMap } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import type { CategoryId } from "@/types";

export function CategoryChips() {
  const { activeCategories, toggleCategory } = useUIStore();
  const { settings } = useSettings();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const container = containerRef.current;
      if (!container) return;
      const buttons = container.querySelectorAll<HTMLButtonElement>("button");
      let nextIndex = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (index + 1) % buttons.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (index - 1 + buttons.length) % buttons.length;
      }
      if (nextIndex >= 0) buttons[nextIndex]?.focus();
    },
    []
  );

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Category filters"
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:flex-wrap lg:overflow-visible"
    >
      {allCategories.map((cat, i) => {
        const isActive =
          activeCategories.length === 0 || activeCategories.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => toggleCategory(cat.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all",
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
  const { settings } = useSettings();
  const map = buildCategoryMap(settings.customCategories);
  const meta = map[category];
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
