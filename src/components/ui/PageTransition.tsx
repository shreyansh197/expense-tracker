"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransition } from "@/lib/motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <m.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </m.div>
  );
}
