"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { staggerDelay, duration, ease } from "@/lib/motion/tokens";

interface DayGroupProps {
  day: number;
  month: number;
  year: number;
  total: string;
  children: React.ReactNode;
  index: number;
}

/**
 * Day header for the expense stream bed.
 * Shows a terrain-style day divider with Lora italic label + day total.
 */
export function DayGroup({ day, month, year, total, children, index }: DayGroupProps) {
  const dayLabel = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    if (day === todayDay && month === todayMonth && year === todayYear) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (
      day === yesterday.getDate() &&
      month === yesterday.getMonth() + 1 &&
      year === yesterday.getFullYear()
    )
      return "Yesterday";
    const d = new Date(year, month - 1, day);
    const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diffDays <= 6 && diffDays > 0) {
      return d.toLocaleString("en", { weekday: "long" });
    }
    return d.toLocaleString("en", { month: "short", day: "numeric" });
  }, [day, month, year]);

  return (
    <m.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay(index), duration: duration.normal, ease: ease.out }}
      className="space-y-1.5"
    >
      {/* Day divider */}
      <div className="flex items-center gap-3 px-1 pt-3 pb-1">
        <span
          className="font-display italic text-sm leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {dayLabel}
        </span>
        <div
          className="flex-1 rounded-full"
          style={{ height: 1, background: "var(--es-clay, #B5654A)", opacity: 0.25 }}
        />
        <span
          className="font-numeric text-xs font-semibold tabular-nums"
          style={{ color: "var(--text-secondary)" }}
        >
          {total}
        </span>
      </div>
      {/* Expense items */}
      <div className="space-y-1.5">{children}</div>
    </m.section>
  );
}
