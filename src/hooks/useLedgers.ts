"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
import { makeIdempotencyKey, enqueueOfflineMutation } from "@/lib/syncClient";
import { fetchSyncData, invalidateSyncCache } from "@/lib/syncFetch";
import { supabase } from "@/lib/supabase";
import type { Ledger, LedgerInput, LedgerStatus, SyncStatus } from "@/types";

/* ─── Global ledger cache (shared across all hook instances) ─── */

let cachedLedgers: Ledger[] = [];
const EMPTY: Ledger[] = [];
const subscribers = new Set<() => void>();

function emitChange() {
  subscribers.forEach((fn) => fn());
}

function subscribeToLedgers(cb: () => void) {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

function getSnapshot(): Ledger[] {
  return cachedLedgers.length === 0 ? EMPTY : cachedLedgers;
}

/* ── Pending optimistic overrides ──
 * When we mutate a ledger, we store the optimistic fields here keyed by ID.
 * setGlobalLedgers merges server data with these overrides, so stale server
 * reads can never revert an in-flight optimistic update.
 * Overrides are cleared once the server data matches, or after 30s. */
const pendingOverrides = new Map<string, { fields: Partial<Ledger>; at: number }>();
const OVERRIDE_TTL = 30_000;

/** Used by fetchLedgers — merges server data with pending overrides */
function setGlobalLedgers(next: Ledger[]) {
  const now = Date.now();
  cachedLedgers = next.map((l) => {
    const override = pendingOverrides.get(l.id);
    if (!override) return l;
    // Expired → remove and use server data
    if (now - override.at > OVERRIDE_TTL) {
      pendingOverrides.delete(l.id);
      return l;
    }
    // Server data matches optimistic → override no longer needed
    const allMatch = Object.entries(override.fields).every(
      ([k, v]) => (l as unknown as Record<string, unknown>)[k] === v,
    );
    if (allMatch) {
      pendingOverrides.delete(l.id);
      return l;
    }
    // Override server data with optimistic fields
    return { ...l, ...override.fields };
  });
  emitChange();
}

/** Used for direct optimistic writes — no merge needed */
function setGlobalLedgersRaw(updater: (prev: Ledger[]) => Ledger[]) {
  cachedLedgers = updater(cachedLedgers);
  emitChange();
}

export function useLedgers() {
  const ledgers = useSyncExternalStore(subscribeToLedgers, getSnapshot, () => EMPTY);
  const [loading, setLoading] = useState(cachedLedgers.length === 0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  const fetchLedgers = useCallback(async () => {
    const wid = getActiveWorkspaceId();
    if (!wid) return;
    setSyncStatus("syncing");

    try {
      const data = await fetchSyncData(wid) as Record<string, unknown>;
      const changes = data.changes as Record<string, unknown> | undefined;
      const all: Ledger[] = ((changes?.businessLedgers ?? []) as Record<string, unknown>[])
        .filter((l: Record<string, unknown>) => !l.deletedAt)
        .map((row: Record<string, unknown>) => ({
          id: row.id as string,
          name: row.name as string,
          expectedAmount: Number(row.expectedAmount),
          currency: row.currency as string,
          status: row.status as LedgerStatus,
          dueDate: row.dueDate ? new Date(row.dueDate as string).toISOString() : undefined,
          tags: (row.tags as string[]) || [],
          notes: (row.notes as string) || "",
          createdAt: new Date(row.createdAt as string).getTime(),
          updatedAt: new Date(row.updatedAt as string).getTime(),
          deletedAt: null,
          deviceId: "",
        }));
      all.sort((a, b) => b.createdAt - a.createdAt);
      setGlobalLedgers(all); // merges with pendingOverrides automatically
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLedgers();

    const wid = getActiveWorkspaceId();
    const channel = wid
      ? supabase
          .channel(`ledgers-${wid}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "business_ledgers",
              filter: `workspace_id=eq.${wid}`,
            },
            () => { fetchLedgers(); }
          )
          .subscribe()
      : null;

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchLedgers]);

  const addLedger = async (input: LedgerInput) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimistic: Ledger = {
      id: tempId,
      ...input,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      deviceId: "",
    };
    setGlobalLedgersRaw((prev) => [optimistic, ...prev]);

    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "business_ledgers" as const,
      operation: "upsert" as const,
      data: {
        name: input.name,
        expectedAmount: input.expectedAmount,
        currency: input.currency,
        status: input.status,
        dueDate: input.dueDate || null,
        tags: input.tags,
        notes: input.notes,
      },
      idempotencyKey: makeIdempotencyKey(),
    };

    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations: [mutation] }),
      });
      if (!res.ok) {
        setGlobalLedgersRaw((prev) => prev.filter((l) => l.id !== tempId));
        throw new Error("Failed to add ledger");
      }
      const body = await res.json();
      const result = body.results?.[0];
      if (result?.status === "error") {
        setGlobalLedgersRaw((prev) => prev.filter((l) => l.id !== tempId));
        throw new Error(result.error ?? "Mutation failed");
      }
      // Replace temp ID with server-assigned ID
      if (result?.id && result.id !== tempId) {
        setGlobalLedgersRaw((prev) =>
          prev.map((l) => (l.id === tempId ? { ...l, id: result.id } : l))
        );
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      setGlobalLedgersRaw((prev) => prev.filter((l) => l.id !== tempId));
      throw err;
    }
    invalidateSyncCache();
    fetchLedgers();
  };

  const updateLedger = async (id: string, updates: Partial<LedgerInput>) => {
    // Store optimistic override so no fetch can revert it
    pendingOverrides.set(id, { fields: updates as Partial<Ledger>, at: Date.now() });
    setGlobalLedgersRaw((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l))
    );
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "business_ledgers" as const,
      operation: "upsert" as const,
      id,
      data: { ...updates },
      idempotencyKey: makeIdempotencyKey(),
    };

    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations: [mutation] }),
      });
      if (!res.ok) {
        pendingOverrides.delete(id);
        fetchLedgers();
        throw new Error("Failed to update ledger");
      }
      const body = await res.json();
      const result = body.results?.[0];
      if (result?.status === "error") {
        pendingOverrides.delete(id);
        fetchLedgers();
        throw new Error(result.error ?? "Mutation failed");
      }
    } catch (err) {
      pendingOverrides.delete(id);
      enqueueOfflineMutation(mutation);
      fetchLedgers();
      throw err;
    }
    // Server confirmed — re-fetch to get confirmed data
    // (override will auto-clear when server data matches)
    invalidateSyncCache();
    fetchLedgers();
  };

  const deleteLedger = async (id: string) => {
    setGlobalLedgersRaw((prev) => prev.filter((l) => l.id !== id));
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "business_ledgers" as const,
      operation: "delete" as const,
      id,
      data: {},
      idempotencyKey: makeIdempotencyKey(),
    };

    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations: [mutation] }),
      });
      if (!res.ok) {
        fetchLedgers();
        throw new Error("Failed to delete ledger");
      }
      const body = await res.json();
      const result = body.results?.[0];
      if (result?.status === "error") {
        fetchLedgers();
        throw new Error(result.error ?? "Mutation failed");
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      fetchLedgers();
      throw err;
    }
  };

  const completeLedger = async (id: string) => {
    return updateLedger(id, { status: "completed" });
  };

  return {
    ledgers,
    loading,
    syncStatus,
    addLedger,
    updateLedger,
    deleteLedger,
    completeLedger,
  };
}
