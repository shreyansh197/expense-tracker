"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

const TIPS = [
  "Swipe left / right to switch months",
  "Enable Business Mode for ledger tracking",
  "Set a budget to unlock forecasts & alerts",
  "Tap the + button to add expenses quickly",
];

export function QuickHelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");
  const shortcuts = SHORTCUTS.filter((s) => (isMac ? !s.ctrl : !s.meta));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
        style={{ color: "var(--text-muted)" }}
        aria-label="Quick help"
      >
        <HelpCircle size={18} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border p-4 shadow-xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
              Quick Tips
            </h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          </div>

          <ul className="space-y-1.5">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-center gap-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {tip}
              </li>
            ))}
          </ul>

          <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
              Keyboard Shortcuts
            </h4>
            <div className="space-y-1">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: "var(--text-secondary)" }}>{s.description}</span>
                  <kbd className="rounded border px-1.5 py-0.5 font-mono text-[10px]" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-secondary)" }}>
                    {s.label}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-center text-[10px]" style={{ color: "var(--text-secondary)" }}>
            Press <kbd className="rounded border px-1 py-0.5 font-mono" style={{ borderColor: "var(--border)", background: "var(--surface-secondary)", color: "var(--text-primary)" }}>Shift + ?</kbd> for full shortcuts panel
          </p>
        </div>
      )}
    </div>
  );
}
