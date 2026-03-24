"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { getActiveWorkspaceId } from "@/lib/authClient";
import { fetchSyncData } from "@/lib/syncFetch";
import { supabase } from "@/lib/supabase";
import type { Payment, PaymentMethod } from "@/types";

/**
 * Fetch all payments for all ledgers belonging to this workspace.
 * Used for aggregate analytics on the business dashboard.
 */
export function useAllPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const wid = getActiveWorkspaceId();
    if (!wid) { startTransition(() => setLoading(false)); return; }

    try {
      const data = await fetchSyncData(wid) as Record<string, unknown>;
      const changes = data.changes as Record<string, unknown> | undefined;

      const all: Payment[] = ((changes?.businessPayments ?? []) as Record<string, unknown>[])
        .filter((p: Record<string, unknown>) => !p.deletedAt)
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
      startTransition(() => setPayments(all));
    } catch { /* ignore */ }
    startTransition(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAll();

    const wid = getActiveWorkspaceId();
    const channel = wid
      ? supabase
          .channel(`all-payments-${wid}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "business_payments", filter: `workspace_id=eq.${wid}` },
            () => { fetchAll(); }
          )
          .subscribe()
      : null;

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { payments, loading };
}
