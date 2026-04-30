"use client";

import { useCallback } from "react";

/**
 * Returns a wrapper that runs a callback inside a View Transition
 * (if the browser supports it), falling back to direct execution.
 */
export function useViewTransition() {
  const startTransition = useCallback((cb: () => void) => {
    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      typeof (document as any).startViewTransition === "function"
    ) {
      (document as any).startViewTransition(cb);
    } else {
      cb();
    }
  }, []);

  return startTransition;
}
