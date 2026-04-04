"use client";

/** Static SVG fallback for the success coin flip — small gold circle with checkmark */
export function SuccessCoinFlipFallback() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Success"
    >
      <circle cx="20" cy="20" r="17" fill="#f59e0b" />
      <circle cx="20" cy="20" r="17" stroke="#d97706" strokeWidth="2" fill="none" />
      <path
        d="M13 20l4 4 10-10"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
