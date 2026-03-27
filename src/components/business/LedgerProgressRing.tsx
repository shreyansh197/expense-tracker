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
      : "text-slate-300 dark:text-slate-600";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-700 dark:text-slate-300">
        {Math.round(percent)}%
      </span>
    </div>
  );
}
