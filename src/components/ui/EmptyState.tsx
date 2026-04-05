"use client";

import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { staggerContainer, fadeUpSmall } from "@/lib/motion";
import { scale as scaleTokens } from "@/lib/motion/tokens";

interface EmptyStateProps {
  icon: LucideIcon;
  secondaryIcon?: LucideIcon;
  /** Optional SVG illustration — rendered instead of the icon container when provided */
  illustration?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    color?: "indigo" | "emerald";
  };
}

export function EmptyState({ icon: Icon, secondaryIcon: SecondaryIcon, illustration, title, description, action }: EmptyStateProps) {
  const btnColor = action?.color === "emerald"
    ? "bg-emerald-600 hover:bg-emerald-700"
    : "bg-accent hover:brightness-110";

  return (
    <m.div
      className="relative flex flex-col items-center justify-center gap-3 py-16"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >

      {illustration ? (
        <m.div variants={fadeUpSmall}>
          {illustration}
        </m.div>
      ) : (
        <m.div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--surface-secondary)' }}
          variants={fadeUpSmall}
        >
          <Icon size={28} style={{ color: 'var(--text-muted)' }} />
          {SecondaryIcon && (
            <div
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
            >
              <SecondaryIcon size={14} style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}
        </m.div>
      )}
      <m.p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }} variants={fadeUpSmall}>{title}</m.p>
      <m.p className="max-w-xs text-center text-xs" style={{ color: 'var(--text-tertiary)' }} variants={fadeUpSmall}>{description}</m.p>
      {action && (
        <m.button
          onClick={action.onClick}
          className={`mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all press-scale ${btnColor}`}
          variants={fadeUpSmall}
          whileTap={{ scale: scaleTokens.tapButton }}
        >
          {action.label}
        </m.button>
      )}
    </m.div>
  );
}
