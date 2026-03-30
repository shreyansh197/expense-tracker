"use client";

/**
 * WalletIllustration — theme-aware SVG wallet with floating coins.
 * Used for expenses-related empty states.
 */
export function WalletIllustration({ size = 140 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="animate-float"
    >
      {/* Background circle */}
      <circle cx="70" cy="70" r="64" fill="var(--surface-secondary)" opacity="0.6" />

      {/* Wallet body */}
      <rect x="32" y="52" width="76" height="50" rx="8" fill="var(--accent)" opacity="0.25" />
      <rect x="32" y="52" width="76" height="50" rx="8" stroke="var(--accent)" strokeWidth="2" opacity="0.55" />

      {/* Wallet flap */}
      <path
        d="M32 60C32 55.5817 35.5817 52 40 52H100C104.418 52 108 55.5817 108 60V68H32V60Z"
        fill="var(--accent)"
        opacity="0.4"
      />

      {/* Wallet clasp */}
      <rect x="84" y="72" width="24" height="16" rx="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" opacity="0.75" />
      <circle cx="96" cy="80" r="3" fill="var(--accent)" opacity="0.65" />

      {/* Card peeking out */}
      <rect x="40" y="46" width="40" height="24" rx="4" fill="var(--success-soft)" stroke="var(--accent)" strokeWidth="1" opacity="0.45" />
      <rect x="44" y="50" width="16" height="3" rx="1.5" fill="var(--accent)" opacity="0.35" />

      {/* Floating coin 1 — top right */}
      <g style={{ animation: 'float-gentle 4s ease-in-out 0s infinite' }}>
        <circle cx="105" cy="35" r="10" fill="var(--warning-soft)" stroke="var(--accent)" strokeWidth="1.5" opacity="0.65" />
        <text x="105" y="39" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--accent)" opacity="0.75">$</text>
      </g>

      {/* Floating coin 2 — top left */}
      <g style={{ animation: 'float-gentle 5s ease-in-out 1.2s infinite' }}>
        <circle cx="45" cy="30" r="8" fill="var(--warning-soft)" stroke="var(--accent)" strokeWidth="1.5" opacity="0.55" />
        <text x="45" y="34" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--accent)" opacity="0.65">$</text>
      </g>

      {/* Floating coin 3 — right side */}
      <g style={{ animation: 'float-gentle 4.5s ease-in-out 0.6s infinite' }}>
        <circle cx="115" cy="58" r="6" fill="var(--warning-soft)" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
      </g>

      {/* Sparkle accents */}
      <path d="M22 45L24 41L26 45L24 49Z" fill="var(--accent)" opacity="0.35" />
      <path d="M118 90L119.5 87L121 90L119.5 93Z" fill="var(--accent)" opacity="0.3" />
    </svg>
  );
}
