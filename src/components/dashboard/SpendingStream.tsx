"use client";

import { useMemo } from "react";
import { m, useReducedMotion } from "framer-motion";

/* ── Layout constants ── */
const VB_W = 360;
const VB_H = 80;
const PAD_X = 10;

interface SpendingStreamProps {
  /** 0-120 — percentage of budget used */
  budgetUsedPercent: number;
  /** Daily totals as simple numbers, one per day of month */
  dailyValues?: number[];
  /** Total days in the month */
  daysInMonth?: number;
  className?: string;
}

/**
 * Signature "Spending Stream" — a layered terrain-water visualization.
 *
 * 4 parallax wave layers · background terrain ridges · log-scaled stones
 * with ripple rings · drifting mist · rising vapor particles.
 *
 * Color blends smoothly from moss → clay → ember as budget usage climbs.
 * Respects prefers-reduced-motion with a beautiful static fallback.
 */
export function SpendingStream({
  budgetUsedPercent,
  dailyValues = [],
  daysInMonth = 30,
  className,
}: SpendingStreamProps) {
  const prefersReduced = useReducedMotion();
  const clamped = Math.min(Math.max(budgetUsedPercent, 0), 120);

  /* ── Water geometry ── */
  const waterHeight = 14 + (clamped / 100) * 40;
  const waveY = VB_H - waterHeight;
  const baseOpacity = 0.12 + (clamped / 100) * 0.2;

  /* ── Smooth color intensity (layered overlay approach) ── */
  const warningIntensity = clamped > 50 ? Math.min((clamped - 50) / 35, 1) : 0;
  const dangerIntensity = clamped > 80 ? Math.min((clamped - 80) / 30, 1) : 0;

  /* ── Today marker ── */
  const today = new Date().getDate();

  /* ── Expense stones (log-scaled sizing) ── */
  const stones = useMemo(() => {
    const span = VB_W - PAD_X * 2;
    return dailyValues
      .map((v, i) => ({
        day: i + 1,
        value: v,
        x: (i / Math.max(daysInMonth - 1, 1)) * span + PAD_X,
        isToday: i + 1 === today,
      }))
      .filter((s) => s.value > 0);
  }, [dailyValues, daysInMonth, today]);

  /* ── Top 5 stones by value get ripple rings ── */
  const topStoneSet = useMemo(() => {
    const sorted = [...stones].sort((a, b) => b.value - a.value);
    return new Set(sorted.slice(0, 5).map((s) => s.day));
  }, [stones]);

  /* ── 4 wave layers (cubic bezier, back → front) ── */
  const wavePaths = useMemo(() => {
    const y = waveY;
    return [
      {
        d: `M0,${y + 8} C40,${y + 5} 100,${y + 10} 160,${y + 6} S240,${y + 11} 310,${y + 5} S350,${y + 9} 360,${y + 7} V${VB_H} H0Z`,
        speed: 20,
        opacity: 0.3,
        shift: [-35, 35],
      },
      {
        d: `M0,${y + 4} C60,${y} 100,${y + 6} 160,${y + 2} S240,${y + 7} 300,${y} S350,${y + 4} 360,${y + 3} V${VB_H} H0Z`,
        speed: 14,
        opacity: 0.45,
        shift: [-50, 25],
      },
      {
        d: `M0,${y + 1} C50,${y + 5} 90,${y - 2} 150,${y + 4} S230,${y - 3} 290,${y + 3} S350,${y} 360,${y + 2} V${VB_H} H0Z`,
        speed: 10,
        opacity: 0.6,
        shift: [-45, 30],
      },
      {
        d: `M0,${y - 1} C30,${y - 4} 70,${y + 4} 120,${y - 2} S200,${y + 5} 260,${y - 3} S340,${y + 2} 360,${y} V${VB_H} H0Z`,
        speed: 7,
        opacity: 0.8,
        shift: [-25, 45],
      },
    ];
  }, [waveY]);

  /* ── Terrain ridges (static background hills) ── */
  const ridges = useMemo(() => {
    const y = waveY;
    return [
      `M0,${y + 12} Q60,${y} 120,${y + 7} Q180,${y - 2} 240,${y + 10} Q300,${y + 2} 360,${y + 8} V${VB_H} H0Z`,
      `M0,${y + 16} Q45,${y + 6} 90,${y + 12} Q135,${y + 3} 180,${y + 14} Q225,${y + 5} 270,${y + 10} Q315,${y + 8} 360,${y + 12} V${VB_H} H0Z`,
    ];
  }, [waveY]);

  /* ── Mist wisps ── */
  const mists = useMemo(
    () => [
      { cx: 80, cy: waveY - 4, rx: 50, ry: 3 },
      { cx: 220, cy: waveY - 6, rx: 40, ry: 2.5 },
      { cx: 320, cy: waveY - 3, rx: 35, ry: 2 },
    ],
    [waveY],
  );

  /* ── Rising vapor dots ── */
  const vapors = useMemo(
    () => [
      { cx: 55, sy: waveY, r: 1.2 },
      { cx: 125, sy: waveY + 2, r: 1 },
      { cx: 195, sy: waveY - 1, r: 1.3 },
      { cx: 275, sy: waveY + 1, r: 0.8 },
      { cx: 340, sy: waveY, r: 1.1 },
    ],
    [waveY],
  );

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
        role="presentation"
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
              r={Math.min(1 + Math.log2(s.value + 1) * 0.4, 2.5)}
              fill="var(--text-primary)"
              opacity={s.isToday ? 0.4 : 0.2}
            />
          ))}
        </svg>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     Full visualization — layered terrain-water scene
     ═══════════════════════════════════════════════════ */
  return (
    <div
      className={className}
      style={{ overflow: "hidden", height: VB_H, position: "relative" }}
      role="presentation"
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          {/* Base water gradient — moss/sage blend */}
          <linearGradient id="ss-base" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={baseOpacity * 0.7} />
            <stop offset="25%" stopColor="var(--secondary)" stopOpacity={baseOpacity * 0.9} />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity={baseOpacity} />
            <stop offset="75%" stopColor="var(--secondary)" stopOpacity={baseOpacity * 0.9} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={baseOpacity * 0.7} />
          </linearGradient>

          {/* Warning overlay (clay) — fades in above 50 % */}
          <linearGradient id="ss-warn" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0} />
            <stop offset="30%" stopColor="var(--accent)" stopOpacity={warningIntensity * 0.25} />
            <stop offset="70%" stopColor="var(--accent)" stopOpacity={warningIntensity * 0.25} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>

          {/* Danger overlay (ember) — fades in above 80 % */}
          <linearGradient id="ss-danger" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--danger)" stopOpacity={0} />
            <stop offset="40%" stopColor="var(--danger)" stopOpacity={dangerIntensity * 0.3} />
            <stop offset="60%" stopColor="var(--danger)" stopOpacity={dangerIntensity * 0.3} />
            <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
          </linearGradient>

          {/* Vertical depth tint — darker towards the bottom */}
          <linearGradient id="ss-depth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.02} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={baseOpacity * 0.4} />
          </linearGradient>

          {/* Top-edge fade mask — seamless blend into card above */}
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
            <feDropShadow dx="0" dy="0.5" stdDeviation="1" floodOpacity="0.3" />
          </filter>

          {/* Organic wave distortion (front wave only) */}
          <filter id="ss-organic" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves={1}
              seed={3}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={1.5}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <g mask="url(#ss-mask)">
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

          {/* ── 4 wave layers (back → front) ── */}
          {wavePaths.map((w, i) => (
            <m.path
              key={`wave-${i}`}
              d={w.d}
              fill="url(#ss-base)"
              opacity={w.opacity}
              animate={{ x: [w.shift[0], w.shift[1], w.shift[0]] }}
              transition={{ duration: w.speed, ease: "linear", repeat: Infinity }}
              filter={i === 3 ? "url(#ss-organic)" : undefined}
            />
          ))}

          {/* ── Color overlays (clay / ember) ── */}
          {warningIntensity > 0 && (
            <m.path
              d={wavePaths[2].d}
              fill="url(#ss-warn)"
              animate={{
                x: [wavePaths[2].shift[0], wavePaths[2].shift[1], wavePaths[2].shift[0]],
              }}
              transition={{
                duration: wavePaths[2].speed,
                ease: "linear",
                repeat: Infinity,
              }}
            />
          )}
          {dangerIntensity > 0 && (
            <m.path
              d={wavePaths[3].d}
              fill="url(#ss-danger)"
              animate={{
                x: [wavePaths[3].shift[0], wavePaths[3].shift[1], wavePaths[3].shift[0]],
              }}
              transition={{
                duration: wavePaths[3].speed,
                ease: "linear",
                repeat: Infinity,
              }}
            />
          )}

          {/* ── Expense stones + ripples ── */}
          {stones.map((stone) => {
            const r = Math.min(1.5 + Math.log2(stone.value + 1) * 0.6, 4.5);
            const hasRipple = topStoneSet.has(stone.day);
            return (
              <g key={stone.day}>
                {/* Today glow pulse (behind stone) */}
                {stone.isToday && (
                  <m.circle
                    cx={stone.x}
                    cy={waveY + 8}
                    r={r + 3}
                    fill="var(--accent)"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.08, 0.3] }}
                    transition={{
                      duration: 2.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                  />
                )}

                {/* Concentric ripple rings (top 5 stones) */}
                {hasRipple && (
                  <g transform={`translate(${stone.x}, ${waveY + 8})`}>
                    <m.circle
                      r={r + 6}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={0.5}
                      initial={{ scale: 0.4, opacity: 0.25 }}
                      animate={{ scale: 1, opacity: 0 }}
                      transition={{
                        duration: 3.5,
                        ease: "easeOut",
                        repeat: Infinity,
                        delay: (stone.day % 5) * 0.6,
                      }}
                    />
                    <m.circle
                      r={r + 12}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={0.3}
                      initial={{ scale: 0.3, opacity: 0.15 }}
                      animate={{ scale: 1, opacity: 0 }}
                      transition={{
                        duration: 4.5,
                        ease: "easeOut",
                        repeat: Infinity,
                        delay: (stone.day % 5) * 0.6 + 0.8,
                      }}
                    />
                  </g>
                )}

                {/* Stone body */}
                <circle
                  cx={stone.x}
                  cy={waveY + 8}
                  r={r}
                  fill="var(--text-primary)"
                  opacity={0.2}
                  filter="url(#ss-shadow)"
                />
              </g>
            );
          })}

          {/* ── Mist wisps (slow horizontal drift) ── */}
          {mists.map((mi, i) => (
            <m.ellipse
              key={`mist-${i}`}
              cx={mi.cx}
              cy={mi.cy}
              rx={mi.rx}
              ry={mi.ry}
              fill="var(--surface)"
              opacity={0.08}
              animate={{ cx: [mi.cx - 25, mi.cx + 25, mi.cx - 25] }}
              transition={{ duration: 16 + i * 4, ease: "linear", repeat: Infinity }}
            />
          ))}

          {/* ── Vapor particles (rising from surface) ── */}
          {vapors.map((v, i) => (
            <m.circle
              key={`vapor-${i}`}
              cx={v.cx}
              r={v.r}
              fill="var(--secondary)"
              initial={{ cy: v.sy, opacity: 0.15 }}
              animate={{ cy: v.sy - 16, opacity: 0 }}
              transition={{
                duration: 4 + i,
                ease: "easeOut",
                repeat: Infinity,
                delay: i * 1.4,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
