"use client";

/**
 * SparkGraphic — small abstract sparkle / starburst accent.
 * Adds visual polish to cards and sections. Decorative only.
 */
export function SparkGraphic() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[28px] w-[28px] sm:h-[42px] sm:w-[42px]"
    >
      {/* Soft background glow */}
      <circle cx="24" cy="24" r="18" fill="var(--accent)" opacity="0.04" />

      {/* 4-point starburst — vertical and horizontal lines */}
      <line x1="24" y1="6" x2="24" y2="18" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.14" />
      <line x1="24" y1="30" x2="24" y2="42" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.10" />
      <line x1="6" y1="24" x2="18" y2="24" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.10" />
      <line x1="30" y1="24" x2="42" y2="24" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.14" />

      {/* Diagonal accents */}
      <line x1="12" y1="12" x2="18" y2="18" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.08" />
      <line x1="30" y1="30" x2="36" y2="36" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.08" />
      <line x1="30" y1="18" x2="36" y2="12" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.06" />
      <line x1="12" y1="36" x2="18" y2="30" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.06" />

      {/* Center dot */}
      <circle cx="24" cy="24" r="3" fill="var(--accent)" opacity="0.16" />
    </svg>
  );
}
