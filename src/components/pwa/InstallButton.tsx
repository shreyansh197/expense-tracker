"use client";

import { useState, useEffect, startTransition } from "react";
import { Download, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    if (installed) return;

    // Check if the event was already captured by the global inline script
    const saved = (window as unknown as Record<string, unknown>).__pwaInstallPrompt;
    if (saved) {
      startTransition(() => setDeferredPrompt(saved as BeforeInstallPromptEvent));
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [installed]);

  if (installed) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        ✓ App is installed
      </p>
    );
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    (window as unknown as Record<string, unknown>).__pwaInstallPrompt = null;
  };

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        <Download size={16} />
        Install App
      </button>
    );
  }

  // Fallback: show manual instructions
  return (
    <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
      <div className="flex items-start gap-2">
        <Smartphone size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Android (Chrome)</p>
          <p>Tap menu (⋮) → &quot;Install app&quot;</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Smartphone size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>iPhone (Safari)</p>
          <p>Tap Share (↑) → &quot;Add to Home Screen&quot;</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Monitor size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Desktop (Chrome/Edge)</p>
          <p>Click menu (⋮) → &quot;Save and Share&quot; → &quot;Install page as app&quot;</p>
        </div>
      </div>
    </div>
  );
}
