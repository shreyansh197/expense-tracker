"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  getDeadLetterMutations,
  retryDeadLetter,
  discardDeadLetter,
  restoreDiscardedMutation,
  onDeadLetterChange,
  MAX_MUTATION_ATTEMPTS,
} from "@/lib/syncEngine";
import type { IDBMutation } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";

/**
 * Global, user-facing banner for dead-lettered mutations — changes that
 * failed to sync after `MAX_MUTATION_ATTEMPTS` retries and are now stuck in
 * IndexedDB until someone explicitly retries or discards them. This is the
 * only recovery UI for that state, so it is shown on every page (not buried
 * in an advanced Settings panel) whenever the queue is non-empty.
 */
export function SyncDeadLetterBanner() {
  const { toast } = useToast();
  const [deadLetter, setDeadLetter] = useState<IDBMutation[]>([]);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(() => {
    getDeadLetterMutations()
      .then(setDeadLetter)
      .catch(() => setDeadLetter([]));
  }, []);

  useEffect(() => {
    refresh();
    // Poll as a safety net and subscribe to explicit change events so
    // retry/discard (from this banner or elsewhere) update instantly.
    const id = setInterval(refresh, 15_000);
    const unsub = onDeadLetterChange(refresh);
    return () => {
      clearInterval(id);
      unsub();
    };
  }, [refresh]);

  const handleRetry = (localId: number) => {
    retryDeadLetter(localId)
      .then((ok) => {
        toast(
          ok ? "Retrying stuck change" : "Change no longer in queue",
          ok ? "success" : "info",
        );
        refresh();
      })
      .catch(() => toast("Could not retry", "error"));
  };

  const handleDiscard = (localId: number) => {
    discardDeadLetter(localId)
      .then((discarded) => {
        if (!discarded) {
          toast("Change no longer in queue", "info");
          refresh();
          return;
        }
        toast("Discarded stuck change", "success", {
          label: "Undo",
          onClick: () => {
            restoreDiscardedMutation(discarded)
              .then(() => {
                toast("Change restored", "success");
                refresh();
              })
              .catch(() => toast("Undo failed", "error"));
          },
        });
        refresh();
      })
      .catch(() => toast("Could not discard", "error"));
  };

  if (deadLetter.length === 0) return null;

  return (
    <div
      role="region"
      aria-label={`${deadLetter.length} sync changes need attention`}
      aria-live="polite"
      style={{
        background: "var(--danger-soft)",
        color: "var(--danger-text)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls="sync-dead-letter-list"
        aria-label={`Sync needs attention — ${deadLetter.length} ${deadLetter.length === 1 ? "change" : "changes"} couldn't be saved. ${expanded ? "Hide" : "Show"} details.`}
        className="flex w-full items-center justify-center gap-2 px-3 min-h-[44px] text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        data-testid="sync-dead-letter-toggle"
      >
        <ShieldAlert size={14} aria-hidden="true" />
        <span>
          Sync needs attention — {deadLetter.length}{" "}
          {deadLetter.length === 1 ? "change" : "changes"} couldn&apos;t be saved
        </span>
        {expanded ? (
          <ChevronUp size={14} aria-hidden="true" />
        ) : (
          <ChevronDown size={14} aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div
          id="sync-dead-letter-list"
          className="px-3 pb-3 space-y-2"
          data-testid="sync-dead-letter-list"
        >
          <p className="text-[10px] opacity-80 text-center">
            Exceeded {MAX_MUTATION_ATTEMPTS} retry attempts — review and retry
            or discard each change below.
          </p>
          <ul className="space-y-1.5" role="list">
            {deadLetter.map((m) => (
              <li
                key={m.localId}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
                style={{ background: "var(--surface)" }}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {m.table}:{m.operation}
                  </p>
                  <p
                    className="text-[10px] font-mono truncate"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {m.lastError ?? "unknown error"} · {m.attempts ?? 0}{" "}
                    attempts
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => m.localId && handleRetry(m.localId)}
                    aria-label={`Retry ${m.table} ${m.operation}`}
                    className="inline-flex items-center justify-center gap-1 rounded-md px-2 min-h-[44px] text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    style={{
                      background: "var(--surface-secondary)",
                      color: "var(--text-primary)",
                    }}
                    data-testid={`sync-dead-letter-retry-${m.localId}`}
                  >
                    <RefreshCw size={12} aria-hidden="true" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => m.localId && handleDiscard(m.localId)}
                    aria-label={`Discard ${m.table} ${m.operation}`}
                    className="inline-flex items-center justify-center gap-1 rounded-md px-2 min-h-[44px] text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    style={{
                      background: "var(--danger-text)",
                      color: "var(--danger-soft)",
                    }}
                    data-testid={`sync-dead-letter-discard-${m.localId}`}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                    Discard
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
