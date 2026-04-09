/**
 * BuilderCharacter — Abstract ascending bar chart with growth trend.
 *
 * Usage: Savings & Goals sections, Business page headers.
 * NEVER place in: transaction lists, charts, forms, error states, inline components.
 */
import { ENABLE_DECORATIVE_ILLUSTRATIONS } from "@/lib/constants";

interface Props {
  size?: number;
  className?: string;
}

export function BuilderCharacter({ size = 120, className = "" }: Props) {
  if (!ENABLE_DECORATIVE_ILLUSTRATIONS) return null;

  const w = size;
  const h = size * 1.1;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 120 132"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Bar 1 — shortest */}
      <rect x="14" y="94" width="16" height="24" rx="5" fill="var(--primary)" opacity="0.10" />
      {/* Bar 2 */}
      <rect x="36" y="76" width="16" height="42" rx="5" fill="var(--primary)" opacity="0.13" />
      {/* Bar 3 */}
      <rect x="58" y="58" width="16" height="60" rx="5" fill="var(--accent)" opacity="0.14" />
      {/* Bar 4 — tallest */}
      <rect
        x="80"
        y="38"
        width="16"
        height="80"
        rx="5"
        fill="var(--primary)"
        opacity="0.16"
        className="animate-float"
        style={{ animationDelay: "0.8s" }}
      />
      {/* Growth trend line connecting bar tops */}
      <path
        d="M22 92 L44 74 L66 56 L88 36"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.16"
      />
      {/* Trend node on highest bar */}
      <circle cx="88" cy="36" r="4" fill="var(--accent)" opacity="0.22" />
      {/* Upward arrow hint */}
      <path
        d="M100 28 L106 18 L112 28"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.14"
      />
    </svg>
  );
}
