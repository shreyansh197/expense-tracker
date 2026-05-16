"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

const COMMON_TIPS = [
  "Set a monthly budget in Settings to unlock spend forecasts and pace alerts",
  "Add recurring expenses in Settings → Recurring — they auto-log each month",
  "Per-category budgets are available in Settings → Category Budgets",
  "Track achievements by staying under budget — streaks and badges unlock rewards",
  "PIN lock protects your app — brute-force lockout kicks in after 3 wrong attempts",
  "Link or manage devices in Settings → Devices to sync across desktop and phone",
  "Enable Business Mode in Settings for ledger and payment tracking",
  "Export or import expenses as CSV from the Expenses page",
  "Choose an accent color and app theme in Settings → Appearance",
  "Search settings by keyword to find any option fast",
];

const TOUCH_TIPS = [
  "Swipe left / right on the month header to switch months",
  "Pull down on the dashboard to sync the latest data",
  "Tap the + button or FAB to add a new expense quickly",
  "Swipe an expense left to delete it",
  "Use the bottom nav to switch between Dashboard, Expenses, Analytics and Settings",
  "Install as an app from your browser menu for offline access",
];

const DESKTOP_TIPS = [
  "Use Ctrl+K (⌘K on Mac) to focus the search bar",
  "Press Ctrl+N (⌘N on Mac) to add a new expense",
  "Press Shift+? to see all keyboard shortcuts",
  "Arrow keys navigate the spending stream chart, accent color picker & category grid",
  "Tab to the echo card after adding an expense, then Esc to dismiss",
  "Use the sidebar Help & Tips button for quick reminders any time",
];

function getIsTouch() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function HelpPanelContent({
  tips,
  shortcuts,
  isTouch,
  onClose,
  pageTips,
  pageLabel,
  showGeneral,
}: {
  tips: string[];
  shortcuts: { label: string; description: string }[];
  isTouch: boolean;
  onClose: () => void;
  pageTips?: string[];
  pageLabel?: string;
  showGeneral?: boolean;
}) {
  // When a page supplies its own tips, hide the generic section unless caller opts in
  const pageOnly = !!(pageTips && pageTips.length > 0 && !showGeneral);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
          Quick Tips
        </h3>
        <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="transition-colors hover:opacity-80">
          <X size={14} />
        </button>
      </div>

      {pageTips && pageTips.length > 0 && (
        <>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
            {pageLabel ?? "This page"}
          </p>
          <ul className={`space-y-1.5${!pageOnly ? " mb-3" : ""}`}>
            {pageTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
                {tip}
              </li>
            ))}
          </ul>
          {!pageOnly && (
            <>
              <div className="mb-3 border-t" style={{ borderColor: "var(--border)" }} />
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                General
              </p>
            </>
          )}
        </>
      )}

      {!pageOnly && (
        <>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--secondary)" }} />
                {tip}
              </li>
            ))}
          </ul>

          {!isTouch && (
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
          )}

          {!isTouch && (
            <p className="mt-3 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
              Press <kbd className="rounded border px-1 py-0.5 font-mono" style={{ borderColor: "var(--border)", background: "var(--surface-secondary)", color: "var(--text-primary)" }}>Shift + ?</kbd> for full shortcuts panel
            </p>
          )}
        </>
      )}
    </>
  );
}

export function QuickHelpButton({ variant = "icon", pageTips, pageLabel, showGeneral }: { variant?: "icon" | "sidebar"; pageTips?: string[]; pageLabel?: string; showGeneral?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
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
  const isTouch = getIsTouch();
  const shortcuts = SHORTCUTS.filter((s) => (isMac ? !s.ctrl : !s.meta));
  const tips = [...COMMON_TIPS, ...(isTouch ? TOUCH_TIPS : DESKTOP_TIPS)];
  const close = () => setOpen(false);

  const panelStyle = {
    background: "var(--surface)",
    borderColor: "var(--border)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  };

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
        onMouseEnter={variant === "sidebar" ? (e) => { e.currentTarget.style.background = "var(--surface-secondary)"; } : undefined}
        onMouseLeave={variant === "sidebar" ? (e) => { e.currentTarget.style.background = ""; } : undefined}
        aria-label="Quick help"
      >
        <HelpCircle size={variant === "sidebar" ? 14 : 18} />
        {variant === "sidebar" && "Help & Tips"}
      </button>

      {open && variant !== "sidebar" && createPortal(
        <>
          <div
            className="fixed inset-0 z-[450] bg-black/20 backdrop-blur-[1px] sm:hidden"
            onClick={close}
          />
          <div
            className="fixed inset-x-3 top-20 z-[500] w-auto sm:inset-x-auto sm:w-72 sm:right-6 sm:top-16 rounded-xl border p-4 shadow-xl max-h-[70vh] overflow-y-auto"
            style={panelStyle}
          >
            <HelpPanelContent tips={tips} shortcuts={shortcuts} isTouch={isTouch} onClose={close} pageTips={pageTips} pageLabel={pageLabel} showGeneral={showGeneral} />
          </div>
        </>,
        document.body,
      )}

      {open && variant === "sidebar" && (
        <div
          className="absolute z-[500] bottom-full left-0 mb-2 w-72 rounded-xl border p-4 shadow-xl max-h-[70vh] overflow-y-auto"
          style={panelStyle}
        >
          <HelpPanelContent tips={tips} shortcuts={shortcuts} isTouch={isTouch} onClose={close} pageTips={pageTips} pageLabel={pageLabel} showGeneral={showGeneral} />
        </div>
      )}
    </div>
  );
}
