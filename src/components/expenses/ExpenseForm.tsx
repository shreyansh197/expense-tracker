"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Camera, CalendarDays, CheckCircle2, Mic, MicOff, Delete, ChevronDown } from "lucide-react";
import { getAllCategories } from "@/lib/categories";
import { cn, getDaysInMonth, getCurrencySymbol } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";
import { DatePicker } from "@/components/ui/DatePicker";
import { ReceiptCapture } from "@/components/expenses/ReceiptCapture";
import { CategorySelector } from "@/components/expenses/CategorySelector";
import { FormError } from "@/components/ui/FormError";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useAutoRules } from "@/components/settings/AutoRulesManager";
import { SUPPORTED_CURRENCIES } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import { MoneyEcho } from "@/components/ui/MoneyEcho";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useMerchantIndex } from "@/hooks/useMerchantIndex";
import { useExpenses } from "@/hooks/useExpenses";
import type { CategoryId, ExpenseInput, Expense } from "@/types";

/* ─── Keypad keys ─── */
const KEYPAD_KEYS = [
  "1", "2", "3",
  "4", "5", "6",
  "7", "8", "9",
  ".", "0", "backspace",
] as const;

interface ExpenseFormProps {
  onSubmit: (data: ExpenseInput) => Promise<void>;
  onUpdate?: (id: string, data: Partial<ExpenseInput>) => Promise<void>;
  editExpense?: Expense | null;
  month: number;
  year: number;
  onClose?: () => void;
  closingRef?: React.RefObject<boolean>;
  prefill?: { amount?: number; category?: string; remark?: string };
}

export function ExpenseForm({
  onSubmit,
  onUpdate,
  editExpense,
  month,
  year,
  onClose,
  // closingRef is received from ExpenseFormModal but handled externally
  prefill,
}: ExpenseFormProps) {
  const storeCloseForm = useUIStore((s) => s.closeForm);
  const closeForm = onClose ?? storeCloseForm;
  const { toast } = useToast();
  const { settings } = useSettings();
  const { symbol } = useCurrency();
  const { categoryTotals } = useCalculationsContext();
  const { currentMonth, currentYear } = useUIStore();
  const { expenses: allExpenses } = useExpenses(currentMonth, currentYear);
  const { search: searchMerchants } = useMerchantIndex(allExpenses);
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const multiCurrency = settings.multiCurrencyEnabled ?? false;

  // Time-of-day sorted categories
  const sortedCategories = useMemo(() => {
    const h = new Date().getHours();
    const priorityMap: Record<string, number> = h >= 5 && h < 10
      ? { food: 0, cafe: 1, transport: 2 }
      : h >= 11 && h < 14
      ? { food: 0, transport: 1, shopping: 2 }
      : h >= 18 && h < 23
      ? { food: 0, entertainment: 1, shopping: 2 }
      : {};
    return [...allCategories].sort((a, b) => {
      const aP = priorityMap[a.id] ?? 99;
      const bP = priorityMap[b.id] ?? 99;
      return aP - bP;
    });
  }, [allCategories]);

  const { rules: autoRules } = useAutoRules();
  const [category, setCategory] = useState<CategoryId>(() => {
    if (editExpense?.category) return editExpense.category;
    if (prefill?.category) return prefill.category;
    return "";
  });
  const [autoApplied, setAutoApplied] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || prefill?.amount?.toString() || "");
  const today = new Date();
  const [day, setDay] = useState(editExpense?.day || today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(editExpense ? month : today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(editExpense ? year : today.getFullYear());
  const [remark, setRemark] = useState(editExpense?.remark || prefill?.remark || "");
  const [remarkSuggestions, setRemarkSuggestions] = useState<ReturnType<typeof searchMerchants>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expenseCurrency, setExpenseCurrency] = useState(editExpense?.currency || settings.currency || "INR");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [echoTrigger, setEchoTrigger] = useState(0);
  const submittingRef = useRef(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showMore, setShowMore] = useState(!!editExpense);
  const remarkRef = useRef<HTMLInputElement>(null);

  const voice = useSpeechRecognition(
    useCallback((transcript: string) => {
      setRemark((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${transcript}` : transcript;
      });
    }, []),
  );

  useEffect(() => {
    if (editExpense) {
      setCategory(editExpense.category);
      setAmount(editExpense.amount.toString());
      setDay(editExpense.day);
      setRemark(editExpense.remark || "");
    }
  }, [editExpense]);

  // Auto-rules
  useEffect(() => {
    if (editExpense || manualOverride) return;
    const enabledRules = autoRules.filter((r) => r.enabled && r.action.type === "set_category");
    const sortedRules = [...enabledRules].sort((a, b) => {
      const aExact = ["equals"].includes(a.condition.operator) ? 0 : 1;
      const bExact = ["equals"].includes(b.condition.operator) ? 0 : 1;
      return aExact - bExact;
    });
    for (const rule of sortedRules) {
      const { field, operator, value } = rule.condition;
      let match = false;
      if (field === "remark" && remark.trim()) {
        const rv = remark.toLowerCase();
        const cv = value.toLowerCase();
        if (operator === "contains") {
          const keywords = cv.split(",").map((k) => k.trim()).filter(Boolean);
          match = keywords.length > 0 && keywords.some((kw) => rv.includes(kw));
        }
        else if (operator === "equals") match = rv === cv;
        else if (operator === "starts_with") match = rv.startsWith(cv);
        else if (operator === "ends_with") match = rv.endsWith(cv);
      } else if (field === "amount" && amount) {
        const num = parseFloat(amount);
        if (!isNaN(num)) {
          if (operator === "between") {
            const [minStr, maxStr] = value.split(",");
            const min = parseFloat(minStr), max = parseFloat(maxStr);
            if (!isNaN(min) && !isNaN(max)) match = num >= min && num <= max;
          } else {
            const target = parseFloat(value);
            if (operator === "greater_than") match = num > target;
            else if (operator === "less_than") match = num < target;
            else if (operator === "equals") match = num === target;
          }
        }
      } else if (field === "day_of_month") {
        if (operator === "between") {
          const [minStr, maxStr] = value.split(",");
          const min = parseInt(minStr, 10), max = parseInt(maxStr, 10);
          if (!isNaN(min) && !isNaN(max)) match = day >= min && day <= max;
        } else {
          const target = parseInt(value, 10);
          if (!isNaN(target)) {
            if (operator === "equals") match = day === target;
            else if (operator === "greater_than") match = day > target;
            else if (operator === "less_than") match = day < target;
          }
        }
      } else if (field === "is_recurring") {
        match = value === "true" ? false : true;
      }
      if (match && allCategories.some((c) => c.id === rule.action.value)) {
        setCategory(rule.action.value as CategoryId);
        setAutoApplied(true);
        return;
      }
    }
    if (autoApplied) {
      setCategory("");
      setAutoApplied(false);
    }
  }, [remark, amount, day, autoRules, editExpense, allCategories, autoApplied, manualOverride]);

  /* ─── Keypad handler ─── */
  const handleKeypadPress = useCallback((key: string) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    setAmount((prev) => {
      if (key === "backspace") return prev.slice(0, -1);
      if (key === "." && prev.includes(".")) return prev;
      // Max 2 decimal places
      const dotIdx = prev.indexOf(".");
      if (dotIdx !== -1 && prev.length - dotIdx > 2) return prev;
      // Limit length
      if (prev.length >= 10) return prev;
      return prev + key;
    });
    if (submitted) setSubmitted(false);
  }, [submitted]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (submittingRef.current) return;
      setSubmitted(true);
      setError("");

      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Enter a valid positive amount");
        return;
      }
      if (parsedAmount > 10_000_000) {
        setError("Amount cannot exceed 10,000,000");
        return;
      }
      if (!category) {
        setError("Select a category");
        return;
      }
      const maxDay = getDaysInMonth(selectedMonth, selectedYear);
      if (day < 1 || day > maxDay) {
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
            currency: multiCurrency ? expenseCurrency : undefined,
            day,
            month: selectedMonth,
            year: selectedYear,
            remark: remark.trim() || undefined,
          });
        } else {
          await onSubmit({
            category,
            amount: parsedAmount,
            currency: multiCurrency ? expenseCurrency : undefined,
            day,
            month: selectedMonth,
            year: selectedYear,
            remark: remark.trim() || undefined,
          });
        }
        localStorage.setItem("expenstream-last-category", category);
        const catLabel = allCategories.find(c => c.id === category)?.label ?? category;
        const displaySymbol = multiCurrency && expenseCurrency ? getCurrencySymbol(expenseCurrency) : symbol;
        if (editExpense) {
          toast(`${displaySymbol}${parsedAmount} in ${catLabel} updated`);
        }
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([20, 30, 20]);
        setShowSuccess(true);
        setEchoTrigger((t) => t + 1);
        setTimeout(() => { closeForm(); }, 600);
      } catch {
        setError("Failed to save expense. Please try again.");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [amount, day, category, remark, editExpense, onSubmit, onUpdate, closeForm, selectedMonth, selectedYear, toast, multiCurrency, expenseCurrency, allCategories, symbol]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeForm(); }
      // Sync physical keyboard with on-screen keypad
      if (e.key >= "0" && e.key <= "9") { e.preventDefault(); handleKeypadPress(e.key); }
      if (e.key === "." || e.key === "Decimal") { e.preventDefault(); handleKeypadPress("."); }
      if (e.key === "Backspace") { e.preventDefault(); handleKeypadPress("backspace"); }
      if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
    },
    [closeForm, handleKeypadPress, handleSubmit]
  );

  const parsedDisplay = amount || "0";
  const amountInvalid = submitted && (amount === "" || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0);

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-2"
    >
      {/* Success flash */}
      <AnimatePresence>
        {showSuccess && (
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-2 rounded-xl py-3 px-3"
            style={{ background: 'var(--success-soft)' }}
          >
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--success-text)' }}>
              {editExpense ? "Updated!" : "Expense added!"}
            </span>
          </m.div>
        )}
      </AnimatePresence>

      <MoneyEcho trigger={echoTrigger} color={allCategories.find(c => c.id === category)?.color} />

      {/* ─── 1. Amount Hero Display ─── */}
      <div className="flex flex-col items-center pt-1">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {editExpense ? "Edit amount" : "How much?"}
        </span>
        <m.div
          className="flex items-baseline gap-1"
          animate={amountInvalid ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <span className="text-xl font-display" style={{ color: 'var(--text-muted)' }}>{symbol}</span>
          <span
            className={cn(
              "text-4xl font-display font-bold tabular-nums tracking-tight transition-colors",
              amount ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            )}
          >
            {parsedDisplay}
          </span>
        </m.div>
      </div>

      {/* Error — above keypad so it's visible when keyboard is open */}
      <FormError message={error} visible={!!error} />

      {/* ─── 2. Numeric Keypad ─── */}
      <AnimatePresence initial={false}>
        {!showScanner && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className={cn("grid grid-cols-3 gap-1.5 px-2", showMore ? "gap-1" : "gap-2")} role="group" aria-label="Amount keypad">
              {KEYPAD_KEYS.map((key) => (
                <m.button
                  key={key}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  transition={spring.water}
                  onClick={() => handleKeypadPress(key)}
                  className={cn(
                    "flex items-center justify-center rounded-xl font-semibold font-numeric select-none",
                    "active:bg-[var(--surface-tertiary)] transition-all",
                    showMore ? "h-9 text-base" : "h-11 text-lg",
                    key === "backspace" ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                  )}
                  style={{ background: 'var(--surface-secondary)' }}
                  aria-label={key === "backspace" ? "Delete" : key === "." ? "Decimal point" : key}
                >
                  {key === "backspace" ? <Delete size={showMore ? 18 : 20} /> : key}
                </m.button>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ─── 3. Category Grid ─── */}
      <CategorySelector
        categories={sortedCategories}
        selected={category}
        onSelect={(id) => {
          setCategory(id);
          setAutoApplied(false);
          setManualOverride(true);
        }}
        showError={!category && submitted}
        categoryBudgets={settings.categoryBudgets}
        categoryTotals={categoryTotals}
        currencySymbol={symbol}
      />

      {/* ─── 4. Remark (always visible) with typeahead ─── */}
      <div className="relative">
        <input
          ref={remarkRef}
          type="text"
          value={voice.listening ? (remark ? `${remark} ${voice.transcript}` : voice.transcript) || remark : remark}
          onChange={(e) => {
            const val = e.target.value;
            setRemark(val);
            const matches = searchMerchants(val);
            setRemarkSuggestions(matches);
            setShowSuggestions(matches.length > 0);
          }}
          onFocus={(e) => {
            const el = e.target;
            setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
            if (remark.length >= 2) {
              const matches = searchMerchants(remark);
              setRemarkSuggestions(matches);
              setShowSuggestions(matches.length > 0);
            }
          }}
          onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
          placeholder={voice.listening ? "Listening..." : "Add a note..."}
          maxLength={200}
          readOnly={voice.listening}
          autoComplete="off"
          className={cn("form-input w-full pr-10", voice.listening && "ring-2 ring-[var(--brand)]")}
        />
        {voice.supported && (
          <button
            type="button"
            onClick={() => { if (voice.listening) { voice.stop(); } else { voice.start(); } }}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors",
              voice.listening && "animate-pulse"
            )}
            style={{ color: voice.listening ? 'var(--brand)' : 'var(--text-muted)' }}
            aria-label={voice.listening ? "Stop voice input" : "Start voice input"}
            title={voice.listening ? "Stop listening" : "Voice input"}
          >
            {voice.listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* Typeahead dropdown */}
        {showSuggestions && remarkSuggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border shadow-lg"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {remarkSuggestions.map((s) => {
              const catMeta = allCategories.find((c) => c.id === s.category);
              return (
                <button
                  key={s.remark}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-secondary)]"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur
                    setRemark(s.remark);
                    if (!manualOverride) setCategory(s.category);
                    setShowSuggestions(false);
                  }}
                >
                  <span style={{ color: "var(--text-primary)" }}>{s.remark}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {catMeta?.label ?? s.category} · ~{symbol}{s.medianAmount.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {voice.error && (
        <p className="text-xs" style={{ color: 'var(--err)' }}>{voice.error}</p>
      )}

      {/* ─── 5. More options (date, scanner, currency) ─── */}
      <div className="flex items-center gap-2">
        {!showMore && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
          >
            <CalendarDays size={12} />
            Day {day}{selectedMonth !== (today.getMonth() + 1) || selectedYear !== today.getFullYear() ? ` · ${selectedMonth}/${selectedYear}` : day === today.getDate() ? " (today)" : ""}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1 rounded-lg py-1.5 px-2 text-xs font-medium transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {showMore ? "Less" : "More options"}
          <m.span animate={{ rotate: showMore ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-flex' }}>
            <ChevronDown size={12} />
          </m.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showMore && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:overflow-visible space-y-2"
          >
            {/* Receipt scanner */}
            {!editExpense && (
              <>
                <button
                  type="button"
                  onClick={() => setShowScanner((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: showScanner ? 'var(--brand-soft)' : 'var(--surface-secondary)',
                    color: showScanner ? 'var(--brand)' : 'var(--text-tertiary)',
                  }}
                >
                  <Camera size={12} />
                  Scan receipt
                </button>
                <AnimatePresence>
                  {showScanner && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden rounded-xl border"
                      style={{ borderColor: "var(--border)", background: "var(--surface-secondary)" }}
                    >
                      <div className="p-3">
                        <ReceiptCapture
                          onExtracted={(data) => {
                            if (data.amount) setAmount(data.amount.toString());
                            if (data.category) setCategory(data.category);
                            if (data.remark) setRemark(data.remark);
                            setShowScanner(false);
                          }}
                          onClose={() => setShowScanner(false)}
                        />
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </>
            )}
            {multiCurrency && (
              <div>
                <label className="form-label mb-1.5 uppercase">Currency</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setExpenseCurrency(c.code)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                        expenseCurrency === c.code
                          ? "bg-brand-soft text-brand ring-1 ring-brand-border"
                          : "text-[var(--text-secondary)]"
                      )}
                      style={expenseCurrency !== c.code ? { background: "var(--surface-secondary)" } : undefined}
                    >
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="form-label mb-1.5 uppercase">Date</label>
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
          </m.div>
        )}
      </AnimatePresence>

      {/* ─── 5. Submit ─── */}
      <m.button
        type="submit"
        disabled={submitting || !amount}
        className="btn-primary btn-lg w-full justify-center"
        whileTap={{ scale: 0.97 }}
        transition={spring.water}
      >
        {submitting
          ? "Dropping stone..."
          : editExpense
            ? "Update Expense"
            : "Drop Stone"}
      </m.button>
    </form>
  );
}
