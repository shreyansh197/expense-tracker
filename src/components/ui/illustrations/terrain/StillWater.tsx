"use client";

/** Empty expenses — a still stream bed with smooth stones. */
export function StillWater({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="280" height="180" rx="16" fill="var(--surface-secondary)" />

      {/* Bank edges */}
      <path
        d="M0 100 Q30 92 60 96 Q100 88 140 92 Q180 86 220 94 Q260 88 280 92 V180 H0Z"
        fill="var(--primary)"
        opacity="0.1"
      />

      {/* Water surface */}
      <path
        d="M20 108 Q70 102 140 106 Q210 100 260 104 V140 Q210 146 140 142 Q70 148 20 142Z"
        fill="var(--accent)"
        opacity="0.08"
      />

      {/* Reflection lines */}
      <line x1="60" y1="118" x2="100" y2="118" stroke="var(--accent)" strokeWidth="1" opacity="0.15" strokeLinecap="round" />
      <line x1="150" y1="122" x2="200" y2="122" stroke="var(--accent)" strokeWidth="1" opacity="0.12" strokeLinecap="round" />
      <line x1="90" y1="128" x2="170" y2="128" stroke="var(--accent)" strokeWidth="0.8" opacity="0.08" strokeLinecap="round" />

      {/* Smooth stones */}
      <ellipse cx="80" cy="146" rx="10" ry="6" fill="var(--text-tertiary)" opacity="0.25" />
      <ellipse cx="140" cy="150" rx="14" ry="7" fill="var(--text-tertiary)" opacity="0.2" />
      <ellipse cx="200" cy="144" rx="8" ry="5" fill="var(--text-tertiary)" opacity="0.3" />
      <ellipse cx="110" cy="156" rx="6" ry="4" fill="var(--text-tertiary)" opacity="0.15" />

      {/* Gentle ripple */}
      <ellipse cx="140" cy="114" rx="24" ry="2" fill="none" stroke="var(--accent)" strokeWidth="0.6" opacity="0.2" />
      <ellipse cx="140" cy="114" rx="40" ry="3" fill="none" stroke="var(--accent)" strokeWidth="0.4" opacity="0.1" />
    </svg>
  );
}
