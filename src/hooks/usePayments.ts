"use client";

import { useCallback } from "react";
import { getActiveWorkspaceId } from "@/lib/authClient";
import { db } from "@/lib/db";
import {
  makeIdempotencyKey,
  enqueueMutation,
  trySyncPush,
  generateUUID,
} from "@/lib/syncEngine";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import type { Payment, PaymentInput, PaymentMethod, SyncStatus } from "@/types";

// Global event kept for backward compatibility (RecurringManager imports it)
const paymentListeners = new Set<() => void>();
export function notifyPaymentChange() {
  paymentListeners.forEach((fn) => fn());
}

function toPayment(row: { id: string; ledgerId: string; amount: number; date: string; method?: PaymentMethod; reference?: string; notes?: string; createdAt: number; updatedAt: number; deletedAt: number | null }): Payment {
  return {
    id: row.id,
    ledgerId: row.ledgerId,
    amount: row.amount,
    date: row.date,
    method: row.method,
    reference: row.reference,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    deviceId: "",
  };
}

export function usePayments(ledgerId: string | null) {
  const wid = getActiveWorkspaceId();

  const queryResult = useDexieQuery(
    async () => {
      if (!wid || !ledgerId) return [] as Payment[];
      const rows = await db.payments
        .where("ledgerId").equals(ledgerId)
        .toArray();
      return rows
        .filter(r => !r.deletedAt && r.workspaceId === wid)
        .map(toPayment)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [wid, ledgerId],
    [] as Payment[],
  );

  const payments = queryResult;
  const loading = false;
  const syncStatus: SyncStatus = "synced";

  const addPayment = useCallback(async (input: PaymentInput) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    const id = generateUUID();

    await db.payments.put({
      id,
      workspaceId: workspace,
      ledgerId: input.ledgerId,
      amount: input.amount,
      date: input.date,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });

    await enqueueMutation({
      table: "business_payments",
      operation: "upsert",
      id,
      data: {
        ledgerId: input.ledgerId,
        amount: input.amount,
        date: input.date,
        method: input.method || null,
        reference: input.reference || null,
        notes: input.notes || null,
      },
      idempotencyKey: makeIdempotencyKey(),
    }, workspace);

    trySyncPush(workspace);
    notifyPaymentChange();
  }, []);

  const updatePayment = useCallback(async (id: string, updates: Partial<PaymentInput>) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    const existing = await db.payments.get(id);
    if (existing) {
      await db.payments.put({ ...existing, ...updates, updatedAt: Date.now() });
    }

    await enqueueMutation({
      table: "business_payments",
      operation: "upsert",
      id,
      data: { ...updates },
      idempotencyKey: makeIdempotencyKey(),
    }, workspace);

    trySyncPush(workspace);
    notifyPaymentChange();
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    await db.payments.delete(id);

    await enqueueMutation({
      table: "business_payments",
      operation: "delete",
      id,
      data: {},
      idempotencyKey: makeIdempotencyKey(),
    }, workspace);

    trySyncPush(workspace);
    notifyPaymentChange();
  }, []);

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
