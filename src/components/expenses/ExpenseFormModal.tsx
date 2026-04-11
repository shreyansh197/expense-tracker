"use client";

import { useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { ExpenseForm } from "./ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";
import { BottomSheet } from "@/components/ui/BottomSheet";

export function ExpenseFormModal() {
  const { showExpenseForm, editingExpenseId, closeForm, currentMonth, currentYear } =
    useUIStore();
  const { expenses, addExpense, updateExpense } = useExpenses(currentMonth, currentYear);
  const closingRef = useRef(false);

  const editExpense = editingExpenseId
    ? expenses.find((e) => e.id === editingExpenseId) ?? null
    : null;

  // Reset closing flag when form opens
  useEffect(() => {
    if (showExpenseForm) {
      closingRef.current = false;
    }
  }, [showExpenseForm]);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    closeForm();
  }, [closeForm]);

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

  return (
    <BottomSheet
      open={showExpenseForm}
      onClose={handleClose}
      label="Expense form"
      className="expense-form-modal"
    >
      <div className="px-6 pb-6">
        <ExpenseForm
          onSubmit={addExpense}
          onUpdate={updateExpense}
          editExpense={editExpense}
          month={currentMonth}
          year={currentYear}
          onClose={handleClose}
          closingRef={closingRef}
        />
      </div>
    </BottomSheet>
  );
}
