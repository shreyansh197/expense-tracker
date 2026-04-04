"use client";

/** Static SVG gem/diamond fallback, 40×40 */
export function LoadingGemFallback() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Loading"
    >
      {/* Diamond shape */}
      <polygon
        points="20,4 36,20 20,36 4,20"
        fill="#2ec4b6"
        opacity="0.8"
      />
      <polygon
        points="20,4 36,20 20,36 4,20"
        stroke="#26a69a"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner facet lines */}
      <line x1="20" y1="4" x2="20" y2="36" stroke="#26a69a" strokeWidth="0.5" opacity="0.4" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="#26a69a" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}
