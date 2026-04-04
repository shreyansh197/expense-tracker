"use client";

import { m } from "framer-motion";
import { duration, ease, distance } from "@/lib/motion/tokens";
import type { ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  /** Delay before the reveal starts (seconds). Default 0 */
  delay?: number;
}

export function RevealOnScroll({ children, className, delay = 0 }: RevealOnScrollProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: distance.md }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: duration.emphasis, ease: [...ease.out], delay }}
    >
      {children}
    </m.div>
  );
}
