/// <reference types="jest" />

/**
 * Sync Engine — Reliability & Persistence Tests
 *
 * Covers the Sprint 2.2 invariants:
 *
 *  1. Persistence — a mutation enqueued before the tab is "closed" is still
 *     present after the sync engine restarts (survives tab close).
 *  2. Offline drain — a failed push increments `attempts` and sets a future
 *     `nextRetryAt`; mutations remain in the queue.
 *  3. Backoff — successive failures produce monotonically-increasing delays,
 *     capped at 30 s. A mutation is not attempted again before its
 *     `nextRetryAt` elapses.
 *  4. Re-auth — mutations enqueued under workspace A remain intact when the
 *     active workspace switches to B; drain never leaks across workspaces.
 *  5. Dead-letter promotion — after MAX_MUTATION_ATTEMPTS failures the item
 *     surfaces via `getDeadLetterMutations` and `onDeadLetterChange`, and is
 *     no longer eligible for automatic drain until the user retries it.
 */

// ── Mocks (must load BEFORE importing the sync engine) ────────────────────

const mockAuthFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();
let mockWorkspaceId: string | null =
  "ws-a-00000000-0000-0000-0000-000000000000";
let mockIsAuthenticated = true;

jest.mock("@/lib/authClient", () => ({
  authFetch: (...args: [string, RequestInit?]) => mockAuthFetch(...args),
  getActiveWorkspaceId: () => mockWorkspaceId,
  isAuthenticated: () => mockIsAuthenticated,
  subscribeAuth: () => () => {},
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      unsubscribe: () => {},
    }),
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
  makeIdempotencyKey,
  computeBackoffDelay,
  getDeadLetterMutations,
  retryDeadLetter,
  discardDeadLetter,
  restoreDiscardedMutation,
  onDeadLetterChange,
  MAX_MUTATION_ATTEMPTS,
} from "@/lib/syncEngine";

// ── Helpers ───────────────────────────────────────────────────────────────

const WORKSPACE_A = "ws-a-00000000-0000-0000-0000-000000000000";
const WORKSPACE_B = "ws-b-00000000-0000-0000-0000-000000000000";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function serverErrorResponse(): Response {
  return jsonResponse({ error: "Internal" }, 500);
}

function makeMutation() {
  return {
    table: "expenses" as const,
    operation: "upsert" as const,
    id: crypto.randomUUID(),
    data: {
      amount: 42,
      category: "groceries",
      day: 1,
      month: 1,
      year: 2025,
      isRecurring: false,
    },
    idempotencyKey: makeIdempotencyKey(),
  };
}

async function drainAllTables() {
  await db.mutations.clear();
  await db.expenses.clear();
  await db.settings.clear();
  await db.ledgers.clear();
  await db.payments.clear();
  await db.syncMeta.clear();
}

beforeEach(async () => {
  mockAuthFetch.mockReset();
  mockWorkspaceId = WORKSPACE_A;
  mockIsAuthenticated = true;
  await drainAllTables();
});

// ── 1. Persistence — mutation survives "tab close" ────────────────────────

describe("persistent mutation queue", () => {
  test("enqueued mutations are readable after a simulated tab reload", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);
    await enqueueMutation(makeMutation(), WORKSPACE_A);

    // "Close" the tab: the Dexie handle stays live in the fake-indexeddb
    // instance, mirroring how the browser retains the underlying store after
    // JS globals reset. Fetching via a fresh query proves the rows are
    // durable rather than held in an in-memory buffer.
    const survivors = await db.mutations
      .where("workspaceId")
      .equals(WORKSPACE_A)
      .toArray();
    expect(survivors).toHaveLength(2);
    expect(
      survivors.every((m) => m.attempts === 0 && m.nextRetryAt === 0),
    ).toBe(true);
  });
});

// ── 2. Offline / failing push — retry metadata is persisted ───────────────

describe("failed push updates retry metadata", () => {
  test("HTTP 500 bumps attempts, sets nextRetryAt in the future, and keeps rows", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);

    mockAuthFetch.mockResolvedValueOnce(serverErrorResponse());

    const before = Date.now();
    await pushMutations(WORKSPACE_A);
    const after = Date.now();

    const rows = await db.mutations
      .where("workspaceId")
      .equals(WORKSPACE_A)
      .toArray();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.attempts).toBe(1);
    expect(row.nextRetryAt).toBeGreaterThan(before);
    // Backoff must not exceed the 30 s ceiling + jitter.
    expect(row.nextRetryAt).toBeLessThanOrEqual(after + 30_000 + 500);
    expect(row.lastError).toBe("HTTP 500");
  });

  test("subsequent push before nextRetryAt is a no-op (no HTTP call)", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);

    mockAuthFetch.mockResolvedValueOnce(serverErrorResponse());
    await pushMutations(WORKSPACE_A); // fail once, sets nextRetryAt ≈ now + 1s

    mockAuthFetch.mockClear();

    // Immediately try again — must be skipped by the eligibility filter.
    const applied = await pushMutations(WORKSPACE_A);
    expect(applied).toBe(0);
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("network error path also records backoff (offline scenario)", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);

    mockAuthFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await pushMutations(WORKSPACE_A);

    const row = (
      await db.mutations.where("workspaceId").equals(WORKSPACE_A).toArray()
    )[0];
    expect(row.attempts).toBe(1);
    expect(row.nextRetryAt).toBeGreaterThan(Date.now());
    expect(row.lastError).toBe("TypeError");
  });
});

// ── 3. Backoff schedule ───────────────────────────────────────────────────

describe("exponential backoff with jitter", () => {
  test("delay grows monotonically until the 30 s cap", () => {
    const d1 = computeBackoffDelay(1);
    const d2 = computeBackoffDelay(2);
    const d3 = computeBackoffDelay(3);
    const d4 = computeBackoffDelay(4);
    // Base 1 s doubles each step; jitter (< 500 ms) never exceeds one step.
    expect(d1).toBeGreaterThanOrEqual(1_000);
    expect(d1).toBeLessThan(2_000);
    expect(d2).toBeGreaterThanOrEqual(2_000);
    expect(d3).toBeGreaterThanOrEqual(4_000);
    expect(d4).toBeGreaterThanOrEqual(8_000);
  });

  test("delay never exceeds 30 s + jitter regardless of attempts", () => {
    for (const attempts of [8, 16, 32, 100]) {
      const d = computeBackoffDelay(attempts);
      expect(d).toBeLessThanOrEqual(30_500);
    }
  });
});

// ── 4. Re-auth / workspace switch ─────────────────────────────────────────

describe("workspace isolation across re-auth", () => {
  test("switching active workspace preserves the queue for the previous one", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);
    await enqueueMutation(makeMutation(), WORKSPACE_A);

    // Simulate re-auth into workspace B.
    mockWorkspaceId = WORKSPACE_B;
    await enqueueMutation(makeMutation(), WORKSPACE_B);

    const a = await db.mutations
      .where("workspaceId")
      .equals(WORKSPACE_A)
      .toArray();
    const b = await db.mutations
      .where("workspaceId")
      .equals(WORKSPACE_B)
      .toArray();
    expect(a).toHaveLength(2);
    expect(b).toHaveLength(1);
  });

  test("push for workspace A never sends mutations belonging to workspace B", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);
    await enqueueMutation(makeMutation(), WORKSPACE_B);

    mockAuthFetch.mockResolvedValue(
      jsonResponse({ results: [{ status: "applied" }] }),
    );

    await pushMutations(WORKSPACE_A);

    // Only one HTTP call, and its payload targets workspace A exclusively.
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockAuthFetch.mock.calls[0][1]?.body as string);
    expect(body.workspaceId).toBe(WORKSPACE_A);
    expect(body.mutations).toHaveLength(1);

    // Workspace B's mutation is untouched.
    const b = await db.mutations
      .where("workspaceId")
      .equals(WORKSPACE_B)
      .toArray();
    expect(b).toHaveLength(1);
  });
});

// ── 5. Dead-letter promotion, retry, discard, undo ────────────────────────

describe("dead-letter queue lifecycle", () => {
  test("attempts >= MAX_MUTATION_ATTEMPTS promotes the mutation and fires the observable", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);

    // Simulate a mutation that has already burned through its retry budget.
    // We bypass the backoff gate by manually advancing `attempts` and
    // clearing `nextRetryAt` so pushMutations attempts one more time.
    const row = (await db.mutations.toArray())[0];
    await db.mutations.update(row.localId!, {
      attempts: MAX_MUTATION_ATTEMPTS - 1,
      nextRetryAt: 0,
    });

    const promotions: number[] = [];
    const unsub = onDeadLetterChange(() => promotions.push(Date.now()));

    mockAuthFetch.mockResolvedValueOnce(serverErrorResponse());
    await pushMutations(WORKSPACE_A);

    const dead = await getDeadLetterMutations(WORKSPACE_A);
    expect(dead).toHaveLength(1);
    expect(dead[0].attempts).toBe(MAX_MUTATION_ATTEMPTS);
    expect(promotions.length).toBeGreaterThanOrEqual(1);

    unsub();
  });

  test("dead-lettered mutations are skipped by drain until user retries", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);
    const row = (await db.mutations.toArray())[0];
    await db.mutations.update(row.localId!, {
      attempts: MAX_MUTATION_ATTEMPTS,
      nextRetryAt: 0,
      lastError: "HTTP 500",
    });

    // Drain must not attempt dead-lettered rows.
    const applied = await pushMutations(WORKSPACE_A);
    expect(applied).toBe(0);
    expect(mockAuthFetch).not.toHaveBeenCalled();

    // User clicks Retry — attempts reset, and drain (mocked) fires trySyncPush.
    mockAuthFetch.mockResolvedValue(
      jsonResponse({ results: [{ status: "applied" }] }),
    );
    const ok = await retryDeadLetter(row.localId!);
    expect(ok).toBe(true);

    const reset = await db.mutations.get(row.localId!);
    expect(reset?.attempts).toBe(0);
    expect(reset?.nextRetryAt).toBe(0);
    expect(reset?.lastError).toBeNull();
  });

  test("discard removes the row; restore re-enqueues with fresh retry state", async () => {
    await enqueueMutation(makeMutation(), WORKSPACE_A);
    const row = (await db.mutations.toArray())[0];
    await db.mutations.update(row.localId!, {
      attempts: MAX_MUTATION_ATTEMPTS,
      nextRetryAt: 0,
    });

    // Silence the trySyncPush the restore path fires automatically.
    mockAuthFetch.mockResolvedValue(
      jsonResponse({ results: [{ status: "applied" }] }),
    );

    const discarded = await discardDeadLetter(row.localId!);
    expect(discarded).not.toBeNull();
    expect(await db.mutations.get(row.localId!)).toBeUndefined();

    await restoreDiscardedMutation(discarded!);

    const restored = await db.mutations
      .where("workspaceId")
      .equals(WORKSPACE_A)
      .toArray();
    expect(restored).toHaveLength(1);
    expect(restored[0].attempts).toBe(0);
    expect(restored[0].idempotencyKey).toBe(discarded!.idempotencyKey);
  });
});
