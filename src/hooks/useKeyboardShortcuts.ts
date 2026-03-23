"use client";

import { useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";

interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
  label: string;
}

export const SHORTCUTS: Omit<ShortcutDef, "action">[] = [
  { key: "n", ctrl: true, label: "Ctrl+N", description: "Add new expense" },
  { key: "n", meta: true, label: "⌘+N", description: "Add new expense" },
  { key: "k", ctrl: true, label: "Ctrl+K", description: "Focus search" },
  { key: "k", meta: true, label: "⌘+K", description: "Focus search" },
  { key: "?", label: "?", description: "Show keyboard shortcuts" },
  { key: "Escape", label: "Esc", description: "Close dialog / form" },
];

export function useKeyboardShortcuts(onShowHelp: () => void) {
  const helpRef = useRef(onShowHelp);
  useEffect(() => { helpRef.current = onShowHelp; });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable;

    // ? key (only when not in input)
    if (e.key === "?" && !isInput && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      helpRef.current();
      return;
    }

    // Ctrl/Cmd+K — focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[placeholder*="Search"]'
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      } else {
        // Navigate to expenses page
        const { setSearchQuery } = useUIStore.getState();
        setSearchQuery("");
        window.location.href = "/expenses";
      }
      return;
    }

    // Ctrl/Cmd+N handled in ExpenseFormModal already
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
