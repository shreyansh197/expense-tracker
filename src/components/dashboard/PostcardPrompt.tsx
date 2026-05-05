"use client";

import { useState, useMemo } from "react";
import { Image, X } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

const DISMISSED_KEY = "expenstream-postcard-prompt-dismissed";

interface PostcardPromptProps {
  month: number;
  year: number;
  hasExpenses: boolean;
}

/**
 * Postcard Prompt — a gentle end-of-month nudge (days 28–31)
 * encouraging the user to view/share their Monthly Postcard.
 * Dismisses for the current month once closed.
 */
export function PostcardPrompt({ month, year, hasExpenses }: PostcardPromptProps) {
  const monthKey = `${year}-${month}`;
  const openPostcard = useUIStore((s) => s.openPostcard);

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(DISMISSED_KEY) === monthKey;
    } catch { return false; }
  });

  const shouldShow = useMemo(() => {
    if (dismissed || !hasExpenses) return false;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    // Only show for the current month, days 28-31
    if (month !== currentMonth || year !== currentYear) return false;
    const today = now.getDate();
    return today >= 28;
  }, [dismissed, hasExpenses, month, year]);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, monthKey); } catch { /* ignore */ }
  };

  const handleOpen = () => {
    openPostcard();
    handleDismiss();
  };

  return (
    <div
      className="card relative overflow-hidden px-4 py-3 sm:px-5"
      style={{ borderLeft: "3px solid var(--accent)" }}
    >
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
        style={{ color: "var(--text-muted)" }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--accent-soft)" }}
        >
          <Image size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Your month is wrapping up
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            See your monthly postcard and share it
          </p>
        </div>
        <button
          onClick={handleOpen}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          View
        </button>
      </div>
    </div>
  );
}
