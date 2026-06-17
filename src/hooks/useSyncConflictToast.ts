"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * Listens for `sync-conflict` BroadcastChannel messages emitted by the sync engine
 * when the server overwrites a locally-newer expense record.
 * Shows a brief informational toast to let the user know.
 */
export function useSyncConflictToast() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const bc = new BroadcastChannel("expenstream-sync");

    bc.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "sync-conflict") {
        const count: number = e.data.count ?? 1;
        toast(
          `${count} expense${count > 1 ? "s" : ""} updated from another device`,
          "info"
        );
      }
    });

    return () => bc.close();
  }, [toast]);
}
