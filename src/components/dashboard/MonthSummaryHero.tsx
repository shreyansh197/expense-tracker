"use client";

import { useMemo, useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Coffee, Edit2, Check, X } from "lucide-react";
import { SpendingStream } from "@/components/dashboard/SpendingStream";
import { useUIStore } from "@/stores/uiStore";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { CategoryTotal, CategoryMeta } from "@/types";

interface MonthSummaryHeroProps {
  monthlyTotal: number;
  remaining: number;
  budgetUsedPercent: number;
  effectiveBudget: number;
  daysRemaining: number;
  avgDaily: number;
  paceToStayUnder: number;
  categoryTotals: CategoryTotal[];
  categories: CategoryMeta[];
  topCategory: { slug: string; label: string; emoji: string; total: number } | null;
  streak: number;
  recurringCount: number;
  recurringTotal: number;
  formatCurrency: (n: number) => string;
  onCategoryClick: (slug: string) => void;
  userName?: string;
  todayTotal: number;
  yesterdayExpense?: { amount: number; category: string; remark: string; label: string } | null;
  achievementLabel?: string;
  // SpendingStream props
  dailyValues: number[];
  daysInMonth: number;
  anomalyDays: Set<number>;
  monthName: string;
  /** Numeric month (1-12) and year being displayed — passed to SpendingStream for the today marker */
  month: number;
  year: number;
  /** When true, renders a compact sticky bar instead of full hero */
  compact?: boolean;
  /** Called when user edits the budget/salary inline */
  onBudgetEdit?: (newBudget: number) => void;
}

export function MonthSummaryHero({
  monthlyTotal,
  remaining,
  budgetUsedPercent,
  effectiveBudget,
  daysRemaining,
  avgDaily,
  paceToStayUnder,
  formatCurrency,
  userName,
  todayTotal,
  yesterdayExpense,
  dailyValues,
  daysInMonth,
  anomalyDays,
  monthName,
  month,
  year,
  compact = false,
  onBudgetEdit,
}: MonthSummaryHeroProps) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Working late";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Good night";
  }, []);

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const budgetInputRef = useRef<HTMLInputElement>(null);

  const handleBudgetEditStart = () => {
    setBudgetInput(effectiveBudget > 0 ? String(effectiveBudget) : "");
    setEditingBudget(true);
    setTimeout(() => budgetInputRef.current?.focus(), 40);
  };

  const handleBudgetSave = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) onBudgetEdit?.(val);
    setEditingBudget(false);
  };

  // ─── Compact sticky bar ───────────────────────────────────
  if (compact) {
    return (
      <div
        className="sticky top-0 z-[var(--z-sticky)] backdrop-blur-md border-b"
        style={{
          background: "color-mix(in srgb, var(--surface) 85%, transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <AnimatedNumber
              value={monthlyTotal}
              format={formatCurrency}
              duration={350}
              className="font-display text-lg font-bold font-numeric leading-none"
              style={{ color: "var(--text-primary)" }}
            />
            {effectiveBudget > 0 && (
              <div className="flex items-center gap-1.5">
                <div
                  className="h-1.5 w-16 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(budgetUsedPercent, 100)}%`,
                      background: budgetUsedPercent > 100 ? "var(--danger)" : budgetUsedPercent > 80 ? "var(--warning)" : "var(--accent)",
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium font-numeric" style={{ color: "var(--text-muted)" }}>
                  {Math.round(budgetUsedPercent)}%
                </span>
              </div>
            )}
          </div>
          {daysRemaining > 0 && effectiveBudget > 0 && (
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
              {daysRemaining}d left
            </span>
          )}
        </div>
      </div>
    );
  }

  // ─── Full hero ────────────────────────────────────────────

  return (
    <m.div
      className="card-terrain relative overflow-hidden p-5 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Greeting */}
      {userName && (
        <p className="mb-1 text-xs font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>
          {greeting}, {userName.split(" ")[0]}
        </p>
      )}

      {/* Hero amount + orb */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <m.p
            layoutId="monthly-total"
            className="font-display text-hero-amount leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            <AnimatedNumber
              value={monthlyTotal}
              format={formatCurrency}
              duration={500}
            />
          </m.p>

          <p className="mt-1 text-sm" style={{ color: remaining < 0 ? "var(--danger)" : "var(--text-secondary)", fontWeight: remaining < 0 ? 700 : undefined }}>
            {effectiveBudget > 0
              ? remaining >= 0
                ? `${formatCurrency(remaining)} remaining`
                : `${formatCurrency(Math.abs(remaining))} past budget`
              : `spent in ${monthName}`}
            {daysRemaining > 0 && effectiveBudget > 0 && (
              <span style={{ color: "var(--text-muted)" }}> · {daysRemaining}d left</span>
            )}
          </p>
        </div>
      </div>

      {/* Budget progress bar */}
      {(effectiveBudget > 0 || onBudgetEdit) && (
        <div className="mt-3">
          {/* Budget label row with inline edit */}
          {onBudgetEdit && (
            <div className="flex items-center justify-between mb-1.5">
              <AnimatePresence mode="wait">
                {editingBudget ? (
                  <m.div
                    key="edit"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      ref={budgetInputRef}
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleBudgetSave(); if (e.key === "Escape") setEditingBudget(false); }}
                      className="w-28 rounded-lg bg-transparent px-2 py-0.5 text-sm font-numeric outline-none"
                      style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                      placeholder="Monthly budget"
                      aria-label="Set monthly budget"
                    />
                    <button onClick={handleBudgetSave} className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: "var(--accent)", color: "#fff" }} aria-label="Save budget"><Check size={12} /></button>
                    <button onClick={() => setEditingBudget(false)} className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: "var(--surface-tertiary)", color: "var(--text-muted)" }} aria-label="Cancel"><X size={12} /></button>
                  </m.div>
                ) : (
                  <m.button
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleBudgetEditStart}
                    className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-muted)" }}
                    aria-label="Edit monthly budget"
                  >
                    {effectiveBudget > 0 ? `Budget: ${formatCurrency(effectiveBudget)}` : "Set a budget"}
                    <Edit2 size={11} />
                  </m.button>
                )}
              </AnimatePresence>
            </div>
          )}
          {effectiveBudget > 0 && (
            <div
              className="relative h-1.5 w-full rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
              role="progressbar"
              aria-valuenow={Math.min(Math.round(budgetUsedPercent), 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Budget: ${Math.round(budgetUsedPercent)}% of ${formatCurrency(effectiveBudget)} used`}
            >
              <m.div
                className="h-full rounded-full"
                style={{
                  background: budgetUsedPercent > 100 ? "var(--danger)" : budgetUsedPercent > 80 ? "var(--warning)" : "var(--accent)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="absolute top-0 bottom-0 w-px" style={{ left: "75%", background: "var(--text-muted)", opacity: 0.4 }} />
              {budgetUsedPercent > 100 && (
                <m.div
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--danger)", marginRight: "-4px" }}
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Pace insight — one clear, human line instead of a stat grid */}
      {effectiveBudget > 0 && paceToStayUnder > 0 && (
        <p
          className="mt-2 text-xs"
          style={{ color: avgDaily > paceToStayUnder ? "var(--warning)" : "var(--text-muted)" }}
        >
          {avgDaily > paceToStayUnder
            ? `Spending ${formatCurrency(Math.round(avgDaily))}/day — aim for ${formatCurrency(Math.round(paceToStayUnder))} to stay on track`
            : `On track — ${formatCurrency(Math.round(paceToStayUnder))}/day keeps you under budget`}
        </p>
      )}

      {/* Quiet day / yesterday repeat */}
      {todayTotal === 0 && (
        <div className="mt-1.5 flex items-center gap-3">
          <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <Coffee size={12} />
            <span>Quiet day so far</span>
          </p>
          {yesterdayExpense && (
            <button
              onClick={() => useUIStore.getState().openAddForm({
                amount: yesterdayExpense.amount,
                category: yesterdayExpense.category,
                remark: yesterdayExpense.remark,
              })}
              className="rounded-ui-md px-2.5 py-1 text-xs font-medium transition-colors"
              style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
            >
              Same as yesterday · {yesterdayExpense.label}
            </button>
          )}
        </div>
      )}

      {/* Spending stream visualization */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Daily spend</span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{monthName}</span>
        </div>
        <SpendingStream
          budgetUsedPercent={budgetUsedPercent}
          dailyValues={dailyValues}
          daysInMonth={daysInMonth}
          dailyBudgetPace={paceToStayUnder}
          anomalyDays={anomalyDays}
          effectiveBudget={effectiveBudget}
          formatCurrency={formatCurrency}
          month={month}
          year={year}
        />
      </div>
    </m.div>
  );
}
