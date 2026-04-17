"use client";

import { RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pulling: boolean;
  pullDistance: number;
  refreshing: boolean;
  ready: boolean;
}

export function PullToRefreshIndicator({ pulling, pullDistance, refreshing, ready }: PullToRefreshIndicatorProps) {
  if (!pulling && !refreshing) return null;

  const rotation = refreshing ? undefined : Math.min(pullDistance * 3, 360);

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-50 -translate-x-1/2 lg:hidden"
      style={{
        top: `calc(env(safe-area-inset-top, 0px) + ${Math.min(pullDistance, 80)}px)`,
        opacity: Math.min(pullDistance / 40, 1),
        transition: pulling ? "none" : "all 0.3s ease",
      }}
    >
      <div
        className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-md"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Water ripple rings */}
        {(refreshing || ready) && (
          <>
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid var(--primary)",
                animation: "ripple 1.2s ease-out infinite",
              }}
            />
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid var(--primary)",
                animation: "ripple 1.2s ease-out 0.6s infinite",
              }}
            />
          </>
        )}
        <RefreshCw
          size={16}
          className={refreshing ? "animate-spin" : ""}
          style={{
            color: ready || refreshing ? "var(--primary)" : "var(--text-muted)",
            transform: refreshing ? undefined : `rotate(${rotation}deg)`,
            transition: refreshing ? undefined : "color 0.15s",
          }}
        />
      </div>
    </div>
  );
}
