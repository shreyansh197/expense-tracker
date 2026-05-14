"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Zap, Plus, X, Check, Pin } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";
import { getAllCategories } from "@/lib/categories";
import type { ExpenseTemplate } from "@/types";

/**
 * QuickTemplates — a horizontal scrollable row of pinned expense templates.
 * One tap adds the expense for today. Long-press or edit button lets users
 * remove a template. A "+" chip opens a mini creation form inline.
 */
export function QuickTemplates() {
  const { settings, updateSettings } = useSettings();
  const { symbol, formatCurrency } = useCurrency();
  const { openAddForm } = useUIStore();
  const { toast } = useToast();

  const templates: ExpenseTemplate[] = settings.quickTemplates ?? [];
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);

  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState(allCategories[0]?.id ?? "food");

  const handleAddExpense = (t: ExpenseTemplate) => {
    openAddForm({ amount: t.amount, category: t.category, remark: t.remark ?? t.label });
    toast(`${t.label} — ready to log`, "success");
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateSettings({ quickTemplates: templates.filter((t) => t.id !== id) });
  };

  const handleCreate = () => {
    const amt = parseFloat(newAmount);
    if (!newLabel.trim() || isNaN(amt) || amt <= 0) return;
    const template: ExpenseTemplate = {
      id: `tpl-${Date.now()}`,
      label: newLabel.trim(),
      amount: amt,
      category: newCategory,
    };
    updateSettings({ quickTemplates: [...templates, template] });
    setNewLabel("");
    setNewAmount("");
    setShowCreate(false);
    toast(`"${template.label}" template saved`);
  };

  // Don't render the row if empty and create form is closed
  if (templates.length === 0 && !showCreate) {
    return (
      <div className="flex items-center gap-2 py-1">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--surface)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}
          aria-label="Add quick template"
        >
          <Pin size={11} />
          Pin quick expense
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {/* Existing templates */}
        {templates.map((t) => {
          const cat = allCategories.find((c) => c.id === t.category);
          return (
            <m.button
              key={t.id}
              onClick={() => handleAddExpense(t)}
              className="group relative flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-2.5 pr-8 text-xs font-medium transition-colors"
              style={{
                background: cat?.bgColor ?? "var(--surface-secondary)",
                color: cat?.color ?? "var(--text-primary)",
                border: `1px solid color-mix(in srgb, ${cat?.color ?? "var(--accent)"} 20%, transparent)`,
              }}
              whileTap={{ scale: 0.94 }}
              aria-label={`Quick add ${t.label} for ${formatCurrency(t.amount)}`}
            >
              <Zap size={11} className="shrink-0" />
              <span className="max-w-[80px] truncate">{t.label}</span>
              <span className="font-numeric font-semibold">{formatCurrency(t.amount)}</span>
              {/* Remove button — always visible on mobile, hover-only on desktop */}
              <button
                onClick={(e) => handleRemove(t.id, e)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                style={{ background: "var(--surface)", color: "var(--text-muted)" }}
                aria-label={`Remove ${t.label} template`}
              >
                <X size={9} />
              </button>
            </m.button>
          );
        })}

        {/* Add new template chip */}
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex shrink-0 items-center justify-center rounded-full p-1.5 transition-colors"
            style={{ background: "var(--surface)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}
            aria-label="Add quick template"
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {/* Inline creation form */}
      <AnimatePresence>
        {showCreate && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="flex flex-wrap items-center gap-2 rounded-xl p-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <input
                type="text"
                placeholder="Label (e.g. Coffee)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                maxLength={20}
                autoFocus
                className="flex-1 min-w-[100px] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                style={{ background: "var(--surface-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>{symbol}</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-20 rounded-lg py-1.5 pl-6 pr-2 text-xs focus:outline-none"
                  style={{ background: "var(--surface-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                style={{ background: "var(--surface-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              >
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCreate}
                  disabled={!newLabel.trim() || !newAmount}
                  className="flex h-7 w-7 items-center justify-center rounded-lg disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "#fff" }}
                  aria-label="Save template"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "var(--surface-secondary)", color: "var(--text-muted)" }}
                  aria-label="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
