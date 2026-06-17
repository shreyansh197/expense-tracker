"use client";

import { useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { usePathname } from "next/navigation";
import { ExpenseForm } from "./ExpenseForm";
import { EchoCard } from "./EchoCard";
import { useExpenses } from "@/hooks/useExpenses";
import { useEcho } from "@/hooks/useEcho";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { spring } from "@/lib/motion/tokens";
import type { ExpenseInput } from "@/types";

export function ExpenseFormModal() {
  const { showExpenseForm, editingExpenseId, formPrefill, closeForm, currentMonth, currentYear } =
    useUIStore();
  const { expenses, addExpense, updateExpense } = useExpenses(currentMonth, currentYear);
  const closingRef = useRef(false);
  const pathname = usePathname();
  const isBizRoute = pathname.startsWith("/business");

  const { echo, triggerEcho, clearEcho } = useEcho(expenses);

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

  const handleSubmit = useCallback(async (data: ExpenseInput) => {
    await addExpense(data);
    // Synthesise a temporary expense object to find the echo target
    if (!isBizRoute) {
      const syntheticExpense = {
        ...data,
        id: "__echo_temp__",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        deviceId: "",
      };
      triggerEcho(syntheticExpense);
    }
  }, [addExpense, triggerEcho, isBizRoute]);

  // Keyboard shortcut: Ctrl/Cmd+Shift+E to open add form
  // (avoids conflict with browser's native Ctrl+N "New Tab")
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "E") {
        e.preventDefault();
        useUIStore.getState().openAddForm();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <>
      <BottomSheet
        open={showExpenseForm}
        onClose={handleClose}
        label="Expense form"
        className="expense-form-modal"
        springPreset={spring.water}
      >
        <div className="px-4 pb-4">
          <ExpenseForm
            onSubmit={handleSubmit}
            onUpdate={updateExpense}
            editExpense={editExpense}
            prefill={formPrefill ?? undefined}
            month={currentMonth}
            year={currentYear}
            onClose={handleClose}
            closingRef={closingRef}
          />
        </div>
      </BottomSheet>

      {/* Echo card: shown after successful submit, suppressed in business mode */}
      {!isBizRoute && <EchoCard echo={echo} onDismiss={clearEcho} />}
    </>
  );
}
