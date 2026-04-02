"use client";

import { useSyncExternalStore } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getSyncPhase, onSyncPhaseChange } from "@/lib/syncEngine";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import { db } from "@/lib/db";
import type { SyncStatus } from "@/types";

function subscribeSyncPhase(cb: () => void) {
  return onSyncPhaseChange(cb);
}

function getSnapshot() {
  return getSyncPhase();
}

export function useSyncStatus(): { syncStatus: SyncStatus; pendingCount: number } {
  const isOnline = useOnlineStatus();
  const phase = useSyncExternalStore(subscribeSyncPhase, getSnapshot, () => "idle" as const);
  const pendingCount = useDexieQuery(() => db.mutations.count(), [], 0);

  let syncStatus: SyncStatus;
  if (!isOnline) {
    syncStatus = "offline";
  } else if (phase === "error") {
    syncStatus = "error";
  } else if (phase === "syncing") {
    syncStatus = "syncing";
  } else if (pendingCount > 0) {
    syncStatus = "syncing";
  } else {
    syncStatus = "synced";
  }

  return { syncStatus, pendingCount };
}
