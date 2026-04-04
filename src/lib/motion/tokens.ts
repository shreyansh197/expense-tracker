/** Motion design system tokens — single source of truth for all animation values. */

// ── Durations (seconds) ──

export const duration = {
  fast: 0.15,     // hover, press, exits
  normal: 0.25,   // fade, toggle, small movement
  emphasis: 0.4,  // page entrance, hero elements
  slow: 0.7,      // progress bars, chart reveals
  exit: 0.15,     // all exit animations — must be snappy
} as const;

// ── Stagger delays (seconds) ──

export const stagger = {
  tight: 0.04,    // dense lists (expense rows)
  normal: 0.06,   // card grids (KPI, goals)
  loose: 0.10,    // dashboard section-level reveals
} as const;

// ── Easing curves ──

export const ease = {
  /** Default ease-out for entrances — the app's signature curve */
  out: [0.22, 1, 0.36, 1] as readonly [number, number, number, number],
  /** Symmetric ease-in-out for expand/collapse, layout shifts */
  inOut: [0.4, 0, 0.2, 1] as readonly [number, number, number, number],
} as const;

// ── Spring presets (for framer-motion `transition: { type: "spring", ... }`) ──

export const spring = {
  /** Modals, overlays, dropdowns */
  default: { type: "spring" as const, stiffness: 400, damping: 28 },
  /** Tab indicators, layout shifts */
  stiff: { type: "spring" as const, stiffness: 500, damping: 30 },
} as const;

// ── Distances (pixels) ──

export const distance = {
  sm: 6,   // list items
  md: 12,  // cards, sections
  lg: 24,  // modals, page enter
} as const;

// ── Scale values ──

export const scale = {
  tapButton: 0.96,
  tapFab: 0.88,
  tapChip: 0.94,
  modalEnter: 0.97,
} as const;

// ── Max stagger items (cap total stagger time at ~480ms) ──

export const MAX_STAGGER_ITEMS = 12;

/** Compute a capped stagger delay for an item index */
export function staggerDelay(index: number, delayPerItem = stagger.tight): number {
  return Math.min(index * delayPerItem, MAX_STAGGER_ITEMS * delayPerItem);
}
