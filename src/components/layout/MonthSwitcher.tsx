"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { getMonthName } from "@/lib/utils";

const HINT_KEY = "expenstream-month-hint-seen";

/** Wrap a callback in the View Transitions API when supported */
function withViewTransition(fn: () => void) {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(fn);
  } else {
    fn();
  }
}

export function MonthSwitcher() {
  const { currentMonth, currentYear, nextMonth, prevMonth } = useUIStore();
  const [display, setDisplay] = useState({ month: currentMonth, year: currentYear });
  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const prevRef = useRef({ month: currentMonth, year: currentYear });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.month === currentMonth && prev.year === currentYear) return;
    const prevTotal = prev.year * 12 + prev.month;
    const curTotal = currentYear * 12 + currentMonth;
    setDir(curTotal > prevTotal ? "left" : "right");
    prevRef.current = { month: currentMonth, year: currentYear };
    // Dismiss hint on first month navigation
    if (showHint) {
      setShowHint(false);
      try { localStorage.setItem(HINT_KEY, "1"); } catch {}
    }
    const frame = requestAnimationFrame(() => {
      setDisplay({ month: currentMonth, year: currentYear });
      setTimeout(() => setDir(null), 300);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentMonth, currentYear, showHint]);

  // Show hint after a short delay for first-time users
  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch { return; }
    const t = setTimeout(() => setShowHint(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const handlePrev = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
    withViewTransition(prevMonth);
  }, [prevMonth]);

  const handleNext = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
    withViewTransition(nextMonth);
  }, [nextMonth]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch {}
  }, []);

  const now = new Date();
  const isCurrentYear = display.year === now.getFullYear();
  const label = isCurrentYear
    ? getMonthName(display.month)
    : `${getMonthName(display.month)} ${display.year}`;

  return (
    <div className="relative flex flex-col items-center">
      <div className="flex items-center gap-1">
      <button
        onClick={handlePrev}
        className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 hover:bg-[var(--surface-secondary)] active:scale-92 active:bg-[var(--surface-tertiary)]"
        style={{ color: 'var(--text-tertiary)' }}
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="relative min-w-[160px] overflow-hidden rounded-xl px-4 py-2" style={{ background: 'var(--surface-secondary)' }}>
        <h2
          key={label}
          aria-live="polite"
          aria-atomic="true"
          className="text-center text-sm font-bold tracking-tight"
          style={{
            color: 'var(--text-primary)',
            animation: dir ? `month-slide-${dir} 0.3s cubic-bezier(0.22, 1, 0.36, 1) both` : undefined,
            viewTransitionName: 'month-label',
          }}
        >
          {label}
        </h2>
      </div>
      <button
        onClick={handleNext}
        className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 hover:bg-[var(--surface-secondary)] active:scale-92 active:bg-[var(--surface-tertiary)]"
        style={{ color: 'var(--text-tertiary)' }}
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
      </div>
      {/* First-time hint */}
      {showHint && (
        <button
          onClick={dismissHint}
          className="absolute -bottom-7 fade-in text-xs whitespace-nowrap rounded-md px-2.5 py-1"
          style={{ color: "var(--text-muted)", background: "var(--surface-secondary)" }}
        >
          ← Tap arrows or swipe to browse months
        </button>
      )}
    </div>
  );
}
