"use client";

/**
 * BusinessGraphic — abstract ledger / briefcase motif.
 * Suggests professional financial management. Decorative only.
 */
export function BusinessGraphic() {
  return (
    <svg
      viewBox="0 0 110 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[44px] w-[60px] sm:h-[72px] sm:w-[100px]"
    >
      {/* Large soft ledger rectangle */}
      <rect x="20" y="14" width="52" height="52" rx="12" fill="var(--success)" opacity="0.05" />

      {/* Inner card outline */}
      <rect x="30" y="24" width="32" height="22" rx="6" stroke="var(--success)" strokeWidth="1.5" fill="none" opacity="0.12" />

      {/* Rising bar chart inside card */}
      <rect x="36" y="36" width="5" height="8" rx="1.5" fill="var(--success)" opacity="0.14" />
      <rect x="44" y="32" width="5" height="12" rx="1.5" fill="var(--primary)" opacity="0.12" />
      <rect x="52" y="28" width="5" height="16" rx="1.5" fill="var(--success)" opacity="0.16" />

      {/* Upward trend arc — business growth */}
      <path
        d="M24 58 Q 50 30, 82 16"
        stroke="var(--success)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.10"
      />

      {/* Floating accent elements */}
      <circle cx="88" cy="22" r="10" fill="var(--accent)" opacity="0.06" />
      <circle cx="92" cy="55" r="3.5" fill="var(--success)" opacity="0.10" />
      <circle cx="14" cy="28" r="3" fill="var(--primary)" opacity="0.07" />

      {/* Small diamond accent */}
      <rect x="80" y="50" width="8" height="8" rx="2" fill="var(--accent)" opacity="0.08" transform="rotate(45 84 54)" />
    </svg>
  );
}
