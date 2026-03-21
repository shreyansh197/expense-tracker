"use client";

import { useState } from "react";
import { Plus, Trash2, Target, X, Pencil } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils";
import { PRESET_COLORS } from "@/lib/categories";
import type { Goal } from "@/types";

export function GoalsManager() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const goals = settings.goals || [];
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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
        id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        savedAmount: 0,
        monthlyContribution: monthlyContribution ? parseFloat(monthlyContribution) : undefined,
        deadline: deadline || undefined,
        color,
        createdAt: Date.now(),
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

  const handleAddFunds = (id: string) => {
    const input = prompt("Amount to add (₹):");
    if (!input) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) return;
    const updated = goals.map((g) =>
      g.id === id
        ? { ...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount) }
        : g
    );
    updateSettings({ goals: updated });
    toast(`Added ${formatCurrency(amount)} to goal`);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            <Plus size={13} />
            Add Goal
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {editId ? "Edit Goal" : "New Goal"}
            </span>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
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
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="Target amount"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  min="1"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-6 pr-3 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="Monthly contrib."
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  min="0"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-6 pr-3 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="month"
                placeholder="Deadline (optional)"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <div className="flex items-center gap-1 overflow-x-auto">
                {PRESET_COLORS.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 shrink-0 rounded-full border-2 ${
                      color === c ? "border-gray-900 dark:border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {editId ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm ? (
        <p className="py-4 text-center text-xs text-gray-400">
          No goals yet. Set a savings target to track your progress.
        </p>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
            const isComplete = pct >= 100;
            return (
              <div
                key={g.id}
                className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {g.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAddFunds(g.id)}
                      className="rounded-lg px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => handleEdit(g)}
                      className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: isComplete ? "#10b981" : g.color,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                  <span>
                    {formatCurrency(g.savedAmount)} of {formatCurrency(g.targetAmount)} ({pct}%)
                  </span>
                  {g.deadline && (
                    <span>
                      Due: {g.deadline}
                    </span>
                  )}
                  {g.monthlyContribution && !g.deadline && (
                    <span>{formatCurrency(g.monthlyContribution)}/mo</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
