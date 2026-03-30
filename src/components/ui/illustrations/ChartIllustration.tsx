"use client";

/**
 * ChartIllustration — theme-aware SVG bar chart with trend line.
 * Used for dashboard/chart-related empty states.
 */
export function ChartIllustration({ size = 140 }: { size?: number }) {
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

      {/* Grid lines */}
      {[55, 70, 85, 100].map((y) => (
        <line key={y} x1="30" y1={y} x2="112" y2={y} stroke="var(--border)" strokeWidth="0.5" opacity="0.7" strokeDasharray="3 3" />
      ))}

      {/* Baseline */}
      <line x1="30" y1="105" x2="112" y2="105" stroke="var(--border)" strokeWidth="1" opacity="0.8" />
      <line x1="30" y1="40" x2="30" y2="105" stroke="var(--border)" strokeWidth="1" opacity="0.8" />

      {/* Bars with grow animation */}
      {[
        { x: 38, h: 30, delay: '0s' },
        { x: 52, h: 45, delay: '0.1s' },
        { x: 66, h: 25, delay: '0.2s' },
        { x: 80, h: 55, delay: '0.3s' },
        { x: 94, h: 38, delay: '0.4s' },
      ].map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={105 - bar.h}
          width="10"
          height={bar.h}
          rx="3"
          fill="var(--accent)"
          opacity="0.65"
          style={{
            animation: `bar-grow 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${bar.delay} both`,
            transformOrigin: 'bottom',
          }}
        />
      ))}

      {/* Trend line */}
      <path
        d="M43 80 L57 65 L71 82 L85 52 L99 68"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
        fill="none"
        strokeDasharray="120"
        style={{
          animation: 'donut-sweep 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both',
        }}
      />

      {/* Trend line dots */}
      {[
        { x: 43, y: 80 },
        { x: 57, y: 65 },
        { x: 71, y: 82 },
        { x: 85, y: 52 },
        { x: 99, y: 68 },
      ].map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r="3"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="1.5"
          opacity="0.85"
        />
      ))}

      {/* Floating percentage badge */}
      <g style={{ animation: 'float-gentle 4s ease-in-out 0.5s infinite' }}>
        <rect x="88" y="34" width="28" height="16" rx="8" fill="var(--success-soft)" stroke="var(--accent)" strokeWidth="1" opacity="0.75" />
        <text x="102" y="45" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--accent)" opacity="0.85">+12%</text>
      </g>

      {/* Sparkle */}
      <path d="M24 60L26 56L28 60L26 64Z" fill="var(--accent)" opacity="0.55" />
    </svg>
  );
}
