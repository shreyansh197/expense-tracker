"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
import { makeIdempotencyKey, enqueueOfflineMutation } from "@/lib/syncClient";
import { fetchSyncData } from "@/lib/syncFetch";
import { supabase } from "@/lib/supabase";
import type { Payment, PaymentInput, PaymentMethod, SyncStatus } from "@/types";

// Global event to trigger re-fetch across all usePayments instances
const paymentListeners = new Set<() => void>();
export function notifyPaymentChange() {
  paymentListeners.forEach((fn) => fn());
}

export function usePayments(ledgerId: string | null) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  const fetchPayments = useCallback(async () => {
    if (!ledgerId) { setPayments([]); setLoading(false); return; }
    const wid = getActiveWorkspaceId();
    if (!wid) return;
    setSyncStatus("syncing");

    try {
      const data = await fetchSyncData(wid) as Record<string, unknown>;
      const changes = data.changes as Record<string, unknown> | undefined;
      const all: Payment[] = ((changes?.businessPayments ?? []) as Record<string, unknown>[])
        .filter((p: Record<string, unknown>) => !p.deletedAt && p.ledgerId === ledgerId)
        .map((row: Record<string, unknown>) => ({
          id: row.id as string,
          ledgerId: row.ledgerId as string,
          amount: Number(row.amount),
          date: row.date as string,
          method: (row.method as PaymentMethod) || undefined,
          reference: (row.reference as string) || undefined,
          notes: (row.notes as string) || undefined,
          createdAt: new Date(row.createdAt as string).getTime(),
          updatedAt: new Date(row.updatedAt as string).getTime(),
          deletedAt: null,
          deviceId: "",
        }));
      // Sort by date descending
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPayments(all);
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
    setLoading(false);
  }, [ledgerId]);

  useEffect(() => {
    fetchPayments();
    paymentListeners.add(fetchPayments);

    const wid = getActiveWorkspaceId();
    const channel = wid && ledgerId
      ? supabase
          .channel(`payments-${wid}-${ledgerId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "business_payments",
              filter: `workspace_id=eq.${wid}`,
            },
            () => { fetchPayments(); }
          )
          .subscribe()
      : null;

    return () => {
      paymentListeners.delete(fetchPayments);
      if (channel) supabase.removeChannel(channel);
    };
  }, [ledgerId, fetchPayments]);

  const addPayment = async (input: PaymentInput) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimistic: Payment = {
      id: tempId,
      ...input,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      deviceId: "",
    };
    setPayments((prev) => [optimistic, ...prev]);

    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "business_payments" as const,
      operation: "upsert" as const,
      data: {
        ledgerId: input.ledgerId,
        amount: input.amount,
        date: input.date,
        method: input.method || null,
        reference: input.reference || null,
        notes: input.notes || null,
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
        setPayments((prev) => prev.filter((p) => p.id !== tempId));
        throw new Error("Failed to add payment");
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      setPayments((prev) => prev.filter((p) => p.id !== tempId));
      throw err;
    }
    notifyPaymentChange();
  };

  const updatePayment = async (id: string, updates: Partial<PaymentInput>) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
    );
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "business_payments" as const,
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
        fetchPayments();
        throw new Error("Failed to update payment");
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      fetchPayments();
      throw err;
    }
    notifyPaymentChange();
  };

  const deletePayment = async (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const mutation = {
      table: "business_payments" as const,
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
        fetchPayments();
        throw new Error("Failed to delete payment");
      }
    } catch (err) {
      enqueueOfflineMutation(mutation);
      fetchPayments();
      throw err;
    }
    notifyPaymentChange();
  };

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    payments,
    loading,
    syncStatus,
    totalReceived,
    addPayment,
    updatePayment,
    deletePayment,
  };
}
