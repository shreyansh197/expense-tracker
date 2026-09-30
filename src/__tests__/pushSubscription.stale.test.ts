/// <reference types="jest" />

/**
 * Push Subscription — Stale Endpoint Pruning (Sprint 3.1 / T-3.1.5, T-3.1.6)
 *
 * Verifies that when the push service reports an endpoint as gone
 * (`410 Gone` / `404 Not Found`), the dispatcher:
 *
 *   1. Dead-letters the in-flight delivery (no pointless retries).
 *   2. Removes the corresponding `push_subscriptions` row.
 *   3. Emits a `push.subscription_pruned` audit entry (no PII / money).
 *
 * Uses an injected in-memory Prisma double + fake sender for hermetic testing.
 */

const auditMock = jest.fn(async () => {});
jest.mock("@/lib/server/audit", () => ({ audit: auditMock }));

import {
  dispatchDueDeliveries,
  type PushDeliveryRow,
  type PushSubscriptionRow,
  type PushDispatcherDb,
} from "@/lib/server/pushDispatcher";

interface StoredDelivery {
  id: string;
  subscriptionId: string;
  attempts: number;
  payload: string;
  status: string;
  scheduledFor: Date;
  lastError: string | null;
}

function makeDb(deliveries: StoredDelivery[], subscriptions: PushSubscriptionRow[]): PushDispatcherDb {
  return {
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

function makeSub(id: string): PushSubscriptionRow {
  return {
    id,
    userId: `user-${id}`,
    workspaceId: "ws-1",
    endpoint: `https://fcm.googleapis.com/fcm/send/${id}`,
    p256dh: "p256dh-key",
    auth: "auth-key",
  };
}

beforeEach(() => {
  auditMock.mockClear();
});

describe("stale subscription pruning", () => {
  test.each([410, 404])(
    "HTTP %d prunes the subscription and dead-letters the delivery within one tick",
    async (statusCode) => {
      const subscriptions = [makeSub("sub-1")];
      const deliveries: StoredDelivery[] = [
        {
          id: "del-1",
          subscriptionId: "sub-1",
          attempts: 0,
          payload: "{}",
          status: "pending",
          scheduledFor: new Date("2026-01-01T21:00:00Z"),
          lastError: null,
        },
      ];
      const db = makeDb(deliveries, subscriptions);
      const send = jest.fn(async () => {
        throw Object.assign(new Error("gone"), { statusCode });
      });

      const res = await dispatchDueDeliveries({
        db,
        send,
        now: new Date("2026-01-01T21:00:00Z"),
      });

      expect(res).toEqual({ sent: 0, failed: 0, dead: 1 });
      // Subscription removed …
      expect(subscriptions).toHaveLength(0);
      // … delivery dead-lettered (not left pending for retry) …
      expect(deliveries[0].status).toBe("dead");
      expect(deliveries[0].lastError).toBe(`stale:${statusCode}`);
      // … and a privacy-safe audit entry emitted.
      expect(auditMock).toHaveBeenCalledTimes(1);
      expect(auditMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-sub-1",
          entityType: "push_subscription",
          entityId: "sub-1",
          action: "push.subscription_pruned",
          meta: expect.objectContaining({ workspaceId: "ws-1", reason: `stale_endpoint_${statusCode}` }),
        }),
      );
    },
  );

  test("a healthy subscription is never pruned", async () => {
    const subscriptions = [makeSub("sub-ok")];
    const deliveries: StoredDelivery[] = [
      {
        id: "del-ok",
        subscriptionId: "sub-ok",
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-01T21:00:00Z"),
        lastError: null,
      },
    ];
    const db = makeDb(deliveries, subscriptions);
    const send = jest.fn(async () => ({}));

    const res = await dispatchDueDeliveries({
      db,
      send,
      now: new Date("2026-01-01T21:00:00Z"),
    });

    expect(res).toEqual({ sent: 1, failed: 0, dead: 0 });
    expect(subscriptions).toHaveLength(1);
    expect(auditMock).not.toHaveBeenCalled();
  });

  test("one stale endpoint is pruned once even with multiple deliveries", async () => {
    const subscriptions = [makeSub("sub-1")];
    const deliveries: StoredDelivery[] = [
      {
        id: "del-a",
        subscriptionId: "sub-1",
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-01T21:00:00Z"),
        lastError: null,
      },
      {
        id: "del-b",
        subscriptionId: "sub-1",
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-01T21:00:00Z"),
        lastError: null,
      },
    ];
    const db = makeDb(deliveries, subscriptions);
    const send = jest.fn(async () => {
      throw Object.assign(new Error("gone"), { statusCode: 410 });
    });

    const res = await dispatchDueDeliveries({
      db,
      send,
      now: new Date("2026-01-01T21:00:00Z"),
    });

    expect(res).toEqual({ sent: 0, failed: 0, dead: 2 });
    expect(subscriptions).toHaveLength(0);
    // De-duplicated: a single prune + audit for the shared endpoint.
    expect(auditMock).toHaveBeenCalledTimes(1);
  });
});
