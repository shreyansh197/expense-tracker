"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { getMonthName } from "@/lib/utils";

export function MonthSwitcher() {
  const { currentMonth, currentYear, nextMonth, prevMonth } = useUIStore();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={prevMonth}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="Previous month"
      >
        <ChevronLeft size={20} />
      </button>
      <h2 className="min-w-[140px] text-center text-base font-semibold text-gray-900 dark:text-white">
        {getMonthName(currentMonth)} {currentYear}
      </h2>
      <button
        onClick={nextMonth}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="Next month"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
