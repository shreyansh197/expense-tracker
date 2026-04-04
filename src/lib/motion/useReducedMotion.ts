/**
 * Reduced-motion awareness hook and variant factory.
 * Wraps framer-motion's useReducedMotion to provide a consistent API
 * and a helper that neutralises variants for users who prefer reduced motion.
 */

"use client";

import { useReducedMotion as useFMReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

/**
 * Returns `true` when the user's OS has "reduce motion" enabled.
 * Safe to call in SSR (returns `false`).
 */
export function useReducedMotion(): boolean {
  return useFMReducedMotion() ?? false;
}

/**
 * Given a Variants object, return a motion-safe version:
 * - Normal: returns the original variants as-is.
 * - Reduced: initial is `false` (no mount animation), animate is empty,
 *   exit is opacity-only (no movement/scale).
 */
export function safeVariants(v: Variants, reduced: boolean): Variants {
  if (!reduced) return v;
  return {
    initial: { opacity: 1 },
    animate: {},
    exit: { opacity: 0, transition: { duration: 0.01 } },
  };
}
