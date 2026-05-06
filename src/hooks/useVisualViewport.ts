"use client";

import { useState, useEffect } from "react";

interface VisualViewportState {
  /** Current height of the visible area (shrinks when keyboard opens) */
  height: number;
  /** How much the keyboard has pushed the viewport up from the bottom (px) */
  keyboardHeight: number;
  /** Bottom offset — how far the bottom of the visual viewport is from the layout viewport bottom */
  offsetTop: number;
}

/**
 * Tracks the Visual Viewport API to detect when the soft keyboard is open.
 *
 * On iOS Safari and Android Chrome, when the virtual keyboard opens:
 * - `window.visualViewport.height` shrinks to the area ABOVE the keyboard
 * - `window.innerHeight` stays the same (layout viewport)
 *
 * `keyboardHeight` is the difference — how much height the keyboard is eating.
 * Use this to shift fixed/full-screen overlays up so they stay above the keyboard.
 *
 * Falls back to {height: window.innerHeight, keyboardHeight: 0} when not supported.
 */
export function useVisualViewport(): VisualViewportState {
  const getState = (): VisualViewportState => {
    if (typeof window === "undefined") {
      return { height: 0, keyboardHeight: 0, offsetTop: 0 };
    }
    const vv = window.visualViewport;
    if (!vv) {
      return {
        height: window.innerHeight,
        keyboardHeight: 0,
        offsetTop: 0,
      };
    }
    const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    return {
      height: vv.height,
      keyboardHeight,
      offsetTop: vv.offsetTop,
    };
  };

  const [state, setState] = useState<VisualViewportState>(getState);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => setState(getState());
    // Only listen to "resize" — that's when the keyboard opens/closes.
    // Do NOT listen to "scroll": the visual viewport scroll event fires on
    // every page scroll (as the address bar animates in/out), which would
    // cause a state update and re-render on every scroll frame → jank.
    vv.addEventListener("resize", update);
    return () => {
      vv.removeEventListener("resize", update);
    };
  }, []);

  return state;
}
