"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

export function SWUpdateListener() {
  const { toast } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    function onUpdate() {
      if (shown.current) return;
      shown.current = true;
      toast("A new version is available", "info", {
        label: "Update",
        onClick: () => {
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.waiting?.postMessage({ type: "SKIP_WAITING" });
            });
          }
          // Fallback: reload after a short delay if controllerchange doesn't fire
          setTimeout(() => window.location.reload(), 1000);
        },
      });
    }

    window.addEventListener("sw-update-available", onUpdate);
    return () => window.removeEventListener("sw-update-available", onUpdate);
  }, [toast]);

  return null;
}
