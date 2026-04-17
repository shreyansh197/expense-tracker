"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TrendingUp, Minus, X, Target, Sparkles } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";

/**
 * Savings Goals Widget — terrain-styled dashboard card.
 * Shows progress rings, fund/withdraw modal, and inline progress bars.
 * Returns null when no goals exist.
 */
export function SavingsGoalsWidget() {
  const { settings, updateSettings } = useSettings();
  const { formatCurrency, symbol } = useCurrency();
  const { toast } = useToast();
  const goals = settings.goals || [];

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundMode, setFundMode] = useState<"add" | "subtract">("add");

  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (activeGoalId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeGoalId]);

  useEffect(() => {
    if (!activeGoalId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const activeGoal = goals.find((g) => g.id === activeGoalId);

  if (goals.length === 0) return null;

  return (
    <m.div
      className="card-terrain overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Fund Modal — portaled to body */}
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {activeGoalId && activeGoal && (
          <m.div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
            role="dialog"
            aria-modal="true"
            aria-label={`Fund ${activeGoal.name}`}
            initial={{ backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            exit={{ backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.2 }}
          >
            <m.div
              className="card-terrain w-full max-w-sm p-5 shadow-xl"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: activeGoal.color }} />
                  <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {activeGoal.name}
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  <span>{formatCurrency(activeGoal.savedAmount)} saved</span>
                  <span>of {formatCurrency(activeGoal.targetAmount)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-secondary)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.round((activeGoal.savedAmount / activeGoal.targetAmount) * 100), 100)}%`,
                      backgroundColor: activeGoal.color,
                    }}
                  />
                </div>
              </div>

              <div className="flex rounded-xl mb-3 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setFundMode("add")}
                  className="flex-1 py-2.5 text-xs font-medium transition-colors"
                  style={fundMode === "add"
                    ? { background: "var(--es-mist)", color: "var(--es-moss)" }
                    : { color: "var(--text-muted)" }
                  }
                >
                  <TrendingUp size={14} className="inline mr-1.5 -mt-0.5" />
                  Add
                </button>
                <button
                  onClick={() => setFundMode("subtract")}
                  className="flex-1 py-2.5 text-xs font-medium transition-colors"
                  style={fundMode === "subtract"
                    ? { background: "var(--accent-soft)", color: "var(--accent)" }
                    : { color: "var(--text-muted)" }
                  }
                >
                  <Minus size={14} className="inline mr-1.5 -mt-0.5" />
                  Remove
                </button>
              </div>

              <div className="relative mb-4">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>{symbol}</span>
                <input
                  ref={inputRef}
                  type="number"
                  min="1"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleFund(); }}
                  placeholder="Enter amount"
                  className="form-input w-full rounded-xl"
                  style={{ paddingLeft: "2rem" }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFund}
                  disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{
                    background: fundMode === "add"
                      ? "var(--primary-gradient)"
                      : "var(--accent-gradient)",
                  }}
                >
                  {fundMode === "add" ? "Add Funds" : "Remove Funds"}
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
                  style={{ color: "var(--text-secondary)", background: "var(--surface-secondary)" }}
                >
                  Cancel
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>,
      document.body,
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <Target size={15} style={{ color: "var(--es-moss)" }} />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Savings Goals
          </h3>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold font-numeric"
          style={{ background: "var(--es-mist)", color: "var(--es-moss)" }}
        >
          {overallPct}%
        </span>
      </div>

      {/* Overall progress */}
      <div className="mx-4 mt-3 mb-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-secondary)" }} role="progressbar" aria-valuenow={Math.min(overallPct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Overall savings progress">
          <m.div
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--es-moss)" }}
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
                    <span className="shrink-0 flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--es-moss)" }}>
                      <Sparkles size={12} /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveGoalId(g.id);
                        setFundAmount("");
                        setFundMode("add");
                      }}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors min-h-[44px]"
                      style={{ background: "var(--es-mist)", color: "var(--es-moss)" }}
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
