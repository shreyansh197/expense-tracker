"use client";

import { useMemo } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Activity, Zap } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface SpendingPulseProps {
  /** Daily totals array (index 0 = day 1), up to today */
  dailyValues: number[];
  /** Today's total */
  todayTotal: number;
  /** Average daily spending */
  avgDaily: number;
  /** Number of expenses logged today */
  todayCount: number;
}

/**
 * Spending Pulse — an animated heartbeat visualization
 * showing the last 7 days of spending rhythm.
 * Each bar pulses in, today's glows, and a live "BPM"
 * metaphor shows spending intensity.
 */
export function SpendingPulse({ dailyValues, todayTotal, avgDaily, todayCount }: SpendingPulseProps) {
  const { formatCurrency } = useCurrency();
  const shouldReduceMotion = useReducedMotion();

  // Last 7 days of data (including today)
  const pulseData = useMemo(() => {
    const today = new Date().getDate();
    const start = Math.max(0, today - 7);
    const slice = dailyValues.slice(start, today);
    // Pad to 7 if fewer days available
    while (slice.length < 7) slice.unshift(0);
    return slice;
  }, [dailyValues]);

  const maxVal = Math.max(...pulseData, avgDaily, 1);

  // "Pulse rate" — intensity metaphor based on today vs average
  const pulseRate = useMemo(() => {
    if (avgDaily <= 0) return { label: "Calm", intensity: 0 };
    const ratio = todayTotal / avgDaily;
    if (ratio === 0) return { label: "Resting", intensity: 0 };
    if (ratio < 0.5) return { label: "Calm", intensity: 1 };
    if (ratio < 1) return { label: "Steady", intensity: 2 };
    if (ratio < 1.5) return { label: "Active", intensity: 3 };
    return { label: "Surging", intensity: 4 };
  }, [todayTotal, avgDaily]);

  const dayLabels = useMemo(() => {
    const names = ["S", "M", "T", "W", "T", "F", "S"];
    const today = new Date();
    const result: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      result.push(names[d.getDay()]);
    }
    return result;
  }, []);

  const intensityColor = [
    "var(--es-mist)",     // 0 - resting
    "var(--es-sage)",     // 1 - calm
    "var(--es-moss)",     // 2 - steady
    "var(--es-clay)",     // 3 - active
    "var(--accent)",      // 4 - surging
  ][pulseRate.intensity];

  return (
    <m.div
      className="card-terrain overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <m.div
            animate={!shouldReduceMotion && pulseRate.intensity >= 2
              ? { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }
              : { scale: 1, opacity: 0.7 }
            }
            transition={!shouldReduceMotion && pulseRate.intensity >= 2
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : {}
            }
          >
            <Activity size={15} style={{ color: intensityColor }} />
          </m.div>
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Spending Pulse
          </h3>
        </div>
        <m.span
          className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{ background: `color-mix(in srgb, ${intensityColor} 15%, transparent)`, color: intensityColor }}
          key={pulseRate.label}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <Zap size={10} />
          {pulseRate.label}
        </m.span>
      </div>

      {/* Pulse visualization */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-end gap-1.5" style={{ height: 72 }}>
          {pulseData.map((val, i) => {
            const isToday = i === pulseData.length - 1;
            const h = maxVal > 0 ? Math.max((val / maxVal) * 100, 4) : 4;
            const barColor = isToday
              ? intensityColor
              : val > avgDaily
                ? "var(--es-clay)"
                : "var(--es-sage)";

            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full flex justify-center" style={{ height: 56 }}>
                  <m.div
                    className="w-full max-w-[32px] rounded-t-lg"
                    style={{
                      backgroundColor: barColor,
                      opacity: isToday ? 1 : 0.6,
                      position: "absolute",
                      bottom: 0,
                    }}
                    initial={shouldReduceMotion ? false : { height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }
                    }
                  />
                  {/* Today's glow pulse */}
                  {isToday && val > 0 && !shouldReduceMotion && (
                    <m.div
                      className="absolute bottom-0 w-full max-w-[32px] rounded-t-lg"
                      style={{
                        backgroundColor: intensityColor,
                        height: `${h}%`,
                      }}
                      animate={{ opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isToday ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: isToday ? 700 : 500,
                  }}
                >
                  {dayLabels[i]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Average line label */}
        {avgDaily > 0 && (
          <div className="relative mt-1" style={{ height: 0 }}>
            <div
              className="absolute w-full border-t border-dashed"
              style={{
                borderColor: "var(--text-muted)",
                opacity: 0.5,
                bottom: `${Math.min((avgDaily / maxVal) * 56, 54) + 16}px`,
              }}
            />
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between px-4 pb-4 pt-1">
        <div>
          <span className="font-display text-base font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(todayTotal)}
          </span>
          <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            today{todayCount > 0 ? ` · ${todayCount} txn${todayCount !== 1 ? "s" : ""}` : ""}
          </span>
        </div>
        <span className="text-xs font-numeric" style={{ color: "var(--text-muted)" }}>
          avg {formatCurrency(Math.round(avgDaily))}/d
        </span>
      </div>
    </m.div>
  );
}
