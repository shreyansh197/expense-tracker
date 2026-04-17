"use client";

/** Error state — a fallen log across the path. */
export function FallenLog({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="280" height="180" rx="16" fill="var(--surface-secondary)" />

      {/* Path */}
      <path
        d="M0 150 Q60 140 140 142 Q220 138 280 148 V180 H0Z"
        fill="var(--primary)"
        opacity="0.08"
      />

      {/* Fallen log across path */}
      <g transform="translate(140, 125) rotate(-12)">
        <rect x="-60" y="-6" width="120" height="12" rx="6" fill="var(--text-tertiary)" opacity="0.3" />
        {/* Bark texture lines */}
        <line x1="-40" y1="-3" x2="-40" y2="3" stroke="var(--text-tertiary)" strokeWidth="0.8" opacity="0.2" />
        <line x1="-20" y1="-4" x2="-20" y2="4" stroke="var(--text-tertiary)" strokeWidth="0.8" opacity="0.2" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--text-tertiary)" strokeWidth="0.8" opacity="0.2" />
        <line x1="20" y1="-4" x2="20" y2="4" stroke="var(--text-tertiary)" strokeWidth="0.8" opacity="0.2" />
        <line x1="40" y1="-3" x2="40" y2="3" stroke="var(--text-tertiary)" strokeWidth="0.8" opacity="0.2" />
        {/* Broken branch */}
        <line x1="50" y1="-4" x2="65" y2="-16" stroke="var(--text-tertiary)" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      </g>

      {/* Small leaves around the log */}
      <circle cx="95" cy="132" r="2" fill="var(--primary)" opacity="0.15" />
      <circle cx="175" cy="118" r="2.5" fill="var(--primary)" opacity="0.12" />
      <circle cx="110" cy="140" r="1.5" fill="var(--accent)" opacity="0.12" />

      {/* Trail marks (path before/after the log) */}
      <path d="M40 155 Q60 150 80 152" stroke="var(--text-tertiary)" strokeWidth="1.5" opacity="0.1" strokeLinecap="round" fill="none" />
      <path d="M200 148 Q220 144 250 150" stroke="var(--text-tertiary)" strokeWidth="1.5" opacity="0.1" strokeLinecap="round" fill="none" />

      {/* Subtle warning element */}
      <g transform="translate(140, 80)" opacity="0.2">
        <polygon points="0,-12 10,8 -10,8" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="0" y1="-4" x2="0" y2="2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="5" r="1" fill="var(--accent)" />
      </g>
    </svg>
  );
}
