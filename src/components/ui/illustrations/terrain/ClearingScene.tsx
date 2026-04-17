"use client";

/** Empty dashboard — a misty clearing with gentle hills and soft light. */
export function ClearingScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Sky wash */}
      <rect width="280" height="180" rx="16" fill="var(--surface-secondary)" />

      {/* Distant hills */}
      <path
        d="M0 130 Q40 95 80 110 Q120 80 160 105 Q200 75 240 100 Q270 90 280 95 V180 H0Z"
        fill="var(--primary)"
        opacity="0.08"
      />
      <path
        d="M0 145 Q50 120 100 135 Q150 110 200 130 Q240 115 280 125 V180 H0Z"
        fill="var(--primary)"
        opacity="0.14"
      />

      {/* Ground plane */}
      <path
        d="M0 155 Q70 145 140 150 Q210 143 280 152 V180 H0Z"
        fill="var(--primary)"
        opacity="0.22"
      />

      {/* Mist wisps */}
      <ellipse cx="90" cy="132" rx="60" ry="6" fill="var(--surface)" opacity="0.5" />
      <ellipse cx="200" cy="118" rx="40" ry="4" fill="var(--surface)" opacity="0.4" />

      {/* Soft sun glow */}
      <circle cx="200" cy="60" r="24" fill="var(--accent)" opacity="0.12" />
      <circle cx="200" cy="60" r="10" fill="var(--accent)" opacity="0.2" />

      {/* Small tree silhouettes */}
      <g opacity="0.18">
        <line x1="55" y1="148" x2="55" y2="136" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="55" cy="132" r="6" fill="var(--primary)" />
        <line x1="225" y1="142" x2="225" y2="128" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="225" cy="125" r="5" fill="var(--primary)" />
      </g>
    </svg>
  );
}
