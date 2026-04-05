"use client";

const STATUS_COLORS: Record<string, string> = {
  safe: "#10b981",
  caution: "#f59e0b",
  danger: "#ef4444",
};

interface BudgetJarFallbackProps {
  level?: number;
  status?: "safe" | "caution" | "danger";
}

/** Static SVG jar fallback — colored fill proportional to level */
export function BudgetJarFallback({ level = 50, status = "safe" }: BudgetJarFallbackProps) {
  const fill = STATUS_COLORS[status] ?? STATUS_COLORS.safe;
  // Map level (0-100) to a y offset within the jar body (y: 12 at bottom, y: 42 at top → 30px range)
  const jarBottom = 42;
  const jarRange = 30;
  const waterHeight = (Math.min(Math.max(level, 2), 100) / 100) * jarRange;
  const waterY = jarBottom - waterHeight;

  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Budget jar"
    >
      {/* Jar body outline */}
      <rect x="12" y="12" width="32" height="32" rx="4" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      {/* Rim */}
      <rect x="10" y="10" width="36" height="4" rx="2" fill="#cbd5e1" />
      {/* Water fill clipped to jar */}
      <clipPath id="jar-clip">
        <rect x="13" y="13" width="30" height="30" rx="3" />
      </clipPath>
      <rect
        x="13"
        y={waterY}
        width="30"
        height={waterHeight + 1}
        fill={fill}
        opacity={0.55}
        clipPath="url(#jar-clip)"
      />
    </svg>
  );
}
