"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
import { makeIdempotencyKey, enqueueOfflineMutation } from "@/lib/syncClient";
import { supabase } from "@/lib/supabase";
import type { Ledger, LedgerInput, LedgerStatus, SyncStatus } from "@/types";

// Global event to trigger re-fetch across all useLedgers instances
const ledgerListeners = new Set<() => void>();
function notifyLedgerChange() {
  ledgerListeners.forEach((fn) => fn());
}

export function useLedgers() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const lastMutationAt = useRef(0);

  const fetchLedgers = useCallback(async () => {
    // Skip fetches within 3s of a mutation to avoid stale reads overwriting optimistic updates
    if (Date.now() - lastMutationAt.current < 3000) return;
    const wid = getActiveWorkspaceId();
    if (!wid) return;
    setSyncStatus("syncing");

    try {
      const params = new URLSearchParams({ workspaceId: wid });
      const res = await authFetch(`/api/sync/changes?${params}`);
      if (!res.ok) {
        setSyncStatus("error");
        setLoading(false);
        return;
      }
      const data = await res.json();
      const all: Ledger[] = (data.changes?.businessLedgers ?? [])
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
      // Sort by createdAt descending
      all.sort((a, b) => b.createdAt - a.createdAt);
      setLedgers(all);
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLedgers();
    ledgerListeners.add(fetchLedgers);

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
      ledgerListeners.delete(fetchLedgers);
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
    setLedgers((prev) => [optimistic, ...prev]);

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
        setLedgers((prev) => prev.filter((l) => l.id !== tempId));
        throw new Error("Failed to add ledger");
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      setLedgers((prev) => prev.filter((l) => l.id !== tempId));
      throw err;
    }
    notifyLedgerChange();
  };

  const updateLedger = async (id: string, updates: Partial<LedgerInput>) => {
    setLedgers((prev) =>
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

    lastMutationAt.current = Date.now();
    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations: [mutation] }),
      });
      if (!res.ok) {
        lastMutationAt.current = 0;
        fetchLedgers();
        throw new Error("Failed to update ledger");
      }
    } catch (err) {
      lastMutationAt.current = 0;
      enqueueOfflineMutation(mutation);
      fetchLedgers();
      throw err;
    }
    // Trust the optimistic update — realtime will confirm after the guard window
    notifyLedgerChange();
  };

  const deleteLedger = async (id: string) => {
    setLedgers((prev) => prev.filter((l) => l.id !== id));
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "business_ledgers" as const,
      operation: "delete" as const,
      id,
      data: {},
      idempotencyKey: makeIdempotencyKey(),
    };

    lastMutationAt.current = Date.now();
    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wid, mutations: [mutation] }),
      });
      if (!res.ok) {
        lastMutationAt.current = 0;
        fetchLedgers();
        throw new Error("Failed to delete ledger");
      }
    } catch (err) {
      lastMutationAt.current = 0;
      enqueueOfflineMutation(mutation);
      fetchLedgers();
      throw err;
    }
    notifyLedgerChange();
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
