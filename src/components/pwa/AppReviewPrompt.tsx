"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

const PROMPT_KEY = "expenstream-review-prompt";
const USAGE_KEY = "expenstream-usage-days";

/** Shows a gentle "Enjoying ExpenStream?" banner after 7 distinct usage days, once per 90 days. */
export function AppReviewPrompt() {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    // Track distinct usage days
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem(USAGE_KEY) ?? "[]") as string[];
    const days = Array.isArray(stored) ? stored : [];
    if (!days.includes(today)) {
      days.push(today);
      // keep only the last 30 days to avoid unbounded growth
      const trimmed = days.slice(-30);
      localStorage.setItem(USAGE_KEY, JSON.stringify(trimmed));
    }

    // Show prompt after 7 days and not dismissed within last 90 days
    const promptData = localStorage.getItem(PROMPT_KEY);
    const lastShown = promptData ? Number(promptData) : 0;
    const daysSinceLast = (Date.now() - lastShown) / (1000 * 60 * 60 * 24);

    if (days.length >= 7 && daysSinceLast > 90) {
      setVisible(true);
    }
  }, [isAuthenticated]);

  const dismiss = () => {
    localStorage.setItem(PROMPT_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="App review prompt"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 w-[min(340px,calc(100vw-32px))] rounded-2xl shadow-2xl border p-4"
      style={{
        background: "var(--surface-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        Enjoying ExpenStream? 🎉
      </p>
      <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
        You&apos;ve been tracking expenses for a while. Consider sharing it with friends — it really helps!
      </p>
      <div className="flex gap-2">
        <a
          href="https://github.com/your-repo"
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="flex-1 rounded-xl py-2 text-xs font-semibold text-center text-white transition-all active:scale-95"
          style={{ background: "var(--accent)" }}
        >
          ⭐ Star on GitHub
        </a>
        <button
          onClick={dismiss}
          className="rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--surface-secondary)]"
          style={{ color: "var(--text-muted)" }}
          aria-label="Dismiss review prompt"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
