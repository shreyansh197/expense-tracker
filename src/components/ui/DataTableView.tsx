"use client";

import { useId, useState, type ReactNode } from "react";
import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<Row> {
  header: string;
  /** Exact display value for the cell — use the same formatter the chart uses. */
  cell: (row: Row) => string;
  align?: "start" | "end";
  /** Marks the column that names each row (rendered as `<th scope="row">`). */
  rowHeader?: boolean;
}

export interface DataTableViewProps<Row> {
  /** Chart name, used in the toggle's accessible name and the table caption. */
  title: string;
  /** Optional one-line summary appended to the caption (e.g. totals). */
  summary?: string;
  columns: DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row, index: number) => string;
  /** The visual chart, shown until the user switches to the table. */
  children: ReactNode;
  className?: string;
}

/**
 * Text alternative for a chart (M4 · T-4.2.1, DESIGN_SYSTEM §15.4 / §17.4).
 *
 * A keyboard-operable toggle swaps the chart for a semantic `role="table"`
 * built from the same rows the chart renders, so the values always match.
 * The change is announced through a polite live region. The table never
 * scrolls horizontally (DESIGN_SYSTEM §18.1); long tables scroll vertically
 * inside a focusable region.
 */
export function DataTableView<Row>({
  title,
  summary,
  columns,
  rows,
  getRowKey,
  children,
  className,
}: DataTableViewProps<Row>) {
  const [showTable, setShowTable] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const regionId = useId();
  const description = [title, summary]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.replace(/\.\s*$/, ""))
    .join(". ");

  const toggle = () => {
    const next = !showTable;
    setShowTable(next);
    setAnnouncement(next ? `${title}: showing data table with ${rows.length} rows.` : `${title}: showing chart.`);
  };

  return (
    <div className={className}>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={showTable}
          aria-controls={regionId}
          aria-label={`Data table for ${title}`}
          className={cn(
            "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
            "hover:bg-[var(--surface-secondary)]",
          )}
          style={{
            color: showTable ? "var(--accent)" : "var(--text-muted)",
            background: showTable ? "var(--accent-soft)" : "transparent",
          }}
        >
          <Table2 size={14} aria-hidden="true" />
          <span>Table</span>
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div id={regionId}>
        {showTable ? (
          <div
            className="max-h-72 overflow-y-auto rounded-lg"
            role="region"
            aria-label={`${title} data`}
            tabIndex={0}
            style={{ border: "1px solid var(--border-subtle, var(--border))" }}
          >
            <table role="table" className="w-full table-fixed border-collapse text-xs">
              <caption className="sr-only">{description}</caption>
              <thead className="sticky top-0" style={{ background: "var(--surface-secondary)" }}>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.header}
                      scope="col"
                      className={cn("px-2.5 py-2 font-semibold", col.align === "end" ? "text-right" : "text-left")}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={getRowKey(row, i)} style={{ borderTop: "1px solid var(--border-subtle, var(--border))" }}>
                    {columns.map((col) => {
                      const Cell = col.rowHeader ? "th" : "td";
                      return (
                        <Cell
                          key={col.header}
                          scope={col.rowHeader ? "row" : undefined}
                          className={cn(
                            "break-words px-2.5 py-2 align-top",
                            col.align === "end" ? "text-right font-numeric tabular-nums" : "text-left",
                            col.rowHeader && "font-medium",
                          )}
                          style={{ color: col.rowHeader ? "var(--text-primary)" : "var(--text-secondary)" }}
                        >
                          {col.cell(row)}
                        </Cell>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <p className="sr-only">{description}. Use the Table button for exact values.</p>
            {children}
          </>
        )}
      </div>
    </div>
  );
}
