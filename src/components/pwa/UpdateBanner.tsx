"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

export function UpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker.ready.then((reg) => {
      registration = reg;

      // Check for waiting worker on mount
      if (reg.waiting) {
        setShowUpdate(true);
        return;
      }

      // Listen for new worker installation
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setShowUpdate(true);
          }
        });
      });
    });

    // Also detect controller change (another tab triggered update)
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
    setShowUpdate(false);
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <m.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-[300] flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg md:left-auto md:right-4 md:max-w-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <RefreshCw size={16} style={{ color: "var(--accent)" }} />
          <p className="flex-1 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            A new version is available
          </p>
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ background: "var(--accent)" }}
          >
            Update
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
