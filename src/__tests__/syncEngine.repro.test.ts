/// <reference types="jest" />

/**
 * Sync Engine — Money-field Conflict Reproduction
 *
 * Simulates two independent clients (A and B) both mutating the same
 * `expense.amount` value between pulls. Uses the in-repo sync engine
 * against fake-indexeddb + a mocked HTTP layer that keeps a canonical
 * "server row" so we can observe the current (Sprint 2.1 baseline)
 * behavior of `pullChanges` when local IDB is newer than the incoming
 * server row.
 *
 * This test verifies the Sprint 2.3 (T-2.3.1) deterministic fix: a money-field
 * collision (local IDB newer than the incoming server row, with divergent
 * `amount`) is NEVER silently overwritten. The local value is preserved and a
 * pending conflict is surfaced for explicit user resolution.
 *
 * No monetary values are printed in the snapshot output beyond the
 * literal test-fixture integers (100/150/200). No PII.
 */

// ── Mocks (must load before importing the sync engine) ─────────────────────

const mockAuthFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();
const mockWorkspaceId: string = "ws-repro-001";

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
  enqueueMutation,
  pushMutations,
  pullChanges,
  makeIdempotencyKey,
  getSyncCounters,
  resetSyncCounters,
  getPendingMoneyConflicts,
  resolveMoneyConflict,
  clearMoneyConflicts,
} from "@/lib/syncEngine";

// ── Simulated server ────────────────────────────────────────────────────────

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

/**
 * Minimal server model:
 *  - Holds a single canonical expense row (last-write-wins by updatedAt).
 *  - `commit` accepts upsert mutations and bumps updatedAt to the server clock.
 *  - `changes` returns rows updated after the caller's cursor.
 */
class VirtualServer {
  row: ServerExpense;
  private clock = 1_000; // deterministic monotonic clock (ms)

  constructor(row: ServerExpense) {
    this.row = row;
  }

  private tick(): string {
    this.clock += 10;
    return new Date(this.clock).toISOString();
  }

  commit(mutations: Array<{ id: string; data: Record<string, unknown>; operation: string }>) {
    const results: Array<{ id: string; status: string }> = [];
    for (const m of mutations) {
      if (m.operation === "upsert" && m.id === this.row.id) {
        this.row = {
          ...this.row,
          amount: Number(m.data.amount ?? this.row.amount),
          updatedAt: this.tick(),
        };
      }
      results.push({ id: m.id, status: "applied" });
    }
    return { results };
  }

  changesSince(_cursor: string | null) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return {
      changes: {
        expenses: [this.row],
        settings: null,
        businessLedgers: [],
        businessPayments: [],
      },
      cursor: this.row.updatedAt,
      hasMore: false,
    };
  }
}

let server: VirtualServer;
const EXPENSE_ID = "11111111-1111-4111-8111-111111111111";

function installFetch() {
  mockAuthFetch.mockImplementation(async (url, init) => {
    if (url.startsWith("/api/sync/changes")) {
      const body = server.changesSince(null);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.startsWith("/api/sync/commit")) {
      const parsed = JSON.parse(String(init?.body ?? "{}")) as {
        mutations: Array<{ id: string; data: Record<string, unknown>; operation: string }>;
      };
      return new Response(JSON.stringify(server.commit(parsed.mutations)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("{}", { status: 404 });
  });
}

// ── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(async () => {
  mockAuthFetch.mockReset();
  await db.mutations.clear();
  await db.expenses.clear();
  await db.syncMeta.clear();
  resetSyncCounters();
  clearMoneyConflicts();
  server = new VirtualServer({
    id: EXPENSE_ID,
    workspaceId: mockWorkspaceId,
    category: "groceries",
    amount: 100,
    day: 15,
    month: 6,
    year: 2025,
    isRecurring: false,
    createdAt: new Date(500).toISOString(),
    updatedAt: new Date(500).toISOString(),
    deletedAt: null,
  });
  installFetch();
});

// ── The reproduction ────────────────────────────────────────────────────────

describe("syncEngine repro — concurrent expense.amount conflict", () => {
  test("two clients mutate the same amount; local money is preserved and deferred", async () => {
    // ── Client A: pull the seed row (amount=100) ─────────────────────────
    await pullChanges(mockWorkspaceId);

    const seededA = await db.expenses.get(EXPENSE_ID);
    expect(seededA?.amount).toBe(100);

    // ── Client A: mutate to 150 locally with a later local timestamp ─────
    // Note the local IDB updatedAt is set to a value LATER than what the
    // server currently holds. This mirrors the real-world timing where a
    // user edits a value in the UI faster than a pull can complete.
    const clientALocalUpdatedAt = Date.now() + 60_000; // deliberately in the future vs. server clock
    await db.expenses.put({
      ...seededA!,
      amount: 150,
      updatedAt: clientALocalUpdatedAt,
    });
    await enqueueMutation(
      {
        table: "expenses",
        operation: "upsert",
        id: EXPENSE_ID,
        data: { amount: 150, category: seededA!.category, day: seededA!.day, month: seededA!.month, year: seededA!.year, isRecurring: false },
        idempotencyKey: makeIdempotencyKey(),
      },
      mockWorkspaceId,
    );

    // ── Client B: commits amount=200 directly on the server ──────────────
    // (Represents a second device that already pushed its edit.)
    server.commit([{ id: EXPENSE_ID, operation: "upsert", data: { amount: 200 } }]);

    // ── Client A: pull → server sends row with amount=200 while local is 150 ─
    // IDB.updatedAt (future) > server.updatedAt AND amount diverges → the money
    // field is contested: local 150 is preserved and a pending conflict surfaces.
    const conflictsBefore = getSyncCounters().conflicts;
    await pullChanges(mockWorkspaceId);
    const conflictsAfter = getSyncCounters().conflicts;

    const finalLocal = await db.expenses.get(EXPENSE_ID);
    const counters = getSyncCounters();

    // Deterministic post-fix behavior: the local money value is never silently
    // overwritten; it is kept until the user resolves the conflict.
    expect({
      conflictDelta: conflictsAfter - conflictsBefore,
      finalAmount: finalLocal?.amount,
      finalUpdatedAtIsServer: finalLocal?.updatedAt === new Date(server.row.updatedAt).getTime(),
      pullBatches: counters.pullBatches,
      pushBatches: counters.pushBatches,
      failures: counters.failures,
    }).toMatchInlineSnapshot(`
{
  "conflictDelta": 1,
  "failures": 0,
  "finalAmount": 150,
  "finalUpdatedAtIsServer": false,
  "pullBatches": 2,
  "pushBatches": 0,
}
`);

    // A pending money conflict is surfaced for explicit user resolution — the
    // pull never resolves it on its own.
    const pending = getPendingMoneyConflicts(mockWorkspaceId);
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      entity: "expense",
      id: EXPENSE_ID,
      field: "amount",
      localValue: 150,
      serverValue: 200,
    });
  });

  test("resolving a money conflict with 'theirs' adopts the server value", async () => {
    await pullChanges(mockWorkspaceId);
    const seeded = await db.expenses.get(EXPENSE_ID);
    await db.expenses.put({ ...seeded!, amount: 150, updatedAt: Date.now() + 60_000 });
    await enqueueMutation(
      {
        table: "expenses",
        operation: "upsert",
        id: EXPENSE_ID,
        data: { amount: 150, category: seeded!.category, day: seeded!.day, month: seeded!.month, year: seeded!.year, isRecurring: false },
        idempotencyKey: makeIdempotencyKey(),
      },
      mockWorkspaceId,
    );
    server.commit([{ id: EXPENSE_ID, operation: "upsert", data: { amount: 200 } }]);
    await pullChanges(mockWorkspaceId);

    const [conflict] = getPendingMoneyConflicts(mockWorkspaceId);
    const resolved = await resolveMoneyConflict(conflict.key, "theirs");
    expect(resolved).toBe(true);

    const after = await db.expenses.get(EXPENSE_ID);
    expect(after?.amount).toBe(200);
    expect(getPendingMoneyConflicts(mockWorkspaceId)).toHaveLength(0);

    // The stale queued upsert (amount=150) must not silently undo the choice:
    // after the queue flushes and we re-pull, the value stays at the server's
    // 200 and no new conflict re-opens.
    await pushMutations(mockWorkspaceId);
    expect(server.row.amount).toBe(200);
    await pullChanges(mockWorkspaceId);
    const converged = await db.expenses.get(EXPENSE_ID);
    expect(converged?.amount).toBe(200);
    expect(getPendingMoneyConflicts(mockWorkspaceId)).toHaveLength(0);
  });

  test("resolving a money conflict with 'mine' keeps local and re-queues a push", async () => {
    await pullChanges(mockWorkspaceId);
    const seeded = await db.expenses.get(EXPENSE_ID);
    await db.expenses.put({ ...seeded!, amount: 150, updatedAt: Date.now() + 60_000 });
    server.commit([{ id: EXPENSE_ID, operation: "upsert", data: { amount: 200 } }]);
    await pullChanges(mockWorkspaceId);

    // Drain the queue so we can assert the resolution enqueues a fresh push.
    await db.mutations.clear();

    const [conflict] = getPendingMoneyConflicts(mockWorkspaceId);
    const resolved = await resolveMoneyConflict(conflict.key, "mine");
    expect(resolved).toBe(true);

    const after = await db.expenses.get(EXPENSE_ID);
    expect(after?.amount).toBe(150);
    expect(getPendingMoneyConflicts(mockWorkspaceId)).toHaveLength(0);

    const queued = await db.mutations.where("workspaceId").equals(mockWorkspaceId).toArray();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ table: "expenses", operation: "upsert", id: EXPENSE_ID });
    expect(queued[0].data).toMatchObject({ amount: 150 });

    // A pull that lands before the corrective push flushes (server still 200)
    // must NOT re-open the just-resolved conflict — the local value stays 150.
    await pullChanges(mockWorkspaceId);
    expect(getPendingMoneyConflicts(mockWorkspaceId)).toHaveLength(0);
    const stillLocal = await db.expenses.get(EXPENSE_ID);
    expect(stillLocal?.amount).toBe(150);
  });

  test("push after local edit does not clear the conflict counter", async () => {
    // Seed local state and enqueue an upsert. Then push. Counters should
    // record the push but not touch `conflicts`.
    await db.expenses.put({
      id: EXPENSE_ID,
      workspaceId: mockWorkspaceId,
      category: "groceries",
      amount: 175,
      day: 1,
      month: 6,
      year: 2025,
      isRecurring: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });
    await enqueueMutation(
      {
        table: "expenses",
        operation: "upsert",
        id: EXPENSE_ID,
        data: { amount: 175, category: "groceries", day: 1, month: 6, year: 2025, isRecurring: false },
        idempotencyKey: makeIdempotencyKey(),
      },
      mockWorkspaceId,
    );

    await pushMutations(mockWorkspaceId);

    const counters = getSyncCounters();
    expect(counters.pushBatches).toBe(1);
    expect(counters.conflicts).toBe(0);
    expect(counters.failures).toBe(0);
    // Server should reflect the pushed value.
    expect(server.row.amount).toBe(175);
  });
});
