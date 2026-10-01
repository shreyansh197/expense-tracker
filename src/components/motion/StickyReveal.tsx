"use client";

import type { ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { fadeUpReduced, stickyReveal } from "@/lib/motion/variants";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { cn } from "@/lib/utils";

export interface StickyRevealProps {
  /** Whether the pinned content should be visible. */
  show: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Pins content to the top of the scroll container and reveals it smoothly.
 *
 * The sticky rail is zero-height, so showing or hiding the content never
 * inserts height into the document flow — the page underneath does not jump
 * (the cause of the abrupt money-spent bar on Home). Reduced motion swaps the
 * slide for a short cross-fade (DESIGN_SYSTEM §8.6).
 */
export function StickyReveal({ show, children, className }: StickyRevealProps) {
  const reducedMotion = useReducedMotion();
  return (
    <div className={cn("sticky top-0 z-[var(--z-sticky)] h-0", className)}>
      <AnimatePresence initial={false}>
        {show && (
          <m.div
            key="sticky-reveal"
            variants={reducedMotion ? fadeUpReduced : stickyReveal}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
