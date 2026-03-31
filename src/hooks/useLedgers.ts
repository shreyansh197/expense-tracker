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
import type { Ledger, LedgerInput, LedgerStatus, SyncStatus } from "@/types";

const EMPTY: Ledger[] = [];

function toLedger(row: { id: string; name: string; expectedAmount: number; currency: string; status: LedgerStatus; dueDate?: string; tags: string[]; notes: string; createdAt: number; updatedAt: number; deletedAt: number | null }): Ledger {
  return {
    id: row.id,
    name: row.name,
    expectedAmount: row.expectedAmount,
    currency: row.currency,
    status: row.status,
    dueDate: row.dueDate,
    tags: row.tags,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    deviceId: "",
  };
}

export function useLedgers() {
  const wid = getActiveWorkspaceId();

  const queryResult = useDexieQuery(
    async () => {
      if (!wid) return EMPTY;
      const rows = await db.ledgers
        .where("workspaceId").equals(wid)
        .toArray();
      return rows
        .filter(r => !r.deletedAt)
        .map(toLedger)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    [wid],
    EMPTY,
  );

  const ledgers = queryResult;
  const loading = queryResult === EMPTY && wid !== null;
  const syncStatus: SyncStatus = "synced";

  const addLedger = useCallback(async (input: LedgerInput) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    const id = generateUUID();

    await db.ledgers.put({
      id,
      workspaceId: workspace,
      name: input.name,
      expectedAmount: input.expectedAmount,
      currency: input.currency,
      status: input.status,
      dueDate: input.dueDate,
      tags: input.tags,
      notes: input.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });

    await enqueueMutation({
      table: "business_ledgers",
      operation: "upsert",
      id,
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
    }, workspace);

    trySyncPush(workspace);
  }, []);

  const updateLedger = useCallback(async (id: string, updates: Partial<LedgerInput>) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    const existing = await db.ledgers.get(id);
    if (existing) {
      await db.ledgers.put({ ...existing, ...updates, updatedAt: Date.now() });
    }

    await enqueueMutation({
      table: "business_ledgers",
      operation: "upsert",
      id,
      data: { ...updates },
      idempotencyKey: makeIdempotencyKey(),
    }, workspace);

    trySyncPush(workspace);
  }, []);

  const deleteLedger = useCallback(async (id: string) => {
    const workspace = getActiveWorkspaceId();
    if (!workspace) return;

    await db.ledgers.delete(id);

    await enqueueMutation({
      table: "business_ledgers",
      operation: "delete",
      id,
      data: {},
      idempotencyKey: makeIdempotencyKey(),
    }, workspace);

    trySyncPush(workspace);
  }, []);

  const completeLedger = useCallback(async (id: string) => {
    return updateLedger(id, { status: "completed" });
  }, [updateLedger]);

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
