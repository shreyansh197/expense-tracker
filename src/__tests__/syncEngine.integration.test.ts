/// <reference types="jest" />

/**
 * Sync Engine Integration Tests
 *
 * Tests the pull/push/enqueue lifecycle with mocked IDB (via fake-indexeddb)
 * and mocked HTTP (via jest.fn authFetch).
 */

// ── Mock modules BEFORE importing the sync engine ──

// Mock authClient
const mockAuthFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();
let mockWorkspaceId: string | null = "ws-test-001";
let mockIsAuthenticated = true;

jest.mock("@/lib/authClient", () => ({
  authFetch: (...args: [string, RequestInit?]) => mockAuthFetch(...args),
  getActiveWorkspaceId: () => mockWorkspaceId,
  isAuthenticated: () => mockIsAuthenticated,
  subscribeAuth: () => () => {},
}));

// Mock supabase (realtime channels)
jest.mock("@/lib/supabase", () => ({
  supabase: {
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      unsubscribe: () => {},
    }),
    removeChannel: () => {},
  },
}));

// Mock crypto (no encryption in tests)
jest.mock("@/lib/crypto", () => ({
  encryptJSON: jest.fn((obj: unknown) => Promise.resolve(JSON.stringify(obj))),
  decryptJSON: jest.fn((str: string) => Promise.resolve(JSON.parse(str))),
  hasEncryptionKey: () => false,
}));

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  setUser: jest.fn(),
}));

// Set up fake IndexedDB
import "fake-indexeddb/auto";

// ── Now import the module under test ──

import { db } from "@/lib/db";
import {
  enqueueMutation,
  pushMutations,
  pullChanges,
  makeIdempotencyKey,
  onWorkspaceAccessDenied,
} from "@/lib/syncEngine";
import type { IDBMutation } from "@/lib/db";

// ── Helpers ──

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeMutation(overrides: Partial<IDBMutation> = {}): Omit<IDBMutation, "localId" | "createdAt" | "workspaceId"> {
  return {
    table: "expenses",
    operation: "upsert",
    id: crypto.randomUUID(),
    data: { amount: 100, category: "groceries" },
    idempotencyKey: makeIdempotencyKey(),
    ...overrides,
  };
}

// ── Setup / Teardown ──

beforeEach(async () => {
  mockAuthFetch.mockReset();
  mockWorkspaceId = "ws-test-001";
  mockIsAuthenticated = true;
  // Clear all IDB tables
  await db.mutations.clear();
  await db.expenses.clear();
  await db.settings.clear();
  await db.ledgers.clear();
  await db.payments.clear();
  await db.syncMeta.clear();
});

// ── Tests ──

describe("enqueueMutation", () => {
  test("stores mutation in IDB with correct fields", async () => {
    const mutation = makeMutation();
    await enqueueMutation(mutation, "ws-test-001");

    const stored = await db.mutations.toArray();
    expect(stored).toHaveLength(1);
    expect(stored[0].table).toBe("expenses");
    expect(stored[0].operation).toBe("upsert");
    expect(stored[0].workspaceId).toBe("ws-test-001");
    expect(stored[0].data).toEqual(mutation.data);
    expect(stored[0].createdAt).toBeGreaterThan(0);
  });

  test("generates auto-increment localId", async () => {
    await enqueueMutation(makeMutation(), "ws-test-001");
    await enqueueMutation(makeMutation(), "ws-test-001");

    const stored = await db.mutations.toArray();
    expect(stored).toHaveLength(2);
    expect(stored[0].localId).toBeLessThan(stored[1].localId!);
  });
});

describe("pushMutations", () => {
  test("sends mutations in batches of 100 max", async () => {
    // Enqueue 150 mutations
    for (let i = 0; i < 150; i++) {
      await enqueueMutation(makeMutation(), "ws-test-001");
    }

    mockAuthFetch.mockResolvedValue(
      makeJsonResponse({
        results: Array(100).fill({ status: "applied" }),
      })
    );

    // First call: should send 2 batches (100 + 50)
    // The mock always returns 100 results but pushMutations batches by 100
    await pushMutations("ws-test-001");

    // Should have made 2 fetch calls (100 + 50)
    expect(mockAuthFetch).toHaveBeenCalledTimes(2);

    // Verify first batch had 100 mutations
    const firstCallBody = JSON.parse(mockAuthFetch.mock.calls[0][1]?.body as string);
    expect(firstCallBody.mutations).toHaveLength(100);

    // Verify second batch had 50 mutations
    const secondCallBody = JSON.parse(mockAuthFetch.mock.calls[1][1]?.body as string);
    expect(secondCallBody.mutations).toHaveLength(50);
  });

  test("deletes applied mutations from IDB queue", async () => {
    await enqueueMutation(makeMutation(), "ws-test-001");
    await enqueueMutation(makeMutation(), "ws-test-001");

    mockAuthFetch.mockResolvedValue(
      makeJsonResponse({
        results: [{ status: "applied" }, { status: "applied" }],
      })
    );

    await pushMutations("ws-test-001");

    const remaining = await db.mutations.toArray();
    expect(remaining).toHaveLength(0);
  });

  test("prevents concurrent pushes via mutex", async () => {
    await enqueueMutation(makeMutation(), "ws-test-001");

    let resolveFirst: (v: Response) => void;
    const firstPromise = new Promise<Response>((r) => { resolveFirst = r; });
    mockAuthFetch.mockReturnValueOnce(firstPromise);

    // Start first push (hangs on fetch)
    const push1 = pushMutations("ws-test-001");

    // Start second push while first is in-flight — should return 0 immediately
    const push2Result = await pushMutations("ws-test-001");
    expect(push2Result).toBe(0);

    // Resolve first push
    resolveFirst!(makeJsonResponse({ results: [{ status: "applied" }] }));
    await push1;

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
  });

  test("stops on 403 and notifies access denied", async () => {
    await enqueueMutation(makeMutation(), "ws-test-001");

    const deniedHandler = jest.fn();
    const unsub = onWorkspaceAccessDenied(deniedHandler);

    mockAuthFetch.mockResolvedValue(makeJsonResponse({ error: "Forbidden" }, 403));

    await pushMutations("ws-test-001");

    expect(deniedHandler).toHaveBeenCalledWith("ws-test-001");

    // Mutations should still be in the queue (not deleted on error)
    const remaining = await db.mutations.toArray();
    expect(remaining).toHaveLength(1);

    unsub();
  });

  test("returns 0 when not authenticated", async () => {
    mockIsAuthenticated = false;
    await enqueueMutation(makeMutation(), "ws-test-001");

    const result = await pushMutations("ws-test-001");
    expect(result).toBe(0);
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("purges mutations with non-UUID ids", async () => {
    // Add a mutation with invalid id
    await db.mutations.add({
      table: "expenses",
      operation: "upsert",
      id: "temp-invalid-123",
      data: { amount: 50 },
      idempotencyKey: makeIdempotencyKey(),
      workspaceId: "ws-test-001",
      createdAt: Date.now(),
    });
    // Add a valid mutation
    await enqueueMutation(makeMutation(), "ws-test-001");

    mockAuthFetch.mockResolvedValue(
      makeJsonResponse({ results: [{ status: "applied" }] })
    );

    await pushMutations("ws-test-001");

    // Invalid mutation should be purged, valid one should be pushed
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockAuthFetch.mock.calls[0][1]?.body as string);
    expect(body.mutations).toHaveLength(1);
  });
});

describe("pullChanges", () => {
  test("writes pulled expenses to IDB", async () => {
    const testExpense = {
      id: crypto.randomUUID(),
      workspaceId: "ws-test-001",
      category: "groceries",
      amount: 250,
      day: 15,
      month: 6,
      year: 2025,
      remark: "test expense",
      isRecurring: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };

    mockAuthFetch.mockResolvedValue(
      makeJsonResponse({
        changes: {
          expenses: [testExpense],
          settings: null,
          businessLedgers: [],
          businessPayments: [],
        },
        cursor: "cursor-001",
        hasMore: false,
      })
    );

    const success = await pullChanges("ws-test-001");
    expect(success).toBe(true);

    const expenses = await db.expenses.toArray();
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount).toBe(250);
    expect(expenses[0].category).toBe("groceries");
  });

  test("returns false on 403", async () => {
    const deniedHandler = jest.fn();
    const unsub = onWorkspaceAccessDenied(deniedHandler);

    mockAuthFetch.mockResolvedValue(makeJsonResponse({ error: "Forbidden" }, 403));

    const success = await pullChanges("ws-test-001");
    expect(success).toBe(false);
    expect(deniedHandler).toHaveBeenCalledWith("ws-test-001");

    unsub();
  });

  test("returns false when not authenticated", async () => {
    mockIsAuthenticated = false;

    const success = await pullChanges("ws-test-001");
    expect(success).toBe(false);
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("handles pagination (hasMore=true)", async () => {
    const expense1 = {
      id: crypto.randomUUID(),
      workspaceId: "ws-test-001",
      category: "transport",
      amount: 50,
      day: 1, month: 6, year: 2025,
      isRecurring: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };
    const expense2 = {
      id: crypto.randomUUID(),
      workspaceId: "ws-test-001",
      category: "groceries",
      amount: 100,
      day: 2, month: 6, year: 2025,
      isRecurring: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };

    // First page: hasMore=true
    mockAuthFetch
      .mockResolvedValueOnce(
        makeJsonResponse({
          changes: {
            expenses: [expense1],
            settings: null,
            businessLedgers: [],
            businessPayments: [],
          },
          cursor: "cursor-page1",
          hasMore: true,
        })
      )
      // Second page: hasMore=false
      .mockResolvedValueOnce(
        makeJsonResponse({
          changes: {
            expenses: [expense2],
            settings: null,
            businessLedgers: [],
            businessPayments: [],
          },
          cursor: "cursor-page2",
          hasMore: false,
        })
      );

    const success = await pullChanges("ws-test-001");
    expect(success).toBe(true);

    // Both pages should be fetched
    expect(mockAuthFetch).toHaveBeenCalledTimes(2);

    const expenses = await db.expenses.toArray();
    expect(expenses).toHaveLength(2);
  });
});

describe("idempotency", () => {
  test("makeIdempotencyKey returns unique values", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(makeIdempotencyKey());
    }
    expect(keys.size).toBe(100);
  });
});
