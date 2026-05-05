"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { TrendingUp, Minus } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useCurrency } from "@/hooks/useCurrency";
import type { Goal } from "@/types";

interface GoalFundingSheetProps {
  goal: Goal | null;
  onClose: () => void;
  /** Called with the resolved new savedAmount after validation */
  onSave: (goalId: string, newSaved: number) => void;
}

/**
 * Shared bottom sheet for funding or withdrawing from a savings goal.
 * Used by both SavingsGoalsWidget (dashboard) and GoalsManager (settings).
 */
export function GoalFundingSheet({ goal, onClose, onSave }: GoalFundingSheetProps) {
  const { symbol } = useCurrency();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state each time a new goal is opened
  useEffect(() => {
    if (goal) {
      setAmount("");
      setMode("add");
    }
  }, [goal?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (goal) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [goal]);

  const handleSave = useCallback(() => {
    if (!goal) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    const newSaved =
      mode === "add"
        ? Math.min(goal.savedAmount + amt, goal.targetAmount)
        : Math.max(goal.savedAmount - amt, 0);
    onSave(goal.id, newSaved);
    onClose();
  }, [goal, amount, mode, onSave, onClose]);

  const pct =
    goal && goal.targetAmount > 0
      ? Math.round((goal.savedAmount / goal.targetAmount) * 100)
      : 0;

  const sheet = (
    <BottomSheet open={!!goal} onClose={onClose} label="Fund savings goal">
      {goal && (
        <div className="space-y-4 px-5 pb-6 pt-2">
          {/* Goal header */}
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: goal.color }}
            />
            <h3
              className="truncate text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {goal.name}
            </h3>
          </div>

          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="font-numeric">{goal.savedAmount.toLocaleString()} saved</span>
              <span className="font-numeric">of {goal.targetAmount.toLocaleString()}</span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--surface-secondary)" }}
              role="progressbar"
              aria-valuenow={Math.min(pct, 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }}
              />
            </div>
          </div>

          {/* Add / Remove toggle */}
          <div
            className="flex overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setMode("add")}
              className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
              style={
                mode === "add"
                  ? { background: "var(--accent-soft)", color: "var(--accent)" }
                  : { color: "var(--text-muted)" }
              }
            >
              <TrendingUp size={14} />
              Add
            </button>
            <button
              onClick={() => setMode("subtract")}
              className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
              style={
                mode === "subtract"
                  ? { background: "var(--accent-soft)", color: "var(--accent)" }
                  : { color: "var(--text-muted)" }
              }
            >
              <Minus size={14} />
              Remove
            </button>
          </div>

          {/* Amount input */}
          <div className="relative">
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {symbol}
            </span>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") onClose();
              }}
              placeholder="Enter amount"
              className="form-input w-full rounded-xl"
              style={{ paddingLeft: "2rem", fontSize: "16px" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "var(--primary-gradient, var(--primary))" }}
            >
              {mode === "add" ? "Add Funds" : "Remove Funds"}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl px-5 py-3 text-sm font-medium transition-colors"
              style={{
                color: "var(--text-secondary)",
                background: "var(--surface-secondary)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
