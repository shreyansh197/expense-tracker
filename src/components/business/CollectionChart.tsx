"use client";

import { useMemo } from "react";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { ParentSize } from "@visx/responsive";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";

interface CollectionChartProps {
  data: { month: string; received: number; expected: number }[];
}

const MARGIN = { top: 12, right: 8, bottom: 28, left: 8 };

function Chart({ data, width, height }: { data: CollectionChartProps["data"]; width: number; height: number }) {
  const formatted = useMemo(
    () => data.map((d) => ({
      ...d,
      label: new Date(d.month + "-01").toLocaleDateString(undefined, { month: "short" }),
    })),
    [data],
  );

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const xScale = useMemo(
    () => scaleBand<string>({ domain: formatted.map((d) => d.label), range: [0, innerW], padding: 0.3 }),
    [formatted, innerW],
  );

  const maxVal = Math.max(...formatted.map((d) => Math.max(d.expected, d.received)), 1);
  const yScale = useMemo(
    () => scaleLinear<number>({ domain: [0, maxVal], range: [innerH, 0] }),
    [maxVal, innerH],
  );

  const barWidth = (xScale.bandwidth() - 2) / 2;

  return (
    <svg width={width} height={height}>
      <Group left={MARGIN.left} top={MARGIN.top}>
        {formatted.map((d) => {
          const x = xScale(d.label) ?? 0;
          const expectedH = innerH - (yScale(d.expected) ?? 0);
          const receivedH = innerH - (yScale(d.received) ?? 0);
          return (
            <Group key={d.label}>
              <Bar
                x={x}
                y={innerH - expectedH}
                width={barWidth}
                height={expectedH}
                rx={3}
                fill="var(--surface-tertiary)"
              />
              <Bar
                x={x + barWidth + 2}
                y={innerH - receivedH}
                width={barWidth}
                height={receivedH}
                rx={3}
                fill="var(--success)"
              />
              <text
                x={x + xScale.bandwidth() / 2}
                y={innerH + 16}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize={10}
              >
                {d.label}
              </text>
            </Group>
          );
        })}
      </Group>
    </svg>
  );
}

export function CollectionChart({ data }: CollectionChartProps) {
  if (data.length === 0) return (
    <div className="card-stone p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Monthly Collections</h3>
      <EmptyState
        icon={BarChart3}
        title="No collection data"
        description="Collection history will appear here once payments are recorded."
      />
    </div>
  );

  return (
    <div className="card-stone p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        Monthly Collections
      </h3>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--surface-tertiary)" }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Expected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--success)" }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Received</span>
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ParentSize>{({ width, height }) => <Chart data={data} width={width} height={height} />}</ParentSize>
      </div>
    </div>
  );
}
