"use client";

import { useMemo } from "react";

/**
 * Gemini-style shape-morphing orb.
 * The blob layers ARE the shape — no clipping container.
 * Each layer has its own border-radius morph, creating the organic silhouette.
 */

interface HeroOrbProps {
  budgetUsedPercent: number;
  hasBudget: boolean;
  size?: number;
}

export function HeroOrb({ budgetUsedPercent, hasBudget, size = 76 }: HeroOrbProps) {
  const palette = useMemo(() => {
    if (!hasBudget) {
      return { a: "var(--accent, #7c3aed)", b: "var(--accent-light, #818cf8)", c: "var(--accent-lighter, #c084fc)", d: "var(--accent-soft, #a78bfa)" };
    }
    if (budgetUsedPercent >= 90) {
      return { a: "var(--color-danger, #ef4444)", b: "#f97316", c: "var(--color-danger-dark, #dc2626)", d: "#fb7185" };
    }
    if (budgetUsedPercent >= 70) {
      return { a: "var(--color-warning, #f59e0b)", b: "#fb923c", c: "#fbbf24", d: "#f97316" };
    }
    return { a: "var(--accent, #7c3aed)", b: "var(--accent-light, #818cf8)", c: "var(--accent-lighter, #c084fc)", d: "var(--accent-soft, #a78bfa)" };
  }, [budgetUsedPercent, hasBudget]);

  return (
    <div
      className="hero-orb-container"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Ambient glow — sits behind everything */}
      <div
        className="hero-orb-glow"
        style={{
          background: `radial-gradient(circle, ${palette.a}, transparent 65%)`,
        }}
      />

      {/* Primary blob — this defines the visible outer shape */}
      <div
        className="hero-orb-blob orb-blob-1"
        style={{
          background: `conic-gradient(from 0deg, ${palette.a}, ${palette.b}, ${palette.c}, ${palette.d}, ${palette.a})`,
        }}
      />

      {/* Secondary blob — offset timing, adds color complexity */}
      <div
        className="hero-orb-blob orb-blob-2"
        style={{
          background: `conic-gradient(from 120deg, ${palette.c}, ${palette.a}, ${palette.d}, ${palette.b}, ${palette.c})`,
        }}
      />

      {/* Inner core — bright center */}
      <div
        className="hero-orb-blob orb-blob-3"
        style={{
          background: `radial-gradient(circle at 40% 40%, ${palette.b}, ${palette.d}88, ${palette.a}44)`,
        }}
      />

      {/* Specular highlight — glass-like reflection */}
      <div className="hero-orb-specular" />
    </div>
  );
}
