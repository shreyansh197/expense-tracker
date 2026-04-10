/**
 * Shared Framer Motion variant objects — import these instead of inline objects.
 * All values derived from tokens.ts for consistency.
 */

import { duration, ease, stagger, distance, spring, scale } from "./tokens";
import type { Variants } from "framer-motion";

// ── Fade + slide up (default entrance) ──

export const fadeUp: Variants = {
  initial: { opacity: 0, y: distance.md },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.emphasis, ease: ease.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.exit },
  },
};

export const fadeUpSmall: Variants = {
  initial: { opacity: 0, y: distance.sm },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.exit },
  },
};

// ── Fade only (no movement) ──

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.exit },
  },
};

// ── Scale in (modals, overlays) ──

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: scale.modalEnter },
  animate: {
    opacity: 1,
    scale: 1,
    transition: spring.default,
  },
  exit: {
    opacity: 0,
    scale: scale.modalEnter,
    transition: { duration: duration.exit, ease: "easeIn" },
  },
};

// ── Stagger containers (wrap children that use the variants above) ──

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: stagger.normal },
  },
};

export const staggerTight: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: stagger.tight },
  },
};

export const staggerLoose: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: stagger.loose },
  },
};

// ── List item (for expense rows, payment rows, etc.) ──

export const listItem: Variants = {
  initial: { opacity: 0, y: distance.sm },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: -distance.swipeExit,
    height: 0,
    marginBottom: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
};

// ── Modal backdrop ──

export const modalBackdrop: Variants = {
  initial: { backgroundColor: "rgba(0,0,0,0)" },
  animate: { backgroundColor: "rgba(0,0,0,0.4)" },
  exit: { backgroundColor: "rgba(0,0,0,0)", transition: { duration: duration.exit } },
};

// ── Modal content (bottom sheet / centered) ──

export const modalContent: Variants = {
  initial: { opacity: 0, y: distance.lg, scale: scale.modalEnter },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.default,
  },
  exit: {
    opacity: 0,
    y: distance.md,
    scale: scale.modalEnter,
    transition: { duration: duration.exit, ease: "easeIn" },
  },
};

// ── Page transition (route crossfade) ──

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.emphasis, ease: ease.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.exit },
  },
};

// ── Tap scale presets (for whileTap prop) ──

export const tapButton = { scale: scale.tapButton };
export const tapChip = { scale: scale.tapChip };
export const tapFab = { scale: scale.tapFab };

// ── Slide from right (drawers, panels) ──

export const slideFromRight: Variants = {
  initial: { opacity: 0, x: distance.lg },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.emphasis, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: distance.lg,
    transition: { duration: duration.exit, ease: "easeIn" },
  },
};

// ── Expand / collapse (accordion sections) ──

export const expandCollapse: Variants = {
  initial: { height: 0, opacity: 0, overflow: "hidden" },
  animate: {
    height: "auto",
    opacity: 1,
    overflow: "hidden",
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    transition: { duration: duration.exit, ease: "easeIn" },
  },
};

// ── Number tick (KPI counter pop) ──

export const numberTick: Variants = {
  initial: { opacity: 0, y: -distance.sm, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.stiff,
  },
};

// ── Success pulse (goal achievement celebration) ──

export const successPulse: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: [0.8, 1.05, 1],
    opacity: 1,
    transition: { duration: duration.emphasis, ease: ease.out },
  },
};
