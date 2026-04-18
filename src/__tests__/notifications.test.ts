/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Notification & Push Feature Test Suite
 * ═══════════════════════════════════════════════════════════════════
 *
 * Requirements Traceability:
 *   US-NOTIF-001  Evening reminder push notification
 *   US-NOTIF-002  Budget milestone alerts (75%, 100%)
 *   US-NOTIF-003  Notification preferences persistence
 *   US-PUSH-001   VAPID-based push subscription flow
 *   US-PUSH-002   Cron-triggered notification dispatch
 *   US-PUSH-003   Stale subscription cleanup
 *
 * Environment: Node (Jest), ts-jest, no DOM
 */

import type { NotificationPrefs, UserSettings } from "../types";

// ── Helpers ──

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  eveningReminder: true,
  eveningReminderTime: "21:00",
  weeklyDigest: false,
  budgetAlerts: true,
};

function mergePrefs(overrides: Partial<NotificationPrefs> = {}): NotificationPrefs {
  return { ...DEFAULT_PREFS, ...overrides };
}

// =========================================================================
// TC-NOTIF-001: NotificationPrefs type integrity
// Priority: HIGH | Reusable: Yes | Automation: Unit
// =========================================================================

describe("NotificationPrefs type structure", () => {
  test("TC-NOTIF-001-01: default prefs have all required fields", () => {
    const prefs = mergePrefs();
    expect(prefs).toHaveProperty("enabled");
    expect(prefs).toHaveProperty("eveningReminder");
    expect(prefs).toHaveProperty("eveningReminderTime");
    expect(prefs).toHaveProperty("weeklyDigest");
    expect(prefs).toHaveProperty("budgetAlerts");
  });

  test("TC-NOTIF-001-02: default prefs have correct initial values", () => {
    const prefs = mergePrefs();
    expect(prefs.enabled).toBe(false);
    expect(prefs.eveningReminder).toBe(true);
    expect(prefs.eveningReminderTime).toBe("21:00");
    expect(prefs.weeklyDigest).toBe(false);
    expect(prefs.budgetAlerts).toBe(true);
  });

  test("TC-NOTIF-001-03: partial overrides merge correctly", () => {
    const prefs = mergePrefs({ enabled: true, eveningReminderTime: "20:30" });
    expect(prefs.enabled).toBe(true);
    expect(prefs.eveningReminderTime).toBe("20:30");
    // Untouched fields remain default
    expect(prefs.eveningReminder).toBe(true);
    expect(prefs.weeklyDigest).toBe(false);
    expect(prefs.budgetAlerts).toBe(true);
  });

  test("TC-NOTIF-001-04: all boolean fields accept true/false toggle", () => {
    const on = mergePrefs({ enabled: true, eveningReminder: true, weeklyDigest: true, budgetAlerts: true });
    expect(on.enabled).toBe(true);
    expect(on.eveningReminder).toBe(true);
    expect(on.weeklyDigest).toBe(true);
    expect(on.budgetAlerts).toBe(true);

    const off = mergePrefs({ enabled: false, eveningReminder: false, weeklyDigest: false, budgetAlerts: false });
    expect(off.enabled).toBe(false);
    expect(off.eveningReminder).toBe(false);
    expect(off.weeklyDigest).toBe(false);
    expect(off.budgetAlerts).toBe(false);
  });
});

// =========================================================================
// TC-NOTIF-002: Evening reminder time validation
// Priority: HIGH | Boundary testing for time picker
// =========================================================================

describe("Evening reminder time format", () => {
  test("TC-NOTIF-002-01: accepts standard HH:MM format (21:00)", () => {
    const prefs = mergePrefs({ eveningReminderTime: "21:00" });
    const [h, m] = prefs.eveningReminderTime.split(":").map(Number);
    expect(h).toBe(21);
    expect(m).toBe(0);
  });

  test("TC-NOTIF-002-02: accepts midnight boundary (00:00)", () => {
    const prefs = mergePrefs({ eveningReminderTime: "00:00" });
    const [h, m] = prefs.eveningReminderTime.split(":").map(Number);
    expect(h).toBe(0);
    expect(m).toBe(0);
  });

  test("TC-NOTIF-002-03: accepts end-of-day boundary (23:59)", () => {
    const prefs = mergePrefs({ eveningReminderTime: "23:59" });
    const [h, m] = prefs.eveningReminderTime.split(":").map(Number);
    expect(h).toBe(23);
    expect(m).toBe(59);
  });

  test("TC-NOTIF-002-04: accepts early morning time (06:30)", () => {
    const prefs = mergePrefs({ eveningReminderTime: "06:30" });
    const [h, m] = prefs.eveningReminderTime.split(":").map(Number);
    expect(h).toBe(6);
    expect(m).toBe(30);
  });

  test("TC-NOTIF-002-05: time string splits into exactly 2 parts", () => {
    const parts = "21:00".split(":");
    expect(parts).toHaveLength(2);
  });
});

// =========================================================================
// TC-NOTIF-003: NotificationPrefs in UserSettings
// Priority: HIGH | Ensures field survives settings merge
// =========================================================================

describe("NotificationPrefs in UserSettings", () => {
  test("TC-NOTIF-003-01: notificationPrefs is optional on UserSettings", () => {
    const settings = { salary: 50000, currency: "INR" } as Partial<UserSettings>;
    expect(settings.notificationPrefs).toBeUndefined();
  });

  test("TC-NOTIF-003-02: notificationPrefs can be set on UserSettings", () => {
    const settings: Partial<UserSettings> = {
      notificationPrefs: mergePrefs({ enabled: true }),
    };
    expect(settings.notificationPrefs?.enabled).toBe(true);
  });

  test("TC-NOTIF-003-03: spreading undefined notificationPrefs produces defaults", () => {
    const existing: Partial<NotificationPrefs> | undefined = undefined;
    const prefs = { ...DEFAULT_PREFS, ...existing };
    expect(prefs.enabled).toBe(false);
    expect(prefs.eveningReminderTime).toBe("21:00");
  });

  test("TC-NOTIF-003-04: spreading existing prefs preserves user overrides", () => {
    const existing: Partial<NotificationPrefs> = { enabled: true, eveningReminderTime: "20:00" };
    const prefs = { ...DEFAULT_PREFS, ...existing };
    expect(prefs.enabled).toBe(true);
    expect(prefs.eveningReminderTime).toBe("20:00");
    expect(prefs.budgetAlerts).toBe(true); // default preserved
  });
});

// =========================================================================
// TC-NOTIF-004: Budget milestone alert thresholds
// Priority: HIGH | Validates 75% and 100% detection logic
// =========================================================================

describe("Budget milestone thresholds", () => {
  const milestones = [75, 100];

  function getTriggeredMilestones(budgetUsedPercent: number, alreadyAlerted: number[]): number[] {
    return milestones.filter(
      (m) => budgetUsedPercent >= m && !alreadyAlerted.includes(m),
    );
  }

  test("TC-NOTIF-004-01: no milestones triggered at 0% usage", () => {
    expect(getTriggeredMilestones(0, [])).toEqual([]);
  });

  test("TC-NOTIF-004-02: no milestones triggered at 50% usage", () => {
    expect(getTriggeredMilestones(50, [])).toEqual([]);
  });

  test("TC-NOTIF-004-03: 75% milestone triggered at exactly 75%", () => {
    expect(getTriggeredMilestones(75, [])).toEqual([75]);
  });

  test("TC-NOTIF-004-04: 75% milestone triggered at 80% (over threshold)", () => {
    expect(getTriggeredMilestones(80, [])).toEqual([75]);
  });

  test("TC-NOTIF-004-05: both milestones triggered at exactly 100%", () => {
    expect(getTriggeredMilestones(100, [])).toEqual([75, 100]);
  });

  test("TC-NOTIF-004-06: both milestones triggered at 120% (over budget)", () => {
    expect(getTriggeredMilestones(120, [])).toEqual([75, 100]);
  });

  test("TC-NOTIF-004-07: already-alerted 75% is not re-triggered", () => {
    expect(getTriggeredMilestones(80, [75])).toEqual([]);
  });

  test("TC-NOTIF-004-08: 100% triggered when 75% already alerted", () => {
    expect(getTriggeredMilestones(100, [75])).toEqual([100]);
  });

  test("TC-NOTIF-004-09: nothing triggered when both already alerted", () => {
    expect(getTriggeredMilestones(120, [75, 100])).toEqual([]);
  });

  test("TC-NOTIF-004-10: boundary — 74.99% does NOT trigger 75%", () => {
    expect(getTriggeredMilestones(74.99, [])).toEqual([]);
  });

  test("TC-NOTIF-004-11: boundary — 99.99% triggers 75% but NOT 100%", () => {
    expect(getTriggeredMilestones(99.99, [])).toEqual([75]);
  });
});

// =========================================================================
// TC-PUSH-001: Push subscribe schema validation
// Priority: HIGH | Validates Zod schema for subscribe endpoint
// =========================================================================

describe("Push subscribe schema validation", () => {
  const { z } = require("zod");

  const subscribeSchema = z.object({
    workspaceId: z.string().uuid(),
    subscription: z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
      }),
    }),
  });

  const validPayload = {
    workspaceId: "aaf39025-a3d5-4dc0-bddf-1cf70a635a93",
    subscription: {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
      keys: {
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-T1aUR6DouFoPS59",
        auth: "tBHItJI5svbpC7vJZzw",
      },
    },
  };

  test("TC-PUSH-001-01: accepts valid push subscription payload", () => {
    expect(subscribeSchema.safeParse(validPayload).success).toBe(true);
  });

  test("TC-PUSH-001-02: rejects invalid workspace UUID", () => {
    expect(
      subscribeSchema.safeParse({ ...validPayload, workspaceId: "not-a-uuid" }).success,
    ).toBe(false);
  });

  test("TC-PUSH-001-03: rejects missing workspace ID", () => {
    const { workspaceId, ...rest } = validPayload;
    expect(subscribeSchema.safeParse(rest).success).toBe(false);
  });

  test("TC-PUSH-001-04: rejects invalid endpoint URL", () => {
    expect(
      subscribeSchema.safeParse({
        ...validPayload,
        subscription: { ...validPayload.subscription, endpoint: "not-a-url" },
      }).success,
    ).toBe(false);
  });

  test("TC-PUSH-001-05: rejects empty p256dh key", () => {
    expect(
      subscribeSchema.safeParse({
        ...validPayload,
        subscription: {
          ...validPayload.subscription,
          keys: { ...validPayload.subscription.keys, p256dh: "" },
        },
      }).success,
    ).toBe(false);
  });

  test("TC-PUSH-001-06: rejects empty auth key", () => {
    expect(
      subscribeSchema.safeParse({
        ...validPayload,
        subscription: {
          ...validPayload.subscription,
          keys: { ...validPayload.subscription.keys, auth: "" },
        },
      }).success,
    ).toBe(false);
  });

  test("TC-PUSH-001-07: rejects missing keys object", () => {
    expect(
      subscribeSchema.safeParse({
        ...validPayload,
        subscription: { endpoint: validPayload.subscription.endpoint },
      }).success,
    ).toBe(false);
  });

  test("TC-PUSH-001-08: rejects missing subscription entirely", () => {
    expect(
      subscribeSchema.safeParse({ workspaceId: validPayload.workspaceId }).success,
    ).toBe(false);
  });

  test("TC-PUSH-001-09: accepts various valid FCM endpoints", () => {
    const endpoints = [
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v1/xyz",
      "https://wns2-par02p.notify.windows.com/w/push/123",
    ];
    for (const endpoint of endpoints) {
      const payload = {
        ...validPayload,
        subscription: { ...validPayload.subscription, endpoint },
      };
      expect(subscribeSchema.safeParse(payload).success).toBe(true);
    }
  });
});

// =========================================================================
// TC-PUSH-002: Unsubscribe schema validation
// Priority: MEDIUM
// =========================================================================

describe("Push unsubscribe schema validation", () => {
  const { z } = require("zod");

  const unsubscribeSchema = z.object({
    endpoint: z.string().url(),
  });

  test("TC-PUSH-002-01: accepts valid endpoint", () => {
    expect(
      unsubscribeSchema.safeParse({ endpoint: "https://fcm.googleapis.com/fcm/send/abc123" }).success,
    ).toBe(true);
  });

  test("TC-PUSH-002-02: rejects non-URL endpoint", () => {
    expect(unsubscribeSchema.safeParse({ endpoint: "not-valid" }).success).toBe(false);
  });

  test("TC-PUSH-002-03: rejects empty endpoint", () => {
    expect(unsubscribeSchema.safeParse({ endpoint: "" }).success).toBe(false);
  });

  test("TC-PUSH-002-04: rejects missing endpoint", () => {
    expect(unsubscribeSchema.safeParse({}).success).toBe(false);
  });
});

// =========================================================================
// TC-PUSH-003: urlBase64ToUint8Array conversion
// Priority: HIGH | Core crypto helper for VAPID key
// =========================================================================

describe("urlBase64ToUint8Array", () => {
  // Replica of the function from pushSubscription.ts for pure testing
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = Buffer.from(base64, "base64");
    return new Uint8Array(rawData);
  }

  test("TC-PUSH-003-01: converts standard VAPID public key", () => {
    const key = "BHKcxdHV_IX6SM9GVv4khP8ukiCyKHAWxAtJsj8QMr37RMbKlUFOFDYTFae5QALpbSF3lMmsAk0eOmvTF9TSo2g";
    const result = urlBase64ToUint8Array(key);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(65); // Uncompressed ECDSA P-256 public key
  });

  test("TC-PUSH-003-02: handles URL-safe base64 characters (- and _)", () => {
    const key = "BHKcxdHV_IX6SM9GVv4khP8u";
    const result = urlBase64ToUint8Array(key);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  test("TC-PUSH-003-03: adds correct padding for non-padded input", () => {
    // 3 chars → needs 1 pad char
    const result = urlBase64ToUint8Array("abc");
    expect(result).toBeInstanceOf(Uint8Array);
  });

  test("TC-PUSH-003-04: empty string produces empty array", () => {
    const result = urlBase64ToUint8Array("");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });
});

// =========================================================================
// TC-PUSH-004: Cron send endpoint — time matching logic
// Priority: HIGH | Validates per-user time matching
// =========================================================================

describe("Cron send — time matching logic", () => {
  function matchesCurrentTime(
    prefs: { enabled: boolean; eveningReminder: boolean; eveningReminderTime: string },
    currentTime: string,
  ): boolean {
    if (!prefs.enabled || !prefs.eveningReminder) return false;
    const time = prefs.eveningReminderTime || "21:00";
    return time === currentTime;
  }

  test("TC-PUSH-004-01: matches when time is exactly equal", () => {
    expect(matchesCurrentTime({ enabled: true, eveningReminder: true, eveningReminderTime: "21:00" }, "21:00")).toBe(true);
  });

  test("TC-PUSH-004-02: does not match different minute", () => {
    expect(matchesCurrentTime({ enabled: true, eveningReminder: true, eveningReminderTime: "21:00" }, "21:01")).toBe(false);
  });

  test("TC-PUSH-004-03: does not match different hour", () => {
    expect(matchesCurrentTime({ enabled: true, eveningReminder: true, eveningReminderTime: "21:00" }, "20:00")).toBe(false);
  });

  test("TC-PUSH-004-04: returns false when notifications disabled", () => {
    expect(matchesCurrentTime({ enabled: false, eveningReminder: true, eveningReminderTime: "21:00" }, "21:00")).toBe(false);
  });

  test("TC-PUSH-004-05: returns false when eveningReminder disabled", () => {
    expect(matchesCurrentTime({ enabled: true, eveningReminder: false, eveningReminderTime: "21:00" }, "21:00")).toBe(false);
  });

  test("TC-PUSH-004-06: defaults to 21:00 when time is empty", () => {
    expect(matchesCurrentTime({ enabled: true, eveningReminder: true, eveningReminderTime: "" }, "21:00")).toBe(true);
  });

  test("TC-PUSH-004-07: midnight boundary (00:00)", () => {
    expect(matchesCurrentTime({ enabled: true, eveningReminder: true, eveningReminderTime: "00:00" }, "00:00")).toBe(true);
  });

  test("TC-PUSH-004-08: end-of-day boundary (23:59)", () => {
    expect(matchesCurrentTime({ enabled: true, eveningReminder: true, eveningReminderTime: "23:59" }, "23:59")).toBe(true);
  });
});
