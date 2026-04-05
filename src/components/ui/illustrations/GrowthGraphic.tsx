"use client";

/**
 * GrowthGraphic — abstract upward arc with ascending dots.
 * Suggests growth/progress for savings sections. Decorative only.
 */
export function GrowthGraphic() {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[44px] w-[35px] sm:h-[80px] sm:w-[64px]"
    >
      {/* Upward sweeping arc — growth trajectory */}
      <path
        d="M8 68 Q 20 50, 32 38 Q 44 26, 56 12"
        stroke="var(--success)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.22"
      />

      {/* Ascending step dots along the arc */}
      <circle cx="16" cy="58" r="3.5" fill="var(--success)" opacity="0.18" />
      <circle cx="32" cy="38" r="4" fill="var(--success)" opacity="0.24" />
      <circle cx="50" cy="18" r="5" fill="var(--primary)" opacity="0.18" />

      {/* Background soft shape — visual grounding */}
      <rect x="22" y="42" width="30" height="30" rx="10" fill="var(--primary)" opacity="0.07" />
    </svg>
  );
}
