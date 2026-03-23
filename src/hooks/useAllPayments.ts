"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
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
    if (!wid) { setLoading(false); return; }

    try {
      const params = new URLSearchParams({ workspaceId: wid });
      const res = await authFetch(`/api/sync/changes?${params}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();

      const all: Payment[] = (data.changes?.businessPayments ?? [])
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
      setPayments(all);
    } catch { /* ignore */ }
    setLoading(false);
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
