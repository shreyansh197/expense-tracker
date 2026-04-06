/**
 * ReflectiveCharacter — Abstract seated human form with soft awareness arc.
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
      {/* Awareness arc — soft circle behind figure */}
      <circle
        cx="60"
        cy="56"
        r="40"
        fill="var(--secondary)"
        opacity="0.06"
      />
      {/* Second subtle arc ring */}
      <circle
        cx="60"
        cy="56"
        r="48"
        stroke="var(--secondary)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.08"
      />
      {/* Body — seated posture, wider pill */}
      <rect
        x="36"
        y="56"
        width="48"
        height="40"
        rx="20"
        fill="var(--secondary)"
        opacity="0.13"
      />
      {/* Head — circle */}
      <circle
        cx="60"
        cy="40"
        r="18"
        fill="var(--secondary)"
        opacity="0.16"
      />
      {/* Gentle chin-rest gesture — small arc near head */}
      <path
        d="M72 46 Q78 52 76 60"
        stroke="var(--secondary)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.10"
      />
      {/* Floating insight dot */}
      <circle
        cx="28"
        cy="36"
        r="4"
        fill="var(--primary)"
        opacity="0.12"
        className="animate-float"
        style={{ animationDelay: "2s" }}
      />
      {/* Subtle ground shadow */}
      <ellipse
        cx="60"
        cy="104"
        rx="26"
        ry="3.5"
        fill="var(--text-muted)"
        opacity="0.08"
      />
    </svg>
  );
}
