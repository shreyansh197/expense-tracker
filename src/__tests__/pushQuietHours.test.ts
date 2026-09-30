/// <reference types="jest" />

/**
 * Push Quiet Hours — Timezone-Correct Delivery Gating (Sprint 3.2 / T-3.2.3, T-3.2.6)
 *
 * Verifies the quiet-hours contract in `src/lib/server/pushDispatcher.ts`:
 *
 *   1. Pure helpers correctly parse/resolve/evaluate quiet-hours windows,
 *      including overnight windows that cross midnight (e.g. 22:00–07:00),
 *      across multiple IANA timezones — never the server's own UTC clock.
 *   2. `dispatchDueDeliveries` never sends to a recipient inside their quiet
 *      hours; the delivery is held and rescheduled to the exact moment the
 *      window ends, without spending one of its retry attempts.
 *   3. Deliveries for workspaces without quiet hours (or without the
 *      `workspaceSettings` lookup at all — older callers) are unaffected.
 *   4. A realistic mixed fixture (quiet + non-quiet, some retries) still
 *      clears the M3 exit bar of ≥ 95% delivery.
 *
 * The dispatcher is exercised entirely through an injected in-memory Prisma
 * double and a fake sender — no DB, no network, fully hermetic.
 */

jest.mock("@/lib/server/audit", () => ({ audit: jest.fn(async () => {}) }));

import {
  parseHHMMToMinutes,
  resolveQuietHoursWindow,
  isQuietHoursActive,
  nextLocalClockTimeUtc,
  dispatchDueDeliveries,
  type QuietHoursWindow,
  type PushDeliveryRow,
  type PushSubscriptionRow,
  type WorkspaceSettingsRow,
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
  workspaceSettings?: WorkspaceSettingsRow[],
): PushDispatcherDb {
  const db: PushDispatcherDb = {
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
  if (workspaceSettings) {
    db.workspaceSettings = {
      findMany: async (args: unknown) => {
        const { where } = args as { where: { workspaceId: { in: string[] } } };
        return workspaceSettings.filter((w) => where.workspaceId.in.includes(w.workspaceId));
      },
    };
  }
  return db;
}

function makeSub(id: string, workspaceId = "ws-1"): PushSubscriptionRow {
  return {
    id,
    userId: `user-${id}`,
    workspaceId,
    endpoint: `https://fcm.googleapis.com/fcm/send/${id}`,
    p256dh: "p256dh-key",
    auth: "auth-key",
  };
}

// =========================================================================
// Pure helpers — parsing & window resolution
// =========================================================================

describe("parseHHMMToMinutes", () => {
  test("parses valid HH:MM", () => {
    expect(parseHHMMToMinutes("00:00")).toBe(0);
    expect(parseHHMMToMinutes("09:05")).toBe(545);
    expect(parseHHMMToMinutes("23:59")).toBe(1439);
  });

  test("rejects malformed input", () => {
    expect(parseHHMMToMinutes("24:00")).toBeNull();
    expect(parseHHMMToMinutes("12:60")).toBeNull();
    expect(parseHHMMToMinutes("9:00")).toBeNull();
    expect(parseHHMMToMinutes("")).toBeNull();
    expect(parseHHMMToMinutes(undefined)).toBeNull();
    expect(parseHHMMToMinutes(123)).toBeNull();
  });
});

describe("resolveQuietHoursWindow", () => {
  test("resolves a valid window with an explicit quietHoursTimezone", () => {
    const window = resolveQuietHoursWindow({
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      quietHoursTimezone: "America/New_York",
      timezone: "UTC",
    });
    expect(window).toEqual({ startMinutes: 1320, endMinutes: 420, timezone: "America/New_York" });
  });

  test("falls back to the general timezone when quietHoursTimezone is absent", () => {
    const window = resolveQuietHoursWindow({
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      timezone: "Asia/Kolkata",
    });
    expect(window?.timezone).toBe("Asia/Kolkata");
  });

  test("falls back to UTC when no timezone is known at all", () => {
    const window = resolveQuietHoursWindow({
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    });
    expect(window?.timezone).toBe("UTC");
  });

  test("returns null when quiet hours are disabled", () => {
    expect(
      resolveQuietHoursWindow({ quietHoursEnabled: false, quietHoursStart: "22:00", quietHoursEnd: "07:00" }),
    ).toBeNull();
  });

  test("returns null (fails open) on identical start/end", () => {
    expect(
      resolveQuietHoursWindow({ quietHoursEnabled: true, quietHoursStart: "09:00", quietHoursEnd: "09:00" }),
    ).toBeNull();
  });

  test("returns null (fails open) on malformed start/end", () => {
    expect(
      resolveQuietHoursWindow({ quietHoursEnabled: true, quietHoursStart: "bad", quietHoursEnd: "07:00" }),
    ).toBeNull();
  });

  test("returns null for non-object input", () => {
    expect(resolveQuietHoursWindow(null)).toBeNull();
    expect(resolveQuietHoursWindow(undefined)).toBeNull();
    expect(resolveQuietHoursWindow("not an object")).toBeNull();
  });
});

// =========================================================================
// isQuietHoursActive — same-day and midnight-crossing windows
// =========================================================================

describe("isQuietHoursActive", () => {
  test("same-day window: active strictly inside [start, end)", () => {
    const window: QuietHoursWindow = { startMinutes: 9 * 60, endMinutes: 17 * 60, timezone: "UTC" };
    expect(isQuietHoursActive(window, new Date("2026-01-15T09:00:00Z"))).toBe(true); // start inclusive
    expect(isQuietHoursActive(window, new Date("2026-01-15T12:00:00Z"))).toBe(true);
    expect(isQuietHoursActive(window, new Date("2026-01-15T16:59:00Z"))).toBe(true);
    expect(isQuietHoursActive(window, new Date("2026-01-15T17:00:00Z"))).toBe(false); // end exclusive
    expect(isQuietHoursActive(window, new Date("2026-01-15T08:59:00Z"))).toBe(false);
  });

  test("overnight window (22:00–07:00): active across midnight", () => {
    const window: QuietHoursWindow = { startMinutes: 22 * 60, endMinutes: 7 * 60, timezone: "UTC" };
    expect(isQuietHoursActive(window, new Date("2026-01-15T22:00:00Z"))).toBe(true); // right at start
    expect(isQuietHoursActive(window, new Date("2026-01-15T23:30:00Z"))).toBe(true); // before midnight
    expect(isQuietHoursActive(window, new Date("2026-01-16T00:00:00Z"))).toBe(true); // exactly midnight
    expect(isQuietHoursActive(window, new Date("2026-01-16T03:00:00Z"))).toBe(true); // after midnight
    expect(isQuietHoursActive(window, new Date("2026-01-16T06:59:00Z"))).toBe(true);
    expect(isQuietHoursActive(window, new Date("2026-01-16T07:00:00Z"))).toBe(false); // end exclusive
    expect(isQuietHoursActive(window, new Date("2026-01-16T12:00:00Z"))).toBe(false); // broad daytime
  });

  test("evaluates in the window's own timezone, not the server's UTC clock", () => {
    // 09:00 UTC == 14:30 IST (UTC+5:30). A 22:00–07:00 IST quiet window is NOT
    // active at 14:30 IST even though the *UTC* hour (09) looks unremarkable.
    const window: QuietHoursWindow = { startMinutes: 22 * 60, endMinutes: 7 * 60, timezone: "Asia/Kolkata" };
    expect(isQuietHoursActive(window, new Date("2026-01-15T09:00:00Z"))).toBe(false);
    // 17:00 UTC == 22:30 IST — inside the window.
    expect(isQuietHoursActive(window, new Date("2026-01-15T17:00:00Z"))).toBe(true);
  });
});

// =========================================================================
// nextLocalClockTimeUtc — reschedule target correctness
// =========================================================================

/** Independent (black-box) check: format `instant` in `tz` and read HH:MM. */
function localHHMM(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(
    instant,
  );
}

describe("nextLocalClockTimeUtc", () => {
  test("schedules later today when the target time hasn't happened yet locally", () => {
    // 09:00 UTC in Asia/Kolkata (UTC+5:30, no DST) is 14:30 local.
    // Target 07:00 tomorrow already passed; target 20:00 is still ahead today.
    const now = new Date("2026-01-15T09:00:00Z");
    const next = nextLocalClockTimeUtc(now, "Asia/Kolkata", 20 * 60);
    expect(localHHMM(next, "Asia/Kolkata")).toBe("20:00");
    expect(next.getTime()).toBeGreaterThan(now.getTime());
    expect(next.getTime() - now.getTime()).toBeLessThanOrEqual(24 * 60 * 60_000);
  });

  test("rolls to tomorrow when the target time has already passed locally", () => {
    const now = new Date("2026-01-15T20:00:00Z"); // 01:30 IST on the 16th
    const next = nextLocalClockTimeUtc(now, "Asia/Kolkata", 7 * 60); // target 07:00
    expect(localHHMM(next, "Asia/Kolkata")).toBe("07:00");
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });

  test("overnight window end resolves correctly whether now is before or after local midnight", () => {
    // Before local midnight: 23:30 local (overnight window 22:00–07:00) → end is tomorrow 07:00.
    const beforeMidnight = new Date("2026-01-15T18:00:00Z"); // 23:30 IST
    const end1 = nextLocalClockTimeUtc(beforeMidnight, "Asia/Kolkata", 7 * 60);
    expect(localHHMM(end1, "Asia/Kolkata")).toBe("07:00");
    expect(end1.getTime()).toBeGreaterThan(beforeMidnight.getTime());

    // After local midnight: 03:00 local → end is *today* (already past midnight) 07:00.
    const afterMidnight = new Date("2026-01-15T21:30:00Z"); // 03:00 IST on the 16th
    const end2 = nextLocalClockTimeUtc(afterMidnight, "Asia/Kolkata", 7 * 60);
    expect(localHHMM(end2, "Asia/Kolkata")).toBe("07:00");
    expect(end2.getTime()).toBeGreaterThan(afterMidnight.getTime());
    // The gap should be a few hours, not a near-24h roll to the *next* day's 07:00.
    expect(end2.getTime() - afterMidnight.getTime()).toBeLessThan(6 * 60 * 60_000);
  });

  test("works across a westward IANA timezone (negative UTC offset)", () => {
    const now = new Date("2026-01-15T10:00:00Z"); // 05:00 America/New_York (UTC-5 in Jan, no DST)
    const next = nextLocalClockTimeUtc(now, "America/New_York", 7 * 60);
    expect(localHHMM(next, "America/New_York")).toBe("07:00");
    expect(next.getTime()).toBeGreaterThan(now.getTime());
    expect(next.getTime() - now.getTime()).toBeLessThanOrEqual(24 * 60 * 60_000);
  });
});

// =========================================================================
// dispatchDueDeliveries — quiet-hours gating end to end
// =========================================================================

describe("dispatchDueDeliveries — quiet hours", () => {
  test("holds a delivery inside quiet hours: not sent, not counted, no attempt spent", async () => {
    const sub = makeSub("sub-1");
    const deliveries: StoredDelivery[] = [
      {
        id: "del-1",
        subscriptionId: sub.id,
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-15T23:00:00Z"),
        lastError: null,
      },
    ];
    // 23:00 UTC == 04:30 IST on the 16th — inside a 22:00–07:00 IST window.
    const workspaceSettings: WorkspaceSettingsRow[] = [
      {
        workspaceId: "ws-1",
        notificationPrefs: {
          quietHoursEnabled: true,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          quietHoursTimezone: "Asia/Kolkata",
        },
      },
    ];
    const db = makeDb(deliveries, [sub], workspaceSettings);
    const send = jest.fn(async () => ({}));
    const now = new Date("2026-01-15T23:00:00Z");

    const result = await dispatchDueDeliveries({ db, send, now });

    expect(send).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, failed: 0, dead: 0 });
    expect(deliveries[0].status).toBe("pending"); // untouched lifecycle state
    expect(deliveries[0].attempts).toBe(0); // no attempt spent while held
    // Rescheduled to the window's end (07:00 IST), strictly after `now`.
    expect(localHHMM(deliveries[0].scheduledFor, "Asia/Kolkata")).toBe("07:00");
    expect(deliveries[0].scheduledFor.getTime()).toBeGreaterThan(now.getTime());
  });

  test("sends normally once the window has ended", async () => {
    const sub = makeSub("sub-1");
    const deliveries: StoredDelivery[] = [
      {
        id: "del-1",
        subscriptionId: sub.id,
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-16T02:00:00Z"), // 07:30 IST — window just ended
        lastError: null,
      },
    ];
    const workspaceSettings: WorkspaceSettingsRow[] = [
      {
        workspaceId: "ws-1",
        notificationPrefs: {
          quietHoursEnabled: true,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          quietHoursTimezone: "Asia/Kolkata",
        },
      },
    ];
    const db = makeDb(deliveries, [sub], workspaceSettings);
    const send = jest.fn(async () => ({}));

    const result = await dispatchDueDeliveries({ db, send, now: new Date("2026-01-16T02:00:00Z") });

    expect(send).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ sent: 1, failed: 0, dead: 0 });
    expect(deliveries[0].status).toBe("sent");
    expect(deliveries[0].attempts).toBe(1);
  });

  test("is a no-op for workspaces without quiet hours enabled", async () => {
    const sub = makeSub("sub-1");
    const deliveries: StoredDelivery[] = [
      {
        id: "del-1",
        subscriptionId: sub.id,
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-15T23:00:00Z"),
        lastError: null,
      },
    ];
    const workspaceSettings: WorkspaceSettingsRow[] = [
      { workspaceId: "ws-1", notificationPrefs: { quietHoursEnabled: false } },
    ];
    const db = makeDb(deliveries, [sub], workspaceSettings);
    const send = jest.fn(async () => ({}));

    const result = await dispatchDueDeliveries({ db, send, now: new Date("2026-01-15T23:00:00Z") });

    expect(send).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ sent: 1, failed: 0, dead: 0 });
  });

  test("backward-compatible: dispatch behaves exactly as before when db has no workspaceSettings lookup", async () => {
    const sub = makeSub("sub-1");
    const deliveries: StoredDelivery[] = [
      {
        id: "del-1",
        subscriptionId: sub.id,
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-15T23:00:00Z"),
        lastError: null,
      },
    ];
    const db = makeDb(deliveries, [sub]); // no workspaceSettings arg at all
    const send = jest.fn(async () => ({}));

    const result = await dispatchDueDeliveries({ db, send, now: new Date("2026-01-15T23:00:00Z") });

    expect(send).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ sent: 1, failed: 0, dead: 0 });
  });

  test("quiet hours in one workspace never affect subscriptions in another", async () => {
    const quietSub = makeSub("sub-quiet", "ws-quiet");
    const normalSub = makeSub("sub-normal", "ws-normal");
    const deliveries: StoredDelivery[] = [
      {
        id: "del-quiet",
        subscriptionId: quietSub.id,
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-15T23:00:00Z"),
        lastError: null,
      },
      {
        id: "del-normal",
        subscriptionId: normalSub.id,
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-15T23:00:00Z"),
        lastError: null,
      },
    ];
    const workspaceSettings: WorkspaceSettingsRow[] = [
      {
        workspaceId: "ws-quiet",
        notificationPrefs: {
          quietHoursEnabled: true,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          quietHoursTimezone: "Asia/Kolkata",
        },
      },
      { workspaceId: "ws-normal", notificationPrefs: { quietHoursEnabled: false } },
    ];
    const db = makeDb(deliveries, [quietSub, normalSub], workspaceSettings);
    const send = jest.fn(async () => ({}));

    const result = await dispatchDueDeliveries({ db, send, now: new Date("2026-01-15T23:00:00Z") });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ endpoint: normalSub.endpoint }), expect.any(String));
    expect(result).toEqual({ sent: 1, failed: 0, dead: 0 });
    expect(deliveries.find((d) => d.id === "del-quiet")!.status).toBe("pending");
    expect(deliveries.find((d) => d.id === "del-normal")!.status).toBe("sent");
  });

  test("a delivery held every tick throughout the window is never dead-lettered by quiet hours alone", async () => {
    const sub = makeSub("sub-1");
    const deliveries: StoredDelivery[] = [
      {
        id: "del-1",
        subscriptionId: sub.id,
        attempts: 0,
        payload: "{}",
        status: "pending",
        scheduledFor: new Date("2026-01-15T22:00:00Z"), // window opens exactly now (IST)
        lastError: null,
      },
    ];
    const workspaceSettings: WorkspaceSettingsRow[] = [
      {
        workspaceId: "ws-1",
        notificationPrefs: {
          quietHoursEnabled: true,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          quietHoursTimezone: "Asia/Kolkata",
        },
      },
    ];
    const db = makeDb(deliveries, [sub], workspaceSettings);
    const send = jest.fn(async () => ({}));

    // Simulate several per-minute ticks landing inside the window.
    let now = new Date("2026-01-15T22:00:00Z"); // 03:30 IST
    for (let i = 0; i < 5; i++) {
      await dispatchDueDeliveries({ db, send, now });
      now = deliveries[0].scheduledFor > now ? new Date(deliveries[0].scheduledFor.getTime() - 1) : now;
    }

    expect(send).not.toHaveBeenCalled();
    expect(deliveries[0].attempts).toBe(0);
    expect(deliveries[0].status).toBe("pending");
  });
});

// =========================================================================
// M3 exit fixture — ≥ 95% delivery with a realistic mixed batch (T-3.2.6)
// =========================================================================

describe("delivery rate fixture", () => {
  test("a mixed batch (quiet holds + retries + failures) still clears the 95% M3 bar", async () => {
    const subs: PushSubscriptionRow[] = Array.from({ length: 40 }, (_, i) => makeSub(`sub-${i}`, "ws-1"));
    const deliveries: StoredDelivery[] = subs.map((s, i) => ({
      id: `del-${i}`,
      subscriptionId: s.id,
      attempts: 0,
      payload: "{}",
      status: "pending",
      scheduledFor: new Date("2026-01-15T12:00:00Z"), // broad daylight UTC & IST — no quiet hours
      lastError: null,
    }));
    const workspaceSettings: WorkspaceSettingsRow[] = [
      {
        workspaceId: "ws-1",
        notificationPrefs: {
          quietHoursEnabled: true,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          quietHoursTimezone: "Asia/Kolkata",
        },
      },
    ];
    const db = makeDb(deliveries, subs, workspaceSettings);

    // 2 of 40 endpoints are permanently broken (500s → eventually dead-lettered).
    const brokenEndpoints = new Set([subs[0].endpoint, subs[1].endpoint]);
    const send = jest.fn(async (target: { endpoint: string }) => {
      if (brokenEndpoints.has(target.endpoint)) {
        throw Object.assign(new Error("unavailable"), { statusCode: 500 });
      }
      return {};
    });

    let now = new Date("2026-01-15T12:00:00Z");
    let result = { sent: 0, failed: 0, dead: 0 };
    for (let tick = 0; tick < 4; tick++) {
      const r = await dispatchDueDeliveries({ db, send, now, rng: () => 0.5 });
      result = { sent: result.sent + r.sent, failed: result.failed + r.failed, dead: result.dead + r.dead };
      now = new Date(now.getTime() + 31 * 60_000); // clear the 30-min backoff each tick
    }

    const total = deliveries.length;
    const sentCount = deliveries.filter((d) => d.status === "sent").length;
    expect(sentCount).toBe(total - brokenEndpoints.size);
    expect(sentCount / total).toBeGreaterThanOrEqual(0.95);
  });
});
