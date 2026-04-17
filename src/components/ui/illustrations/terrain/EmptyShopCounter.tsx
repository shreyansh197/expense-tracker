"use client";

/** Empty business — a quiet trading post with an empty counter. */
export function EmptyShopCounter({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="280" height="180" rx="16" fill="var(--surface-secondary)" />

      {/* Ground */}
      <rect x="0" y="140" width="280" height="40" rx="0" fill="var(--primary)" opacity="0.06" />

      {/* Counter/table */}
      <rect x="60" y="110" width="160" height="8" rx="3" fill="var(--primary)" opacity="0.18" />
      {/* Table legs */}
      <rect x="75" y="118" width="4" height="22" rx="1" fill="var(--primary)" opacity="0.12" />
      <rect x="200" y="118" width="4" height="22" rx="1" fill="var(--primary)" opacity="0.12" />

      {/* Empty sign hanging */}
      <line x1="140" y1="50" x2="140" y2="70" stroke="var(--text-tertiary)" strokeWidth="1" opacity="0.2" />
      <rect x="115" y="70" width="50" height="24" rx="4" fill="var(--surface)" stroke="var(--border-default)" strokeWidth="1" opacity="0.6" />
      <line x1="125" y1="80" x2="155" y2="80" stroke="var(--text-tertiary)" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="130" y1="86" x2="150" y2="86" stroke="var(--text-tertiary)" strokeWidth="1" opacity="0.15" strokeLinecap="round" />

      {/* Warm light glow */}
      <circle cx="140" cy="100" r="40" fill="var(--accent)" opacity="0.05" />

      {/* Tiny decorative elements on counter */}
      <circle cx="100" cy="106" r="3" fill="var(--accent)" opacity="0.15" />
      <rect x="170" y="103" width="12" height="7" rx="2" fill="var(--primary)" opacity="0.1" />
    </svg>
  );
}
