"use client";

import { useRef, useCallback } from "react";

interface HoldRevealConfig {
  /** Duration (ms) to hold before trigger. Default: 500 */
  holdDuration?: number;
  /** Called when hold completes */
  onHold: () => void;
  /** Called if released before hold completes */
  onRelease?: () => void;
}

export function useHoldReveal(config: HoldRevealConfig) {
  const { holdDuration = 500, onHold, onRelease } = config;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(() => {
    triggeredRef.current = false;
    clear();
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      onHold();
    }, holdDuration);
  }, [holdDuration, onHold, clear]);

  const onPointerUp = useCallback(() => {
    clear();
    if (!triggeredRef.current) {
      onRelease?.();
    }
  }, [clear, onRelease]);

  const onPointerLeave = useCallback(() => {
    clear();
  }, [clear]);

  return { onPointerDown, onPointerUp, onPointerLeave };
}
