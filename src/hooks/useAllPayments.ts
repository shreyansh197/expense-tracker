"use client";

import { getActiveWorkspaceId } from "@/lib/authClient";
import { db } from "@/lib/db";
import { useDexieQuery } from "@/hooks/useDexieQuery";
import type { Payment, PaymentMethod } from "@/types";

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

/**
 * Fetch all payments for all ledgers belonging to this workspace.
 * Used for aggregate analytics on the business dashboard.
 */
export function useAllPayments() {
  const wid = getActiveWorkspaceId();

  const queryResult = useDexieQuery(
    async () => {
      if (!wid) return [] as Payment[];
      const rows = await db.payments
        .where("workspaceId").equals(wid)
        .toArray();
      return rows
        .filter(r => !r.deletedAt)
        .map(toPayment)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [wid],
    [] as Payment[],
  );

  const payments = queryResult;
  const loading = false;

  return { payments, loading };
}
