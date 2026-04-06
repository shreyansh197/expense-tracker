/**
 * BuilderCharacter — Abstract human form interacting with ascending growth shapes.
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
      {/* Body — pill, slight lean toward growth shapes */}
      <rect
        x="24"
        y="52"
        width="44"
        height="60"
        rx="22"
        fill="var(--primary)"
        opacity="0.13"
        transform="rotate(-3 46 82)"
      />
      {/* Head — circle */}
      <circle
        cx="48"
        cy="36"
        r="18"
        fill="var(--primary)"
        opacity="0.16"
      />
      {/* Reaching arm — arc toward growth blocks */}
      <path
        d="M66 66 Q82 54 94 58"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.12"
      />
      {/* Ascending growth block 1 — short */}
      <rect
        x="86"
        y="90"
        width="14"
        height="22"
        rx="5"
        fill="var(--success)"
        opacity="0.14"
      />
      {/* Ascending growth block 2 — medium */}
      <rect
        x="86"
        y="68"
        width="14"
        height="44"
        rx="5"
        fill="var(--success)"
        opacity="0.11"
      />
      {/* Ascending growth block 3 — tall */}
      <rect
        x="104"
        y="50"
        width="14"
        height="62"
        rx="5"
        fill="var(--primary)"
        opacity="0.10"
        className="animate-float"
        style={{ animationDelay: "0.8s" }}
      />
      {/* Subtle ground shadow */}
      <ellipse
        cx="60"
        cy="120"
        rx="32"
        ry="4"
        fill="var(--text-muted)"
        opacity="0.08"
      />
    </svg>
  );
}
