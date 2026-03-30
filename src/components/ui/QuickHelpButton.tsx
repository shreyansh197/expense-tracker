"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

const TIPS = [
  "Swipe left / right to switch months",
  "Enable Business Mode for ledger tracking",
  "Set a budget to unlock forecasts & alerts",
  "Tap the + button to add expenses quickly",
];

export function QuickHelpButton({ variant = "icon" }: { variant?: "icon" | "sidebar" }) {
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
        className={cn(
          "flex items-center transition-colors",
          variant === "sidebar"
            ? "gap-2 rounded-lg px-2 py-1.5 text-xs w-full"
            : "h-8 w-8 justify-center rounded-lg"
        )}
        style={{ color: "var(--text-primary)", background: "var(--surface-secondary)" }}
        onMouseEnter={variant === "sidebar" ? (e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; } : undefined}
        onMouseLeave={variant === "sidebar" ? (e) => { e.currentTarget.style.background = ''; } : undefined}
        aria-label="Quick help"
      >
        <HelpCircle size={variant === "sidebar" ? 14 : 18} />
        {variant === "sidebar" && "Help & Tips"}
      </button>

      {open && (
        <div
          className={cn(
            "w-72 rounded-xl border p-4 shadow-xl",
            variant === "sidebar"
              ? "fixed z-[9999] bottom-full left-0 mb-2"
              : "absolute z-[10000] right-0 top-full mt-2"
          )}
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
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
