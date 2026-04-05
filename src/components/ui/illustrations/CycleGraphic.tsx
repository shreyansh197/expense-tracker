"use client";

/**
 * CycleGraphic — abstract orbital ring with floating dots.
 * Suggests recurring cycles and subscriptions. Decorative only.
 */
export function CycleGraphic() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[36px] w-[36px] sm:h-[56px] sm:w-[56px]"
    >
      {/* Outer orbit ring */}
      <circle cx="32" cy="32" r="26" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.15" />

      {/* Partial arc — active orbit segment */}
      <path
        d="M32 6 A 26 26 0 0 1 58 32"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />

      {/* Second partial arc */}
      <path
        d="M32 58 A 26 26 0 0 1 6 32"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.18"
      />

      {/* Orbiting dots at key positions */}
      <circle cx="32" cy="6" r="4" fill="var(--accent)" opacity="0.28" />
      <circle cx="58" cy="32" r="3.5" fill="var(--primary)" opacity="0.22" />
      <circle cx="32" cy="58" r="3" fill="var(--primary)" opacity="0.18" />
      <circle cx="6" cy="32" r="3.5" fill="var(--accent)" opacity="0.14" />

      {/* Center hub */}
      <circle cx="32" cy="32" r="6" fill="var(--primary)" opacity="0.10" />
      <circle cx="32" cy="32" r="2.5" fill="var(--accent)" opacity="0.22" />
    </svg>
  );
}
