"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Target, Plus, ArrowRight, X } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

const STORAGE_KEY = "expenstream_onboarding_done";

interface OnboardingFlowProps {
  onSetBudget: (amount: number) => void;
}

export function OnboardingFlow({ onSetBudget }: OnboardingFlowProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [budget, setBudget] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      // Skip if already completed, or if WelcomeTutorial already ran (budget set there)
      const tutorialSeen = localStorage.getItem("expenstream-tutorial-seen");
      if (!done && !tutorialSeen) setVisible(true);
    } catch { /* private browsing */ }
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* */ }
    setVisible(false);
  }

  function handleBudgetSubmit() {
    const n = parseFloat(budget.replace(/,/g, ""));
    if (n > 0) onSetBudget(n);
    setStep(1);
  }

  function handleAddExpense() {
    dismiss();
    useUIStore.getState().openAddForm();
  }

  if (!visible) return null;

  return (
    <AnimatePresence>
      <m.div
        key="onboarding"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="card-terrain p-5 relative"
        role="dialog"
        aria-label="Welcome to ExpenStream"
      >
        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-secondary)]"
          aria-label="Skip onboarding"
        >
          <X size={14} style={{ color: "var(--text-muted)" }} />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: step === i ? 20 : 6,
                background: step === i ? "var(--accent)" : "var(--border)",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <m.div
              key="step0"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} style={{ color: "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Set your monthly budget
                </p>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                We'll track your pace and alert you before you overspend.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 20000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="flex-1 rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleBudgetSubmit()}
                  autoFocus
                />
                <button
                  onClick={handleBudgetSubmit}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  style={{ background: "var(--accent)" }}
                  disabled={!budget.trim()}
                >
                  Set
                </button>
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-2 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Skip for now →
              </button>
            </m.div>
          )}

          {step === 1 && (
            <m.div
              key="step1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Plus size={16} style={{ color: "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Add your first expense
                </p>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Tap below to log something small — a coffee, a meal, anything.
              </p>
              <button
                onClick={handleAddExpense}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
                style={{ background: "var(--accent)" }}
              >
                <Plus size={15} />
                Add first expense
              </button>
              <button
                onClick={() => setStep(2)}
                className="mt-2 w-full text-xs text-center"
                style={{ color: "var(--text-muted)" }}
              >
                I'll do it later →
              </button>
            </m.div>
          )}

          {step === 2 && (
            <m.div
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={16} style={{ color: "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  You're all set
                </p>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Your dashboard updates in real-time as you add expenses. Explore Analytics for trends and insights.
              </p>
              <button
                onClick={dismiss}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
                style={{ background: "var(--accent)" }}
              >
                Explore dashboard
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </AnimatePresence>
  );
}
