"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getSyncCode } from "@/lib/deviceId";
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

  const fetchLedgers = useCallback(async () => {
    const syncCode = getSyncCode();
    if (!syncCode) return;
    setSyncStatus("syncing");
    const { data, error } = await supabase
      .from("business_ledgers")
      .select("*")
      .eq("device_id", syncCode)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch ledgers error:", error);
      setSyncStatus("error");
    } else {
      setLedgers(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name as string,
          expectedAmount: Number(row.expected_amount),
          currency: row.currency as string,
          status: row.status as LedgerStatus,
          dueDate: row.due_date ? new Date(row.due_date as string).toISOString() : undefined,
          tags: (row.tags as string[]) || [],
          notes: (row.notes as string) || "",
          createdAt: new Date(row.created_at as string).getTime(),
          updatedAt: new Date(row.updated_at as string).getTime(),
          deletedAt: null,
          deviceId: "",
        }))
      );
      setSyncStatus("synced");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLedgers();
    ledgerListeners.add(fetchLedgers);

    const syncCode = getSyncCode();
    const channel = syncCode
      ? supabase
          .channel(`ledgers-${syncCode}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "business_ledgers",
              filter: `device_id=eq.${syncCode}`,
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

    const { error } = await supabase.from("business_ledgers").insert({
      name: input.name,
      expected_amount: input.expectedAmount,
      currency: input.currency,
      status: input.status,
      due_date: input.dueDate || null,
      tags: input.tags,
      notes: input.notes,
      device_id: getSyncCode(),
    });
    if (error) {
      setLedgers((prev) => prev.filter((l) => l.id !== tempId));
      throw error;
    }
    notifyLedgerChange();
  };

  const updateLedger = async (id: string, updates: Partial<LedgerInput>) => {
    setLedgers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l))
    );
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.expectedAmount !== undefined) dbUpdates.expected_amount = updates.expectedAmount;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await supabase
      .from("business_ledgers")
      .update(dbUpdates)
      .eq("id", id);
    if (error) {
      fetchLedgers();
      throw error;
    }
    notifyLedgerChange();
  };

  const deleteLedger = async (id: string) => {
    setLedgers((prev) => prev.filter((l) => l.id !== id));
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("business_ledgers")
      .update({ deleted_at: now, updated_at: now })
      .eq("id", id);
    if (error) {
      fetchLedgers();
      throw error;
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
