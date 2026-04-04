"use client";

/**
 * Static SVG coin fallback — used during SSR, reduced motion, or old browsers
 * where @react-three/fiber isn't available.
 */
export function CoinFallback() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Coin illustration"
    >
      {/* Coin body */}
      <circle cx="48" cy="48" r="40" fill="#f59e0b" />
      {/* Rim */}
      <circle cx="48" cy="48" r="40" stroke="#d97706" strokeWidth="3" fill="none" />
      {/* Inner ring */}
      <circle cx="48" cy="48" r="33" stroke="#d97706" strokeWidth="1" strokeOpacity="0.4" fill="none" />
      {/* Dollar sign */}
      <text
        x="48"
        y="56"
        textAnchor="middle"
        fontSize="36"
        fontWeight="bold"
        fill="#92400e"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>
    </svg>
  );
}
