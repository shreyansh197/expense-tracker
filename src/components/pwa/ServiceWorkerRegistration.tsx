"use client";

import { useEffect, useCallback } from "react";

export function ServiceWorkerRegistration() {
  const promptUpdate = useCallback(() => {
    // Dispatch a custom event that can be listened to by a toast/banner
    window.dispatchEvent(new CustomEvent("sw-update-available"));
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for updates periodically (every 60 minutes)
        const interval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        // Detect waiting service worker (new version ready)
        if (registration.waiting) {
          promptUpdate();
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New SW installed, old one still controls — prompt user
              promptUpdate();
            }
          });
        });

        return () => clearInterval(interval);
      })
      .catch(() => {
        // SW registration failed — app still works normally
      });

    // Auto-reload when new SW takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, [promptUpdate]);

  return null;
}
