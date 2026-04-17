"use client";

import { useMemo } from "react";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { Group } from "@visx/group";

export interface AreaDatum {
  date: Date | number;
  value: number;
}

interface AreaChartProps {
  data: AreaDatum[];
  width: number;
  height: number;
  /** CSS color for the line stroke. Default: var(--primary) */
  strokeColor?: string;
  /** CSS color for the gradient fill start. Default: var(--primary) */
  fillColorFrom?: string;
  /** CSS color for the gradient fill end (bottom). Default: transparent */
  fillColorTo?: string;
  /** Stroke width. Default: 2 */
  strokeWidth?: number;
  /** Top/bottom margin. Default: 4 */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Unique ID for gradient (required if multiple charts on page) */
  id?: string;
}

const getDate = (d: AreaDatum) => (d.date instanceof Date ? d.date : new Date(d.date));
const getValue = (d: AreaDatum) => d.value;

export function AreaChart({
  data,
  width,
  height,
  strokeColor = "var(--primary)",
  fillColorFrom = "var(--primary)",
  fillColorTo = "transparent",
  strokeWidth = 2,
  margin = {},
  id = "area-gradient",
}: AreaChartProps) {
  const { top = 4, right = 0, bottom = 4, left = 0 } = margin;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  const { xScale, yScale } = useMemo(() => {
    if (data.length === 0)
      return {
        xScale: scaleTime({ domain: [new Date(), new Date()], range: [0, innerWidth] }),
        yScale: scaleLinear({ domain: [0, 1], range: [innerHeight, 0] }),
      };

    const dates = data.map(getDate);
    const values = data.map(getValue);
    return {
      xScale: scaleTime({
        domain: [Math.min(...dates.map((d) => d.getTime())), Math.max(...dates.map((d) => d.getTime()))],
        range: [0, innerWidth],
      }),
      yScale: scaleLinear({
        domain: [0, Math.max(...values) * 1.1],
        range: [innerHeight, 0],
        nice: true,
      }),
    };
  }, [data, innerWidth, innerHeight]);

  if (width < 10 || data.length < 2) return null;

  return (
    <svg width={width} height={height} aria-hidden="true">
      <LinearGradient id={id} from={fillColorFrom} to={fillColorTo} fromOpacity={0.3} toOpacity={0} />
      <Group left={left} top={top}>
        <AreaClosed
          data={data}
          x={(d) => xScale(getDate(d)) ?? 0}
          y={(d) => yScale(getValue(d)) ?? 0}
          yScale={yScale}
          curve={curveMonotoneX}
          fill={`url(#${id})`}
        />
        <LinePath
          data={data}
          x={(d) => xScale(getDate(d)) ?? 0}
          y={(d) => yScale(getValue(d)) ?? 0}
          curve={curveMonotoneX}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Group>
    </svg>
  );
}
