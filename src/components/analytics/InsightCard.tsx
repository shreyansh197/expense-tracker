"use client";

import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Sparkline } from "@/components/ui/charts";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";

export interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
  /** Short explanation of how this metric is calculated — renders an inline ⓘ icon */
  tooltip?: string;
  sparkData?: number[];
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}

export function InsightCard({
  icon: Icon,
  title,
  value,
  subtitle,
  tooltip,
  sparkData,
  accentColor = "var(--accent)",
  onClick,
  className,
}: InsightCardProps) {
  return (
    <m.div
      className={cn(
        "card-stone flex items-start gap-3 p-4 transition-colors",
        onClick && "cursor-pointer hover:bg-[var(--surface-secondary)]",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ui-md"
        style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
      >
        <Icon size={16} style={{ color: accentColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {title}
          </p>
          {tooltip && (
            <InfoTooltip title={title} className="shrink-0">
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{tooltip}</p>
            </InfoTooltip>
          )}
        </div>
        <p className="mt-0.5 font-display text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {sparkData && sparkData.length > 2 && (
        <div className="shrink-0 w-16 h-8 self-center">
          <Sparkline data={sparkData} color={accentColor} />
        </div>
      )}
    </m.div>
  );
}
