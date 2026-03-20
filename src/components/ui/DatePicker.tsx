"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month - 1, 1).getDay();
}

interface DatePickerProps {
  value: number; // day of month
  onChange: (day: number, month?: number, year?: number) => void;
  month: number; // 1-12
  year: number;
}

export function DatePicker({ value, onChange, month, year }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(month);
  const [viewYear, setViewYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  // Reset view to expense month/year when opening
  useEffect(() => {
    if (open) {
      setViewMonth(month);
      setViewYear(year);
    }
  }, [open, month, year]);

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

  const displayMonthName = MONTH_NAMES[month - 1];
  const displayDate = `${value} ${displayMonthName.slice(0, 3)} ${year}`;

  const handleSelect = (day: number) => {
    onChange(day, viewMonth, viewYear);
    setOpen(false);
  };

  const goPrev = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goNext = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() + 1 === viewMonth && today.getFullYear() === viewYear;
  const todayDay = today.getDate();
  const isExpenseMonth = viewMonth === month && viewYear === year;

  // Pad to always 6 rows (42 cells) for consistent height
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

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
        <>
          {/* Mobile: full-screen overlay */}
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 sm:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              className={cn(
                "w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl",
                "dark:border-gray-700 dark:bg-gray-900"
              )}
            >
              <CalendarGrid
                viewMonth={viewMonth}
                viewYear={viewYear}
                cells={cells}
                value={isExpenseMonth ? value : -1}
                isCurrentMonth={isCurrentMonth}
                todayDay={todayDay}
                onSelect={handleSelect}
                onPrev={goPrev}
                onNext={goNext}
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
          {/* Desktop: positioned dropdown — opens upward to avoid clipping */}
          <div
            className={cn(
              "absolute z-50 hidden w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-xl sm:block",
              "dark:border-gray-700 dark:bg-gray-900",
              "bottom-full mb-1.5 left-0"
            )}
          >
            <CalendarGrid
              viewMonth={viewMonth}
              viewYear={viewYear}
              cells={cells}
              value={isExpenseMonth ? value : -1}
              isCurrentMonth={isCurrentMonth}
              todayDay={todayDay}
              onSelect={handleSelect}
              onPrev={goPrev}
              onNext={goNext}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CalendarGrid({
  viewMonth,
  viewYear,
  cells,
  value,
  isCurrentMonth,
  todayDay,
  onSelect,
  onPrev,
  onNext,
  onClose,
}: {
  viewMonth: number;
  viewYear: number;
  cells: (number | null)[];
  value: number;
  isCurrentMonth: boolean;
  todayDay: number;
  onSelect: (day: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose?: () => void;
}) {
  const monthName = MONTH_NAMES[viewMonth - 1];

  return (
    <>
      {/* Header with nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {monthName} {viewYear}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ChevronRight size={18} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={16} />
            </button>
          )}
        </div>
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
            <div key={`blank-${i}`} className="h-10" />
          ) : (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-all",
                day === value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                isCurrentMonth &&
                  day === todayDay &&
                  day !== value &&
                  "ring-1 ring-blue-400 font-bold text-blue-600 dark:text-blue-400 dark:ring-blue-500"
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
          onClick={() => onSelect(todayDay)}
          className="mt-2 w-full rounded-lg bg-gray-50 py-2 text-xs font-medium text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
        >
          Today ({todayDay})
        </button>
      )}
    </>
  );
}
