/// <reference types="jest" />

/**
 * Push Send — Retry & Dead-Letter (Sprint 3.1 / T-3.1.3, T-3.1.6)
 *
 * Verifies the server-scheduled push retry contract in
 * `src/lib/server/pushDispatcher.ts`:
 *
 *   1. The exponential-backoff schedule is 30s → 5min → 30min → dead, with
 *      every delay bounded to ±20% jitter.
 *   2. A persistently-failing endpoint (transient 5xx) is retried across ticks
 *      and dead-lettered after exactly 4 attempts.
 *
 * The dispatcher is exercised through an injected in-memory Prisma double and a
 * fake sender, so the test is fully hermetic (no DB, no network).
 */

// Audit writes go through the real prisma client — stub the module out.
jest.mock("@/lib/server/audit", () => ({ audit: jest.fn(async () => {}) }));

import {
  PUSH_BACKOFF_SCHEDULE_MS,
  PUSH_MAX_ATTEMPTS,
  PUSH_JITTER_RATIO,
  jitteredDelay,
  nextBackoffMs,
  dispatchDueDeliveries,
  type PushDeliveryRow,
  type PushSubscriptionRow,
  type PushDispatcherDb,
} from "@/lib/server/pushDispatcher";

// ── In-memory Prisma double ────────────────────────────────────────────────

interface StoredDelivery {
  id: string;
  subscriptionId: string;
  attempts: number;
  payload: string;
  status: string;
  scheduledFor: Date;
  lastError: string | null;
}

function makeDb(
  deliveries: StoredDelivery[],
  subscriptions: PushSubscriptionRow[],
): PushDispatcherDb & { deliveries: StoredDelivery[]; subscriptions: PushSubscriptionRow[] } {
  return {
    deliveries,
    subscriptions,
    pushDelivery: {
      createMany: async () => ({}),
      findMany: async (args: unknown) => {
        const { where } = args as {
          where: { status: { in: string[] }; scheduledFor: { lte: Date } };
        };
        return deliveries
          .filter(
            (d) =>
              where.status.in.includes(d.status) &&
              d.scheduledFor.getTime() <= where.scheduledFor.lte.getTime(),
          )
          .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
          .map<PushDeliveryRow>((d) => ({
            id: d.id,
            subscriptionId: d.subscriptionId,
            attempts: d.attempts,
            payload: d.payload,
          }));
      },
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = deliveries.find((d) => d.id === args.where.id);
        if (row) Object.assign(row, args.data);
        return row;
      },
    },
    pushSubscription: {
      findMany: async (args: unknown) => {
        const { where } = args as { where: { id: { in: string[] } } };
        return subscriptions.filter((s) => where.id.in.includes(s.id));
      },
      deleteMany: async (args: { where: { id: string } }) => {
        const idx = subscriptions.findIndex((s) => s.id === args.where.id);
        if (idx >= 0) subscriptions.splice(idx, 1);
        return {};
      },
    },
  };
}

const sub: PushSubscriptionRow = {
  id: "sub-1",
  userId: "user-1",
  workspaceId: "ws-1",
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  p256dh: "p256dh-key",
  auth: "auth-key",
};

// =========================================================================
// Backoff schedule & jitter bounds (T-3.1.3)
// =========================================================================

describe("push backoff schedule", () => {
  test("schedule is 30s → 5min → 30min then dead after 4 attempts", () => {
    expect(PUSH_BACKOFF_SCHEDULE_MS).toEqual([30_000, 300_000, 1_800_000]);
    expect(PUSH_MAX_ATTEMPTS).toBe(4);
    // Attempts 1..3 map to the three schedule slots; attempt 4 is dead.
    expect(nextBackoffMs(4)).toBeNull();
    expect(nextBackoffMs(5)).toBeNull();
  });

  test("each delay stays within ±20% jitter bounds", () => {
    for (const base of PUSH_BACKOFF_SCHEDULE_MS) {
      const lo = base * (1 - PUSH_JITTER_RATIO);
      const hi = base * (1 + PUSH_JITTER_RATIO);
      // Extremes of the RNG range map to (essentially) the bound extremes.
      expect(jitteredDelay(base, () => 0)).toBe(Math.round(lo));
      expect(jitteredDelay(base, () => 0.999999)).toBeLessThanOrEqual(Math.round(hi));
      expect(jitteredDelay(base, () => 0.999999)).toBeGreaterThan(Math.round(hi) - 2);
      // Random sampling never escapes the bounds.
      for (let i = 0; i < 1000; i++) {
        const d = jitteredDelay(base, Math.random);
        expect(d).toBeGreaterThanOrEqual(Math.round(lo));
        expect(d).toBeLessThanOrEqual(Math.round(hi));
      }
    }
  });

  test("nextBackoffMs uses the correct schedule slot per attempt", () => {
    const mid = () => 0.5; // no jitter offset
    expect(nextBackoffMs(1, mid)).toBe(30_000);
    expect(nextBackoffMs(2, mid)).toBe(300_000);
    expect(nextBackoffMs(3, mid)).toBe(1_800_000);
  });
});

// =========================================================================
// Dead-letter after 4 attempts (T-3.1.6)
// =========================================================================

describe("push dispatch retry → dead-letter", () => {
  test("a persistently failing endpoint is dead-lettered after 4 attempts", async () => {
    const deliveries: StoredDelivery[] = [
      {
        id: "del-1",
        subscriptionId: sub.id,
        attempts: 0,
        payload: JSON.stringify({ title: "Reminder" }),
        status: "pending",
        scheduledFor: new Date("2026-01-01T21:00:00Z"),
        lastError: null,
      },
    ];
    const db = makeDb(deliveries, [{ ...sub }]);

    // Transient 500 — should be retried, not treated as stale.
    const send = jest.fn(async () => {
      throw Object.assign(new Error("push service unavailable"), { statusCode: 500 });
    });
    const rng = () => 0.5; // deterministic, no jitter offset

    let now = new Date("2026-01-01T21:00:00Z");
    const results = [];
    // Advance well past each backoff window every tick.
    for (let tick = 0; tick < 4; tick++) {
      results.push(await dispatchDueDeliveries({ db, send, now, rng }));
      now = new Date(now.getTime() + 60 * 60_000); // +1h ensures the row is due
    }

    // Four attempts total, then no longer due.
    expect(send).toHaveBeenCalledTimes(4);
    expect(deliveries[0].attempts).toBe(4);
    expect(deliveries[0].status).toBe("dead");

    // Ticks 1-3 reschedule (failed); tick 4 dead-letters.
    expect(results[0]).toEqual({ sent: 0, failed: 1, dead: 0 });
    expect(results[1]).toEqual({ sent: 0, failed: 1, dead: 0 });
    expect(results[2]).toEqual({ sent: 0, failed: 1, dead: 0 });
    expect(results[3]).toEqual({ sent: 0, failed: 0, dead: 1 });

    // A subsequent tick finds nothing due — dead rows are terminal.
    const after = await dispatchDueDeliveries({ db, send, now, rng });
    expect(after).toEqual({ sent: 0, failed: 0, dead: 0 });
    expect(send).toHaveBeenCalledTimes(4);
  });

  test("a successful send marks the delivery sent on the first attempt", async () => {
    const deliveries: StoredDelivery[] = [
      {
        id: "del-ok",
        subscriptionId: sub.id,
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-01T21:00:00Z"),
        lastError: null,
      },
    ];
    const db = makeDb(deliveries, [{ ...sub }]);
    const send = jest.fn(async () => ({ statusCode: 201 }));

    const res = await dispatchDueDeliveries({
      db,
      send,
      now: new Date("2026-01-01T21:00:00Z"),
    });

    expect(res).toEqual({ sent: 1, failed: 0, dead: 0 });
    expect(deliveries[0].status).toBe("sent");
    expect(deliveries[0].attempts).toBe(1);
  });
});
