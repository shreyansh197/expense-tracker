"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { getAllCategories } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Plus, Trash2, ToggleLeft, ToggleRight, Pencil, X, ArrowUpDown } from "lucide-react";
import type { RecurringExpense, CategoryId } from "@/types";

type SortKey = "day" | "amount" | "remark";

export function RecurringManager() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const recurring = settings.recurringExpenses || [];

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryId>(allCategories[0]?.id || "miscellaneous");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [remark, setRemark] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("day");

  const resetForm = () => {
    setCategory(allCategories[0]?.id || "miscellaneous");
    setAmount("");
    setDay("1");
    setRemark("");
    setEditId(null);
    setShowAdd(false);
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(day, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 28) {
      toast("Day must be 1-28", "error");
      return;
    }

    if (editId) {
      // Edit existing
      const updated = recurring.map((r) =>
        r.id === editId
          ? { ...r, category, amount: parsedAmount, day: parsedDay, remark: remark.trim() || r.remark }
          : r
      );
      updateSettings({ recurringExpenses: updated });
      toast("Recurring expense updated");
    } else {
      // Add new
      const newItem: RecurringExpense = {
        id: crypto.randomUUID(),
        category,
        amount: parsedAmount,
        day: parsedDay,
        remark: remark.trim() || `${allCategories.find((c) => c.id === category)?.label || category} (recurring)`,
        frequency: "monthly",
        active: true,
        createdAt: 0,
      };
      updateSettings({ recurringExpenses: [...recurring, newItem] });
      toast("Recurring expense added");
    }
    resetForm();
  };

  const handleEdit = (r: RecurringExpense) => {
    setEditId(r.id);
    setCategory(r.category);
    setAmount(String(r.amount));
    setDay(String(r.day));
    setRemark(r.remark);
    setShowAdd(true);
  };

  const handleToggle = (id: string) => {
    updateSettings({
      recurringExpenses: recurring.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r
      ),
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Remove recurring expense",
      message: "Are you sure you want to remove this recurring expense?",
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!ok) return;
    updateSettings({
      recurringExpenses: recurring.filter((r) => r.id !== id),
    });
    toast("Recurring expense removed", "error");
  };

  const catMap = Object.fromEntries(allCategories.map((c) => [c.id, c]));

  // Sort
  const sorted = [...recurring].sort((a, b) => {
    if (sortKey === "day") return a.day - b.day;
    if (sortKey === "amount") return b.amount - a.amount;
    return a.remark.localeCompare(b.remark);
  });

  // Totals
  const activeTotal = recurring.filter((r) => r.active).reduce((sum, r) => sum + r.amount, 0);
  const totalAll = recurring.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-3">
      {/* Totals bar */}
      {recurring.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Active: <span className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(activeTotal)}</span>/mo
            {activeTotal !== totalAll && (
              <span className="ml-2 text-gray-400">
                (Total incl. paused: {formatCurrency(totalAll)})
              </span>
            )}
          </div>
          <button
            onClick={() => setSortKey((k) => k === "day" ? "amount" : k === "amount" ? "remark" : "day")}
            className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={`Sort by ${sortKey}`}
          >
            <ArrowUpDown size={10} />
            {sortKey}
          </button>
        </div>
      )}

      {recurring.length === 0 && !showAdd && (
        <p className="py-3 text-center text-xs text-gray-400">
          No recurring expenses yet. Add things like rent, SIP, subscriptions.
        </p>
      )}

      {sorted.map((r) => {
        const cat = catMap[r.category];
        return (
          <div
            key={r.id}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
              r.active
                ? "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50"
                : "border-gray-100 bg-gray-50/50 opacity-60 dark:border-gray-800 dark:bg-gray-800/30"
            }`}
          >
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: cat?.color || "#6B7280" }}
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                {r.remark}
              </p>
              <p className="text-xs text-gray-400">
                Day {r.day} · {cat?.label || r.category}
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(r.amount)}
            </span>
            <button
              onClick={() => handleEdit(r)}
              className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Edit"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => handleToggle(r.id)}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title={r.active ? "Pause" : "Resume"}
            >
              {r.active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
            </button>
            <button
              onClick={() => handleDelete(r.id)}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}

      {showAdd ? (
        <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {editId ? "Edit Recurring" : "Add Recurring"}
            </span>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                  category === cat.id
                    ? "text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                }`}
                style={category === cat.id ? { backgroundColor: cat.color } : undefined}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Amount (₹)</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Day of month</label>
              <input
                type="number"
                min="1"
                max="28"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Remark (e.g., SIP - Mutual Fund)"
            maxLength={100}
            className="w-full rounded border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {editId ? "Update" : "Add"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
        >
          <Plus size={14} />
          Add Recurring
        </button>
      )}

      <p className="text-xs text-gray-400">
        Recurring expenses are auto-added on the specified day each month when you open the app.
      </p>
    </div>
  );
}
