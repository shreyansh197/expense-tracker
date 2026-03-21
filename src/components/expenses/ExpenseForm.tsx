"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { getAllCategories } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";
import { DatePicker } from "@/components/ui/DatePicker";
import { useSettings } from "@/hooks/useSettings";
import type { CategoryId, ExpenseInput, Expense } from "@/types";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseInput) => Promise<void>;
  onUpdate?: (id: string, data: Partial<ExpenseInput>) => Promise<void>;
  editExpense?: Expense | null;
  month: number;
  year: number;
}

export function ExpenseForm({
  onSubmit,
  onUpdate,
  editExpense,
  month,
  year,
}: ExpenseFormProps) {
  const closeForm = useUIStore((s) => s.closeForm);
  const { toast } = useToast();
  const { settings } = useSettings();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);

  const [category, setCategory] = useState<CategoryId>(editExpense?.category || "groceries");
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || "");
  const [day, setDay] = useState(editExpense?.day || new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [remark, setRemark] = useState(editExpense?.remark || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  useEffect(() => {
    if (editExpense) {
      setCategory(editExpense.category);
      setAmount(editExpense.amount.toString());
      setDay(editExpense.day);
      setRemark(editExpense.remark || "");
    }
  }, [editExpense]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submittingRef.current) return;
      setError("");

      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Enter a valid positive amount");
        return;
      }

      const parsedDay = day;
      if (parsedDay < 1 || parsedDay > 31) {
        setError("Enter a valid day (1-31)");
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      try {
        if (editExpense && onUpdate) {
          await onUpdate(editExpense.id, {
            category,
            amount: parsedAmount,
            day: parsedDay,
            month: selectedMonth,
            year: selectedYear,
            remark: remark.trim() || undefined,
          });
        } else {
          await onSubmit({
            category,
            amount: parsedAmount,
            day: parsedDay,
            month: selectedMonth,
            year: selectedYear,
            remark: remark.trim() || undefined,
          });
        }
        closeForm();
        toast(editExpense ? "Expense updated" : "Expense added");
      } catch (err) {
        setError("Failed to save expense. Please try again.");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [amount, day, category, month, year, remark, editExpense, onSubmit, onUpdate, closeForm]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        closeForm();
      }
    },
    [closeForm]
  );

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {editExpense ? "Edit Expense" : "Add Expense"}
        </h3>
        <button
          type="button"
          onClick={closeForm}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* Category Selector */}
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                category === cat.id
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
              style={category === cat.id ? { backgroundColor: cat.color } : undefined}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
          Amount (₹)
        </label>
        <input
          ref={amountRef}
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-600"
          required
        />
      </div>

      {/* Date */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
          Date
        </label>
        <DatePicker
          value={day}
          onChange={(d, m, y) => {
            setDay(d);
            if (m !== undefined) setSelectedMonth(m);
            if (y !== undefined) setSelectedYear(y);
          }}
          month={selectedMonth}
          year={selectedYear}
        />
      </div>

      {/* Remark */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
          Remark <span className="text-gray-300 dark:text-gray-600">(optional)</span>
        </label>
        <input
          type="text"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="e.g., Dinner at restaurant"
          maxLength={200}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-600"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting
          ? "Saving..."
          : editExpense
            ? "Update Expense"
            : "Add Expense"}
      </button>
    </form>
  );
}
