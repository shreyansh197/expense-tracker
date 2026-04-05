"use client";

/**
 * WavePatternGraphic — abstract flowing wave with dots.
 * Suggests smooth financial flow / trends. Decorative only.
 */
export function WavePatternGraphic() {
  return (
    <svg
      viewBox="0 0 120 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[28px] w-[66px] sm:h-[44px] sm:w-[105px]"
    >
      {/* Primary flowing wave */}
      <path
        d="M4 35 Q 20 10, 40 25 Q 60 40, 80 20 Q 100 0, 116 18"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.18"
      />

      {/* Secondary wave — offset rhythm */}
      <path
        d="M4 42 Q 25 22, 45 35 Q 65 48, 85 28 Q 105 8, 116 26"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.12"
      />

      {/* Dots along the primary wave */}
      <circle cx="20" cy="18" r="3" fill="var(--primary)" opacity="0.20" />
      <circle cx="60" cy="32" r="3.5" fill="var(--accent)" opacity="0.18" />
      <circle cx="100" cy="10" r="4" fill="var(--primary)" opacity="0.14" />

      {/* Soft fill area under the wave */}
      <path
        d="M4 35 Q 20 10, 40 25 Q 60 40, 80 20 Q 100 0, 116 18 L 116 50 L 4 50 Z"
        fill="var(--primary)"
        opacity="0.05"
      />
    </svg>
  );
}
