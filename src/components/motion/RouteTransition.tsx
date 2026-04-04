"use client";

import { m, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { pageTransition } from "@/lib/motion";

/**
 * Wraps page content in AnimatePresence for smooth route crossfade.
 * Keys by pathname so entering/exiting pages animate independently.
 * Uses `mode="wait"` so the exit completes before enter begins.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
