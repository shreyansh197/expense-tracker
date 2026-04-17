"use client";

import { m } from "framer-motion";
import { Sparkline } from "@/components/ui/charts/Sparkline";
import { terrainReveal } from "@/lib/motion/variants";
import type { LucideIcon } from "lucide-react";

interface NarrativeInsightProps {
  /** Prose description of the insight */
  text: string;
  /** Optional sparkline data to show inline */
  sparkData?: number[];
  /** Insight type — affects left accent color */
  type?: "tip" | "warning" | "positive" | "neutral";
  /** Optional icon */
  icon?: LucideIcon;
  className?: string;
}

const typeColors: Record<string, { accent: string; sparkColor: string }> = {
  tip: { accent: "var(--info)", sparkColor: "var(--info)" },
  warning: { accent: "var(--warning)", sparkColor: "var(--warning)" },
  positive: { accent: "var(--success)", sparkColor: "var(--success)" },
  neutral: { accent: "var(--text-tertiary)", sparkColor: "var(--primary)" },
};

export function NarrativeInsight({
  text,
  sparkData,
  type = "neutral",
  icon: Icon,
  className,
}: NarrativeInsightProps) {
  const colors = typeColors[type] ?? typeColors.neutral;

  return (
    <m.div
      className={`card-parchment p-4 ${className ?? ""}`}
      variants={terrainReveal}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-40px" }}
    >
      <div className="flex items-start gap-3">
        {/* Left accent bar */}
        <div
          className="mt-0.5 h-8 w-1 shrink-0 rounded-full"
          style={{ background: colors.accent, opacity: 0.6 }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {Icon && (
              <Icon
                size={14}
                className="mt-0.5 shrink-0"
                style={{ color: colors.accent }}
              />
            )}
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {text}
            </p>
          </div>

          {/* Inline sparkline */}
          {sparkData && sparkData.length >= 3 && (
            <div className="mt-2">
              <Sparkline
                data={sparkData}
                width={120}
                height={24}
                color={colors.sparkColor}
                strokeWidth={1.5}
              />
            </div>
          )}
        </div>
      </div>
    </m.div>
  );
}
