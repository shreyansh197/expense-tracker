"use client";

import { useMemo } from "react";
import { scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Line color. Default: var(--primary) */
  color?: string;
  /** Stroke width. Default: 1.5 */
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 64,
  height = 24,
  color = "var(--primary)",
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const points = useMemo(() => {
    if (data.length < 2) return [];
    const xScale = scaleLinear({ domain: [0, data.length - 1], range: [2, width - 2] });
    const yScale = scaleLinear({
      domain: [Math.min(...data), Math.max(...data, 1)],
      range: [height - 2, 2],
    });
    return data.map((v, i) => ({ x: xScale(i) ?? 0, y: yScale(v) ?? 0 }));
  }, [data, width, height]);

  if (points.length < 2) return null;

  return (
    <svg width={width} height={height} className={className} aria-hidden="true">
      <LinePath
        data={points}
        x={(d) => d.x}
        y={(d) => d.y}
        curve={curveMonotoneX}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
