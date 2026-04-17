"use client";

/** Offline state — a hand-drawn map with a dotted trail going off-grid. */
export function OffTrailMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="280" height="180" rx="16" fill="var(--surface-secondary)" />

      {/* Map parchment */}
      <rect x="40" y="25" width="200" height="130" rx="8" fill="var(--surface)" stroke="var(--border-default)" strokeWidth="1" opacity="0.8" />

      {/* Terrain contour lines */}
      <g opacity="0.1">
        <path d="M60 80 Q100 60 140 75 Q180 55 220 70" stroke="var(--primary)" strokeWidth="1" fill="none" />
        <path d="M65 95 Q105 75 140 88 Q175 72 215 82" stroke="var(--primary)" strokeWidth="1" fill="none" />
        <path d="M70 110 Q110 92 140 100 Q170 88 210 96" stroke="var(--primary)" strokeWidth="1" fill="none" />
      </g>

      {/* Main trail (solid — known path) */}
      <path
        d="M60 130 Q80 115 100 118 Q130 108 150 100"
        stroke="var(--primary)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Off-trail section (dashed — offline/unknown) */}
      <path
        d="M150 100 Q170 88 190 82 Q210 74 220 60"
        stroke="var(--accent)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity="0.35"
      />

      {/* Current position marker */}
      <circle cx="150" cy="100" r="4" fill="var(--accent)" opacity="0.4" />
      <circle cx="150" cy="100" r="2" fill="var(--accent)" opacity="0.7" />

      {/* Compass rose hint */}
      <g transform="translate(205, 130)" opacity="0.15">
        <circle cx="0" cy="0" r="10" fill="none" stroke="var(--primary)" strokeWidth="1" />
        <line x1="0" y1="-8" x2="0" y2="8" stroke="var(--primary)" strokeWidth="0.8" />
        <line x1="-8" y1="0" x2="8" y2="0" stroke="var(--primary)" strokeWidth="0.8" />
        <polygon points="0,-7 -2,-2 2,-2" fill="var(--primary)" />
      </g>

      {/* Map fold lines */}
      <line x1="140" y1="25" x2="140" y2="155" stroke="var(--border-default)" strokeWidth="0.5" opacity="0.3" />
      <line x1="40" y1="90" x2="240" y2="90" stroke="var(--border-default)" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}
