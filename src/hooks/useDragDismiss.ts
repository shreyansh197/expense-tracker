"use client";

import { useRef, useCallback, useState } from "react";

interface DragDismissConfig {
  /** Direction the sheet can be dragged toward. Default: "down" */
  direction?: "down" | "up";
  /** Distance (px) to trigger dismissal. Default: 120 */
  dismissThreshold?: number;
  /** Called when drag crosses the dismiss threshold and touch ends */
  onDismiss: () => void;
}

interface DragState {
  startY: number;
  currentY: number;
  isDragging: boolean;
}

export function useDragDismiss(config: DragDismissConfig) {
  const { direction = "down", dismissThreshold = 120, onDismiss } = config;
  const dragRef = useRef<DragState | null>(null);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Don't capture drags on scrollable children that aren't at scroll top
    const scrollParent = target.closest("[data-sheet-scroll]");
    if (scrollParent && scrollParent.scrollTop > 0) return;

    dragRef.current = {
      startY: e.touches[0].clientY,
      currentY: e.touches[0].clientY,
      isDragging: false,
    };
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const state = dragRef.current;
      if (!state) return;

      state.currentY = e.touches[0].clientY;
      const delta = state.currentY - state.startY;

      // Only allow dragging in the configured direction
      const isValidDirection = direction === "down" ? delta > 0 : delta < 0;

      if (!state.isDragging && Math.abs(delta) > 8) {
        state.isDragging = isValidDirection;
        if (isValidDirection) setIsDragging(true);
      }

      if (state.isDragging) {
        // Rubber-band effect: offset decelerates as you drag farther
        const raw = Math.abs(delta);
        const dampened = raw < dismissThreshold ? raw : dismissThreshold + (raw - dismissThreshold) * 0.3;
        setOffset(direction === "down" ? dampened : -dampened);
      }
    },
    [direction, dismissThreshold]
  );

  const onTouchEnd = useCallback(() => {
    const state = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);

    if (!state?.isDragging) {
      setOffset(0);
      return;
    }

    const delta = Math.abs(state.currentY - state.startY);

    if (delta >= dismissThreshold) {
      onDismiss();
    }

    setOffset(0);
  }, [dismissThreshold, onDismiss]);

  return {
    /** Spread on the draggable element */
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    /** Current Y offset (px) to apply as transform */
    offset,
    /** Whether a drag is actively in progress */
    isDragging,
  };
}
