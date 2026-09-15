/// <reference types="jest" />

/**
 * Sync Engine — Money Conflict → ConflictReviewSheet trigger (T-2.3.7)
 *
 * Proves the M2 exit invariant: when two clients edit the same `expense.amount`,
 * the sync engine NEVER silently overwrites the money field — it preserves the
 * local value and registers a pending conflict, which is exactly the condition
 * that opens the ConflictReviewSheet (`getPendingMoneyConflicts().length > 0`).
 *
 * Also verifies the two deterministic resolution paths and the audit signal
 * (T-2.3.3): resolving a conflict enqueues a corrective upsert carrying
 * `conflict: { field, choice }` metadata and no monetary value in that field
 * beyond the amount being written.
 *
 * No PII; the only numbers printed are the literal fixture integers.
 */

const mockAuthFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();
const mockWorkspaceId = "ws-conflict-001";

jest.mock("@/lib/authClient", () => ({
  authFetch: (...args: [string, RequestInit?]) => mockAuthFetch(...args),
  getActiveWorkspaceId: () => mockWorkspaceId,
  isAuthenticated: () => true,
  subscribeAuth: () => () => {},
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    channel: () => ({ on: () => ({ subscribe: () => {} }), unsubscribe: () => {} }),
    removeChannel: () => {},
  },
}));

jest.mock("@/lib/crypto", () => ({
  encryptJSON: jest.fn((obj: unknown) => Promise.resolve(JSON.stringify(obj))),
  decryptJSON: jest.fn((str: string) => Promise.resolve(JSON.parse(str))),
  hasEncryptionKey: () => false,
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  setUser: jest.fn(),
}));

import "fake-indexeddb/auto";

import { db } from "@/lib/db";
import {
  pullChanges,
  getPendingMoneyConflicts,
  onMoneyConflictsChange,
  resolveMoneyConflict,
  clearMoneyConflicts,
  type MoneyConflict,
} from "@/lib/syncEngine";

interface ServerExpense {
  id: string;
  workspaceId: string;
  category: string;
  amount: number;
  day: number;
  month: number;
  year: number;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

const EXPENSE_ID = "22222222-2222-4222-8222-222222222222";
let serverRow: ServerExpense;

function installFetch() {
  mockAuthFetch.mockImplementation(async (url) => {
    if (url.startsWith("/api/sync/changes")) {
      return new Response(
        JSON.stringify({
          changes: { expenses: [serverRow], settings: null, businessLedgers: [], businessPayments: [] },
          cursor: serverRow.updatedAt,
          hasMore: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("/api/sync/commit")) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("{}", { status: 404 });
  });
}

beforeEach(async () => {
  mockAuthFetch.mockReset();
  await db.mutations.clear();
  await db.expenses.clear();
  await db.syncMeta.clear();
  clearMoneyConflicts();
  serverRow = {
    id: EXPENSE_ID,
    workspaceId: mockWorkspaceId,
    category: "groceries",
    amount: 100,
    day: 15,
    month: 6,
    year: 2025,
    isRecurring: false,
    createdAt: new Date(500).toISOString(),
    updatedAt: new Date(1000).toISOString(),
    deletedAt: null,
  };
  installFetch();
});

/** Seed local IDB with a locally-newer edit that diverges from the server row. */
async function seedDivergentLocalEdit(localAmount: number): Promise<void> {
  await pullChanges(mockWorkspaceId); // client pulls the seed (amount=100)
  const localUpdatedAt = Date.now() + 60_000; // strictly newer than the server clock
  await db.expenses.put({
    ...(await db.expenses.get(EXPENSE_ID))!,
    amount: localAmount,
    updatedAt: localUpdatedAt,
  });
  // Server independently holds a different value, but the local edit is newer
  // (the user edited locally after the last sync) — a genuine money collision.
  serverRow = {
    ...serverRow,
    amount: 200,
    updatedAt: new Date(Date.now() + 10_000).toISOString(),
  };
}

describe("money conflict triggers ConflictReviewSheet", () => {
  test("two-client edit on expense.amount registers a pending conflict", async () => {
    const events: MoneyConflict[][] = [];
    const unsubscribe = onMoneyConflictsChange((c) => events.push(c));

    await seedDivergentLocalEdit(150);
    await pullChanges(mockWorkspaceId);

    // The sheet opens iff there is at least one pending money conflict.
    const pending = getPendingMoneyConflicts();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      entity: "expense",
      id: EXPENSE_ID,
      field: "amount",
      localValue: 150,
      serverValue: 200,
    });
    // Local money was preserved, never overwritten by the pull.
    expect((await db.expenses.get(EXPENSE_ID))?.amount).toBe(150);
    // A change event was emitted so the UI can react.
    expect(events.at(-1)).toHaveLength(1);

    unsubscribe();
  });

  test('resolving "mine" enqueues a corrective upsert carrying the audit signal', async () => {
    await seedDivergentLocalEdit(150);
    await pullChanges(mockWorkspaceId);

    const key = getPendingMoneyConflicts()[0].key;
    const resolved = await resolveMoneyConflict(key, "mine");

    expect(resolved).toBe(true);
    expect(getPendingMoneyConflicts()).toHaveLength(0);
    expect((await db.expenses.get(EXPENSE_ID))?.amount).toBe(150);

    // The corrective mutation carries conflict metadata (entity field + chosen
    // side) for the server-side `conflict.resolve.money` audit — no other money.
    const mutations = await db.mutations.where("workspaceId").equals(mockWorkspaceId).toArray();
    const corrective = mutations.find((m) => m.id === EXPENSE_ID && m.operation === "upsert");
    expect(corrective?.conflict).toEqual({ field: "amount", choice: "mine" });
  });

  test('resolving "theirs" adopts the server value and clears the conflict', async () => {
    await seedDivergentLocalEdit(150);
    await pullChanges(mockWorkspaceId);

    const key = getPendingMoneyConflicts()[0].key;
    await resolveMoneyConflict(key, "theirs");

    expect(getPendingMoneyConflicts()).toHaveLength(0);
    expect((await db.expenses.get(EXPENSE_ID))?.amount).toBe(200);

    // Even "theirs" enqueues a conflict-tagged corrective upsert so the server
    // emits exactly one `conflict.resolve.money` audit row per resolution.
    const mutations = await db.mutations.where("workspaceId").equals(mockWorkspaceId).toArray();
    const corrective = mutations.find((m) => m.id === EXPENSE_ID && m.operation === "upsert");
    expect(corrective?.conflict).toEqual({ field: "amount", choice: "theirs" });
  });

  test("resolving an unknown conflict key is a no-op", async () => {
    expect(await resolveMoneyConflict("expense:does-not-exist:amount", "mine")).toBe(false);
  });
});
