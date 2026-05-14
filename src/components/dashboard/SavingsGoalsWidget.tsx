"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Target, Sparkles, Plus, Check, X } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import { GoalFundingSheet } from "@/components/goals/GoalFundingSheet";
import type { Goal } from "@/types";

const GOAL_COLORS = ["#F59E0B", "#10B981", "#6366F1", "#EC4899", "#3B82F6", "#EF4444"];

/**
 * Savings Goals Widget — terrain-styled dashboard card.
 * Shows progress rings, fund/withdraw sheet, and inline progress bars.
 * Returns null when no goals exist.
 */
export function SavingsGoalsWidget() {
  const { settings, updateSettings } = useSettings();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const goals = useMemo(() => settings.goals || [], [settings.goals]);

  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newColor, setNewColor] = useState(GOAL_COLORS[0]);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleFundSave = (goalId: string, newSaved: number) => {
    const goal = goals.find((g) => g.id === goalId);
    const prev = goal?.savedAmount ?? 0;
    const updated = goals.map((g) =>
      g.id === goalId ? { ...g, savedAmount: newSaved } : g
    );
    updateSettings({ goals: updated });
    toast(newSaved > prev ? `+${formatCurrency(newSaved - prev)} added` : `${formatCurrency(prev - newSaved)} removed`);
  };

  const handleCreateGoal = useCallback(() => {
    const trimmedName = newName.trim();
    const targetAmt = parseFloat(newTarget);
    if (!trimmedName || !targetAmt || targetAmt <= 0) return;
    const newGoal: Goal = {
      id: `goal-${trimmedName.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      targetAmount: targetAmt,
      savedAmount: 0,
      color: newColor,
      deadline: undefined,
      createdAt: Date.now(),
    };
    updateSettings({ goals: [...goals, newGoal] });
    toast(`Goal "${trimmedName}" created`);
    setNewName("");
    setNewTarget("");
    setNewColor(GOAL_COLORS[0]);
    setShowCreate(false);
  }, [newName, newTarget, newColor, goals, updateSettings, toast]);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  if (goals.length === 0 && !showCreate) {
    return (
      <m.div
        className="card-terrain overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Target size={15} style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Savings Goals
            </h3>
          </div>
          <button
            onClick={() => { setShowCreate(true); setTimeout(() => nameRef.current?.focus(), 50); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            aria-label="Add savings goal"
          >
            <Plus size={13} /> New Goal
          </button>
        </div>
        <AnimatePresence>{showCreate && renderCreateForm()}</AnimatePresence>
      </m.div>
    );
  }

  function renderCreateForm() {
    return (
      <m.div
        key="create-form"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="mx-4 mb-4 flex flex-col gap-2 rounded-xl p-3" style={{ background: "var(--surface-secondary)" }}>
          <input
            ref={nameRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateGoal(); if (e.key === "Escape") setShowCreate(false); }}
            placeholder="Goal name (e.g. Emergency Fund)"
            maxLength={48}
            className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
            aria-label="Goal name"
          />
          <input
            type="number"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateGoal(); }}
            placeholder="Target amount"
            min={1}
            className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
            aria-label="Target amount"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className="h-5 w-5 rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: newColor === c ? "scale(1.3)" : "scale(1)",
                    outline: newColor === c ? "2px solid var(--accent)" : "none",
                    outlineOffset: "1px",
                  }}
                  aria-label={`Color ${c}`}
                  aria-pressed={newColor === c}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewName(""); setNewTarget(""); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ background: "var(--surface-tertiary)", color: "var(--text-muted)" }}
                aria-label="Cancel"
              >
                <X size={13} />
              </button>
              <button
                type="button"
                onClick={handleCreateGoal}
                disabled={!newName.trim() || !newTarget || parseFloat(newTarget) <= 0}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#fff" }}
                aria-label="Save goal"
              >
                <Check size={13} />
              </button>
            </div>
          </div>
        </div>
      </m.div>
    );
  }

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowCreate((v) => !v); setTimeout(() => nameRef.current?.focus(), 50); }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
            style={{ background: "var(--surface-secondary)", color: "var(--text-muted)" }}
            aria-label="Add savings goal"
          >
            <Plus size={12} />
          </button>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold font-numeric"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {overallPct}%
          </span>
        </div>
      </div>

      {/* Inline new-goal form */}
      <AnimatePresence>{showCreate && renderCreateForm()}</AnimatePresence>

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
