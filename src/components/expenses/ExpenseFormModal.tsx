"use client";

import { useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { ExpenseForm } from "./ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";

export function ExpenseFormModal() {
  const { showExpenseForm, editingExpenseId, closeForm, currentMonth, currentYear } =
    useUIStore();
  const { expenses, addExpense, updateExpense } = useExpenses(currentMonth, currentYear);

  const editExpense = editingExpenseId
    ? expenses.find((e) => e.id === editingExpenseId) ?? null
    : null;

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
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl dark:bg-gray-900 lg:rounded-2xl">
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
