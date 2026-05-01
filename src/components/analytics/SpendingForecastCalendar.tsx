"use client";

import { useMemo, useState, useCallback } from "react";
import { m } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useCurrency } from "@/hooks/useCurrency";
import { getDaysInMonth } from "@/lib/utils";
import type { RecurringExpense } from "@/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayForecast {
  day: number;
  actual: number | null;    // null = future day
  predicted: number;
  recurring: number;
  isToday: boolean;
  isPast: boolean;
}

export function SpendingForecastCalendar() {
  const { currentMonth, currentYear } = useUIStore();
  const { expenses } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const { effectiveBudget, avgDaily, forecast } = useCalculationsContext();
  const history = useHistoricalData(currentMonth, currentYear, 6);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  const today = isCurrentMonth ? now.getDate() : (currentMonth < now.getMonth() + 1 || currentYear < now.getFullYear()) ? daysInMonth : 0;

  // Build calendar data
  const calendarData = useMemo(() => {
    const active = expenses.filter((e) => !e.deletedAt);
    const dowFactors = history.dayOfWeekFactors;
    const recurringExpenses = (settings.recurringExpenses ?? []).filter((r: RecurringExpense) => r.active);

    // Build daily actuals
    const dailyActuals: Record<number, number> = {};
    for (const e of active) {
      dailyActuals[e.day] = (dailyActuals[e.day] || 0) + e.amount;
    }

    // Build recurring map (which days have recurring)
    const recurringByDay: Record<number, number> = {};
    for (const r of recurringExpenses) {
      recurringByDay[r.day] = (recurringByDay[r.day] || 0) + r.amount;
    }

    const days: DayForecast[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const isPast = d <= today;
      const isToday_ = d === today;
      const dow = new Date(currentYear, currentMonth - 1, d).getDay();
      const dowFactor = dowFactors[dow] ?? 1;

      // Predicted: use day-of-week factor * average daily + known recurring
      const recurringAmt = recurringByDay[d] || 0;
      const discretionaryPrediction = avgDaily * dowFactor;
      const predicted = isPast ? 0 : discretionaryPrediction + recurringAmt;

      days.push({
        day: d,
        actual: isPast ? (dailyActuals[d] || 0) : null,
        predicted: Math.round(predicted),
        recurring: recurringAmt,
        isToday: isToday_,
        isPast,
      });
    }

    return days;
  }, [expenses, history.dayOfWeekFactors, settings.recurringExpenses, daysInMonth, today, currentYear, currentMonth, avgDaily]);

  // Projected remaining total
  const projectedFutureTotal = useMemo(
    () => calendarData.filter((d) => !d.isPast).reduce((s, d) => s + d.predicted, 0),
    [calendarData],
  );
  const actualSoFar = useMemo(
    () => calendarData.filter((d) => d.isPast && d.actual !== null).reduce((s, d) => s + (d.actual || 0), 0),
    [calendarData],
  );

  // Calendar grid — pad start for first day's weekday offset
  const firstDow = new Date(currentYear, currentMonth - 1, 1).getDay();
  const maxDayAmount = Math.max(
    ...calendarData.map((d) => d.actual ?? d.predicted),
    1,
  );

  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const handleCalendarKeyDown = useCallback((e: React.KeyboardEvent) => {
    setFocusedDay((prev) => {
      const current = prev ?? 1;
      let next = current;
      switch (e.key) {
        case "ArrowRight": next = Math.min(current + 1, daysInMonth); break;
        case "ArrowLeft": next = Math.max(current - 1, 1); break;
        case "ArrowDown": next = Math.min(current + 7, daysInMonth); break;
        case "ArrowUp": next = Math.max(current - 7, 1); break;
        case "Home": next = 1; break;
        case "End": next = daysInMonth; break;
        default: return prev;
      }
      e.preventDefault();
      return next;
    });
  }, [daysInMonth]);

  if (expenses.length < 3 && today < 3) return null;

  return (
    <m.div
      className="card-terrain p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Spending Forecast
          </h3>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase"
            style={{
              background: forecast.confidence === "high"
                ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                : forecast.confidence === "medium"
                  ? "rgba(var(--es-sage-rgb, 143,175,139), 0.2)"
                  : "rgba(var(--es-clay-rgb, 181,101,74), 0.15)",
              color: forecast.confidence === "high"
                ? "var(--accent)"
                : forecast.confidence === "medium"
                  ? "var(--text-muted)"
                  : "var(--es-clay)",
            }}
          >
            {forecast.confidence}
          </span>
        </div>
        {effectiveBudget > 0 && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Est. total: {formatCurrency(Math.round(actualSoFar + projectedFutureTotal))}
          </span>
        )}
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Spending forecast calendar" onKeyDown={handleCalendarKeyDown}>
        {/* Empty cells for padding */}
        {Array.from({ length: firstDow }, (_, i) => (
          <div key={`pad-${i}`} role="gridcell" />
        ))}

        {calendarData.map((day) => {
          const amount = day.actual ?? day.predicted;
          const intensity = Math.min(amount / maxDayAmount, 1);
          const isFuture = !day.isPast;
          const isFocused = focusedDay === day.day;
          const cellLabel = day.isPast
            ? `Day ${day.day}: ${formatCurrency(day.actual || 0)} spent`
            : `Day ${day.day}: approximately ${formatCurrency(day.predicted)} predicted${day.recurring > 0 ? `, including ${formatCurrency(day.recurring)} recurring` : ""}`;

          return (
            <div
              key={day.day}
              role="gridcell"
              tabIndex={isFocused ? 0 : -1}
              aria-label={cellLabel}
              onFocus={() => setFocusedDay(day.day)}
              className="relative rounded-md p-1 text-center focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              style={{
                background: amount > 0
                  ? isFuture
                    ? `rgba(var(--es-sage-rgb, 143,175,139), ${intensity * 0.3})`
                    : `color-mix(in srgb, var(--accent) ${Math.round(intensity * 40)}%, transparent)`
                  : "transparent",
                border: day.isToday ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                opacity: isFuture ? 0.75 : 1,
              }}
              title={
                day.isPast
                  ? `Day ${day.day}: ${formatCurrency(day.actual || 0)} spent`
                  : `Day ${day.day}: ~${formatCurrency(day.predicted)} predicted${day.recurring > 0 ? ` (incl. ${formatCurrency(day.recurring)} recurring)` : ""}`
              }
            >
              <p className="text-[10px] font-medium" style={{ color: day.isToday ? "var(--accent)" : "var(--text-secondary)" }}>
                {day.day}
              </p>
              {amount > 0 && (
                <p
                  className="text-[8px] font-numeric truncate"
                  style={{
                    color: isFuture ? "var(--text-muted)" : "var(--text-tertiary)",
                    fontStyle: isFuture ? "italic" : "normal",
                  }}
                >
                  {amount >= 1000 ? `${Math.round(amount / 1000)}k` : Math.round(amount)}
                </p>
              )}
              {day.recurring > 0 && isFuture && (
                <div
                  className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full"
                  style={{ background: "var(--accent)" }}
                  title="Has recurring expense"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm" style={{ background: "color-mix(in srgb, var(--accent) 30%, transparent)" }} />
          <span>Actual</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm" style={{ background: "rgba(var(--es-sage-rgb, 143,175,139), 0.2)" }} />
          <span>Predicted</span>
        </div>
        {calendarData.some((d) => d.recurring > 0 && !d.isPast) && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            <span>Recurring</span>
          </div>
        )}
      </div>
    </m.div>
  );
}
