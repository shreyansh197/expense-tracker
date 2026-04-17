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

// ── Breath — ambient aliveness for hero surfaces ──
// Apply to: Budget Hero card, Horizon strip, FAB (subtle)
// Rule: never more than 3 breathing elements at once
// prefers-reduced-motion: use the static variant instead

export const breathVariant: Variants = {
  animate: {
    y: [0, -2, 0],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

// Reduced-motion safe version — no movement, just opacity drift
export const breathVariantReduced: Variants = {
  animate: {
    opacity: [1, 0.92, 1],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

// ── Terrain reveal (organic entrance with slight rotation) ──

export const terrainReveal: Variants = {
  initial: { opacity: 0, y: distance.md, scale: 0.95, rotate: -1 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: spring.gentle,
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.exit },
  },
};

// ── Stone settle (KPI cards dropping into place) ──

export const stoneSettle: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: spring.bouncy,
  },
};

// ── Water ripple (concentric ring expand + fade) ──

export const waterRipple: Variants = {
  initial: { scale: 0.6, opacity: 0.6 },
  animate: {
    scale: [0.6, 1.4],
    opacity: [0.6, 0],
    transition: {
      duration: duration.slow,
      ease: ease.out,
    },
  },
};

// ── Stream flow (continuous horizontal translate for SpendingStream) ──

export const streamFlow: Variants = {
  animate: {
    x: [0, -200],
    transition: {
      duration: 8,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

// ── Particle burst (for Money Echo — individual particle trajectory) ──

export const particleBurst: Variants = {
  initial: { opacity: 1, scale: 1 },
  animate: (custom: { x: number; y: number }) => ({
    x: custom.x,
    y: custom.y,
    opacity: 0,
    scale: 0.3,
    transition: {
      duration: duration.slow,
      ease: ease.out,
    },
  }),
};

// ── Bottom sheet entrance ──

export const bottomSheet: Variants = {
  initial: { y: "100%" },
  animate: {
    y: 0,
    transition: spring.water,
  },
  exit: {
    y: "100%",
    transition: { duration: duration.normal, ease: ease.in },
  },
};
