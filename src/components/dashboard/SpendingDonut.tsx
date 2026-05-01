"use client";

import { useEffect, useRef } from "react";
import { m, useMotionValue, animate } from "framer-motion";
import type { CategoryTotal, CategoryMeta } from "@/types";

interface SpendingDonutProps {
  categoryTotals: CategoryTotal[];
  categories: CategoryMeta[];
  onCategoryClick: (slug: string) => void;
  size?: number;
}

const CX = 44;
const CY = 44;
const RADIUS = 30;
const STROKE = 9;
const C = 2 * Math.PI * RADIUS;
const GAP = 1.5;

// Animated segment using SVG path for reliable rendering
function Segment({
  fraction,
  cumulativeFraction,
  color,
  delay,
  isClickable,
  slug,
  onCategoryClick,
}: {
  fraction: number;
  cumulativeFraction: number;
  color: string;
  delay: number;
  isClickable: boolean;
  slug: string;
  onCategoryClick: (s: string) => void;
}) {
  const arcLen = useMotionValue(0);
  const prevLen = useRef(0);

  useEffect(() => {
    const target = Math.max(fraction * C - GAP, 0);
    const controls = animate(prevLen.current, target, {
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => arcLen.set(v),
    });
    prevLen.current = target;
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fraction, delay]);

  const rotateDeg = cumulativeFraction * 360 - 90;

  return (
    <m.circle
      cx={CX}
      cy={CY}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="butt"
      strokeDasharray={`${arcLen} ${C}`}
      style={{
        transformOrigin: `${CX}px ${CY}px`,
        transform: `rotate(${rotateDeg}deg)`,
        cursor: isClickable ? "pointer" : "default",
      }}
      onClick={isClickable ? () => onCategoryClick(slug) : undefined}
    />
  );
}

export function SpendingDonut({
  categoryTotals,
  categories,
  onCategoryClick,
  size = 88,
}: SpendingDonutProps) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const total = categoryTotals.reduce((s, c) => s + c.total, 0);

  // Top 3 + "other"
  const sorted = [...categoryTotals]
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const top3 = sorted.slice(0, 3);
  const otherTotal = sorted.slice(3).reduce((s, c) => s + c.total, 0);

  const segments: { slug: string; fraction: number; color: string }[] = [
    ...top3.map((c) => ({
      slug: c.category,
      fraction: c.total / total,
      color: catMap[c.category]?.color ?? "var(--accent)",
    })),
    ...(otherTotal > 0
      ? [{ slug: "", fraction: otherTotal / total, color: "var(--border)" }]
      : []),
  ];

  // Top category for center icon
  const topCat = top3[0] ? catMap[top3[0].category] : null;
  const topPct = top3[0] ? Math.round((top3[0].total / total) * 100) : 0;

  // Empty state — no expenses yet
  if (total === 0) {
    return (
      <div
        className="relative flex-shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 88 88">
          <circle
            cx={CX} cy={CY} r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE}
            strokeDasharray="4 4"
            opacity={0.5}
          />
        </svg>
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div
      className="relative flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 88 88">
        {/* Track */}
        <circle
          cx={CX} cy={CY} r={RADIUS}
          fill="none"
          stroke="color-mix(in srgb, var(--border) 60%, transparent)"
          strokeWidth={STROKE}
        />

        {/* Segments */}
        {segments.map((seg, i) => {
          const start = cumulative;
          cumulative += seg.fraction;
          return (
            <Segment
              key={seg.slug || "__other__"}
              fraction={seg.fraction}
              cumulativeFraction={start}
              color={seg.color}
              delay={i * 0.08}
              isClickable={!!seg.slug}
              slug={seg.slug}
              onCategoryClick={onCategoryClick}
            />
          );
        })}
      </svg>

      {/* Center: top category color dot + percentage */}
      {topCat && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: topCat.color }}
          />
          <span
            className="text-[10px] font-bold leading-none font-numeric"
            style={{ color: "var(--text-primary)" }}
          >
            {topPct}%
          </span>
        </div>
      )}
    </div>
  );
}
