"use client";

import { cn } from "@/lib/utils";

interface LedgerProgressRingProps {
  received: number;
  expected: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function LedgerProgressRing({
  received,
  expected,
  size = 48,
  strokeWidth = 4,
  className,
}: LedgerProgressRingProps) {
  const percent = expected > 0 ? Math.min((received / expected) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const color =
    percent >= 100
      ? "text-emerald-500"
      : percent >= 50
      ? "text-blue-500"
      : percent > 0
      ? "text-amber-500"
      : "";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={percent > 0 ? "currentColor" : "var(--text-muted)"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color || undefined}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
        {Math.round(percent)}%
      </span>
    </div>
  );
}
