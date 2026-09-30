"use client";

import { useSyncExternalStore } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  getSyncPhase,
  onSyncPhaseChange,
  getSyncCounters,
  onSyncCountersChange,
  type SyncCounters,
} from "@/lib/syncEngine";
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
  } else {
    // phase is idle — don't show spinning icon just because mutations are queued;
    // the next poll cycle will push them. Avoids permanent spinner from stuck mutations.
    syncStatus = "synced";
  }

  return { syncStatus, pendingCount };
}

// ── Sync diagnostics counters ──

// Stable server snapshot to avoid useSyncExternalStore infinite-loop warnings
// on SSR. Counter subscriptions replace it with fresh snapshots on the client.
const _emptyServerCounters: SyncCounters = {
  pullBatches: 0,
  pushBatches: 0,
  conflicts: 0,
  failures: 0,
  lastPullAt: 0,
  lastPushAt: 0,
  lastError: null,
  resetAt: 0,
};

let _cachedCounters: SyncCounters = _emptyServerCounters;

function subscribeCounters(cb: () => void) {
  return onSyncCountersChange((snapshot) => {
    _cachedCounters = snapshot;
    cb();
  });
}

function getCountersSnapshot(): SyncCounters {
  // Refresh the cache lazily so first read after subscribe is current.
  if (_cachedCounters === _emptyServerCounters) {
    _cachedCounters = getSyncCounters();
  }
  return _cachedCounters;
}

function getServerCountersSnapshot(): SyncCounters {
  return _emptyServerCounters;
}

/**
 * Session-scoped sync counters plus pending queue depth.
 *
 * Counters are in-memory only and reset when the tab is closed or
 * `resetSyncCounters()` is called. They never carry monetary values or PII.
 */
export function useSyncCounters(): { counters: SyncCounters; pendingCount: number } {
  const counters = useSyncExternalStore(
    subscribeCounters,
    getCountersSnapshot,
    getServerCountersSnapshot,
  );
  const pendingCount = useDexieQuery(() => db.mutations.count(), [], 0);
  return { counters, pendingCount };
}
