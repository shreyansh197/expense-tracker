/**
 * ObserverCharacter — Calm presence with floating abstract data shapes.
 *
 * Usage: Dashboard greeting headers, empty states, onboarding.
 * NEVER place in: transaction lists, charts, forms, error states, inline components.
 */
import { ENABLE_DECORATIVE_ILLUSTRATIONS } from "@/lib/constants";

interface Props {
  size?: number;
  className?: string;
}

export function ObserverCharacter({ size = 120, className = "" }: Props) {
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
      {/* Body — pill / rounded rectangle */}
      <rect
        x="36"
        y="52"
        width="48"
        height="62"
        rx="24"
        fill="var(--primary)"
        opacity="0.13"
      />
      {/* Head — circle */}
      <circle
        cx="60"
        cy="36"
        r="20"
        fill="var(--primary)"
        opacity="0.16"
      />
      {/* Shoulder line — soft arc connecting head to body */}
      <path
        d="M40 54 Q60 44 80 54"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.10"
      />
      {/* Floating data shape 1 — small circle (stability) */}
      <circle
        cx="98"
        cy="28"
        r="6"
        fill="var(--secondary)"
        opacity="0.14"
        className="animate-float"
        style={{ animationDelay: "0s" }}
      />
      {/* Floating data shape 2 — rounded triangle (guidance) */}
      <path
        d="M16 62 L28 44 L40 62 Z"
        rx="4"
        fill="var(--primary)"
        opacity="0.10"
        className="animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      {/* Subtle ground shadow */}
      <ellipse
        cx="60"
        cy="120"
        rx="28"
        ry="4"
        fill="var(--text-muted)"
        opacity="0.08"
      />
    </svg>
  );
}
