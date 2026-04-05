"use client";

import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const isOnline = useOnlineStatus();
  const { syncStatus, pendingCount } = useSyncStatus();

  const effective = isOnline ? syncStatus : "offline";

  return (
    <div className="flex items-center gap-1.5">
      {effective === "synced" && (
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Synced">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <Wifi size={14} />
        </div>
      )}
      {effective === "syncing" && (
        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400" title="Syncing...">
          <RefreshCw size={14} className="animate-spin" />
        </div>
      )}
      {effective === "offline" && (
        <div className="flex items-center gap-1 text-slate-400" title="Offline">
          <WifiOff size={14} />
          {pendingCount > 0 && (
            <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-caption font-bold text-white">
              {pendingCount}
            </span>
          )}
        </div>
      )}
      {effective === "error" && (
        <div className="flex items-center gap-1 text-red-500" title="Sync error">
          <AlertCircle size={14} />
        </div>
      )}
    </div>
  );
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700",
      "dark:bg-amber-900/30 dark:text-amber-400"
    )}>
      <WifiOff size={12} />
      You&apos;re offline — changes will sync when reconnected
    </div>
  );
}
