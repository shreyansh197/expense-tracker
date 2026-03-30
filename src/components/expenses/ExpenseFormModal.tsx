"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { ExpenseForm } from "./ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";

const DISMISS_THRESHOLD = 100;

export function ExpenseFormModal() {
  const { showExpenseForm, editingExpenseId, closeForm, currentMonth, currentYear } =
    useUIStore();
  const { expenses, addExpense, updateExpense } = useExpenses(currentMonth, currentYear);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);

  const editExpense = editingExpenseId
    ? expenses.find((e) => e.id === editingExpenseId) ?? null
    : null;

  // Save and restore focus
  useEffect(() => {
    if (showExpenseForm) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      dragStartRef.current = null;
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
      closeForm();
    }
    setDragY(0);
    dragStartRef.current = null;
  }, [dragY, closeForm]);

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
      <div
        className="expense-form-modal w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl p-6 shadow-lg lg:max-h-none lg:overflow-visible lg:rounded-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragY > 0 ? 'none' : 'transform 0.2s ease',
          opacity: dragY > 0 ? Math.max(1 - dragY / 300, 0.5) : 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle — mobile only */}
        <div className="mb-3 flex justify-center lg:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
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
