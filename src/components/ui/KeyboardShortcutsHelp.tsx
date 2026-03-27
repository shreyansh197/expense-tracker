"use client";

import { X, Keyboard } from "lucide-react";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  if (!open) return null;

  // Deduplicate: show Ctrl on Windows, ⌘ on Mac
  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");
  const filtered = SHORTCUTS.filter((s) => {
    if (isMac) return !s.ctrl;
    return !s.meta;
  });

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {filtered.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {s.description}
              </span>
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-mono text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {s.label}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
