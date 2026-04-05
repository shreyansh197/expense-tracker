"use client";

interface BalanceScaleFallbackProps {
  tilt?: number;
}

export function BalanceScaleFallback({ tilt = 50 }: BalanceScaleFallbackProps) {
  // Map tilt 0-100 → rotation -8° to 8°
  const angle = ((Math.min(Math.max(tilt, 0), 100) / 100) * 16) - 0;

  return (
    <svg width="56" height="48" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Balance scale">
      {/* Pedestal */}
      <polygon points="28,44 22,44 25,34 31,34 34,44" fill="#475569" />
      {/* Fulcrum */}
      <polygon points="28,18 24,34 32,34" fill="#64748b" />
      {/* Beam */}
      <g transform={`rotate(${angle} 28 18)`}>
        <rect x="6" y="17" width="44" height="2.5" rx="1" fill="#94a3b8" />
        {/* Left pan */}
        <ellipse cx="10" cy="28" rx="8" ry="2" fill="#d97706" opacity="0.8" />
        <line x1="10" y1="19" x2="10" y2="26" stroke="#475569" strokeWidth="1" />
        {/* Right pan */}
        <ellipse cx="46" cy="28" rx="8" ry="2" fill="#94a3b8" opacity="0.8" />
        <line x1="46" y1="19" x2="46" y2="26" stroke="#475569" strokeWidth="1" />
      </g>
    </svg>
  );
}
