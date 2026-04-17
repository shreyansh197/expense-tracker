"use client";

import { useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { getAllCategories } from "@/lib/categories";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import type { EchoData } from "@/hooks/useEcho";
import { cn } from "@/lib/utils";

interface EchoCardProps {
  echo: EchoData | null;
  onDismiss: () => void;
}

/**
 * Ephemeral card that appears after an expense is logged, briefly showing
 * how this spend compares to the last time the user spent in the same category.
 *
 * Key design decisions:
 * - Auto-dismisses after 2500ms (managed by useEcho TTL)
 * - Swipe-down or tap anywhere to dismiss early
 * - Never blocks interaction (pointer-events only on the card itself)
 * - Suppressed in business mode (handled by the parent — not rendered)
 */
export function EchoCard({ echo, onDismiss }: EchoCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const allCategories = getAllCategories(
    settings.customCategories,
    settings.hiddenDefaults,
  );

  // Swipe-to-dismiss tracking
  const startY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    startY.current = null;
    if (dy > 40) onDismiss();
  };

  const getCategoryLabel = (id: string) =>
    allCategories.find((c) => c.id === id)?.label ?? id;

  const enterVariant = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring" as const, stiffness: 500, damping: 30 },
        },
      };

  const exitVariant = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.15 } };

  return (
    <AnimatePresence>
      {echo && (
        <m.div
          key="echo-card"
          variants={enterVariant}
          initial="hidden"
          animate="visible"
          exit={exitVariant}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={onDismiss}
          className={cn(
            "fixed z-[350] mx-auto cursor-pointer select-none rounded-2xl px-4 py-3 shadow-lg",
            "left-1/2 -translate-x-1/2",
          )}
          style={{
            bottom: "calc(calc(56px + env(safe-area-inset-bottom, 0px)) + 80px)",
            maxWidth: "320px",
            width: "calc(100vw - 2rem)",
            background: "var(--surface-elevated, var(--surface))",
            border: "1px solid var(--border-card)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Header */}
          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--es-moss)", fontFamily: "var(--font-body)" }}
          >
            Echo · {getCategoryLabel(echo.category)}
          </p>

          {/* Last amount */}
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="text-sm leading-none"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
            >
              {echo.daysAgo === 0
                ? "Earlier today"
                : echo.daysAgo === 1
                  ? "Yesterday"
                  : `${echo.daysAgo} days ago`}
            </span>
            <span
              className="font-medium"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-numeric)",
                fontSize: "1rem",
              }}
            >
              {formatCurrency(echo.lastAmount)}
            </span>
          </div>

          {/* Diff */}
          {echo.diff !== 0 && (
            <p
              className="mt-0.5 text-xs"
              style={{
                color:
                  echo.diff > 0
                    ? "var(--es-ember)"
                    : "var(--es-canopy)",
                fontFamily: "var(--font-numeric)",
              }}
            >
              {echo.diff > 0 ? "+" : ""}
              {formatCurrency(echo.diff)} this time
            </p>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
