/**
 * ReflectiveCharacter — Abstract trend line with insight nodes.
 *
 * Usage: Analytics page headers, Settings headers, insight/summary sections.
 * NEVER place in: transaction lists, charts, forms, error states, inline components.
 */
import { ENABLE_DECORATIVE_ILLUSTRATIONS } from "@/lib/constants";

interface Props {
  size?: number;
  className?: string;
}

export function ReflectiveCharacter({ size = 120, className = "" }: Props) {
  if (!ENABLE_DECORATIVE_ILLUSTRATIONS) return null;

  const w = size;
  const h = size * 1.0;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Subtle background field */}
      <rect
        x="8"
        y="20"
        width="104"
        height="80"
        rx="16"
        fill="var(--accent)"
        opacity="0.04"
      />
      {/* Grid lines — horizontal */}
      <line x1="16" y1="40" x2="104" y2="40" stroke="var(--accent)" strokeWidth="1" opacity="0.06" />
      <line x1="16" y1="60" x2="104" y2="60" stroke="var(--accent)" strokeWidth="1" opacity="0.06" />
      <line x1="16" y1="80" x2="104" y2="80" stroke="var(--accent)" strokeWidth="1" opacity="0.06" />
      {/* Trend line — smooth upward curve */}
      <path
        d="M18 82 C34 78, 42 68, 52 58 S72 36, 102 30"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.18"
      />
      {/* Node 1 */}
      <circle cx="18" cy="82" r="4" fill="var(--accent)" opacity="0.20" />
      {/* Node 2 */}
      <circle
        cx="52"
        cy="58"
        r="4.5"
        fill="var(--primary)"
        opacity="0.22"
        className="animate-float"
        style={{ animationDelay: "0.6s" }}
      />
      {/* Node 3 — highlight node */}
      <circle cx="102" cy="30" r="5" fill="var(--accent)" opacity="0.24" />
      <circle cx="102" cy="30" r="10" fill="var(--accent)" opacity="0.06" />
      {/* Insight dot — off-trend */}
      <circle
        cx="36"
        cy="46"
        r="3"
        fill="var(--primary)"
        opacity="0.14"
        className="animate-float"
        style={{ animationDelay: "2s" }}
      />
    </svg>
  );
}
