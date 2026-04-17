"use client";

import { useMemo } from "react";
import { scaleLinear, scaleBand } from "@visx/scale";
import { Group } from "@visx/group";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface TerrainBarGroupProps {
  data: BarDatum[];
  width: number;
  height: number;
  /** Default bar color if datum doesn't specify one */
  color?: string;
  /** Border radius on bar tops. Default: 4 */
  barRadius?: number;
  /** Gap between bars as 0–1 ratio. Default: 0.3 */
  padding?: number;
  className?: string;
}

export function TerrainBarGroup({
  data,
  width,
  height,
  color = "var(--primary)",
  barRadius = 4,
  padding = 0.3,
  className,
}: TerrainBarGroupProps) {
  const margin = { top: 4, bottom: 4, left: 0, right: 0 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { xScale, yScale } = useMemo(() => {
    const values = data.map((d) => d.value);
    return {
      xScale: scaleBand<string>({
        domain: data.map((d) => d.label),
        range: [0, innerWidth],
        padding,
      }),
      yScale: scaleLinear<number>({
        domain: [0, Math.max(...values, 1)],
        range: [innerHeight, 0],
        nice: true,
      }),
    };
  }, [data, innerWidth, innerHeight, padding]);

  if (width < 10 || data.length === 0) return null;

  return (
    <svg width={width} height={height} className={className} aria-hidden="true">
      <Group left={margin.left} top={margin.top}>
        {data.map((d) => {
          const barX = xScale(d.label) ?? 0;
          const barWidth = xScale.bandwidth();
          const barY = yScale(d.value) ?? 0;
          const barHeight = innerHeight - barY;
          return (
            <rect
              key={d.label}
              x={barX}
              y={barY}
              width={barWidth}
              height={Math.max(barHeight, 0)}
              rx={barRadius}
              ry={barRadius}
              fill={d.color ?? color}
              style={{
                transition:
                  "height 0.5s cubic-bezier(0.22, 1, 0.36, 1), y 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          );
        })}
      </Group>
    </svg>
  );
}
