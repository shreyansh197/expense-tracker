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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalSwipe = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isHorizontalSwipe.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (dx > 10 && dx > dy) {
      isHorizontalSwipe.current = true;
      e.stopPropagation();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isHorizontalSwipe.current) {
      e.stopPropagation();
    }
    touchStartRef.current = null;
    isHorizontalSwipe.current = false;
  }, []);

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
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap md:overflow-visible"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {allCategories.map((cat, i) => {
        const isActive =
          activeCategories.length === 0 || activeCategories.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => toggleCategory(cat.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            aria-pressed={activeCategories.length > 0 && activeCategories.includes(cat.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all active:scale-95",
              isActive
                ? "text-white"
                : ""
            )}
            style={isActive ? { backgroundColor: cat.color } : { background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
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
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium max-w-full truncate"
      style={{
        backgroundColor: meta.bgColor,
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
}

export function CategoryDot({ category }: { category: CategoryId }) {
  const { settings } = useSettings();
  const map = buildCategoryMap(settings.customCategories);
  const meta = map[category];
  if (!meta) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs max-w-full truncate" style={{ color: 'var(--text-secondary)' }}>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
