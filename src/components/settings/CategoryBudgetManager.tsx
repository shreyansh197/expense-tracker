"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { getAllCategories } from "@/lib/categories";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/components/ui/Toast";
import type { CategoryId } from "@/types";

export function CategoryBudgetManager() {
  const { formatCurrency, symbol } = useCurrency();
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const budgets = settings.categoryBudgets || {};
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleSave = (catId: CategoryId) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    const next = { ...budgets };
    if (val === 0) {
      delete next[catId];
    } else {
      next[catId] = val;
    }
    updateSettings({ categoryBudgets: next });
    setEditingId(null);
    toast(val === 0 ? "Budget removed" : "Budget saved");
  };

  const handleStartEdit = (catId: string) => {
    setEditingId(catId);
    setEditValue(budgets[catId]?.toString() || "");
  };

  return (
    <div className="space-y-2">
      {allCategories.map((cat) => {
        const budget = budgets[cat.id];
        const isEditing = editingId === cat.id;

        return (
          <div
            key={cat.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2"
          >
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
              {cat.label}
            </span>
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{symbol}</span>
                <input
                  type="number"
                  min="0"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave(cat.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="form-input w-20 px-2 py-1 text-xs text-right"
                />
                <button
                  onClick={() => handleSave(cat.id)}
                  className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartEdit(cat.id)}
                className="text-xs font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                style={{ color: 'var(--text-muted)' }}
              >
                {budget ? formatCurrency(budget) : "Set limit"}
              </button>
            )}
          </div>
        );
      })}
      <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        Set per-category spending limits. You&#39;ll see warnings when approaching these limits.
      </p>
    </div>
  );
}
