"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import { ExpenseForm } from "./ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";

const DISMISS_THRESHOLD = 100;

export function ExpenseFormModal() {
  const { showExpenseForm, editingExpenseId, closeForm, currentMonth, currentYear } =
    useUIStore();
  const { expenses, addExpense, updateExpense } = useExpenses(currentMonth, currentYear);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const closingRef = useRef(false);

  const editExpense = editingExpenseId
    ? expenses.find((e) => e.id === editingExpenseId) ?? null
    : null;

  // Reset closing flag when form opens
  useEffect(() => {
    if (showExpenseForm) {
      closingRef.current = false;
      dragStartRef.current = null;
    }
  }, [showExpenseForm]);

  // Robust close: blur everything, freeze inputs, then close
  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    // 1. Blur any focused element to immediately dismiss keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // 2. Make all form inputs unfocusable during exit animation
    const modal = document.querySelector('.expense-form-modal');
    if (modal) {
      modal.querySelectorAll<HTMLElement>('input, textarea, select').forEach(el => {
        el.setAttribute('tabindex', '-1');
        el.setAttribute('readonly', '');
        (el as HTMLInputElement).disabled = true;
      });
    }
    // 3. Close the form
    closeForm();
  }, [closeForm]);

  // Swipe-to-dismiss handlers (mobile only)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartRef.current === null) return;
    const delta = e.touches[0].clientY - dragStartRef.current;
    if (delta > 0) setDragY(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragY > DISMISS_THRESHOLD) {
      handleClose();
    }
    setDragY(0);
    dragStartRef.current = null;
  }, [dragY, handleClose]);

  // Close on backdrop click or Escape
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
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

  return (
    <AnimatePresence>
      {showExpenseForm && (
      <m.div
        className="fixed inset-0 z-[60] flex items-end justify-center backdrop-blur-sm lg:items-center"
        onClick={handleBackdropClick}
        initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
        animate={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
        transition={{ duration: 0.15 }}
      >
        <m.div
          className="expense-form-modal w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl shadow-lg lg:max-h-none lg:overflow-visible lg:rounded-2xl"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            opacity: dragY > 0 ? Math.max(1 - dragY / 300, 0.5) : 1,
          }}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          exit={{ opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.15, ease: "easeIn" } }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
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
        </m.div>
      </m.div>
      )}
    </AnimatePresence>
  );
}
