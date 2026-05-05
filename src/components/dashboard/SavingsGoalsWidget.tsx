"use client";

import { useState } from "react";
import { Target, Sparkles } from "lucide-react";
import { m } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import { GoalFundingSheet } from "@/components/goals/GoalFundingSheet";
import type { Goal } from "@/types";

/**
 * Savings Goals Widget — terrain-styled dashboard card.
 * Shows progress rings, fund/withdraw sheet, and inline progress bars.
 * Returns null when no goals exist.
 */
export function SavingsGoalsWidget() {
  const { settings, updateSettings } = useSettings();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const goals = settings.goals || [];

  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  const handleFundSave = (goalId: string, newSaved: number) => {
    const goal = goals.find((g) => g.id === goalId);
    const prev = goal?.savedAmount ?? 0;
    const updated = goals.map((g) =>
      g.id === goalId ? { ...g, savedAmount: newSaved } : g
    );
    updateSettings({ goals: updated });
    toast(newSaved > prev ? `+${formatCurrency(newSaved - prev)} added` : `${formatCurrency(prev - newSaved)} removed`);
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  if (goals.length === 0) return null;

  return (
    <m.div
      className="card-terrain overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GoalFundingSheet
        goal={activeGoal}
        onClose={() => setActiveGoal(null)}
        onSave={handleFundSave}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <Target size={15} style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Savings Goals
          </h3>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold font-numeric"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {overallPct}%
        </span>
      </div>

      {/* Overall progress */}
      <div className="mx-4 mt-3 mb-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-secondary)" }} role="progressbar" aria-valuenow={Math.min(overallPct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Overall savings progress">
          <m.div
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(overallPct, 100)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="font-numeric">{formatCurrency(totalSaved)}</span>
          <span className="font-numeric">{formatCurrency(totalTarget)}</span>
        </div>
      </div>

      {/* Goal list */}
      <div className="p-4 pt-2 space-y-3">
        {goals.map((g) => {
          const pct =
            g.targetAmount > 0
              ? Math.round((g.savedAmount / g.targetAmount) * 100)
              : 0;
          const isComplete = pct >= 100;

          return (
            <div key={g.id} className="flex items-center gap-3">
              {/* Progress ring */}
              <svg className="shrink-0" width="40" height="40" viewBox="0 0 40 40" aria-hidden>
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--surface-secondary)" strokeWidth="3.5" />
                <m.circle
                  cx="20" cy="20" r="17" fill="none"
                  stroke={g.color} strokeWidth="3.5" strokeLinecap="round"
                  initial={{ strokeDasharray: "0 106.8" }}
                  animate={{ strokeDasharray: `${Math.min(pct, 100) * 1.068} 106.8` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  transform="rotate(-90 20 20)"
                />
                {isComplete ? (
                  <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="12">✓</text>
                ) : (
                  <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fill={g.color} fontSize="9" fontWeight="700" className="font-numeric">{pct}%</text>
                )}
              </svg>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {g.name}
                  </span>
                  {isComplete ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      <Sparkles size={12} /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveGoal(g);
                      }}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors min-h-[44px]"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      + Fund
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-xs font-numeric" style={{ color: "var(--text-muted)" }}>
                  {formatCurrency(g.savedAmount)} / {formatCurrency(g.targetAmount)}
                  {g.deadline && (
                    <span> · {new Date(g.deadline + "-01").toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </m.div>
  );
}
