"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { getAllCategories } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { RecurringExpense, CategoryId } from "@/types";

export function RecurringManager() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const recurring = settings.recurringExpenses || [];

  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState<CategoryId>(allCategories[0]?.id || "miscellaneous");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [remark, setRemark] = useState("");

  const handleAdd = () => {
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
    const newItem: RecurringExpense = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      amount: parsedAmount,
      day: parsedDay,
      remark: remark.trim() || `${allCategories.find((c) => c.id === category)?.label || category} (recurring)`,
      frequency: "monthly",
      active: true,
      createdAt: Date.now(),
    };
    updateSettings({ recurringExpenses: [...recurring, newItem] });
    setAmount("");
    setDay("1");
    setRemark("");
    setShowAdd(false);
    toast("Recurring expense added");
  };

  const handleToggle = (id: string) => {
    updateSettings({
      recurringExpenses: recurring.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r
      ),
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Remove this recurring expense?")) return;
    updateSettings({
      recurringExpenses: recurring.filter((r) => r.id !== id),
    });
    toast("Recurring expense removed", "error");
  };

  const catMap = Object.fromEntries(allCategories.map((c) => [c.id, c]));

  return (
    <div className="space-y-3">
      {recurring.length === 0 && !showAdd && (
        <p className="py-3 text-center text-xs text-gray-400">
          No recurring expenses yet. Add things like rent, SIP, subscriptions.
        </p>
      )}

      {recurring.map((r) => {
        const cat = catMap[r.category];
        return (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/50"
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
              onClick={handleAdd}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
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
