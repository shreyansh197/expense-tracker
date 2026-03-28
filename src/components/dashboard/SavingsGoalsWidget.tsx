"use client";

import { useState } from "react";
import { PiggyBank, TrendingUp, Minus, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";

export function SavingsGoalsWidget() {
  const { settings, updateSettings } = useSettings();
  const { formatCurrency, symbol } = useCurrency();
  const { toast } = useToast();
  const goals = settings.goals || [];

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundMode, setFundMode] = useState<"add" | "subtract">("add");

  if (goals.length === 0) return null;

  const handleFund = () => {
    if (!activeGoalId) return;
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    const updated = goals.map((g) => {
      if (g.id !== activeGoalId) return g;
      const newSaved =
        fundMode === "add"
          ? Math.min(g.savedAmount + amt, g.targetAmount)
          : Math.max(g.savedAmount - amt, 0);
      return { ...g, savedAmount: newSaved };
    });
    updateSettings({ goals: updated });
    toast(
      fundMode === "add"
        ? `+${formatCurrency(amt)} added`
        : `${formatCurrency(amt)} removed`,
    );
    setActiveGoalId(null);
    setFundAmount("");
    setFundMode("add");
  };

  const handleCancel = () => {
    setActiveGoalId(null);
    setFundAmount("");
    setFundMode("add");
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank size={15} className="text-emerald-500" />
          <h3 className="text-section-title">
            Savings Goals
          </h3>
          <span className="tabular-nums rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            {overallPct}%
          </span>
        </div>
        <Link
          href="/settings#goals"
          className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          Manage
          <ChevronRight size={12} />
        </Link>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }}>
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${Math.min(overallPct, 100)}%` }}
        />
      </div>

      {/* Goal list */}
      <div className="space-y-3">
        {goals.map((g) => {
          const pct =
            g.targetAmount > 0
              ? Math.round((g.savedAmount / g.targetAmount) * 100)
              : 0;
          const isComplete = pct >= 100;
          const isActive = activeGoalId === g.id;

          return (
            <div key={g.id} className="space-y-1.5">
              {/* Goal row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {g.name}
                  </span>
                  {isComplete && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      Done!
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="tabular-nums whitespace-nowrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {formatCurrency(g.savedAmount)}{" "}
                    <span style={{ color: 'var(--text-muted)' }}>/</span>{" "}
                    {formatCurrency(g.targetAmount)}
                  </span>
                  {!isComplete && (
                    <button
                      onClick={() => {
                        if (isActive) {
                          handleCancel();
                        } else {
                          setActiveGoalId(g.id);
                          setFundAmount("");
                          setFundMode("add");
                        }
                      }}
                      className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                    >
                      {isActive ? "Cancel" : "+ Add"}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: g.color,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>{pct}% complete</span>
                {g.deadline && (
                  <span>
                    Target:{" "}
                    {new Date(g.deadline + "-01").toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Inline fund form */}
              {isActive && (
                <div className="flex items-center gap-2 rounded-lg p-2" style={{ background: 'var(--surface-secondary)' }}>
                  {/* Add / Subtract toggle */}
                  <div className="flex overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setFundMode("add")}
                      title="Add funds"
                      className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        fundMode === "add"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : ""
                      }`}
                      style={fundMode !== "add" ? { color: 'var(--text-muted)' } : undefined}
                      onMouseEnter={e => { if (fundMode !== 'add') e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { if (fundMode !== 'add') e.currentTarget.style.background = ''; }}
                    >
                      <TrendingUp size={12} />
                    </button>
                    <button
                      onClick={() => setFundMode("subtract")}
                      title="Remove funds"
                      className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        fundMode === "subtract"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                          : ""
                      }`}
                      style={fundMode !== "subtract" ? { color: 'var(--text-muted)' } : undefined}
                      onMouseEnter={e => { if (fundMode !== 'subtract') e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { if (fundMode !== 'subtract') e.currentTarget.style.background = ''; }}
                    >
                      <Minus size={12} />
                    </button>
                  </div>

                  {/* Amount input */}
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>{symbol}</span>
                    <input
                      type="number"
                      min="1"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFund();
                        if (e.key === "Escape") handleCancel();
                      }}
                      autoFocus
                      placeholder="Amount"
                      className="form-input w-full py-1.5 pl-6 pr-2 text-xs"
                    />
                  </div>

                  <button
                    onClick={handleFund}
                    disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                    className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Save
                  </button>

                  <button
                    onClick={handleCancel}
                    className="shrink-0 rounded-lg p-1.5 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                    aria-label="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
