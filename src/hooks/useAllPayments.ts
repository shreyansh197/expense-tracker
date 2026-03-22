"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getSyncCode } from "@/lib/deviceId";
import type { Payment, PaymentMethod } from "@/types";

/**
 * Fetch all payments for all ledgers belonging to this sync code.
 * Used for aggregate analytics on the business dashboard.
 */
export function useAllPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const syncCode = getSyncCode();
    if (!syncCode) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("business_payments")
      .select("*")
      .eq("device_id", syncCode)
      .is("deleted_at", null)
      .order("date", { ascending: false });

    if (!error && data) {
      setPayments(
        data.map((row) => ({
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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const syncCode = getSyncCode();
    const channel = syncCode
      ? supabase
          .channel(`all-payments-${syncCode}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "business_payments", filter: `device_id=eq.${syncCode}` },
            () => { fetchAll(); }
          )
          .subscribe()
      : null;

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { payments, loading };
}
