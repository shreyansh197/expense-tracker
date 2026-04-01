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
        label: "Refresh",
        onClick: () => window.location.reload(),
      });
    }

    window.addEventListener("sw-update-available", onUpdate);
    return () => window.removeEventListener("sw-update-available", onUpdate);
  }, [toast]);

  return null;
}
