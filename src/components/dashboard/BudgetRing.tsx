"use client";

import { useEffect, useRef } from "react";
import { m, useMotionValue, useTransform, animate } from "framer-motion";

interface BudgetRingProps {
  /** 0–100+ (can exceed 100 when over budget) */
  budgetUsedPercent: number;
  hasBudget: boolean;
  /** Amount to show in the center (remaining or spent) */
  centerLabel: string;
  /** Sub-label below center number */
  subLabel?: string;
  size?: number;
}

const RADIUS = 34;
const STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ringColor(pct: number, hasBudget: boolean): string {
  if (!hasBudget) return "var(--accent)";
  if (pct >= 100) return "var(--danger)";
  if (pct >= 80) return "var(--warning)";
  return "var(--accent)";
}

export function BudgetRing({
  budgetUsedPercent,
  hasBudget,
  centerLabel,
  subLabel,
  size = 88,
}: BudgetRingProps) {
  const progress = useMotionValue(0);
  const dashOffset = useTransform(
    progress,
    (v) => CIRCUMFERENCE - (Math.min(v, 100) / 100) * CIRCUMFERENCE
  );

  const prevPct = useRef(0);

  useEffect(() => {
    const controls = animate(prevPct.current, budgetUsedPercent, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => progress.set(v),
    });
    prevPct.current = budgetUsedPercent;
    return controls.stop;
  }, [budgetUsedPercent, progress]);

  const color = ringColor(budgetUsedPercent, hasBudget);
  const viewBox = size;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="relative flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* 75% danger marker */}
        {hasBudget && (
          <circle
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth={1}
            strokeDasharray={`1 ${CIRCUMFERENCE - 1}`}
            strokeDashoffset={-(0.75 * CIRCUMFERENCE - CIRCUMFERENCE)}
            opacity={0.35}
          />
        )}

        {/* Progress arc */}
        <m.circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>

      {/* Center labels */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
        style={{ transform: "none" }}
      >
        <span
          className="font-display text-[11px] font-bold leading-none font-numeric text-center px-1 truncate max-w-full"
          style={{ color: "var(--text-primary)" }}
        >
          {centerLabel}
        </span>
        {subLabel && (
          <span
            className="text-[8px] leading-none font-medium tracking-wide uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}
