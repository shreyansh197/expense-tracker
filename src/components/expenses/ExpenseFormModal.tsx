"use client";

import { useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { ExpenseForm } from "./ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";

export function ExpenseFormModal() {
  const { showExpenseForm, editingExpenseId, closeForm, currentMonth, currentYear } =
    useUIStore();
  const { expenses, addExpense, updateExpense } = useExpenses(currentMonth, currentYear);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const editExpense = editingExpenseId
    ? expenses.find((e) => e.id === editingExpenseId) ?? null
    : null;

  // Save and restore focus
  useEffect(() => {
    if (showExpenseForm) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus first input after render
      requestAnimationFrame(() => {
        const firstInput = document.querySelector<HTMLElement>(
          ".expense-form-modal input, .expense-form-modal button"
        );
        firstInput?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [showExpenseForm]);

  // Close on backdrop click or Escape
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) closeForm();
    },
    [closeForm]
  );

  // Keyboard shortcut: Ctrl/Cmd+N to open add form
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        useUIStore.getState().openAddForm();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  if (!showExpenseForm) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center"
      onClick={handleBackdropClick}
    >
      <div className="expense-form-modal w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl p-6 shadow-lg lg:max-h-none lg:overflow-visible lg:rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <ExpenseForm
          onSubmit={addExpense}
          onUpdate={updateExpense}
          editExpense={editExpense}
          month={currentMonth}
          year={currentYear}
        />
      </div>
    </div>
  );
}
