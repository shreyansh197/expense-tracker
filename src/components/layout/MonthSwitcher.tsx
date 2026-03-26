"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { getMonthName } from "@/lib/utils";

export function MonthSwitcher() {
  const { currentMonth, currentYear, nextMonth, prevMonth } = useUIStore();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prevMonth}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <h2 className="min-w-[140px] text-center text-base font-semibold tracking-tight text-gray-900 dark:text-white">
        {getMonthName(currentMonth)} {currentYear}
      </h2>
      <button
        onClick={nextMonth}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
