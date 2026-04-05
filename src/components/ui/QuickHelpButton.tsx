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
    // Small delay so the touch/click that opened the popup doesn't immediately close it
    const timerId = setTimeout(() => {
      const handler = (e: MouseEvent | TouchEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler, { passive: true });
      handlerRef.current = handler;
    }, 100);
    return () => {
      clearTimeout(timerId);
      if (handlerRef.current) {
        document.removeEventListener("mousedown", handlerRef.current);
        document.removeEventListener("touchstart", handlerRef.current);
        handlerRef.current = null;
      }
    };
  }, [open]);

  const handlerRef = useRef<((e: MouseEvent | TouchEvent) => void) | null>(null);

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
        style={{ color: "var(--text-primary)", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
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
            "w-72 rounded-xl border p-4 shadow-xl max-h-[70vh] overflow-y-auto",
            variant === "sidebar"
              ? "absolute z-[9999] bottom-full left-0 mb-2"
              : "fixed z-[10000] right-3 top-auto mt-2 sm:absolute sm:right-0 sm:top-full sm:fixed-auto"
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
            <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }} className="transition-colors hover:opacity-80">
              <X size={14} />
            </button>
          </div>

          <ul className="space-y-1.5">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-center gap-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--secondary)' }} />
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
                  <kbd className="rounded border px-1.5 py-0.5 font-mono text-caption" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-secondary)" }}>
                    {s.label}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
            Press <kbd className="rounded border px-1 py-0.5 font-mono" style={{ borderColor: "var(--border)", background: "var(--surface-secondary)", color: "var(--text-primary)" }}>Shift + ?</kbd> for full shortcuts panel
          </p>
        </div>
      )}
    </div>
  );
}
