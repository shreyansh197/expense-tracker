"use client";

import { useState, useRef } from "react";
import { m, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import type { WatcherInsight } from "@/hooks/useWatcher";

interface WatcherConstellationProps {
  insight: WatcherInsight | null;
  onDismiss: () => void;
}

/**
 * Three ambient dots in a triangle formation that live above the bottom nav.
 * When the Watcher has an insight, they pulse gently to invite attention.
 * Tapping opens an inline popover — never a modal, never an alert.
 *
 * Business routes use emerald (--biz-accent) instead of moss.
 * Reduced-motion: no breathe/pulse, static opacity only.
 */
export function WatcherConstellation({ insight, onDismiss }: WatcherConstellationProps) {
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  const pathname = usePathname();
  const isBizRoute = pathname.startsWith("/business");
  const popoverRef = useRef<HTMLDivElement>(null);

  const dotColor = isBizRoute ? "var(--biz-accent)" : "var(--es-moss)";
  const hasInsight = insight !== null;

  // Hide completely when no insight — avoid confusing idle dots
  if (!hasInsight && !open) return null;

  // Dot positions forming a small equilateral triangle
  const dots = [
    { cx: 12, cy: 4 },  // apex
    { cx: 4,  cy: 16 }, // bottom-left
    { cx: 20, cy: 16 }, // bottom-right
  ];

  const handleToggle = () => {
    if (!hasInsight) return;
    setOpen((v) => !v);
  };

  const handleDismiss = () => {
    setOpen(false);
    onDismiss();
  };

  // Close popover on outside tap
  const handleBackdropClick = () => {
    setOpen(false);
  };

  const breatheVariant: Variants = {
    animate: {
      y: [0, -2, 0],
      transition: { duration: 4, ease: "easeInOut", repeat: Infinity },
    },
  };

  const pulseVariant: Variants = {
    animate: {
      scale: [1, 1.5, 1],
      opacity: [0.3, 0.85, 0.3],
      transition: { duration: 1.4, repeat: 2, ease: "easeInOut" },
    },
  };

  const idleVariant: Variants = prefersReduced
    ? { animate: { opacity: 0.3 } }
    : breatheVariant;

  return (
    <>
      {/* Backdrop to close popover */}
      <AnimatePresence>
        {open && (
          <m.div
            key="watcher-backdrop"
            className="fixed inset-0 z-[160]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Constellation dots */}
      <m.button
        className="fixed z-[165] focus-visible:outline-none"
        style={{
          right: "1.25rem",
          bottom: `calc(56px + env(safe-area-inset-bottom, 0px) + 16px)`,
          width: 24,
          height: 20,
          touchAction: "none",
        }}
        onClick={handleToggle}
        aria-label={hasInsight ? "View Watcher insight" : "Watcher — no new insights"}
        aria-haspopup={hasInsight ? "dialog" : undefined}
        aria-expanded={open}
      >
        <m.svg
          viewBox="0 0 24 20"
          width={24}
          height={20}
          aria-hidden="true"
          variants={hasInsight ? pulseVariant : idleVariant}
          animate="animate"
        >
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r={2.5}
              fill={dotColor}
              opacity={hasInsight ? 0.85 : 0.3}
            />
          ))}
        </m.svg>
      </m.button>

      {/* Insight popover */}
      <AnimatePresence>
        {open && insight && (
          <m.div
            ref={popoverRef}
            key="watcher-popover"
            role="dialog"
            aria-label="Watcher insight"
            className="fixed z-[170] rounded-2xl px-4 py-3 shadow-lg"
            style={{
              right: "1rem",
              bottom: `calc(56px + env(safe-area-inset-bottom, 0px) + 52px)`,
              maxWidth: "260px",
              background: "var(--surface-elevated, var(--surface))",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-lg)",
            }}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {/* Watcher eyebrow */}
            <p
              className="mb-1.5 text-xs font-medium uppercase tracking-widest"
              style={{ color: dotColor, fontFamily: "var(--font-body)" }}
            >
              Watcher
            </p>

            {/* Insight text */}
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                lineHeight: 1.55,
              }}
            >
              {insight.text}
            </p>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="mt-2.5 text-xs font-medium underline-offset-2 hover:underline"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
              }}
            >
              Got it
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
