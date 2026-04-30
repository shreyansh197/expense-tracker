"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import type { FingerprintAxes } from "@/lib/fingerprint";
import { AXIS_LABELS } from "@/lib/fingerprint";

interface FingerprintBlobProps {
  axes: FingerprintAxes;
  /** Accent color for the blob fill/stroke */
  color?: string;
  size?: number;
}

const AXIS_KEYS: (keyof FingerprintAxes)[] = [
  "automation",
  "focus",
  "weekendEnergy",
  "frontLoading",
  "frequency",
  "volatility",
  "diversification",
  "ticketSize",
];

const MIN_RADIUS = 0.2; // minimum radius so blob always has visible shape
const TWO_PI = Math.PI * 2;

/**
 * Compute Catmull-Rom → cubic Bézier path for smooth closed curve through points.
 */
function catmullRomToBezierPath(points: [number, number][], tension = 0.3): string {
  const n = points.length;
  if (n < 3) return "";

  let d = `M ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }

  return d + " Z";
}

export function FingerprintBlob({ axes, color = "var(--accent)", size = 180 }: FingerprintBlobProps) {
  const center = size / 2;
  const maxRadius = (size / 2) * 0.72; // leave room for labels

  const { path, points } = useMemo(() => {
    const values = AXIS_KEYS.map((key) => axes[key]);
    const pts: [number, number][] = values.map((val, i) => {
      const angle = (i / AXIS_KEYS.length) * TWO_PI - Math.PI / 2; // start at top
      const r = (MIN_RADIUS + val * (1 - MIN_RADIUS)) * maxRadius;
      return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    });
    return { path: catmullRomToBezierPath(pts), points: pts };
  }, [axes, center, maxRadius]);

  // Grid circles at 33%, 66%, 100%
  const gridRadii = [0.33, 0.66, 1.0].map((f) => f * maxRadius);

  // Label positions (slightly outside max radius)
  const labelRadius = maxRadius + 16;
  const labels = AXIS_KEYS.map((key, i) => {
    const angle = (i / AXIS_KEYS.length) * TWO_PI - Math.PI / 2;
    return {
      key,
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
      label: AXIS_LABELS[key],
    };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      className="mx-auto max-w-[200px] overflow-visible"
      role="img"
      aria-label="Financial fingerprint — a radial visualization of your spending behavior across 8 dimensions"
    >
      {/* Grid circles */}
      {gridRadii.map((r, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="2 3"
          opacity={0.5}
        />
      ))}

      {/* Axis lines */}
      {AXIS_KEYS.map((_, i) => {
        const angle = (i / AXIS_KEYS.length) * TWO_PI - Math.PI / 2;
        const x2 = center + maxRadius * Math.cos(angle);
        const y2 = center + maxRadius * Math.sin(angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x2}
            y2={y2}
            stroke="var(--border)"
            strokeWidth={0.5}
            opacity={0.3}
          />
        );
      })}

      {/* The blob */}
      <m.path
        d={path}
        fill={`color-mix(in srgb, ${color} 18%, transparent)`}
        stroke={color}
        strokeWidth={1.5}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />

      {/* Data points */}
      {points.map(([x, y], i) => (
        <m.circle
          key={i}
          cx={x}
          cy={y}
          r={3}
          fill={color}
          initial={{ opacity: 0, r: 0 }}
          animate={{ opacity: 0.9, r: 3 }}
          transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
        />
      ))}

      {/* Axis labels */}
      {labels.map(({ key, x, y, label }) => (
        <text
          key={key}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--text-muted)] text-[7px] font-medium"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
