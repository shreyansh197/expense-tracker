"use client";

interface TrophyIllustrationProps {
  size?: number;
}

/**
 * Minimal SVG trophy illustration for goals/achievements empty states.
 * Uses CSS custom properties for theme-adaptive colors.
 */
export function TrophyIllustration({ size = 120 }: TrophyIllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="54" fill="var(--surface-secondary)" opacity="0.5" />
      {/* Trophy cup */}
      <path
        d="M45 38h30v24c0 8.284-6.716 15-15 15s-15-6.716-15-15V38z"
        fill="var(--warning-soft)"
        stroke="var(--warning)"
        strokeWidth="2"
      />
      {/* Left handle */}
      <path
        d="M45 44h-6a8 8 0 0 0 0 16h6"
        stroke="var(--warning)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right handle */}
      <path
        d="M75 44h6a8 8 0 0 1 0 16h-6"
        stroke="var(--warning)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Star */}
      <path
        d="M60 46l3 6.18 6.82.99-4.94 4.81 1.17 6.8L60 61.46l-6.05 3.32 1.17-6.8-4.94-4.81 6.82-.99L60 46z"
        fill="var(--warning)"
        opacity="0.8"
      />
      {/* Stem */}
      <rect x="56" y="77" width="8" height="8" rx="2" fill="var(--text-muted)" opacity="0.3" />
      {/* Base */}
      <rect x="48" y="85" width="24" height="5" rx="2.5" fill="var(--text-muted)" opacity="0.25" />
    </svg>
  );
}
