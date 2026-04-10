"use client";

import { useRef, useCallback, useState, useEffect } from "react";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  /** Element to attach touch listeners to (defaults to document) */
  enabled?: boolean;
}

export function usePullToRefresh({ onRefresh, enabled = true }: UsePullToRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const startScrollTop = useRef(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || refreshing) return;
      const scrollable = (e.target as HTMLElement)?.closest("[data-pull-scroll]") as HTMLElement | null;
      const scrollTop = scrollable ? scrollable.scrollTop : window.scrollY;
      if (scrollTop > 5) return; // Only trigger at top
      startY.current = e.touches[0].clientY;
      startScrollTop.current = scrollTop;
    },
    [enabled, refreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 10) {
        const distance = Math.min(dy * 0.5, MAX_PULL);
        setPulling(true);
        setPullDistance(distance);
      }
    },
    [refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) {
      startY.current = null;
      return;
    }
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPulling(false);
    setPullDistance(0);
    startY.current = null;
  }, [pulling, pullDistance, onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    const opts: AddEventListenerOptions = { passive: true };
    document.addEventListener("touchstart", handleTouchStart, opts);
    document.addEventListener("touchmove", handleTouchMove, opts);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const ready = pullDistance >= PULL_THRESHOLD;

  return { pulling: pulling || refreshing, pullDistance, refreshing, ready };
}
