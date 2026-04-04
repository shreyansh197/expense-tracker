"use client";

/** Static SVG piggy bank fallback — soft pink silhouette, 56×56 */
export function PiggyBankFallback() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Piggy bank"
    >
      {/* Body */}
      <ellipse cx="28" cy="30" rx="18" ry="15" fill="#f9a8d4" />
      {/* Snout */}
      <ellipse cx="42" cy="30" rx="5" ry="4" fill="#fbb6ce" />
      <circle cx="40.5" cy="29" r="1" fill="#ec4899" />
      <circle cx="43.5" cy="29" r="1" fill="#ec4899" />
      {/* Ear */}
      <path d="M19 17l-4-6 6 2z" fill="#f9a8d4" />
      <path d="M33 17l4-6-6 2z" fill="#f9a8d4" />
      {/* Eye */}
      <circle cx="34" cy="26" r="2" fill="#1a1a2e" />
      {/* Coin slot */}
      <rect x="23" y="14" width="10" height="2" rx="1" fill="#ec4899" />
      {/* Legs */}
      <rect x="16" y="42" width="4" height="6" rx="1" fill="#f9a8d4" />
      <rect x="24" y="42" width="4" height="6" rx="1" fill="#f9a8d4" />
      <rect x="32" y="42" width="4" height="6" rx="1" fill="#f9a8d4" />
      <rect x="40" y="42" width="4" height="6" rx="1" fill="#f9a8d4" />
    </svg>
  );
}
