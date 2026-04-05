"use client";

interface HourglassFallbackProps {
  progress?: number;
}

export function HourglassFallback({ progress = 50 }: HourglassFallbackProps) {
  const pct = Math.min(Math.max(progress, 0), 100);
  const topH = Math.round((1 - pct / 100) * 12);
  const bottomH = Math.round((pct / 100) * 12);

  return (
    <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Time remaining">
      {/* Frame */}
      <rect x="6" y="1" width="20" height="3" rx="1" fill="#64748b" />
      <rect x="6" y="32" width="20" height="3" rx="1" fill="#64748b" />
      {/* Glass outline */}
      <path d="M9 4 L16 17 L23 4" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <path d="M9 32 L16 19 L23 32" stroke="#94a3b8" strokeWidth="1" fill="none" />
      {/* Top sand */}
      {topH > 0 && (
        <rect x={16 - topH / 2} y={4} width={topH} height={topH} rx="1" fill="#d97706" opacity="0.6" />
      )}
      {/* Bottom sand */}
      {bottomH > 0 && (
        <rect x={16 - bottomH / 2} y={32 - bottomH} width={bottomH} height={bottomH} rx="1" fill="#d97706" opacity="0.6" />
      )}
    </svg>
  );
}
