"use client";

import { useEffect, useState, useTransition } from "react";
import { Activity, ArrowUpCircle, ArrowDownCircle, AlertTriangle, RotateCcw, WifiOff, ShieldAlert, Inbox } from "lucide-react";
import { useSyncCounters } from "@/hooks/useSyncStatus";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { resetSyncCounters } from "@/lib/syncEngine";
import { useToast } from "@/components/ui/Toast";

/**
 * Format an epoch ms as a compact relative-time string.
 * "Never", "just now", "12s ago", "5m ago", "3h ago", "2d ago".
 */
function formatRelative(epochMs: number, now: number): string {
  if (!epochMs) return "Never";
  const deltaSec = Math.max(0, Math.round((now - epochMs) / 1000));
  if (deltaSec < 5) return "just now";
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const deltaMin = Math.round(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHr = Math.round(deltaMin / 60);
  if (deltaHr < 24) return `${deltaHr}h ago`;
  const deltaDay = Math.round(deltaHr / 24);
  return `${deltaDay}d ago`;
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  emphasis?: "default" | "warn" | "danger";
  testid?: string;
}

function StatRow({ icon, label, value, emphasis = "default", testid }: StatRowProps) {
  const valueColor =
    emphasis === "danger"
      ? "var(--danger-text)"
      : emphasis === "warn"
      ? "var(--warning-text)"
      : "var(--text-primary)";
  return (
    <div
      className="flex items-center justify-between gap-3 py-2"
      data-testid={testid}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0" style={{ color: "var(--text-tertiary)" }} aria-hidden="true">
          {icon}
        </span>
        <span className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>
      </div>
      <span
        className="text-xs font-semibold tabular-nums text-right shrink-0"
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Diagnostics panel showing live sync-engine counters, queue depth,
 * last successful pull, last error, and a reset control.
 *
 * All values are in-memory counters — no monetary values, no PII.
 */
export function SyncDiagnosticsCard() {
  const isOnline = useOnlineStatus();
  const { counters, pendingCount } = useSyncCounters();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Tick every 10s so "5s ago" / "1m ago" stays accurate without user interaction.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  const handleReset = () => {
    startTransition(() => {
      resetSyncCounters();
      toast("Diagnostics reset", "success");
    });
  };

  // ── Five-state resolution ────────────────────────────────────────────────
  // offline → user is disconnected (dominant signal)
  // error   → last recorded sync error and no successful pull yet in session
  // loading → in-session but haven't observed any pull/push yet
  // empty   → no pending mutations and no recorded activity (session just started)
  // success → active session with at least one pull or push
  const hasActivity = counters.pullBatches > 0 || counters.pushBatches > 0;
  const state: "offline" | "error" | "loading" | "empty" | "success" =
    !isOnline
      ? "offline"
      : counters.lastError && !hasActivity
      ? "error"
      : !hasActivity && pendingCount === 0
      ? "empty"
      : !hasActivity
      ? "loading"
      : "success";

  return (
    <div
      className="space-y-3"
      role="region"
      aria-label="Sync diagnostics"
      aria-live="polite"
    >
      {/* Status banner — reflects the dominant of the five states */}
      {state === "offline" && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }}
          role="status"
        >
          <WifiOff size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>Offline. Sync will resume automatically once you reconnect.</span>
        </div>
      )}
      {state === "error" && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: "var(--danger-soft)", color: "var(--danger-text)" }}
          role="status"
        >
          <ShieldAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>Sync reported an error. See last error below.</span>
        </div>
      )}
      {state === "loading" && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: "var(--info-soft)", color: "var(--info-text)" }}
          role="status"
        >
          <Activity size={14} aria-hidden="true" className="mt-0.5 shrink-0 animate-pulse" />
          <span>Waiting for the first sync of this session…</span>
        </div>
      )}
      {state === "empty" && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
          role="status"
        >
          <Inbox size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>Nothing queued. Counters will populate as sync runs.</span>
        </div>
      )}
      {state === "success" && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: "var(--success-soft)", color: "var(--success-text)" }}
          role="status"
        >
          <Activity size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>Sync engine active for this session.</span>
        </div>
      )}

      {/* Counter grid — no monetary values, no PII */}
      <div
        className="rounded-lg divide-y px-3"
        style={{ background: "var(--surface-secondary)", borderColor: "var(--border)" }}
      >
        <StatRow
          icon={<Inbox size={14} />}
          label="Queued mutations"
          value={pendingCount}
          emphasis={pendingCount > 50 ? "warn" : "default"}
          testid="sync-diag-queued"
        />
        <StatRow
          icon={<ArrowDownCircle size={14} />}
          label="Pulls this session"
          value={counters.pullBatches}
          testid="sync-diag-pulls"
        />
        <StatRow
          icon={<ArrowUpCircle size={14} />}
          label="Push batches this session"
          value={counters.pushBatches}
          testid="sync-diag-pushes"
        />
        <StatRow
          icon={<AlertTriangle size={14} />}
          label="Conflicts detected"
          value={counters.conflicts}
          emphasis={counters.conflicts > 0 ? "warn" : "default"}
          testid="sync-diag-conflicts"
        />
        <StatRow
          icon={<ShieldAlert size={14} />}
          label="Failures"
          value={counters.failures}
          emphasis={counters.failures > 0 ? "danger" : "default"}
          testid="sync-diag-failures"
        />
        <StatRow
          icon={<Activity size={14} />}
          label="Last pull"
          value={formatRelative(counters.lastPullAt, now)}
          testid="sync-diag-last-pull"
        />
        <StatRow
          icon={<Activity size={14} />}
          label="Last push"
          value={formatRelative(counters.lastPushAt, now)}
          testid="sync-diag-last-push"
        />
      </div>

      {counters.lastError && (
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{ background: "var(--danger-soft)", color: "var(--danger-text)" }}
        >
          <p className="font-semibold uppercase tracking-wide text-[10px] mb-1">Last error</p>
          <p className="font-mono break-all">{counters.lastError}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Session counters — cleared on tab close.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          aria-label="Reset sync diagnostics counters"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 min-h-[44px] min-w-[44px] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:opacity-60"
          style={{ background: "var(--surface)", color: "var(--text-primary)", borderColor: "var(--border)", borderWidth: 1 }}
        >
          <RotateCcw size={14} aria-hidden="true" className={isPending ? "animate-spin" : ""} />
          Reset counters
        </button>
      </div>
    </div>
  );
}
