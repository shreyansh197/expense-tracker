"use client";

import { useRef, useCallback } from "react";

export type SwipeDirection = "left" | "right" | "up" | "down";

interface SwipeConfig {
  /** Minimum distance (px) to trigger a swipe. Default: 50 */
  threshold?: number;
  /** Minimum velocity (px/ms) to trigger a swipe. Default: 0.3 */
  velocityThreshold?: number;
  /** Lock to horizontal or vertical axis after initial movement. Default: true */
  directionLock?: boolean;
  /** Called when a qualifying swipe completes */
  onSwipe: (direction: SwipeDirection, velocity: number) => void;
  /** Called continuously during swipe with delta */
  onSwiping?: (deltaX: number, deltaY: number) => void;
  /** Called when touch ends (regardless of whether swipe triggered) */
  onSwipeEnd?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  locked: "horizontal" | "vertical" | null;
}

export function useSwipeGesture(config: SwipeConfig) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    directionLock = true,
    onSwipe,
    onSwiping,
    onSwipeEnd,
  } = config;

  const touchRef = useRef<TouchState | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      locked: null,
    };
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const state = touchRef.current;
      if (!state) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;

      // Direction lock after 10px movement
      if (directionLock && !state.locked) {
        const absDx = Math.abs(deltaX);
        const absDy = Math.abs(deltaY);
        if (absDx > 10 || absDy > 10) {
          state.locked = absDx > absDy ? "horizontal" : "vertical";
        }
      }

      onSwiping?.(deltaX, deltaY);
    },
    [directionLock, onSwiping]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const state = touchRef.current;
      if (!state) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const elapsed = Date.now() - state.startTime;
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / Math.max(elapsed, 1);

      touchRef.current = null;
      onSwipeEnd?.();

      const absDx = Math.abs(deltaX);
      const absDy = Math.abs(deltaY);

      // Check direction lock
      if (directionLock && state.locked === "vertical" && absDx < absDy) return;
      if (directionLock && state.locked === "horizontal" && absDy < absDx) return;

      const meetsThreshold = absDx >= threshold || absDy >= threshold;
      const meetsVelocity = velocity >= velocityThreshold;

      if (!meetsThreshold && !meetsVelocity) return;

      let direction: SwipeDirection;
      if (absDx > absDy) {
        direction = deltaX > 0 ? "right" : "left";
      } else {
        direction = deltaY > 0 ? "down" : "up";
      }

      onSwipe(direction, velocity);
    },
    [threshold, velocityThreshold, directionLock, onSwipe, onSwipeEnd]
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}
