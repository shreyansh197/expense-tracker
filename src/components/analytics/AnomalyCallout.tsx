"use client";

import { m } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { AnomalyResult } from "@/types";

interface AnomalyCalloutProps {
  anomalies: AnomalyResult[];
  formatCurrency: (n: number) => string;
  /** Category label map: id → label */
  categoryLabels: Record<string, string>;
}

export function AnomalyCallout({ anomalies, formatCurrency, categoryLabels }: AnomalyCalloutProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Spending Anomalies
        </h4>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ background: "rgba(245,158,11,0.15)", color: "var(--accent)" }}
        >
          {anomalies.length}
        </span>
      </div>

      {anomalies.slice(0, 5).map((a, i) => {
        const catLabel = categoryLabels[a.expense.category] ?? a.expense.category;
        const sigma = a.zScore.toFixed(1);

        return (
          <m.div
            key={a.expense.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl p-3 flex items-start gap-3"
            style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)",
              boxShadow: "0 0 12px rgba(245,158,11,0.08)",
            }}
          >
            {/* Amber pulse dot */}
            <div className="relative mt-0.5 shrink-0">
              <span
                className="block h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="absolute inset-0 animate-ping rounded-full opacity-40"
                style={{ background: "var(--accent)", animationDuration: "2s" }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {a.expense.remark || catLabel}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {catLabel} · {sigma}σ above 30-day avg
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold font-numeric" style={{ color: "var(--accent)" }}>
                    {formatCurrency(a.expense.amount)}
                  </p>
                  <p className="text-xs font-numeric" style={{ color: "var(--text-muted)" }}>
                    avg {formatCurrency(a.categoryMedian)}
                  </p>
                </div>
              </div>
            </div>
          </m.div>
        );
      })}
    </div>
  );
}
