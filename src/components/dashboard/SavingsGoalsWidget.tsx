"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TrendingUp, Minus, ChevronRight, X } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { IconGoals } from "@/components/ui/icons";
import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import { GrowthGraphic } from "@/components/ui/illustrations";
import { BuilderCharacter } from "@/components/ui/illustrations/characters";


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

  // Focus the input when modal opens
  useEffect(() => {
    if (activeGoalId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeGoalId]);

  // Close modal on Escape
  useEffect(() => {
    if (!activeGoalId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const activeGoal = goals.find((g) => g.id === activeGoalId);

  if (goals.length === 0) return null;

  return (
    <div className="card relative overflow-hidden p-5">
      {/* Fund Modal — portaled to body to escape overflow-hidden */}
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {activeGoalId && activeGoal && (
          <m.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
              className="w-full max-w-sm rounded-2xl p-5 shadow-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: activeGoal.color }} />
                  <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {activeGoal.name}
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress info */}
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

              {/* Add / Subtract toggle */}
              <div className="flex rounded-lg mb-3" style={{ border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setFundMode("add")}
                  className={`flex-1 py-2 text-xs font-medium rounded-l-lg transition-colors ${
                    fundMode === "add" ? "bg-ok-soft text-ok-text" : ""
                  }`}
                  style={fundMode !== "add" ? { color: "var(--text-muted)" } : undefined}
                >
                  <TrendingUp size={14} className="inline mr-1.5 -mt-0.5" />
                  Add Funds
                </button>
                <button
                  onClick={() => setFundMode("subtract")}
                  className={`flex-1 py-2 text-xs font-medium rounded-r-lg transition-colors ${
                    fundMode === "subtract" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : ""
                  }`}
                  style={fundMode !== "subtract" ? { color: "var(--text-muted)" } : undefined}
                >
                  <Minus size={14} className="inline mr-1.5 -mt-0.5" />
                  Remove Funds
                </button>
              </div>

              {/* Amount input */}
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
                  className="form-input w-full"
                  style={{ paddingLeft: "2rem" }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFund}
                  disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
                  style={{
                    background: fundMode === "add"
                      ? "linear-gradient(135deg, #2EC4B6 0%, #26a69a 100%)"
                      : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    boxShadow: fundMode === "add"
                      ? "0 4px 12px rgba(46,196,182,0.3)"
                      : "0 4px 12px rgba(239,68,68,0.3)",
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
      {/* BuilderCharacter — growth archetype for savings (density: 1 char + 1 art max) */}
      <div className="pointer-events-none absolute right-2 top-6 opacity-25 sm:opacity-40 scale-75 sm:scale-100 origin-top-right">
        <BuilderCharacter size={72} />
      </div>
      {/* Abstract growth graphic — hidden when character is visible (density cap: 1 char + 1 art max) */}
      <div className="pointer-events-none absolute right-3 top-2 hidden">
        <GrowthGraphic />
      </div>

      {/* Header */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconGoals size={15} className="text-ok" />
          <h3 className="text-section-title">
            Savings Goals
          </h3>
          <span className="text-amount rounded-full bg-ok-soft px-2 py-0.5 text-xs font-bold text-ok-text">
            {overallPct}%
          </span>
        </div>
        <Link
          href="/settings#goals"
          className="flex items-center gap-0.5 text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
        >
          Manage
          <ChevronRight size={12} />
        </Link>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }} role="progressbar" aria-valuenow={Math.min(overallPct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Overall savings progress">
        <div
          className="h-full rounded-full bg-ok transition-all duration-500"
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

          return (
            <div key={g.id} className="flex items-start gap-3">
              {/* Circular progress ring (SVG) */}
              <svg className="shrink-0 mt-1" width="40" height="40" viewBox="0 0 40 40" aria-hidden>
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--surface-secondary)" strokeWidth="4" />
                <circle
                  cx="20" cy="20" r="17" fill="none"
                  stroke={g.color} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${pct * 1.068} 106.8`}
                  transform="rotate(-90 20 20)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
                <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fill={g.color} fontSize="9" fontWeight="700">{Math.round(pct)}%</text>
              </svg>
              {/* Goal details */}
              <div className="min-w-0 flex-1 space-y-1.5">
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
                    <span className="shrink-0 rounded-full bg-ok-soft px-1.5 py-0.5 text-xs font-semibold text-ok-text">
                      Done!
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-amount whitespace-nowrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {formatCurrency(g.savedAmount)}{" "}
                    <span style={{ color: 'var(--text-muted)' }}>/</span>{" "}
                    {formatCurrency(g.targetAmount)}
                  </span>
                  {!isComplete && (
                    <button
                      onClick={() => {
                        setActiveGoalId(g.id);
                        setFundAmount("");
                        setFundMode("add");
                      }}
                      className="rounded-md bg-ok-soft px-2 py-0.5 text-xs font-medium text-ok-text transition-colors hover:bg-ok-soft-hover"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }} role="progressbar" aria-valuenow={Math.min(pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.name} progress`}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: g.color,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{pct}% complete</span>
                {g.deadline && (
                  <span>
                    Target:{" "}
                    {new Date(g.deadline + "-01").toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              </div>{/* end goal details */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
