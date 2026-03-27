"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg",
        className
      )}
      style={{ background: 'var(--surface-secondary)', ...style }}
    />
  );
}

export function SkeletonKpiCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="card-sm p-4"
        >
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="mb-2 h-7 w-24" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  const heights = [45, 70, 35, 80, 55, 65, 40, 75];
  return (
    <div className="card p-5">
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="flex items-end justify-between gap-1 h-[220px] pt-4">
        {heights.map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonExpenseList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, g) => (
        <div key={g}>
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-24 flex-1" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCategoryDetail() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="card-sm p-4"
          >
            <Skeleton className="mb-2 h-3 w-14" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <SkeletonChart />
    </div>
  );
}
