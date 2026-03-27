"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { getAllCategories } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";
import { DatePicker } from "@/components/ui/DatePicker";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
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
  const { symbol } = useCurrency();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);

  const [category, setCategory] = useState<CategoryId>(() => {
    if (editExpense?.category) return editExpense.category;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("spendly-last-category") as CategoryId | null;
      if (saved && allCategories.some((c) => c.id === saved)) return saved;
    }
    return "groceries";
  });
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || "");
  const [day, setDay] = useState(editExpense?.day || new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [remark, setRemark] = useState(editExpense?.remark || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
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
        localStorage.setItem("spendly-last-category", category);
        toast(editExpense ? "Expense updated" : "Expense added");
      } catch {
        setError("Failed to save expense. Please try again.");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [amount, day, category, remark, editExpense, onSubmit, onUpdate, closeForm, selectedMonth, selectedYear, toast]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        closeForm();
      }
    },
    [closeForm]
  );

  const amountInvalid = amountTouched && (amount === "" || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0);

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {editExpense ? "Edit Expense" : "Add an Expense"}
        </h3>
        <button
          type="button"
          onClick={closeForm}
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
          aria-label="Close form"
        >
          <X size={18} />
        </button>
      </div>

      {/* Category Selector */}
      <div>
        <label className="form-label mb-2 uppercase">
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
                  : ""
              )}
              style={
                category === cat.id
                  ? { backgroundColor: cat.color }
                  : { background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }
              }
              onMouseEnter={category !== cat.id ? (e) => { e.currentTarget.style.background = 'var(--surface-tertiary)'; } : undefined}
              onMouseLeave={category !== cat.id ? (e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; } : undefined}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="form-label mb-1.5 uppercase">
          Amount ({symbol})
        </label>
        <input
          ref={amountRef}
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); if (amountTouched) setAmountTouched(true); }}
          onBlur={() => setAmountTouched(true)}
          placeholder="0"
          className={cn("form-input w-full text-lg font-semibold", amountInvalid && "!border-red-400 !ring-red-400/20")}
          required
          aria-invalid={amountInvalid || undefined}
        />
        {amountInvalid && (
          <p className="mt-1 text-xs font-medium text-red-500">Enter a valid positive amount</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="form-label mb-1.5 uppercase">
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
        <label className="form-label mb-1.5 uppercase">
          Remark <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
        </label>
        <input
          type="text"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="e.g., Dinner at restaurant"
          maxLength={200}
          className="form-input w-full"
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting
          ? "Saving..."
          : editExpense
            ? "Update Expense"
            : "Add Expense"}
      </button>
    </form>
  );
}
