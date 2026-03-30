"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { getAllCategories } from "@/lib/categories";
import { cn, getDaysInMonth } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";
import { DatePicker } from "@/components/ui/DatePicker";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useAutoRules } from "@/components/settings/AutoRulesManager";
import type { CategoryId, ExpenseInput, Expense } from "@/types";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseInput) => Promise<void>;
  onUpdate?: (id: string, data: Partial<ExpenseInput>) => Promise<void>;
  editExpense?: Expense | null;
  month: number;
  year: number;
  onClose?: () => void;
  closingRef?: React.RefObject<boolean>;
}

export function ExpenseForm({
  onSubmit,
  onUpdate,
  editExpense,
  month,
  year,
  onClose,
  closingRef,
}: ExpenseFormProps) {
  const storeCloseForm = useUIStore((s) => s.closeForm);
  const closeForm = onClose ?? storeCloseForm;
  const { toast } = useToast();
  const { settings } = useSettings();
  const { symbol } = useCurrency();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);

  const { rules: autoRules } = useAutoRules();
  const [category, setCategory] = useState<CategoryId>(() => {
    if (editExpense?.category) return editExpense.category;
    return "";
  });
  const [autoApplied, setAutoApplied] = useState(false);
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || "");
  const [day, setDay] = useState(editExpense?.day || new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [remark, setRemark] = useState(editExpense?.remark || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-focus amount input on mount — guarded against closing state
  useEffect(() => {
    // Small delay to let the modal entrance animation start first,
    // and check closing flag to prevent focus during exit
    const id = setTimeout(() => {
      if (closingRef?.current) return;
      amountRef.current?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editExpense) {
      setCategory(editExpense.category);
      setAmount(editExpense.amount.toString());
      setDay(editExpense.day);
      setRemark(editExpense.remark || "");
    }
  }, [editExpense]);

  // Apply auto-rules when remark or amount changes (only for new expenses)
  useEffect(() => {
    if (editExpense) return;
    const enabledRules = autoRules.filter((r) => r.enabled && r.action.type === "set_category");
    for (const rule of enabledRules) {
      const { field, operator, value } = rule.condition;
      let match = false;
      if (field === "remark" && remark.trim()) {
        const rv = remark.toLowerCase();
        const cv = value.toLowerCase();
        if (operator === "contains") match = rv.includes(cv);
        else if (operator === "equals") match = rv === cv;
      } else if (field === "amount" && amount) {
        const num = parseFloat(amount);
        if (!isNaN(num)) {
          const target = parseFloat(value);
          if (operator === "greater_than") match = num > target;
          else if (operator === "less_than") match = num < target;
          else if (operator === "equals") match = num === target;
        }
      }
      if (match && allCategories.some((c) => c.id === rule.action.value)) {
        setCategory(rule.action.value as CategoryId);
        setAutoApplied(true);
        return;
      }
    }
    // If no rule matched and category was auto-applied before, clear it
    if (autoApplied) {
      setCategory("");
      setAutoApplied(false);
    }
  }, [remark, amount, autoRules, editExpense, allCategories, autoApplied]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submittingRef.current) return;
      setSubmitted(true);
      setError("");

      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Enter a valid positive amount");
        return;
      }

      if (!category) {
        setError("Select a category");
        return;
      }

      const parsedDay = day;
      const maxDay = getDaysInMonth(selectedMonth, selectedYear);
      if (parsedDay < 1 || parsedDay > maxDay) {
        setError(`Enter a valid day (1-${maxDay} for this month)`);
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
        localStorage.setItem("expenstream-last-category", category);
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
        e.preventDefault();
        closeForm();
      }
    },
    [closeForm]
  );

  const amountInvalid = submitted && (amount === "" || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0);

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
          ref={closeBtnRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            closeForm();
          }}
          onTouchStart={(e) => {
            // On mobile: fire close IMMEDIATELY on touch start,
            // before the browser can process focus on any nearby input.
            // This is the earliest possible moment in the touch event chain.
            e.preventDefault();
            closeForm();
          }}
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
          Category {!category && submitted && <span className="text-red-500 normal-case">— please select</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <m.button
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
              onMouseEnter={category !== cat.id ? (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--surface-tertiary)'; } : undefined}
              onMouseLeave={category !== cat.id ? (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--surface-secondary)'; } : undefined}
              whileTap={{ scale: 0.92 }}
              animate={category === cat.id ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              {cat.label}
            </m.button>
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
          onChange={(e) => { setAmount(e.target.value); if (submitted) setSubmitted(false); }}
          placeholder="e.g. 500"
          className={cn("form-input w-full text-lg font-semibold", amountInvalid && "!border-red-400 !ring-red-400/20")}
          required
          aria-invalid={amountInvalid || undefined}
        />
        <AnimatePresence>
          {amountInvalid && (
            <m.p
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 4 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs font-medium text-red-500 overflow-hidden"
            >
              Enter a valid positive amount
            </m.p>
          )}
        </AnimatePresence>
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
      <AnimatePresence>
        {error && (
          <m.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-medium text-red-500 overflow-hidden"
          >
            {error}
          </m.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <m.button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF8A65] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF7043] disabled:opacity-50"
        whileTap={{ scale: 0.97 }}
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting
          ? "Saving..."
          : editExpense
            ? "Update Expense"
            : "Add Expense"}
      </m.button>
    </form>
  );
}
