"use client";

import { useId, type ReactNode } from "react";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { fadeUp } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

export interface AnalyticsSectionProps {
  title: string;
  icon?: LucideIcon;
  /** Plain-language explanation shown in the ⓘ tooltip. */
  info?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A titled Analytics card: a `<section>` labelled by its `<h2>`, entering with
 * the shared `fadeUp` variant (movement is dropped under reduced motion by the
 * app-level `MotionConfig`).
 */
export function AnalyticsSection({ title, icon: Icon, info, children, className }: AnalyticsSectionProps) {
  const headingId = useId();
  return (
    <m.section
      aria-labelledby={headingId}
      className={cn("card-terrain p-5", className)}
      variants={fadeUp}
      initial="initial"
      animate="animate"
    >
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon size={16} aria-hidden="true" style={{ color: "var(--accent)" }} />}
        <h2 id={headingId} className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {title}
        </h2>
        {info && <InfoTooltip title={title}>{info}</InfoTooltip>}
      </div>
      {children}
    </m.section>
  );
}
