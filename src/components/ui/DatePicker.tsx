"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month - 1, 1).getDay();
}

interface DatePickerProps {
  value: number; // day of month
  onChange: (day: number) => void;
  month: number; // 1-12
  year: number;
}

export function DatePicker({ value, onChange, month, year }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() + 1 === month && today.getFullYear() === year;
  const todayDay = today.getDate();

  const monthName = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
  });

  // Build grid: leading blanks + day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const displayDate = `${value} ${monthName.slice(0, 3)} ${year}`;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
          "border-gray-200 bg-white text-gray-900 hover:border-gray-300",
          "dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600",
          open && "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-500"
        )}
      >
        <Calendar size={16} className="shrink-0 text-gray-400" />
        <span>{displayDate}</span>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl",
            "dark:border-gray-700 dark:bg-gray-900",
            // Position: centered on mobile, left-aligned on desktop
            "left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0"
          )}
        >
          {/* Month/Year header */}
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {monthName} {year}
            </span>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase text-gray-400 dark:text-gray-500"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <div key={`blank-${i}`} className="h-9" />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(day);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all",
                    day === value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                    isCurrentMonth &&
                      day === todayDay &&
                      day !== value &&
                      "font-bold text-blue-600 dark:text-blue-400"
                  )}
                >
                  {day}
                </button>
              )
            )}
          </div>

          {/* Today shortcut */}
          {isCurrentMonth && (
            <button
              type="button"
              onClick={() => {
                onChange(todayDay);
                setOpen(false);
              }}
              className="mt-2 w-full rounded-lg bg-gray-50 py-1.5 text-xs font-medium text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
            >
              Today ({todayDay})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
