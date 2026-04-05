"use client";

/**
 * ExpensesGraphic — abstract receipt / transaction lines motif.
 * Suggests organized transactions. Decorative only.
 */
export function ExpensesGraphic() {
  return (
    <svg
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[44px] w-[55px] sm:h-[72px] sm:w-[90px]"
    >
      {/* Soft background receipt shape */}
      <rect x="28" y="6" width="44" height="68" rx="8" fill="var(--primary)" opacity="0.05" />

      {/* Stacked horizontal lines — transaction rows */}
      <line x1="36" y1="22" x2="64" y2="22" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.12" />
      <line x1="36" y1="32" x2="58" y2="32" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.09" />
      <line x1="36" y1="42" x2="62" y2="42" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.10" />
      <line x1="36" y1="52" x2="54" y2="52" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.07" />

      {/* Floating accent circle — magnifying / search vibe */}
      <circle cx="78" cy="18" r="12" fill="var(--accent)" opacity="0.06" />
      <circle cx="78" cy="18" r="6" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.12" />

      {/* Decorative dots */}
      <circle cx="18" cy="38" r="3" fill="var(--primary)" opacity="0.08" />
      <circle cx="86" cy="60" r="4" fill="var(--primary)" opacity="0.06" />
      <circle cx="14" cy="62" r="2.5" fill="var(--accent)" opacity="0.07" />
    </svg>
  );
}
