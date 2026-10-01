"use client";

import { m } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { fadeUpSmall, staggerTight } from "@/lib/motion/variants";
import type { AnomalyResult } from "@/types";

interface AnomalyCalloutProps {
  anomalies: AnomalyResult[];
  formatCurrency: (n: number) => string;
  /** Category label map: id → label */
  categoryLabels: Record<string, string>;
}

const MAX_SHOWN = 5;

/**
 * Quiet, amber (never red) cards naming each unusual expense with a reason
 * string — icon + text, not colour alone (SCREEN_GUIDELINES §6, §10.6).
 */
export function AnomalyCallout({ anomalies, formatCurrency, categoryLabels }: AnomalyCalloutProps) {
  if (anomalies.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={14} aria-hidden="true" style={{ color: "var(--warning-text)" }} />
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Worth a look
        </h3>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }}>
          {anomalies.length}
          <span className="sr-only"> unusual {anomalies.length === 1 ? "expense" : "expenses"}</span>
        </span>
      </div>

      <m.ul className="space-y-2" variants={staggerTight} initial="initial" animate="animate">
        {anomalies.slice(0, MAX_SHOWN).map((a) => {
          const catLabel = categoryLabels[a.expense.category] ?? a.expense.category;
          const multiplier = a.categoryMedian > 0 ? (a.expense.amount / a.categoryMedian).toFixed(1) : null;
          const reason =
            a.zScore >= 3.5
              ? "well above your normal"
              : a.zScore >= 2.5
                ? `about ${multiplier ?? "2"}× your typical ${catLabel} spend`
                : "notably higher than your usual spending";

          return (
            <m.li
              key={a.expense.id}
              variants={fadeUpSmall}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: "var(--warning-soft)", border: "1px solid var(--warning-border)" }}
            >
              <span aria-hidden="true" className="mt-1.5 block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "var(--warning-text)" }} />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {a.expense.remark || catLabel}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {catLabel} · {reason}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(a.expense.amount)}
                  </p>
                  <p className="text-xs font-numeric" style={{ color: "var(--text-muted)" }}>
                    typical {formatCurrency(a.categoryMedian)}
                  </p>
                </div>
              </div>
            </m.li>
          );
        })}
      </m.ul>
    </div>
  );
}
