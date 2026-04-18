/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Notification Settings UI Contract Tests
 * ═══════════════════════════════════════════════════════════════════
 *
 * Requirements Traceability:
 *   US-SETTINGS-001  Notification settings section on settings page
 *   US-SETTINGS-002  NotificationSettings component (three toggles)
 *   US-SETTINGS-003  Push subscription lifecycle on master toggle
 *   US-SETTINGS-004  Service worker push event handler
 *
 * Environment: Node (Jest), file-based source analysis
 */

import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========================================================================
// TC-SETTINGS-001: NotificationSettings component contract
// Priority: HIGH | US-SETTINGS-002
// =========================================================================

describe("NotificationSettings component contract", () => {
  const src = readComponent("components/settings/NotificationSettings.tsx");

  test("TC-SETTINGS-001-01: exports NotificationSettings", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+NotificationSettings/);
  });

  test("TC-SETTINGS-001-02: has evening reminder toggle", () => {
    expect(src).toContain("eveningReminder");
  });

  test("TC-SETTINGS-001-03: has weekly digest toggle", () => {
    expect(src).toContain("weeklyDigest");
  });

  test("TC-SETTINGS-001-04: has budget alerts toggle", () => {
    expect(src).toContain("budgetAlerts");
  });

  test("TC-SETTINGS-001-05: has time picker for evening reminder", () => {
    expect(src).toContain("eveningReminderTime");
    expect(src).toContain('type="time"');
  });

  test("TC-SETTINGS-001-06: handles notification permission denied state", () => {
    expect(src).toContain("denied");
  });

  test("TC-SETTINGS-001-07: checks for notification API support", () => {
    expect(src).toMatch(/Notification.*undefined|notification.*supported/i);
  });

  test("TC-SETTINGS-001-08: uses DEFAULT_PREFS fallback", () => {
    expect(src).toContain("DEFAULT_PREFS");
  });

  test("TC-SETTINGS-001-09: calls updateSettings on toggle change", () => {
    expect(src).toContain("updateSettings");
  });

  test("TC-SETTINGS-001-10: calls subscribeToPush / unsubscribeFromPush", () => {
    expect(src).toContain("subscribeToPush");
    expect(src).toContain("unsubscribeFromPush");
  });
});

// =========================================================================
// TC-SETTINGS-002: Settings page integration contract
// Priority: HIGH | US-SETTINGS-001
// =========================================================================

describe("Settings page notification integration", () => {
  const src = readComponent("app/settings/page.tsx");

  test("TC-SETTINGS-002-01: imports NotificationSettings", () => {
    expect(src).toContain("NotificationSettings");
  });

  test("TC-SETTINGS-002-02: has Bell icon import for header", () => {
    expect(src).toContain("Bell");
  });

  test("TC-SETTINGS-002-03: has Notifications accordion section", () => {
    expect(src).toContain("Notifications");
  });

  test("TC-SETTINGS-002-04: search index includes notifications entry", () => {
    expect(src).toMatch(/notification/i);
  });

  test("TC-SETTINGS-002-05: header toggle handles subscribeToPush", () => {
    expect(src).toContain("subscribeToPush");
    expect(src).toContain("unsubscribeFromPush");
  });

  test("TC-SETTINGS-002-06: uses spread defaults for notification prefs", () => {
    // const base = { ...defaults, ...settings.notificationPrefs }
    expect(src).toContain("settings.notificationPrefs");
  });
});

// =========================================================================
// TC-SETTINGS-003: pushSubscription module contract
// Priority: HIGH | US-PUSH-001
// =========================================================================

describe("pushSubscription module contract", () => {
  const src = readComponent("lib/pushSubscription.ts");

  test("TC-SETTINGS-003-01: exports subscribeToPush function", () => {
    expect(src).toMatch(/export\s+(async\s+)?function\s+subscribeToPush/);
  });

  test("TC-SETTINGS-003-02: exports unsubscribeFromPush function", () => {
    expect(src).toMatch(/export\s+(async\s+)?function\s+unsubscribeFromPush/);
  });

  test("TC-SETTINGS-003-03: exports isPushSubscribed function", () => {
    expect(src).toMatch(/export\s+(async\s+)?function\s+isPushSubscribed/);
  });

  test("TC-SETTINGS-003-04: fetches VAPID key from server", () => {
    expect(src).toContain("/api/push/vapid-key");
  });

  test("TC-SETTINGS-003-05: calls pushManager.subscribe with applicationServerKey", () => {
    expect(src).toContain("pushManager.subscribe");
    expect(src).toContain("applicationServerKey");
  });

  test("TC-SETTINGS-003-06: POSTs subscription to /api/push/subscribe", () => {
    expect(src).toContain("/api/push/subscribe");
    expect(src).toContain("POST");
  });

  test("TC-SETTINGS-003-07: DELETEs subscription via /api/push/subscribe", () => {
    expect(src).toContain("DELETE");
  });

  test("TC-SETTINGS-003-08: has urlBase64ToUint8Array helper", () => {
    expect(src).toContain("urlBase64ToUint8Array");
  });

  test("TC-SETTINGS-003-09: uses userVisibleOnly: true for push subscription", () => {
    expect(src).toContain("userVisibleOnly: true");
  });
});

// =========================================================================
// TC-SETTINGS-004: Service worker push handler contract
// Priority: HIGH | US-PUSH-001
// =========================================================================

describe("Service worker push handler contract", () => {
  const swSrc = fs.readFileSync(
    path.resolve(__dirname, "..", "..", "public", "sw.js"),
    "utf-8",
  );

  test("TC-SETTINGS-004-01: listens for push event", () => {
    expect(swSrc).toContain('addEventListener("push"');
  });

  test("TC-SETTINGS-004-02: parses push event data as JSON", () => {
    expect(swSrc).toMatch(/event\.data.*json/i);
  });

  test("TC-SETTINGS-004-03: calls showNotification", () => {
    expect(swSrc).toContain("showNotification");
  });

  test("TC-SETTINGS-004-04: listens for notificationclick event", () => {
    expect(swSrc).toContain('addEventListener("notificationclick"');
  });

  test("TC-SETTINGS-004-05: focuses or opens window on notification click", () => {
    expect(swSrc).toMatch(/clients.*openWindow|clients.*focus/);
  });

  test("TC-SETTINGS-004-06: does NOT contain old setInterval pattern", () => {
    expect(swSrc).not.toContain("setInterval");
  });

  test("TC-SETTINGS-004-07: does NOT contain old checkEveningReminder", () => {
    expect(swSrc).not.toContain("checkEveningReminder");
  });

  test("TC-SETTINGS-004-08: does NOT contain old notifPrefs storage logic", () => {
    expect(swSrc).not.toContain("persistNotifPrefs");
    expect(swSrc).not.toContain("restoreNotifPrefs");
  });
});

// =========================================================================
// TC-SETTINGS-005: Push API route contracts
// Priority: HIGH | US-PUSH-002, US-PUSH-003
// =========================================================================

describe("Push API route contracts", () => {
  const subscribeRoute = readComponent("app/api/push/subscribe/route.ts");
  const sendRoute = readComponent("app/api/push/send/route.ts");
  const vapidRoute = readComponent("app/api/push/vapid-key/route.ts");

  test("TC-SETTINGS-005-01: subscribe route exports POST handler", () => {
    expect(subscribeRoute).toMatch(/export\s+(async\s+)?function\s+POST/);
  });

  test("TC-SETTINGS-005-02: subscribe route exports DELETE handler", () => {
    expect(subscribeRoute).toMatch(/export\s+(async\s+)?function\s+DELETE/);
  });

  test("TC-SETTINGS-005-03: subscribe route uses Zod validation", () => {
    expect(subscribeRoute).toContain("z.object");
  });

  test("TC-SETTINGS-005-04: subscribe route checks auth", () => {
    expect(subscribeRoute).toMatch(/auth|token|session/i);
  });

  test("TC-SETTINGS-005-05: send route exports POST handler", () => {
    expect(sendRoute).toMatch(/export\s+(async\s+)?function\s+POST/);
  });

  test("TC-SETTINGS-005-06: send route validates cron secret", () => {
    expect(sendRoute).toContain("x-cron-secret");
  });

  test("TC-SETTINGS-005-07: send route uses webpush.sendNotification", () => {
    expect(sendRoute).toContain("sendNotification");
  });

  test("TC-SETTINGS-005-08: send route cleans stale 404/410 subscriptions", () => {
    expect(sendRoute).toMatch(/404|410/);
  });

  test("TC-SETTINGS-005-09: send route filters by notification time", () => {
    expect(sendRoute).toContain("notification_prefs");
  });

  test("TC-SETTINGS-005-10: vapid-key route exports GET handler", () => {
    expect(vapidRoute).toMatch(/export\s+(async\s+)?function\s+GET/);
  });

  test("TC-SETTINGS-005-11: vapid-key route returns VAPID_PUBLIC_KEY", () => {
    expect(vapidRoute).toContain("VAPID_PUBLIC_KEY");
  });
});

// =========================================================================
// TC-SETTINGS-006: useNotifications hook contract
// Priority: MEDIUM | Budget milestone alerts in-tab
// =========================================================================

describe("useNotifications hook contract", () => {
  const src = readComponent("hooks/useNotifications.ts");

  test("TC-SETTINGS-006-01: exports useNotifications as default or named", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+useNotifications/);
  });

  test("TC-SETTINGS-006-02: monitors budget usage percentage", () => {
    expect(src).toMatch(/budget|percent|milestone/i);
  });

  test("TC-SETTINGS-006-03: checks budgetAlerts pref before alerting", () => {
    expect(src).toContain("budgetAlerts");
  });

  test("TC-SETTINGS-006-04: uses subscribedRef to track state", () => {
    expect(src).toContain("subscribedRef");
  });
});

// =========================================================================
// TC-SETTINGS-007: Prisma schema — push subscription model
// Priority: HIGH | Database schema validation
// =========================================================================

describe("Prisma schema — PushSubscription model", () => {
  const schema = fs.readFileSync(
    path.resolve(__dirname, "..", "..", "prisma", "schema.prisma"),
    "utf-8",
  );

  test("TC-SETTINGS-007-01: PushSubscription model exists", () => {
    expect(schema).toContain("model PushSubscription");
  });

  test("TC-SETTINGS-007-02: endpoint field is unique", () => {
    // The model should have @unique on endpoint
    expect(schema).toMatch(/endpoint.*@unique|@unique.*endpoint/);
  });

  test("TC-SETTINGS-007-03: model has userId field", () => {
    expect(schema).toMatch(/userId.*String/);
  });

  test("TC-SETTINGS-007-04: model has workspaceId field", () => {
    expect(schema).toMatch(/workspaceId.*String/);
  });

  test("TC-SETTINGS-007-05: model has p256dh and auth key fields", () => {
    expect(schema).toContain("p256dh");
    expect(schema).toContain("auth");
  });

  test("TC-SETTINGS-007-06: WorkspaceSettings has notificationPrefs field", () => {
    expect(schema).toContain("notificationPrefs");
    expect(schema).toContain("notification_prefs");
  });
});

// =========================================================================
// TC-SETTINGS-008: Migration SQL contract
// Priority: MEDIUM | Ensures migration creates correct schema
// =========================================================================

describe("Push subscription migration SQL", () => {
  const sql = fs.readFileSync(
    path.resolve(__dirname, "..", "..", "prisma", "migrations", "010_push_subscriptions_notification_prefs.sql"),
    "utf-8",
  );

  test("TC-SETTINGS-008-01: creates push_subscriptions table", () => {
    expect(sql).toMatch(/CREATE TABLE.*push_subscriptions/i);
  });

  test("TC-SETTINGS-008-02: push_subscriptions has endpoint column", () => {
    expect(sql).toContain("endpoint");
  });

  test("TC-SETTINGS-008-03: push_subscriptions has unique constraint on endpoint", () => {
    expect(sql).toMatch(/UNIQUE.*endpoint|endpoint.*UNIQUE/i);
  });

  test("TC-SETTINGS-008-04: adds notification_prefs column to workspace_settings", () => {
    expect(sql).toMatch(/ALTER TABLE.*workspace_settings.*ADD.*notification_prefs/i);
  });

  test("TC-SETTINGS-008-05: notification_prefs is JSONB type", () => {
    expect(sql).toMatch(/jsonb/i);
  });
});
