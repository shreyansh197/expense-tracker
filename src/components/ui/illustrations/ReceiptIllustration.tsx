"use client";

/**
 * ReceiptIllustration — theme-aware SVG receipt with magnifying glass.
 * Used for "no results found" / filtered-empty states.
 */
export function ReceiptIllustration({ size = 140 }: { size?: number }) {
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
      <circle cx="70" cy="70" r="64" fill="var(--surface-secondary)" opacity="0.8" />

      {/* Receipt body */}
      <path
        d="M45 28H95C97.2091 28 99 29.7909 99 32V108L93 104L87 108L81 104L75 108L69 104L63 108L57 104L51 108L45 104V32C45 29.7909 46.7909 28 49 28Z"
        fill="var(--surface)"
        stroke="var(--accent)"
        strokeWidth="1.5"
        opacity="0.75"
      />

      {/* Receipt lines */}
      <rect x="54" y="42" width="32" height="3" rx="1.5" fill="var(--accent)" opacity="0.5" />
      <rect x="54" y="52" width="24" height="2" rx="1" fill="var(--border)" opacity="0.8" />
      <rect x="54" y="60" width="28" height="2" rx="1" fill="var(--border)" opacity="0.8" />
      <rect x="54" y="68" width="20" height="2" rx="1" fill="var(--border)" opacity="0.8" />

      {/* Separator dashed line */}
      <line x1="54" y1="78" x2="86" y2="78" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />

      {/* Total amount */}
      <rect x="54" y="84" width="14" height="3" rx="1.5" fill="var(--accent)" opacity="0.55" />
      <rect x="74" y="84" width="12" height="3" rx="1.5" fill="var(--accent)" opacity="0.65" />

      {/* Magnifying glass */}
      <g style={{ animation: 'float-gentle 5s ease-in-out 0.3s' }}>
        <circle cx="98" cy="50" r="16" fill="var(--surface-secondary)" stroke="var(--accent)" strokeWidth="2" opacity="0.75" />
        <circle cx="98" cy="50" r="10" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" opacity="0.65" />
        <line x1="109" y1="61" x2="118" y2="70" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        <text x="98" y="54" textAnchor="middle" fontSize="10" fill="var(--accent)" opacity="0.7">?</text>
      </g>

      {/* Scattered dots */}
      <circle cx="35" cy="55" r="2" fill="var(--text-tertiary)" opacity="0.35" />
      <circle cx="28" cy="75" r="1.5" fill="var(--text-tertiary)" opacity="0.28" />

      {/* Sparkle */}
      <path d="M115 85L117 81L119 85L117 89Z" fill="var(--text-tertiary)" opacity="0.5" />
    </svg>
  );
}
