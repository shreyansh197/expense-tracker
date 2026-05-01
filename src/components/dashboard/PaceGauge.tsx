"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, animate, useTransform, m } from "framer-motion";

interface PaceGaugeProps {
  /** User's actual average daily spend this month */
  avgDaily: number;
  /** Target daily spend to stay under budget */
  paceToStayUnder: number;
  /** Whether a budget is set */
  hasBudget: boolean;
  size?: number;
}

// SVG half-circle geometry
const W = 88;
const H = 52; // viewBox height — just the top half + needle room
const CX = W / 2;
const CY = 48; // arc center — pushed down so needle sweeps within viewBox
const R = 34;
const STROKE = 7;

// Arc goes from 210° to 330° (150° sweep, centered at top)
const START_DEG = 210;
const END_DEG = 330;
const SWEEP = END_DEG - START_DEG; // 120°

function degToRad(d: number) { return (d * Math.PI) / 180; }

function arcPoint(deg: number): [number, number] {
  return [
    CX + R * Math.cos(degToRad(deg)),
    CY + R * Math.sin(degToRad(deg)),
  ];
}

// Build SVG arc path for a segment from startDeg to endDeg
function arcPath(startDeg: number, endDeg: number): string {
  const [sx, sy] = arcPoint(startDeg);
  const [ex, ey] = arcPoint(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey}`;
}

// Zone boundaries (fraction of sweep 0→1)
const ZONES = [
  { from: 0,    to: 0.45, color: "var(--success, #22c55e)" },
  { from: 0.45, to: 0.65, color: "var(--warning, #f59e0b)" },
  { from: 0.65, to: 1,    color: "var(--danger, #ef4444)" },
];

// Needle as a thin line from center to arc edge
function Needle({ angleDeg }: { angleDeg: number }) {
  const tipX = CX + (R - STROKE / 2 - 1) * Math.cos(degToRad(angleDeg));
  const tipY = CY + (R - STROKE / 2 - 1) * Math.sin(degToRad(angleDeg));
  const baseX = CX + 5 * Math.cos(degToRad(angleDeg + 180));
  const baseY = CY + 5 * Math.sin(degToRad(angleDeg + 180));
  return (
    <>
      <line
        x1={baseX} y1={baseY}
        x2={tipX} y2={tipY}
        stroke="var(--text-primary)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r={2.5} fill="var(--text-primary)" />
    </>
  );
}

export function PaceGauge({ avgDaily, paceToStayUnder, hasBudget, size = 88 }: PaceGaugeProps) {
  // Ratio: 0 = spending nothing, 1 = exactly on pace, >1 = over pace
  // We clamp to [0, 1.6] so the needle still shows "off the chart" without overflowing
  const ratio = hasBudget && paceToStayUnder > 0
    ? Math.min(avgDaily / paceToStayUnder, 1.6)
    : 0.5; // neutral center when no budget

  // Map ratio [0, 1.6] → sweep fraction [0, 1]
  const fraction = ratio / 1.6;

  const needleAngle = useMotionValue(START_DEG);
  const prevFraction = useRef(0);

  useEffect(() => {
    const targetDeg = START_DEG + fraction * SWEEP;
    const controls = animate(needleAngle.get(), targetDeg, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => needleAngle.set(v),
    });
    prevFraction.current = fraction;
    return controls.stop;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fraction]);

  // Reactive needle coordinates from motion value
  const needleTipX = useTransform(needleAngle, (deg) => CX + (R - STROKE / 2 - 1) * Math.cos(degToRad(deg)));
  const needleTipY = useTransform(needleAngle, (deg) => CY + (R - STROKE / 2 - 1) * Math.sin(degToRad(deg)));
  const needleBaseX = useTransform(needleAngle, (deg) => CX + 5 * Math.cos(degToRad(deg + 180)));
  const needleBaseY = useTransform(needleAngle, (deg) => CY + 5 * Math.sin(degToRad(deg + 180)));

  // Label beneath gauge
  const label = !hasBudget
    ? null
    : ratio <= 0.85
    ? { text: "under pace", color: "var(--success, #22c55e)" }
    : ratio <= 1.15
    ? { text: "on pace", color: "var(--warning, #f59e0b)" }
    : { text: "over pace", color: "var(--danger, #ef4444)" };

  const scale = size / W;

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center"
      style={{ width: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={Math.round(H * scale)}
        viewBox={`0 0 ${W} ${H}`}
      >
        {/* Track (full arc, faint) */}
        <path
          d={arcPath(START_DEG, END_DEG)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Zone segments */}
        {ZONES.map((z, i) => {
          const segStart = START_DEG + z.from * SWEEP;
          const segEnd = START_DEG + z.to * SWEEP;
          return (
            <path
              key={i}
              d={arcPath(segStart, segEnd)}
              fill="none"
              stroke={z.color}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              opacity={0.25}
            />
          );
        })}

        {/* Active zone highlight up to current position */}
        {hasBudget && (() => {
          const activeFrac = Math.min(fraction, 1);
          const activeEnd = START_DEG + activeFrac * SWEEP;
          // Pick zone color
          const zone = ZONES.findLast((z) => fraction >= z.from) ?? ZONES[0];
          return (
            <path
              d={arcPath(START_DEG, activeEnd)}
              fill="none"
              stroke={zone.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })()}

        {/* Needle */}
        <m.line
          x1={needleBaseX}
          y1={needleBaseY}
          x2={needleTipX}
          y2={needleTipY}
          stroke="var(--text-primary)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={2.5} fill="var(--text-primary)" />

        {/* Min / Max tick labels */}
        {hasBudget && (
          <>
            <text x={arcPoint(START_DEG)[0] - 2} y={arcPoint(START_DEG)[1] + 8} fontSize="6" fill="var(--text-muted)" textAnchor="middle">0</text>
            <text x={arcPoint(END_DEG)[0] + 2} y={arcPoint(END_DEG)[1] + 8} fontSize="6" fill="var(--text-muted)" textAnchor="middle">2×</text>
          </>
        )}
      </svg>

      {/* Status label */}
      {label && (
        <span
          className="text-[9px] font-semibold uppercase tracking-wide leading-none -mt-1"
          style={{ color: label.color }}
        >
          {label.text}
        </span>
      )}
    </div>
  );
}
