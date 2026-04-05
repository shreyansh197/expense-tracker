"use client";

interface GoalRingFallbackProps {
  progress?: number;
  color?: string;
}

/** Static SVG ring fallback — arc proportional to progress */
export function GoalRingFallback({ progress = 0, color = "#10b981" }: GoalRingFallbackProps) {
  const pct = Math.min(Math.max(progress, 0), 100);
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const arcLen = (pct / 100) * circumference;

  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Goal progress ring"
    >
      {/* Track */}
      <circle cx="24" cy="24" r={r} stroke="#e2e8f0" strokeWidth="4" opacity={0.4} />
      {/* Progress arc */}
      <circle
        cx="24"
        cy="24"
        r={r}
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference}`}
        transform="rotate(-90 24 24)"
        opacity={0.75}
      />
    </svg>
  );
}
