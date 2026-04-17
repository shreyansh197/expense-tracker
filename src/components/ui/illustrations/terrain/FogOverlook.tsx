"use client";

/** Empty analytics — a foggy overlook with distant ridges barely visible. */
export function FogOverlook({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="280" height="180" rx="16" fill="var(--surface-secondary)" />

      {/* Far ridges dissolving into fog */}
      <path
        d="M0 90 Q60 60 120 80 Q180 55 240 75 Q270 65 280 70 V180 H0Z"
        fill="var(--primary)"
        opacity="0.05"
      />
      <path
        d="M0 110 Q50 85 110 100 Q170 80 230 95 Q260 88 280 92 V180 H0Z"
        fill="var(--primary)"
        opacity="0.08"
      />
      <path
        d="M0 130 Q80 110 140 120 Q200 105 280 118 V180 H0Z"
        fill="var(--primary)"
        opacity="0.12"
      />

      {/* Heavy fog layers */}
      <ellipse cx="140" cy="100" rx="140" ry="20" fill="var(--surface)" opacity="0.6" />
      <ellipse cx="100" cy="120" rx="100" ry="12" fill="var(--surface)" opacity="0.45" />
      <ellipse cx="200" cy="85" rx="80" ry="10" fill="var(--surface)" opacity="0.5" />

      {/* Observation point hint */}
      <rect x="125" y="148" width="30" height="3" rx="1.5" fill="var(--text-tertiary)" opacity="0.2" />
      <rect x="132" y="145" width="16" height="3" rx="1.5" fill="var(--text-tertiary)" opacity="0.15" />

      {/* Distant bird silhouettes */}
      <g opacity="0.12" transform="translate(180, 50)">
        <path d="M-4 0 Q-2 -3 0 0 Q2 -3 4 0" stroke="var(--primary)" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
      <g opacity="0.08" transform="translate(200, 42)">
        <path d="M-3 0 Q-1.5 -2 0 0 Q1.5 -2 3 0" stroke="var(--primary)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
