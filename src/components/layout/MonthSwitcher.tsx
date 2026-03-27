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
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <h2 className="min-w-[140px] text-center text-base font-semibold tracking-tight text-slate-900 dark:text-white">
        {getMonthName(currentMonth)} {currentYear}
      </h2>
      <button
        onClick={nextMonth}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
