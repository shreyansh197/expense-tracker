/**
 * ObserverCharacter — Abstract concentric data-pulse rings with floating dots.
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
      {/* Outer pulse ring */}
      <circle
        cx="60"
        cy="62"
        r="52"
        stroke="var(--primary)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.08"
      />
      {/* Middle ring */}
      <circle
        cx="60"
        cy="62"
        r="38"
        stroke="var(--primary)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.12"
      />
      {/* Inner filled ring */}
      <circle
        cx="60"
        cy="62"
        r="22"
        fill="var(--primary)"
        opacity="0.08"
      />
      {/* Core dot */}
      <circle cx="60" cy="62" r="5" fill="var(--primary)" opacity="0.22" />
      {/* Data dot 1 — on outer ring, top-right */}
      <circle
        cx="96"
        cy="32"
        r="4.5"
        fill="var(--accent)"
        opacity="0.20"
        className="animate-float"
        style={{ animationDelay: "0s" }}
      />
      {/* Data dot 2 — on middle ring, left */}
      <circle
        cx="26"
        cy="76"
        r="3.5"
        fill="var(--primary)"
        opacity="0.18"
        className="animate-float"
        style={{ animationDelay: "1.2s" }}
      />
      {/* Data dot 3 — on outer ring, bottom */}
      <circle
        cx="78"
        cy="108"
        r="3"
        fill="var(--accent)"
        opacity="0.14"
        className="animate-float"
        style={{ animationDelay: "2.4s" }}
      />
      {/* Connecting arc segment — partial ring highlight */}
      <path
        d="M88 30 A52 52 0 0 1 110 68"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.12"
      />
    </svg>
  );
}
