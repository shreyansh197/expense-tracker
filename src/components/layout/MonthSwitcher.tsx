"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { getMonthName } from "@/lib/utils";

export function MonthSwitcher() {
  const { currentMonth, currentYear, nextMonth, prevMonth } = useUIStore();
  const [display, setDisplay] = useState({ month: currentMonth, year: currentYear });
  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const prevRef = useRef({ month: currentMonth, year: currentYear });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.month === currentMonth && prev.year === currentYear) return;
    const prevTotal = prev.year * 12 + prev.month;
    const curTotal = currentYear * 12 + currentMonth;
    setDir(curTotal > prevTotal ? "left" : "right");
    prevRef.current = { month: currentMonth, year: currentYear };
    const frame = requestAnimationFrame(() => {
      setDisplay({ month: currentMonth, year: currentYear });
      setTimeout(() => setDir(null), 300);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentMonth, currentYear]);

  const handlePrev = useCallback(() => prevMonth(), [prevMonth]);
  const handleNext = useCallback(() => nextMonth(), [nextMonth]);

  const label = `${getMonthName(display.month)} ${display.year}`;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handlePrev}
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = ''; }}
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="relative min-w-[160px] overflow-hidden rounded-xl px-4 py-2" style={{ background: 'var(--surface-secondary)' }}>
        <h2
          key={label}
          className="text-center text-sm font-bold tracking-tight"
          style={{
            color: 'var(--text-primary)',
            animation: dir ? `month-slide-${dir} 0.3s cubic-bezier(0.4, 0, 0.2, 1) both` : undefined,
          }}
        >
          {label}
        </h2>
      </div>
      <button
        onClick={handleNext}
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = ''; }}
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>

      <style jsx>{`
        @keyframes month-slide-left {
          0% { opacity: 0; transform: translateX(24px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes month-slide-right {
          0% { opacity: 0; transform: translateX(-24px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
