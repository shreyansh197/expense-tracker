"use client";

import { useEffect, useState } from "react";

interface BudgetRingProps {
  /** 0–1 progress value */
  progress: number;
  /** Ring size in px */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color based on status */
  status?: "safe" | "caution" | "danger";
  /** Optional label inside the ring */
  label?: string;
  /** Whether to animate on mount */
  animate?: boolean;
}

const STATUS_COLORS = {
  safe: "var(--success)",
  caution: "var(--warning)",
  danger: "var(--danger)",
} as const;

const STATUS_TRACK_COLORS = {
  safe: "var(--success-soft)",
  caution: "var(--warning-soft)",
  danger: "var(--danger-soft)",
} as const;

/**
 * Animated circular SVG progress ring for budget visualization.
 * Used in KPI cards and goal widgets for premium feel.
 */
export function BudgetRing({
  progress,
  size = 64,
  strokeWidth = 5,
  status = "safe",
  label,
  animate = true,
}: BudgetRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(animate ? 0 : progress);

  useEffect(() => {
    if (!animate) {
      setAnimatedProgress(progress);
      return;
    }
    // Animate from 0 to target over 700ms
    const start = performance.now();
    const dur = 700;
    let raf: number;
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setAnimatedProgress(progress * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [progress, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(animatedProgress, 0), 1);
  const dashOffset = circumference * (1 - clamped);
  const color = STATUS_COLORS[status];
  const trackColor = STATUS_TRACK_COLORS[status];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: animate ? "none" : "stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      {/* Center label */}
      {label && (
        <span
          className="absolute text-amount text-xs font-semibold"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
