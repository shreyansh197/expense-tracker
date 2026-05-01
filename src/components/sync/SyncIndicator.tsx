"use client";

import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { trySyncPush } from "@/lib/syncEngine";

export function SyncIndicator() {
  const isOnline = useOnlineStatus();
  const { syncStatus, pendingCount } = useSyncStatus();

  const effective = isOnline ? syncStatus : "offline";

  return (
    <div className="flex items-center gap-1.5">
      {effective === "synced" && (
        <div className="flex items-center gap-1" style={{ color: 'var(--success-text)' }} title="Synced">
          <div className="h-2 w-2 rounded-full" style={{ background: 'var(--success)' }} />
          <Wifi size={14} />
        </div>
      )}
      {effective === "syncing" && (
        <div className="flex items-center gap-1" style={{ color: 'var(--secondary-text)' }} title="Syncing...">
          <RefreshCw size={14} className="animate-spin" />
        </div>
      )}
      {effective === "offline" && (
        <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }} title="Offline">
          <WifiOff size={14} />
          {pendingCount > 0 && (
            <span className="ml-0.5 rounded-full px-1.5 py-0.5 text-caption font-bold text-white" style={{ background: 'var(--warning)' }}>
              {pendingCount}
            </span>
          )}
        </div>
      )}
      {effective === "error" && (
        <button
          onClick={() => trySyncPush(undefined, true)}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-[var(--surface-secondary)]"
          style={{ color: 'var(--danger)' }}
          title="Sync failed — tap to retry"
          aria-label="Retry sync"
        >
          <AlertCircle size={14} />
          <span className="text-caption font-medium">Retry</span>
        </button>
      )}
    </div>
  );
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium" style={{ background: 'var(--warning-soft)', color: 'var(--warning-text)' }}>
      <WifiOff size={12} />
      You&apos;re offline — you can still log expenses. Changes sync when you reconnect.
    </div>
  );
}
