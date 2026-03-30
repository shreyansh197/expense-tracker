"use client";

/**
 * TargetIllustration — theme-aware SVG bullseye/target with arrow.
 * Used for goals, category detail, and tracking empty states.
 */
export function TargetIllustration({ size = 140 }: { size?: number }) {
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

      {/* Target rings */}
      <circle cx="65" cy="72" r="38" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.38" />
      <circle cx="65" cy="72" r="28" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.5" />
      <circle cx="65" cy="72" r="18" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6" />

      {/* Bullseye center */}
      <circle cx="65" cy="72" r="6" fill="var(--accent)" opacity="0.55" />
      <circle cx="65" cy="72" r="2.5" fill="var(--accent)" opacity="0.75" />

      {/* Arrow */}
      <g style={{ animation: 'float-gentle 4s ease-in-out 0s infinite' }}>
        {/* Arrow shaft */}
        <line x1="92" y1="44" x2="70" y2="66" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        {/* Arrow head */}
        <path d="M68 64L66 72L74 70Z" fill="var(--accent)" opacity="0.8" />
        {/* Arrow fletching */}
        <path d="M92 44L96 40L90 42Z" fill="var(--accent)" opacity="0.7" />
        <path d="M92 44L96 48L94 42Z" fill="var(--accent)" opacity="0.6" />
      </g>

      {/* Progress arc — partial ring showing progress */}
      <path
        d="M65 34A38 38 0 0 1 103 72"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"        strokeDasharray="60"
        style={{
          animation: 'donut-sweep 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both',
        }}
      />

      {/* Floating percentage */}
      <g style={{ animation: 'float-gentle 5s ease-in-out 1s infinite' }}>
        <rect x="96" y="28" width="26" height="16" rx="8" fill="var(--success-soft)" stroke="var(--accent)" strokeWidth="1" opacity="0.75" />
        <text x="109" y="39" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--accent)" opacity="0.8">0%</text>
      </g>

      {/* Sparkles */}
      <path d="M30 48L32 44L34 48L32 52Z" fill="var(--accent)" opacity="0.5" />
      <path d="M108 98L109.5 95L111 98L109.5 101Z" fill="var(--accent)" opacity="0.45" />

      {/* Small decorative dots */}
      <circle cx="24" cy="82" r="2" fill="var(--accent)" opacity="0.3" />
      <circle cx="116" cy="62" r="1.5" fill="var(--accent)" opacity="0.35" />
    </svg>
  );
}
