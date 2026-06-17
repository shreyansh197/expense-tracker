"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { m, useReducedMotion } from "framer-motion";

/* ── Layout constants ── */
const VB_W = 360;
const VB_H = 160;
const PAD_X = 10;

/** Navigate stones with Left/Right arrow keys */
function useStoneKeyNav(
  stones: { day: number }[],
  activeStone: number | null,
  setActiveStone: (d: number | null) => void,
) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (!stones.length) return;
      if (e.key === "Escape") { setActiveStone(null); return; }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const idx = activeStone != null ? stones.findIndex((s) => s.day === activeStone) : -1;
      const next =
        e.key === "ArrowRight"
          ? stones[Math.min(idx + 1, stones.length - 1)]
          : stones[Math.max(idx - 1, 0)];
      setActiveStone(next.day);
    },
    [stones, activeStone, setActiveStone],
  );
}

interface SpendingStreamProps {
  /** 0-120 — percentage of budget used */
  budgetUsedPercent: number;
  /** Daily totals as simple numbers, one per day of month */
  dailyValues?: number[];
  /** Total days in the month */
  daysInMonth?: number;
  /** Daily budget pace (budget ÷ days) for baseline line */
  dailyBudgetPace?: number;
  /** Anomaly day numbers to highlight */
  anomalyDays?: Set<number>;
  /** Monthly budget for tooltip % display */
  effectiveBudget?: number;
  /** Currency formatter */
  formatCurrency?: (n: number) => string;
  /** Month (1-12) and year being displayed — used to determine whether to show the "today" marker */
  month?: number;
  year?: number;
  className?: string;
}

export function SpendingStream({
  budgetUsedPercent,
  dailyValues = [],
  daysInMonth = 30,
  dailyBudgetPace = 0,
  anomalyDays,
  effectiveBudget = 0,
  formatCurrency,
  month,
  year,
  className,
}: SpendingStreamProps) {
  const prefersReduced = useReducedMotion();
  const clamped = Math.min(Math.max(budgetUsedPercent, 0), 120);
  const [activeStone, setActiveStone] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Pause animations when the browser tab is hidden to save battery
  const [isPageVisible, setIsPageVisible] = useState(true);
  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const fmt = useCallback(
    (n: number) => (formatCurrency ? formatCurrency(n) : `₹${n.toLocaleString()}`),
    [formatCurrency],
  );

  /* ── Water geometry ── */
  const waterHeight = 14 + (clamped / 100) * 90;
  const waveY = VB_H - waterHeight;
  const baseOpacity = 0.12 + (clamped / 100) * 0.2;

  /* ── Smooth color intensity (layered overlay approach) ── */
  const warningIntensity = clamped > 50 ? Math.min((clamped - 50) / 35, 1) : 0;
  const dangerIntensity = clamped > 80 ? Math.min((clamped - 80) / 30, 1) : 0;

  /* ── Budget horizon line Y position (100% mark) ── */
  const budgetHorizonY = VB_H - (14 + 90);

  /* ── Today marker — only meaningful when viewing the actual current month ── */
  const today = useMemo(() => {
    const now = new Date();
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    return isCurrentMonth ? now.getDate() : -1;
  }, [month, year]);

  /* ── Daily budget baseline Y (mapped into same weight-space as stones) ── */
  const baselineY = useMemo(() => {
    if (!dailyBudgetPace || dailyBudgetPace <= 0) return null;
    const maxVal = Math.max(...dailyValues.filter((v) => v > 0), 1);
    if (maxVal <= 0) return null;
    const weight = Math.log2(dailyBudgetPace + 1) / Math.log2(maxVal + 1);
    const clampedWeight = Math.min(Math.max(weight, 0), 1);
    return waveY + clampedWeight * 50;
  }, [dailyBudgetPace, dailyValues, waveY]);

  /* ── Expense stones ── */
  const stones = useMemo(() => {
    const span = VB_W - PAD_X * 2;
    const maxVal = Math.max(...dailyValues.filter((v) => v > 0), 1);
    return dailyValues
      .map((v, i) => {
        const weight = v > 0 ? Math.log2(v + 1) / Math.log2(maxVal + 1) : 0;
        return {
          day: i + 1,
          value: v,
          x: (i / Math.max(daysInMonth - 1, 1)) * span + PAD_X,
          isToday: i + 1 === today,
          weight,
          isAnomaly: anomalyDays?.has(i + 1) ?? false,
        };
      })
      .filter((s) => s.value > 0);
  }, [dailyValues, daysInMonth, today, anomalyDays]);

  /* ── 2 wave layers (back + front — extended beyond edges for seamless animation) ── */
  const wavePaths = useMemo(() => {
    const y = waveY;
    // Extend paths from -80 to 440 so the shift animation never exposes edges
    return [
      {
        d: `M-80,${y + 6} C-30,${y + 2} 20,${y + 8} 80,${y + 4} S160,${y + 9} 220,${y + 2} S280,${y + 6} 340,${y + 5} S400,${y + 3} 440,${y + 7} V${VB_H} H-80Z`,
        speed: 16,
        opacity: 0.35,
        shift: [-40, 30],
      },
      {
        d: `M-80,${y} C-40,${y - 3} 0,${y + 4} 50,${y - 1} S130,${y + 5} 190,${y - 2} S260,${y + 2} 320,${y + 1} S390,${y - 1} 440,${y + 3} V${VB_H} H-80Z`,
        speed: 9,
        opacity: 0.7,
        shift: [-30, 40],
      },
    ];
  }, [waveY]);

  /* ── Terrain ridges (static background) ── */
  const ridges = useMemo(() => {
    const y = waveY;
    return [
      `M0,${y + 12} Q60,${y} 120,${y + 7} Q180,${y - 2} 240,${y + 10} Q300,${y + 2} 360,${y + 8} V${VB_H} H0Z`,
      `M0,${y + 16} Q45,${y + 6} 90,${y + 12} Q135,${y + 3} 180,${y + 14} Q225,${y + 5} 270,${y + 10} Q315,${y + 8} 360,${y + 12} V${VB_H} H0Z`,
    ];
  }, [waveY]);

  /* ── Gauge marks (right edge) at 50%, 75%, 100% ── */
  const gaugeMarks = useMemo(() => {
    return [50, 75, 100].map((pct) => {
      const h = 14 + (pct / 100) * 90;
      return { pct, y: VB_H - h };
    });
  }, []);

  /* ── Week bands (alternating subtle background) ── */
  const weekBands = useMemo(() => {
    const span = VB_W - PAD_X * 2;
    const dayWidth = span / Math.max(daysInMonth - 1, 1);
    const bands: { x: number; w: number; week: number }[] = [];
    let weekStart = 0;
    for (let d = 0; d < daysInMonth; d++) {
      if (d > 0 && d % 7 === 0) {
        const x = PAD_X + weekStart * dayWidth - dayWidth * 0.5;
        const w = (d - weekStart) * dayWidth;
        bands.push({ x, w, week: Math.floor(weekStart / 7) });
        weekStart = d;
      }
    }
    const x = PAD_X + weekStart * dayWidth - dayWidth * 0.5;
    const w = (daysInMonth - weekStart) * dayWidth + dayWidth * 0.5;
    bands.push({ x, w, week: Math.floor(weekStart / 7) });
    return bands;
  }, [daysInMonth]);

  /* ── Stone color: sage → moss → clay by weight, accent for anomalies ── */
  const stoneColor = useCallback(
    (weight: number, isAnomaly: boolean) => {
      if (isAnomaly) return "var(--accent)";
      if (weight < 0.4) return "var(--secondary)";
      if (weight < 0.7) return "var(--primary)";
      return "var(--accent-deep)";
    },
    [],
  );

  const handleStoneEnter = useCallback((day: number) => {
    setActiveStone(day);
  }, []);

  const handleStoneLeave = useCallback(() => {
    setActiveStone(null);
  }, []);

  const handleKeyDown = useStoneKeyNav(stones, activeStone, setActiveStone);

  /* ═══════════════════════════════════════════════════════
     Reduced-motion fallback — static gradient bar + stones
     ═══════════════════════════════════════════════════════ */
  if (prefersReduced) {
    const barColor =
      dangerIntensity > 0
        ? "var(--danger)"
        : warningIntensity > 0
          ? "var(--accent)"
          : "var(--primary)";
    return (
      <div
        className={className}
        style={{ position: "relative", height: 12, borderRadius: 6 }}
        role="img"
        aria-label={`Spending stream: ${Math.round(clamped)}% of budget used`}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 6,
            background: `linear-gradient(90deg, var(--primary) 0%, ${barColor} 50%, var(--primary) 100%)`,
            opacity: baseOpacity + 0.2,
          }}
        />
        <svg
          viewBox={`0 0 ${VB_W} 12`}
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          {stones.map((s) => (
            <circle
              key={s.day}
              cx={s.x}
              cy={6}
              r={Math.min(1.5 + Math.log2(s.value + 1) * 0.5, 3.5)}
              fill={stoneColor(s.weight, s.isAnomaly)}
              opacity={s.isToday ? 0.5 : 0.35}
            />
          ))}
        </svg>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     Full visualization — layered terrain-water scene
     ═══════════════════════════════════════════════════ */
  const dailyBudget = effectiveBudget > 0 ? effectiveBudget / daysInMonth : 0;

  return (
    <div
      className={className}
      style={{ position: "relative" }}
      role="img"
      aria-label={`Spending stream: ${Math.round(clamped)}% of budget used${activeStone ? `. Day ${activeStone} selected` : ". Use arrow keys to explore daily spending"}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsHovering(true)}
      onBlur={() => setIsHovering(false)}
    >
      {/* Active stone tooltip — HTML above SVG, never clipped */}
      {activeStone !== null && (() => {
        const stone = stones.find((s) => s.day === activeStone);
        if (!stone) return null;
        const leftPct = (stone.x / VB_W) * 100;
        const pctOfDaily = dailyBudget > 0 ? Math.round((stone.value / dailyBudget) * 100) : null;
        // Clamp tooltip so it doesn't overflow left/right edges
        // Anchor tooltip transform based on position: left-align near left edge, right-align near right edge
        const translateX = leftPct < 15 ? "0%" : leftPct > 85 ? "-100%" : "-50%";
        return (
          <div
            style={{
              position: "absolute",
              top: -6,
              left: `${leftPct}%`,
              transform: `translate(${translateX}, -100%)`,
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <div
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              <div>Day {stone.day}: {fmt(stone.value)}</div>
              {pctOfDaily !== null && (
                <div
                  style={{
                    fontSize: 10,
                    color: pctOfDaily > 100 ? "var(--accent)" : "var(--text-muted)",
                    marginTop: 1,
                  }}
                >
                  {pctOfDaily}% of daily budget
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Gauge labels as HTML — shown only on hover/focus to fix WCAG AA 9px contrast ── */}
      {gaugeMarks.map((g) => (
        <div
          key={g.pct}
          style={{
            position: "absolute",
            right: 4,
            top: `${(g.y / VB_H) * 100}%`,
            transform: "translateY(-50%)",
            fontSize: 9,
            lineHeight: 1,
            color: "var(--text-muted)",
            opacity: isHovering ? 0.8 : 0,
            transition: "opacity 0.2s ease",
            pointerEvents: "none",
            userSelect: "none",
            fontVariantNumeric: "tabular-nums",
          }}
          aria-hidden="true"
        >
          {g.pct}%
        </div>
      ))}

      <div style={{ overflow: "hidden", height: VB_H }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          {/* Base water gradient — simplified 2-tone */}
          <linearGradient id="ss-base" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={baseOpacity * 0.8} />
            <stop offset="50%" stopColor="var(--secondary)" stopOpacity={baseOpacity} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={baseOpacity * 0.8} />
          </linearGradient>

          {/* Warning overlay (clay) — fades in above 50% */}
          <linearGradient id="ss-warn" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0} />
            <stop offset="30%" stopColor="var(--accent)" stopOpacity={warningIntensity * 0.25} />
            <stop offset="70%" stopColor="var(--accent)" stopOpacity={warningIntensity * 0.25} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>

          {/* Danger overlay (ember) — fades in above 80% */}
          <linearGradient id="ss-danger" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--danger)" stopOpacity={0} />
            <stop offset="40%" stopColor="var(--danger)" stopOpacity={dangerIntensity * 0.3} />
            <stop offset="60%" stopColor="var(--danger)" stopOpacity={dangerIntensity * 0.3} />
            <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
          </linearGradient>

          {/* Vertical depth tint */}
          <linearGradient id="ss-depth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.02} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={baseOpacity * 0.4} />
          </linearGradient>

          {/* Top-edge fade mask */}
          <linearGradient id="ss-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity={0} />
            <stop offset="12%" stopColor="white" stopOpacity={1} />
            <stop offset="100%" stopColor="white" stopOpacity={1} />
          </linearGradient>
          <mask id="ss-mask">
            <rect width={VB_W} height={VB_H} fill="url(#ss-fade)" />
          </mask>

          {/* Stone drop-shadow */}
          <filter id="ss-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" floodOpacity="0.25" />
          </filter>

          {/* Anomaly glow */}
          <filter id="ss-anomaly-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g mask="url(#ss-mask)">
          {/* ── Week bands (subtle alternating background) ── */}
          {weekBands.map((band) => (
            band.week % 2 === 1 ? (
              <rect
                key={band.week}
                x={band.x}
                y={0}
                width={band.w}
                height={VB_H}
                fill="var(--primary)"
                opacity={0.03}
              />
            ) : null
          ))}

          {/* ── Terrain ridges (static background hills) ── */}
          <path d={ridges[0]} fill="var(--primary)" opacity={0.06} />
          <path d={ridges[1]} fill="var(--primary)" opacity={0.10} />

          {/* ── Depth fill beneath waterline ── */}
          <rect
            x={0}
            y={waveY + 10}
            width={VB_W}
            height={VB_H - waveY - 10}
            fill="url(#ss-depth)"
          />

          {/* ── Budget horizon line (dashed, at 100% mark) ── */}
          <line
            x1={PAD_X}
            x2={VB_W - PAD_X}
            y1={budgetHorizonY}
            y2={budgetHorizonY}
            stroke="var(--danger)"
            strokeWidth={0.5}
            strokeDasharray="4 3"
            opacity={0.35}
          />

          {/* ── Daily budget baseline (calm dashed line) ── */}
          {baselineY !== null && (
            <line
              x1={PAD_X}
              x2={VB_W - PAD_X}
              y1={baselineY}
              y2={baselineY}
              stroke="var(--secondary)"
              strokeWidth={0.8}
              strokeDasharray="6 4"
              opacity={0.5}
            />
          )}

          {/* ── Right-edge gauge tick marks only (labels rendered as HTML) ── */}
          {gaugeMarks.map((g) => (
            <line
              key={g.pct}
              x1={VB_W - 6}
              x2={VB_W}
              y1={g.y}
              y2={g.y}
              stroke="var(--text-muted)"
              strokeWidth={0.5}
              opacity={0.4}
            />
          ))}

          {/* ── 2 wave layers (back + front) ── */}
          {wavePaths.map((w, i) => (
            <m.path
              key={`wave-${i}`}
              d={w.d}
              fill="url(#ss-base)"
              opacity={w.opacity}
              animate={{ x: [w.shift[0], w.shift[1], w.shift[0]] }}
              transition={{ duration: w.speed, ease: "linear", repeat: isPageVisible ? Infinity : 0 }}
            />
          ))}

          {/* ── Color overlays (clay / ember) ── */}
          {warningIntensity > 0 && (
            <m.path
              d={wavePaths[0].d}
              fill="url(#ss-warn)"
              animate={{
                x: [wavePaths[0].shift[0], wavePaths[0].shift[1], wavePaths[0].shift[0]],
              }}
              transition={{
                duration: wavePaths[0].speed,
                ease: "linear",
                repeat: isPageVisible ? Infinity : 0,
              }}
            />
          )}
          {dangerIntensity > 0 && (
            <m.path
              d={wavePaths[1].d}
              fill="url(#ss-danger)"
              animate={{
                x: [wavePaths[1].shift[0], wavePaths[1].shift[1], wavePaths[1].shift[0]],
              }}
              transition={{
                duration: wavePaths[1].speed,
                ease: "linear",
                repeat: isPageVisible ? Infinity : 0,
              }}
            />
          )}

          {/* ── Expense stones (weight-positioned, drifting) ── */}
          {stones.map((stone) => {
            const r = Math.min(1.5 + Math.log2(stone.value + 1) * 0.7, 5);
            const rx = r * 0.65;
            const ry = r;
            const isActive = activeStone === stone.day;
            const stoneY = waveY + stone.weight * 50;
            const bobAmp = 1.2 - stone.weight * 0.8;
            const bobDuration = 3 + (stone.day % 4) * 0.8;
            const driftAmp = 1 - stone.weight * 0.5;
            const fill = stoneColor(stone.weight, stone.isAnomaly);
            return (
              <m.g
                key={stone.day}
                style={{ cursor: "pointer" }}
                onPointerEnter={() => handleStoneEnter(stone.day)}
                onPointerLeave={handleStoneLeave}
                animate={{
                  x: [0, driftAmp, -driftAmp * 0.6, 0],
                  y: [0, -bobAmp, bobAmp * 0.4, 0],
                }}
                transition={{
                  duration: bobDuration,
                  ease: "easeInOut",
                  repeat: isPageVisible ? Infinity : 0,
                  delay: (stone.day % 7) * 0.3,
                }}
              >
                {/* Today glow pulse */}
                {stone.isToday && (
                  <m.circle
                    cx={stone.x}
                    cy={stoneY}
                    r={r + 3}
                    fill="var(--accent)"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.08, 0.3] }}
                    transition={{
                      duration: 2.5,
                      ease: "easeInOut",
                      repeat: isPageVisible ? Infinity : 0,
                    }}
                  />
                )}

                {/* Anomaly glow ring */}
                {stone.isAnomaly && !stone.isToday && (
                  <ellipse
                    cx={stone.x}
                    cy={stoneY}
                    rx={rx + 3}
                    ry={ry + 3}
                    fill="var(--accent)"
                    opacity={0.15}
                    filter="url(#ss-anomaly-glow)"
                  />
                )}

                {/* Stone body — ellipse pebble with lift on hover */}
                <m.ellipse
                  cx={stone.x}
                  cy={stoneY}
                  rx={rx}
                  ry={ry}
                  fill={fill}
                  opacity={isActive ? 0.55 : 0.38}
                  filter="url(#ss-shadow)"
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </m.g>
            );
          })}

          {/* ── Forecast end marker ── */}
        </g>
      </svg>
      </div>

    </div>
  );
}
