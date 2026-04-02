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
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-brand" />
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-secondary)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close keyboard shortcuts"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {filtered.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-secondary)]"
            >
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {s.description}
              </span>
              <kbd className="rounded-md px-2 py-0.5 text-xs font-mono" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {s.label}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
