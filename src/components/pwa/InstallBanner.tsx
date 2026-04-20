"use client";

import { useState, useEffect, startTransition } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISIT_KEY = "expenstream-visit-count";
const DISMISSED_KEY = "expenstream-install-dismissed";
const MIN_VISITS = 3;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * Proactive install banner shown on the dashboard after MIN_VISITS.
 * Dismissible — won't show again once dismissed or installed.
 */
export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (typeof window === "undefined") return;

    // Check if dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    // Increment visit count
    const count = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(count));

    if (count < MIN_VISITS) return;

    // Check for saved prompt
    const saved = (window as unknown as Record<string, unknown>).__pwaInstallPrompt;
    if (saved) {
      startTransition(() => {
        setDeferredPrompt(saved as BeforeInstallPromptEvent);
        setVisible(true);
      });
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
    (window as unknown as Record<string, unknown>).__pwaInstallPrompt = null;
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  return (
    <AnimatePresence>
      {visible && deferredPrompt && (
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ background: "var(--surface-secondary)", borderColor: "var(--border)" }}
        >
          <Download size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Install ExpenStream
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Add to your home screen for quick access
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1.5 transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
