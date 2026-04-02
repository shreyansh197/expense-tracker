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
        "relative overflow-hidden rounded-lg",
        className
      )}
      style={{ background: 'var(--surface-secondary)', ...style }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--surface-hover) 50%, transparent 100%)',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export function SkeletonKpiCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3" role="status" aria-busy="true" aria-label="Loading budget overview">
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
    <div className="card p-5" role="status" aria-busy="true" aria-label="Loading chart">
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
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading expenses">
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
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading category details">
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

export function SkeletonBusinessKpi() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="status" aria-busy="true" aria-label="Loading business overview">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card-sm p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLedgerList() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="status" aria-busy="true" aria-label="Loading ledgers">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1.5 h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonLedgerDetail() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading ledger details">
      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-1.5 h-3 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
      </div>
      {/* Payments card */}
      <div className="card p-5">
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
