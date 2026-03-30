"use client";

import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AmbientBackground } from "./AmbientBackground";

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

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export function EmptyState({ icon: Icon, secondaryIcon: SecondaryIcon, illustration, title, description, action }: EmptyStateProps) {
  const btnColor = action?.color === "emerald"
    ? "bg-emerald-600 hover:bg-emerald-700"
    : "bg-[#FF8A65] hover:bg-[#FF7043] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]";

  return (
    <m.div
      className="relative flex flex-col items-center justify-center gap-3 py-16"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <AmbientBackground />

      {illustration ? (
        <m.div variants={fadeUp}>
          {illustration}
        </m.div>
      ) : (
        <m.div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--surface-secondary)', animation: 'glow-ring 3s ease-in-out infinite' }}
          variants={fadeUp}
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
      <m.p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }} variants={fadeUp}>{title}</m.p>
      <m.p className="max-w-xs text-center text-xs" style={{ color: 'var(--text-tertiary)' }} variants={fadeUp}>{description}</m.p>
      {action && (
        <m.button
          onClick={action.onClick}
          className={`btn-pulse mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all press-scale ${btnColor}`}
          variants={fadeUp}
          whileTap={{ scale: 0.96 }}
        >
          {action.label}
        </m.button>
      )}
    </m.div>
  );
}
