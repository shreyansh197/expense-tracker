"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { getMonthName } from "@/lib/utils";

export function MonthSwitcher() {
  const { currentMonth, currentYear, nextMonth, prevMonth } = useUIStore();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={prevMonth}
        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
        style={{ color: 'var(--text-tertiary)' }}
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <h2
        className="min-w-[148px] rounded-lg px-3 py-1.5 text-center text-sm font-semibold tracking-tight"
        style={{ color: 'var(--text-primary)', background: 'var(--surface-secondary)' }}
      >
        {getMonthName(currentMonth)} {currentYear}
      </h2>
      <button
        onClick={nextMonth}
        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
        style={{ color: 'var(--text-tertiary)' }}
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
