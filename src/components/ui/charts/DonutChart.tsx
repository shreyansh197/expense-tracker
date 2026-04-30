"use client";

import { useMemo } from "react";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Gap angle (degrees) between segments. Default: 3 */
  gap?: number;
  /** When true, SVG fills its container width (up to max-w-[300px]) */
  responsive?: boolean;
  className?: string;
}

export function DonutChart({
  data,
  size = 120,
  thickness = 16,
  gap = 3,
  responsive = false,
  className,
}: DonutChartProps) {
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0);

  const segments = useMemo(() => {
    if (total === 0) return [];
    const gapRad = (gap * Math.PI) / 180;
    const totalGap = gapRad * data.length;
    const available = 2 * Math.PI - totalGap;
    let currentAngle = -Math.PI / 2; // start at top

    return data.map((d) => {
      const fraction = d.value / total;
      const segmentAngle = fraction * available;
      const dashLength = segmentAngle * radius;
      const dashGap = circumference - dashLength;
      const rotation = (currentAngle * 180) / Math.PI;
      currentAngle += segmentAngle + gapRad;

      return {
        ...d,
        dashArray: `${dashLength} ${dashGap}`,
        rotation,
      };
    });
  }, [data, total, gap, radius, circumference]);

  if (data.length === 0) return null;

  return (
    <svg
      width={responsive ? "100%" : size}
      height={responsive ? "100%" : size}
      viewBox={`0 0 ${size} ${size}`}
      className={responsive ? `max-w-[300px] ${className ?? ""}` : className}
      aria-hidden="true"
    >
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={thickness}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${seg.rotation} ${center} ${center})`}
          style={{
            transition: "stroke-dasharray 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      ))}
    </svg>
  );
}
