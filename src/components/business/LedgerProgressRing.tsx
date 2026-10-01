"use client";

import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { DataTableView, type DataTableColumn } from "@/components/ui/DataTableView";

interface LedgerProgressRingProps {
  received: number;
  expected: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /**
   * Render the "Table" toggle with an exact received / expected / collected
   * breakdown. Leave off inside links and cards (a toggle cannot nest inside a
   * link); the progressbar's accessible value still carries the numbers there.
   */
  withDataTable?: boolean;
}

interface CollectionRow {
  received: number;
  expected: number;
  percent: number;
}

export function LedgerProgressRing({
  received,
  expected,
  size = 48,
  strokeWidth = 4,
  className,
  withDataTable = false,
}: LedgerProgressRingProps) {
  const { formatCurrency } = useCurrency();
  const percent = expected > 0 ? Math.min((received / expected) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const valueText = expected > 0
    ? `${Math.round(percent)}% collected — ${formatCurrency(received)} of ${formatCurrency(expected)}`
    : `${formatCurrency(received)} received, no target set`;

  const color =
    percent >= 100
      ? "text-[var(--biz-accent-text)]"
      : percent >= 50
      ? "text-[var(--biz-pending-text)]"
      : percent > 0
      ? "text-[var(--warning-text)]"
      : "";

  const ring = (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="progressbar"
      aria-label="Collected"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueText}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={percent > 0 ? "currentColor" : "var(--text-muted)"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-[stroke-dashoffset] duration-700", color || undefined)}
        />
      </svg>
      <span aria-hidden="true" className="absolute text-xs font-bold" style={{ color: "var(--text-primary)" }}>
        {Math.round(percent)}%
      </span>
    </div>
  );

  if (!withDataTable) return ring;

  const columns: DataTableColumn<CollectionRow>[] = [
    { header: "Received", align: "end", cell: (r) => formatCurrency(r.received) },
    { header: "Expected", align: "end", cell: (r) => (r.expected > 0 ? formatCurrency(r.expected) : "No target") },
    { header: "Collected", align: "end", cell: (r) => `${Math.round(r.percent)}%` },
  ];

  return (
    <DataTableView
      title="Ledger collection progress"
      columns={columns}
      rows={[{ received, expected, percent }]}
      getRowKey={() => "collection"}
      // In a wrapping flex row the open table takes the full line instead of the ring's narrow column.
      className="has-[table]:basis-full"
    >
      {ring}
    </DataTableView>
  );
}
