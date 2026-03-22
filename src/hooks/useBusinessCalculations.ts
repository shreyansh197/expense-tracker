"use client";

import { useMemo } from "react";
import type { Ledger, Payment } from "@/types";

export interface BusinessStats {
  totalExpected: number;
  totalReceived: number;
  collectionPercent: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  overdueCount: number;
  overdueLedgerIds: string[];
  receivedByLedger: Record<string, number>;
  tagBreakdown: { tag: string; expected: number; received: number; count: number }[];
  monthlyCollections: { month: string; received: number; expected: number }[];
}

export function useBusinessCalculations(
  ledgers: Ledger[],
  allPayments: Payment[]
): BusinessStats {
  return useMemo(() => {
    const nonCancelled = ledgers.filter((l) => l.status !== "cancelled");
    const active = ledgers.filter((l) => l.status === "active");
    const completed = ledgers.filter((l) => l.status === "completed");
    const cancelled = ledgers.filter((l) => l.status === "cancelled");

    // Received per ledger
    const receivedByLedger: Record<string, number> = {};
    for (const p of allPayments) {
      receivedByLedger[p.ledgerId] = (receivedByLedger[p.ledgerId] || 0) + p.amount;
    }

    const totalExpected = nonCancelled.reduce((s, l) => s + l.expectedAmount, 0);
    const nonCancelledIds = new Set(nonCancelled.map((l) => l.id));
    const totalReceived = allPayments
      .filter((p) => nonCancelledIds.has(p.ledgerId))
      .reduce((s, p) => s + p.amount, 0);
    const collectionPercent = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

    // Overdue
    const now = new Date();
    const overdueLedgerIds = active
      .filter((l) => {
        if (!l.dueDate) return false;
        const received = receivedByLedger[l.id] || 0;
        return new Date(l.dueDate) < now && received < l.expectedAmount;
      })
      .map((l) => l.id);

    // Tag breakdown
    const tagMap = new Map<string, { expected: number; received: number; count: number }>();
    for (const l of nonCancelled) {
      const received = receivedByLedger[l.id] || 0;
      for (const tag of l.tags) {
        const existing = tagMap.get(tag) || { expected: 0, received: 0, count: 0 };
        existing.expected += l.expectedAmount;
        existing.received += received;
        existing.count += 1;
        tagMap.set(tag, existing);
      }
    }
    const tagBreakdown = Array.from(tagMap.entries())
      .map(([tag, data]) => ({ tag, ...data }))
      .sort((a, b) => b.expected - a.expected);

    // Monthly collections (last 6 months)
    const monthlyMap = new Map<string, { received: number; expected: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { received: 0, expected: 0 });
    }
    for (const p of allPayments) {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.get(key)!.received += p.amount;
      }
    }
    // Distribute expected across months based on ledger creation dates
    for (const l of nonCancelled) {
      const d = new Date(l.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.get(key)!.expected += l.expectedAmount;
      }
    }
    const monthlyCollections = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));

    return {
      totalExpected,
      totalReceived,
      collectionPercent,
      activeCount: active.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      overdueCount: overdueLedgerIds.length,
      overdueLedgerIds,
      receivedByLedger,
      tagBreakdown,
      monthlyCollections,
    };
  }, [ledgers, allPayments]);
}
