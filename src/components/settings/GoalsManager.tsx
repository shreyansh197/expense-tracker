"use client";

import { useState } from "react";
import { Plus, Trash2, X, Pencil, TrendingUp, Minus } from "lucide-react";
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
        <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Total progress: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalSaved)}</span> / {formatCurrency(totalTarget)}
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{overallPct}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(overallPct, 100)}%` }}
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
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {editId ? "Edit Goal" : "New Goal"}
            </span>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Goal name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
                <input
                  type="number"
                  placeholder="Target amount"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  min="1"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-6 pr-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
                <input
                  type="number"
                  placeholder="Monthly contrib."
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  min="0"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-6 pr-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
            <input
              type="month"
              placeholder="Deadline (optional)"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
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
        <p className="py-4 text-center text-xs text-slate-400">
          No goals yet. Set a savings target to track your progress.
        </p>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
            const isComplete = pct >= 100;
            const remaining = g.targetAmount - g.savedAmount;
            const monthsLeft = g.monthlyContribution && g.monthlyContribution > 0 && remaining > 0
              ? Math.ceil(remaining / g.monthlyContribution) : null;

            return (
              <div
                key={g.id}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {g.name}
                    </span>
                    {isComplete && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        Done!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setFundGoalId(g.id); setFundMode("add"); setFundAmount(""); }}
                      className="rounded-lg px-2 py-1 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => handleEdit(g)}
                      className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="rounded p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Add/Subtract Funds inline */}
                {fundGoalId === g.id && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-800">
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setFundMode("add")}
                        className={`px-2 py-1 text-xs font-medium rounded-l-lg ${
                          fundMode === "add"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "text-slate-400"
                        }`}
                      >
                        <TrendingUp size={12} />
                      </button>
                      <button
                        onClick={() => setFundMode("subtract")}
                        className={`px-2 py-1 text-xs font-medium rounded-r-lg ${
                          fundMode === "subtract"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                            : "text-slate-400"
                        }`}
                      >
                        <Minus size={12} />
                      </button>
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
                      <input
                        type="number"
                        min="1"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleFundSave(); if (e.key === "Escape") setFundGoalId(null); }}
                        autoFocus
                        placeholder="Amount"
                        className="w-full rounded border border-slate-200 bg-white py-1 pl-5 pr-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={handleFundSave}
                      className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setFundGoalId(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: isComplete ? "#10b981" : g.color,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    {formatCurrency(g.savedAmount)} of {formatCurrency(g.targetAmount)} ({pct}%)
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
