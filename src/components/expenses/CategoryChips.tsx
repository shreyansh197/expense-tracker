"use client";

import { useRef, useCallback, useState } from "react";
import { m } from "framer-motion";
import { getAllCategories, buildCategoryMap } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import { scale } from "@/lib/motion/tokens";
import type { CategoryId } from "@/types";

const LONG_PRESS_MS = 300;

export function CategoryChips() {
  const { activeCategories, toggleCategory, setActiveCategories } = useUIStore();
  const { settings } = useSettings();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalSwipe = useRef(false);

  // Long-press state
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holdingId, setHoldingId] = useState<CategoryId | null>(null);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setHoldingId(null);
  }, []);

  const startLongPress = useCallback(
    (catId: CategoryId) => {
      setHoldingId(catId);
      longPressTimer.current = setTimeout(() => {
        // Long press completed — isolate this category
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
        const isAlreadyIsolated =
          activeCategories.length === 1 && activeCategories[0] === catId;
        if (isAlreadyIsolated) {
          setActiveCategories([]); // release
        } else {
          setActiveCategories([catId]); // isolate
        }
        setHoldingId(null);
        longPressTimer.current = null;
      }, LONG_PRESS_MS);
    },
    [activeCategories, setActiveCategories],
  );

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
      cancelLongPress();
    }
  }, [cancelLongPress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isHorizontalSwipe.current) {
      e.stopPropagation();
    }
    touchStartRef.current = null;
    isHorizontalSwipe.current = false;
    cancelLongPress();
  }, [cancelLongPress]);

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
      aria-label="Category filters — long press to isolate"
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap md:overflow-visible"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {allCategories.map((cat, i) => {
        const isActive =
          activeCategories.length === 0 || activeCategories.includes(cat.id);
        const isHolding = holdingId === cat.id;
        return (
          <m.button
            key={cat.id}
            onClick={() => toggleCategory(cat.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPointerDown={() => startLongPress(cat.id)}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
            aria-pressed={activeCategories.length > 0 && activeCategories.includes(cat.id)}
            aria-label={`Filter by ${cat.label}${isActive ? " (active)" : ""} — long press to isolate`}
            whileTap={{ scale: scale.tapChip }}
            animate={isHolding ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-full px-3.5 py-2 text-xs font-medium transition-all",
              isActive ? "text-white" : "",
            )}
            style={{
              ...(isActive
                ? { backgroundColor: cat.color }
                : { background: "var(--surface-secondary)", color: "var(--text-secondary)" }),
              ...(isHolding ? { outlineColor: "var(--es-clay)", outline: "2px solid var(--es-clay)", outlineOffset: "1px" } : {}),
            }}
          >
            {cat.label}
            {/* Long-press fill indicator */}
            {isHolding && (
              <m.span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ background: "var(--es-mist)", originX: 0, scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: LONG_PRESS_MS / 1000, ease: "linear" }}
                aria-hidden="true"
              />
            )}
          </m.button>
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
