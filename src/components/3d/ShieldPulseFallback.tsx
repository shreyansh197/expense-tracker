"use client";

const STATUS_COLORS: Record<string, string> = {
  caution: "#f59e0b",
  danger: "#ef4444",
};

interface ShieldPulseFallbackProps {
  status?: "caution" | "danger";
}

export function ShieldPulseFallback({ status = "caution" }: ShieldPulseFallbackProps) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.caution;

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Budget warning">
      <path
        d="M18 4C18 4 6 8 6 18c0 6 5.5 11 12 14 6.5-3 12-8 12-14 0-10-12-14-12-14z"
        fill={color}
        opacity="0.25"
        stroke={color}
        strokeWidth="1.5"
      />
      <text x="18" y="22" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">!</text>
    </svg>
  );
}
