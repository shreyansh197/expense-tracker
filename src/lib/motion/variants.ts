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
    x: -80,
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
  initial: { opacity: 0, y: 40, scale: scale.modalEnter },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.default,
  },
  exit: {
    opacity: 0,
    y: 20,
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
