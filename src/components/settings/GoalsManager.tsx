"use client";

import { useState } from "react";
import { Plus, Trash2, X, Pencil, TrendingUp, Minus, Target } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useCurrency } from "@/hooks/useCurrency";
import { PRESET_COLORS } from "@/lib/categories";
import type { Goal } from "@/types";

export function GoalsManager() {
  const { formatCurrency, symbol } = useCurrency();
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const goals = settings.goals || [];
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [fundGoalId, setFundGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundMode, setFundMode] = useState<"add" | "subtract">("add");

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setMonthlyContribution("");
    setDeadline("");
    setColor(PRESET_COLORS[0]);
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0) return;

    if (editId) {
      const updated = goals.map((g) =>
        g.id === editId
          ? {
              ...g,
              name: name.trim(),
              targetAmount: parseFloat(targetAmount),
              monthlyContribution: monthlyContribution ? parseFloat(monthlyContribution) : undefined,
              deadline: deadline || undefined,
              color,
            }
          : g
      );
      updateSettings({ goals: updated });
      toast("Goal updated");
    } else {
      const goal: Goal = {
        id: crypto.randomUUID(),
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        savedAmount: 0,
        monthlyContribution: monthlyContribution ? parseFloat(monthlyContribution) : undefined,
        deadline: deadline || undefined,
        color,
        createdAt: 0,
      };
      updateSettings({ goals: [...goals, goal] });
      toast("Goal created");
    }
    resetForm();
  };

  const handleEdit = (g: Goal) => {
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setMonthlyContribution(g.monthlyContribution ? String(g.monthlyContribution) : "");
    setDeadline(g.deadline || "");
    setColor(g.color);
    setEditId(g.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete goal",
      message: "Are you sure you want to remove this goal?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      updateSettings({ goals: goals.filter((g) => g.id !== id) });
      toast("Goal deleted", "error");
    }
  };

  const handleFundSave = () => {
    if (!fundGoalId) return;
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    const updated = goals.map((g) => {
      if (g.id !== fundGoalId) return g;
      const newSaved = fundMode === "add"
        ? Math.min(g.savedAmount + amt, g.targetAmount)
        : Math.max(g.savedAmount - amt, 0);
      return { ...g, savedAmount: newSaved };
    });
    updateSettings({ goals: updated });
    toast(fundMode === "add" ? `Added ${formatCurrency(amt)}` : `Removed ${formatCurrency(amt)}`);
    setFundGoalId(null);
    setFundAmount("");
    setFundMode("add");
  };

  // Summary stats
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div>
      {/* Summary bar */}
      {goals.length > 0 && (
        <div className="mb-4 rounded-xl px-4 py-3" style={{ background: 'var(--status-ok-bg)', border: '1px solid var(--status-ok-border)' }}>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>
              Total progress: <span className="font-semibold" style={{ color: 'var(--status-ok-text)' }}>{formatCurrency(totalSaved)}</span> / {formatCurrency(totalTarget)}
            </span>
            <span className="font-semibold" style={{ color: 'var(--status-ok-text)' }}>{overallPct}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(overallPct, 100)}%`, backgroundColor: 'var(--success)' }}
            />
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-end">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
          >
            <Plus size={13} />
            Add Goal
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 overflow-hidden rounded-xl p-4" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {editId ? "Edit Goal" : "New Goal"}
            </span>
            <button onClick={resetForm} style={{ color: 'var(--text-muted)' }} aria-label="Close form">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="form-label">Goal Name</label>
              <input
                type="text"
                placeholder="Goal name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                className="form-input text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">Target ({symbol})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
                  <input
                    type="number"
                    placeholder="e.g. 50,000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="form-input py-2 pl-9 pr-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Monthly ({symbol})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
                  <input
                    type="number"
                    placeholder="e.g. 5,000"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    min="0"
                    step="0.01"
                    className="form-input py-2 pl-9 pr-3 text-sm"
                  />
                </div>
              </div>
            </div>
            <input
              type="month"
              placeholder="Deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="min-w-0 max-w-full form-input px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className={`h-5 w-5 shrink-0 rounded-full border-2 transition-all hover:scale-110 ${
                    color === c ? "border-slate-900 scale-110 dark:border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0}
              className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
            >
              {editId ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-secondary)' }}>
            <Target size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Set your first savings goal</p>
          <p className="mt-1 max-w-[240px] text-xs" style={{ color: 'var(--text-muted)' }}>Future you will appreciate it. Start small — every target begins with a number.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
            const isComplete = pct >= 100;
            const remaining = g.targetAmount - g.savedAmount;
            const monthsLeft = g.monthlyContribution && g.monthlyContribution > 0 && remaining > 0
              ? Math.ceil(remaining / g.monthlyContribution) : null;

            return (
              <div
                key={g.id}
                className="rounded-xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {g.name}
                    </span>
                    {isComplete && (
                      <span className="rounded-full px-2 py-0.5 text-caption font-semibold" style={{ background: 'var(--status-ok-bg)', color: 'var(--status-ok-text)' }}>
                        Goal achieved!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setFundGoalId(g.id); setFundMode("add"); setFundAmount(""); }}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => handleEdit(g)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Edit goal"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Delete goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Add/Subtract Funds inline */}
                {fundGoalId === g.id && (
                  <div className="mb-3 rounded-xl px-3 py-3" style={{ background: 'var(--surface-secondary)' }}>
                    <div className="flex items-center gap-2">
                    <div className="flex rounded-lg" style={{ border: '1px solid var(--border)' }}>
                      <button
                        onClick={() => setFundMode("add")}
                        className={`flex h-8 w-8 items-center justify-center text-xs font-medium rounded-l-lg ${
                          fundMode === "add"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : ""
                        }`}
                        style={fundMode !== "add" ? { color: 'var(--text-muted)' } : undefined}
                        aria-label="Add funds"
                      >
                        <TrendingUp size={14} />
                      </button>
                      <button
                        onClick={() => setFundMode("subtract")}
                        className={`flex h-8 w-8 items-center justify-center text-xs font-medium rounded-r-lg ${
                          fundMode === "subtract"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                            : ""
                        }`}
                        style={fundMode !== "subtract" ? { color: 'var(--text-muted)' } : undefined}
                        aria-label="Subtract funds"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleFundSave(); if (e.key === "Escape") setFundGoalId(null); }}
                        autoFocus
                        placeholder="Amount"
                        className="form-input py-2 pl-7 pr-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleFundSave}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setFundGoalId(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface-hover)]"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Cancel"
                    >
                      <X size={14} />
                    </button>
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>Enter amount to {fundMode === "add" ? "add to" : "remove from"} your goal</p>
                  </div>
                )}

                <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: isComplete ? "var(--success)" : g.color,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>
                    {formatCurrency(g.savedAmount)} of {formatCurrency(g.targetAmount)} ({pct}%)
                    {pct >= 100 ? " — Goal achieved, well done!" : pct >= 50 ? " — Halfway there, keep going!" : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    {monthsLeft && !isComplete && (
                      <span className="text-indigo-500">~{monthsLeft}mo left</span>
                    )}
                    {g.deadline && (
                      <span>Due: {g.deadline}</span>
                    )}
                    {g.monthlyContribution && !g.deadline && (
                      <span>{formatCurrency(g.monthlyContribution)}/mo</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
