"use client";

import { useId } from "react";
import { m, useReducedMotion } from "framer-motion";
import type { DailyTotal } from "@/types";

interface RidgeLineProps {
  /** Array of daily spending totals. Empty = renders flat baseline. */
  dailyTotals: DailyTotal[];
  /** Total days in the displayed month (used to scale x-axis). */
  maxDays: number;
  /** Filled progress 0–1 (budget used %). Controls the clip-path fill width. */
  progress: number;
  /** Visual width of the SVG (px). Defaults to 100% via viewBox. */
  width?: number;
  /** Visual height of the SVG (px). */
  height?: number;
  className?: string;
  /** "personal" uses moss/sage; "business" uses biz-accent green. */
  variant?: "personal" | "business";
}

/**
 * Converts daily spend array to a monotone cubic-bezier SVG path.
 * Returns a smooth ridge silhouette — peaks where spending was heavy,
 * valleys where it was restrained.
 */
function buildRidgePath(
  dailyTotals: DailyTotal[],
  maxDays: number,
  w: number,
  h: number,
): string {
  if (!dailyTotals.length) return `M 0 ${h} L ${w} ${h}`;

  const padding = 4;
  const maxVal = Math.max(...dailyTotals.map((d) => d.total), 1);

  // Map each day to a (x, y) coordinate
  const points = Array.from({ length: maxDays }, (_, i) => {
    const d = dailyTotals.find((t) => t.day === i + 1);
    const val = d?.total ?? 0;
    const x = (i / Math.max(maxDays - 1, 1)) * w;
    const y = h - padding - ((val / maxVal) * (h - padding * 2));
    return { x, y };
  });

  if (points.length === 0) return `M 0 ${h} L ${w} ${h}`;
  if (points.length === 1) return `M 0 ${h} L 0 ${points[0].y} L ${w} ${h}`;

  // Build smooth cubic bezier path (Catmull-Rom → cubic bezier)
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX.toFixed(2)} ${prev.y.toFixed(2)}, ${cpX.toFixed(2)} ${curr.y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }

  // Close the path to form a filled shape along the bottom
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(2)} ${h} L 0 ${h} Z`;
  return d;
}

export function RidgeLine({
  dailyTotals,
  maxDays,
  progress,
  width = 300,
  height = 40,
  className,
  variant = "personal",
}: RidgeLineProps) {
  const prefersReduced = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const gradId = `ridge-grad-${uid}`;
  const clipId = `ridge-clip-${uid}`;
  const fillColor = variant === "business" ? "var(--biz-accent)" : "var(--accent)";
  const fillColorEnd = variant === "business" ? "var(--biz-accent-soft)" : "var(--es-sage)";
  const bgColor = "var(--es-mist)";

  const ridgePath = buildRidgePath(dailyTotals, maxDays, width, height);
  const clippedWidth = Math.max(0, Math.min(progress, 1)) * width;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      aria-hidden="true"
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        {/* Gradient: fills from primary → soft variant left to right */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fillColorEnd} stopOpacity="0.7" />
        </linearGradient>

        {/* Clip rectangle that represents how far budget has been used */}
        <clipPath id={clipId}>
          <rect x="0" y="0" width={clippedWidth} height={height} />
        </clipPath>
      </defs>

      {/* Background ridge (mist — full width, unfilled portion) */}
      <path
        d={ridgePath}
        fill={bgColor}
        fillOpacity="0.4"
      />

      {/* Foreground ridge (filled portion — clipped by progress) */}
      {prefersReduced ? (
        <path
          d={ridgePath}
          fill={`url(#${gradId})`}
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <m.path
          d={ridgePath}
          fill={`url(#${gradId})`}
          clipPath={`url(#${clipId})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      )}
    </svg>
  );
}
