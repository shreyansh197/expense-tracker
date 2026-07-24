/// <reference types="jest" />

/**
 * Sync Commit — Idempotency Guarantees (Sprint 2.2 / T-2.2.3)
 *
 * Verifies the server-side dedup contract:
 *
 *   1. Two commits with the SAME idempotency key produce HTTP 200 with a
 *      response body whose `results` entry is byte-for-byte identical
 *      (same `status`, same entity `id`).
 *   2. The underlying Prisma upsert is called only once — the replay must
 *      not create a duplicate row.
 *   3. The dedup ledger receives one INSERT storing the entity id, so
 *      future replays keep returning the same body even after a process
 *      restart clears in-memory caches.
 *
 * The route is exercised through a manufactured `NextRequest`, with Prisma
 * and the auth guards mocked so the test stays hermetic.
 */

// ── Mocks (must load BEFORE importing the route handler) ──────────────────

const mockPrisma = {
  $queryRawUnsafe: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  expense: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  workspaceSettings: { upsert: jest.fn() },
  businessLedger: {
    upsert: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  businessPayment: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};

jest.mock("@/lib/server/prisma", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/server/guards", () => ({
  requireAuth: jest.fn(async () => ({
    userId: "user-1",
    sessionId: "sess-1",
    deviceId: "dev-1",
    workspaceId: "ws-1",
  })),
  requireWorkspaceMember: jest.fn(async () => ({ role: "owner" })),
  jsonError: (message: string, status: number) =>
    // Inline NextResponse to avoid pulling next/server for a trivial object.
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  getClientIp: () => "127.0.0.1",
}));

jest.mock("@/lib/server/ensureSyncColumns", () => ({
  ensureSyncColumns: jest.fn(async () => {}),
}));

jest.mock("@/lib/server/rateLimit", () => ({
  rateLimit: jest.fn(async () => ({ ok: true, retryAfter: 0 })),
}));

jest.mock("@/lib/server/tokens", () => ({
  hashIp: (ip: string) => `hashed-${ip}`,
}));

// The route imports from next/server which requires the runtime; jest's
// node testEnvironment already supplies fetch/Request/Response globals in
// modern Node, so we just need to import the handler after mocks are set up.
import { NextRequest } from "next/server";
import { POST } from "@/app/api/sync/commit/route";

// ── Helpers ───────────────────────────────────────────────────────────────

const WORKSPACE = "11111111-1111-4111-8111-111111111111";
const EXPENSE_ID = "22222222-2222-4222-8222-222222222222";
const KEY = "idem-key-2024-abc";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/sync/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json", authorization: "Bearer x" },
    body: JSON.stringify(body),
  });
}

function commitBody() {
  return {
    workspaceId: WORKSPACE,
    mutations: [
      {
        table: "expenses",
        operation: "upsert",
        id: EXPENSE_ID,
        data: {
          category: "groceries",
          amount: 12.5,
          day: 5,
          month: 6,
          year: 2025,
          isRecurring: false,
        },
        idempotencyKey: KEY,
      },
    ],
  };
}

beforeEach(() => {
  jest.clearAllMocks();

  // Simulated ledger of already-processed idempotency keys, keyed by the
  // string the route substitutes into $queryRawUnsafe.
  const processed: Array<{ idempotency_key: string; entity_id: string | null }> = [];

  mockPrisma.$queryRawUnsafe.mockImplementation(async (_sql: string, _wsId: string, keys: string[]) => {
    return processed.filter((r) => keys.includes(r.idempotency_key));
  });

  mockPrisma.$executeRawUnsafe.mockImplementation(async (sql: string, _wsId: string, keys: string[], entityIds: (string | null)[]) => {
    if (typeof sql === "string" && sql.includes("INSERT INTO processed_idempotency_keys")) {
      keys.forEach((k, i) => {
        if (!processed.some((r) => r.idempotency_key === k)) {
          processed.push({ idempotency_key: k, entity_id: entityIds[i] ?? null });
        }
      });
    }
    return 0;
  });

  mockPrisma.expense.findUnique.mockResolvedValue(null);
  mockPrisma.expense.upsert.mockResolvedValue({ id: EXPENSE_ID });
});

// ── The invariant ─────────────────────────────────────────────────────────

describe("POST /api/sync/commit — idempotency dedup", () => {
  test("two commits with the same key return identical bodies and upsert once", async () => {
    const res1 = await POST(makeRequest(commitBody()));
    expect(res1.status).toBe(200);
    const body1 = await res1.json();

    // First call actually upserts and records the dedup entry.
    expect(mockPrisma.expense.upsert).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);

    const res2 = await POST(makeRequest(commitBody()));
    expect(res2.status).toBe(200);
    const body2 = await res2.json();

    // Replay must NOT upsert again, and must NOT insert another dedup row.
    expect(mockPrisma.expense.upsert).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);

    // Response bodies must be identical (same key, same status, same entity id).
    expect(body2).toEqual(body1);
    expect(body1.results[0]).toEqual({
      idempotencyKey: KEY,
      status: "applied",
      id: EXPENSE_ID,
    });
    expect(body2.results[0]).toEqual({
      idempotencyKey: KEY,
      status: "applied",
      id: EXPENSE_ID,
    });
  });

  test("replay after mixed batch: only the duplicate is skipped, new items apply", async () => {
    await POST(makeRequest(commitBody()));
    mockPrisma.expense.upsert.mockClear();

    const newId = "33333333-3333-4333-8333-333333333333";
    const newKey = "idem-key-2024-def";
    mockPrisma.expense.upsert.mockResolvedValueOnce({ id: newId });

    const res = await POST(makeRequest({
      workspaceId: WORKSPACE,
      mutations: [
        commitBody().mutations[0],
        {
          ...commitBody().mutations[0],
          id: newId,
          idempotencyKey: newKey,
        },
      ],
    }));

    const body = await res.json();
    expect(mockPrisma.expense.upsert).toHaveBeenCalledTimes(1);
    expect(body.results).toHaveLength(2);
    expect(body.results[0]).toEqual({ idempotencyKey: KEY, status: "applied", id: EXPENSE_ID });
    expect(body.results[1]).toEqual({ idempotencyKey: newKey, status: "applied", id: newId });
  });
});
