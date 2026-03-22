"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getSyncCode } from "@/lib/deviceId";
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
    const syncCode = getSyncCode();
    if (!syncCode) return;
    setSyncStatus("syncing");
    const { data, error } = await supabase
      .from("business_payments")
      .select("*")
      .eq("device_id", syncCode)
      .eq("ledger_id", ledgerId)
      .is("deleted_at", null)
      .order("date", { ascending: false });

    if (error) {
      console.error("Fetch payments error:", error);
      setSyncStatus("error");
    } else {
      setPayments(
        (data ?? []).map((row) => ({
          id: row.id,
          ledgerId: row.ledger_id as string,
          amount: Number(row.amount),
          date: row.date as string,
          method: (row.method as PaymentMethod) || undefined,
          reference: (row.reference as string) || undefined,
          notes: (row.notes as string) || undefined,
          createdAt: new Date(row.created_at as string).getTime(),
          updatedAt: new Date(row.updated_at as string).getTime(),
          deletedAt: null,
          deviceId: "",
        }))
      );
      setSyncStatus("synced");
    }
    setLoading(false);
  }, [ledgerId]);

  useEffect(() => {
    fetchPayments();
    paymentListeners.add(fetchPayments);

    const syncCode = getSyncCode();
    const channel = syncCode && ledgerId
      ? supabase
          .channel(`payments-${syncCode}-${ledgerId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "business_payments",
              filter: `device_id=eq.${syncCode}`,
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

    const { error } = await supabase.from("business_payments").insert({
      ledger_id: input.ledgerId,
      amount: input.amount,
      date: input.date,
      method: input.method || null,
      reference: input.reference || null,
      notes: input.notes || null,
      device_id: getSyncCode(),
    });
    if (error) {
      setPayments((prev) => prev.filter((p) => p.id !== tempId));
      throw error;
    }
    notifyPaymentChange();
  };

  const updatePayment = async (id: string, updates: Partial<PaymentInput>) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
    );
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.method !== undefined) dbUpdates.method = updates.method || null;
    if (updates.reference !== undefined) dbUpdates.reference = updates.reference || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

    const { error } = await supabase
      .from("business_payments")
      .update(dbUpdates)
      .eq("id", id);
    if (error) {
      fetchPayments();
      throw error;
    }
    notifyPaymentChange();
  };

  const deletePayment = async (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("business_payments")
      .update({ deleted_at: now, updated_at: now })
      .eq("id", id);
    if (error) {
      fetchPayments();
      throw error;
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
