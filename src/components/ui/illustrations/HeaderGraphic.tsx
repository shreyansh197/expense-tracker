"use client";

/**
 * HeaderGraphic — abstract geometric composition for the dashboard greeting zone.
 * Decorative only (aria-hidden). Uses brand tokens, hidden on mobile.
 */
export function HeaderGraphic() {
  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[50px] w-[66px] sm:h-[90px] sm:w-[120px]"
    >
      {/* Large soft circle — primary brand at low opacity */}
      <circle cx="80" cy="35" r="32" fill="var(--primary)" opacity="0.08" />

      {/* Rounded rectangle — accent tint */}
      <rect x="50" y="50" width="44" height="28" rx="10" fill="var(--accent)" opacity="0.06" />

      {/* Small arc / crescent — secondary accent */}
      <path
        d="M30 20 A 22 22 0 0 1 52 42"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.10"
      />

      {/* Tiny dot cluster — depth accent */}
      <circle cx="105" cy="18" r="4" fill="var(--accent)" opacity="0.10" />
      <circle cx="38" cy="65" r="3" fill="var(--primary)" opacity="0.06" />
    </svg>
  );
}
