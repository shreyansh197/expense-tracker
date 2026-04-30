"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
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
  // Peek mode: save previous categories so we can restore on release
  const peekPrevRef = useRef<CategoryId[] | null>(null);

  // Long-press discovery hint (shown once per device)
  const [showLongPressHint, setShowLongPressHint] = useState(false);
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem("expenstream-longpress-hint-seen") === "1") return;
    // Show after a short delay so it doesn't distract on initial load
    const t = setTimeout(() => setShowLongPressHint(true), 2000);
    return () => clearTimeout(t);
  }, []);
  const dismissHint = useCallback(() => {
    setShowLongPressHint(false);
    localStorage.setItem("expenstream-longpress-hint-seen", "1");
  }, []);

  const releasePeek = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // If we were peeking, restore previous filter state
    if (peekPrevRef.current !== null) {
      setActiveCategories(peekPrevRef.current);
      peekPrevRef.current = null;
    }
    setHoldingId(null);
  }, [setActiveCategories]);

  const startLongPress = useCallback(
    (catId: CategoryId) => {
      setHoldingId(catId);
      longPressTimer.current = setTimeout(() => {
        // Long press completed — peek at this category
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
        // Save current filter state before peeking
        peekPrevRef.current = [...activeCategories];
        setActiveCategories([catId]);
        setHoldingId(null);
        longPressTimer.current = null;
        dismissHint();
      }, LONG_PRESS_MS);
    },
    [activeCategories, setActiveCategories, dismissHint],
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
      releasePeek();
    }
  }, [releasePeek]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isHorizontalSwipe.current) {
      e.stopPropagation();
    }
    touchStartRef.current = null;
    isHorizontalSwipe.current = false;
    releasePeek();
  }, [releasePeek]);

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
    <>
      <div
        ref={containerRef}
        role="group"
        aria-label="Category filters — hold to peek at a category"
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
              onPointerUp={releasePeek}
              onPointerLeave={releasePeek}
              aria-pressed={activeCategories.length > 0 && activeCategories.includes(cat.id)}
              aria-label={`Filter by ${cat.label}${isActive ? " (active)" : ""} — hold to peek`}
              whileTap={{ scale: scale.tapChip }}
              animate={isHolding ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-ui-full px-3.5 py-2 text-xs font-medium transition-all select-none",
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
                  className="pointer-events-none absolute inset-0 rounded-ui-full"
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
      <AnimatePresence>
        {showLongPressHint && (
          <m.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] pl-1 cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            onClick={dismissHint}
          >
            Tip: hold a category to peek at its expenses
          </m.p>
        )}
      </AnimatePresence>
    </>
  );
}

export function CategoryBadge({ category }: { category: CategoryId }) {
  const { settings } = useSettings();
  const map = buildCategoryMap(settings.customCategories);
  const meta = map[category];
  if (!meta) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-ui-full px-2.5 py-0.5 text-xs font-medium max-w-full truncate"
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
