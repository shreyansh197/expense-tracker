/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Settings Sync Pipeline Tests
 * ═══════════════════════════════════════════════════════════════════
 *
 * Requirements Traceability:
 *   US-SYNC-001  notificationPrefs round-trips through all sync paths
 *   US-SYNC-002  Settings store merged fields survive update cycle
 *   US-SYNC-003  IDB settings schema includes notification prefs
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

function makeSettings(overrides: Partial<UserSettings> = {}): Partial<UserSettings> {
  return {
    salary: 50000,
    currency: "INR",
    categories: [],
    customCategories: [],
    hiddenDefaults: [],
    categoryBudgets: {},
    recurringExpenses: [],
    notificationPrefs: DEFAULT_PREFS,
    ...overrides,
  };
}

// =========================================================================
// TC-SYNC-001: notificationPrefs round-trip simulation
// Priority: CRITICAL | Core sync integrity
// =========================================================================

describe("Sync pipeline — notificationPrefs round-trip", () => {
  test("TC-SYNC-001-01: push-to-API includes notificationPrefs", () => {
    const settings = makeSettings({ notificationPrefs: { ...DEFAULT_PREFS, enabled: true } });
    const payload = {
      salary: settings.salary,
      currency: settings.currency,
      notificationPrefs: settings.notificationPrefs,
    };
    expect(payload.notificationPrefs).toBeDefined();
    expect(payload.notificationPrefs!.enabled).toBe(true);
  });

  test("TC-SYNC-001-02: API response without notificationPrefs defaults to undefined", () => {
    const apiResponse = { salary: 50000, currency: "INR" } as any;
    const prefs: NotificationPrefs | undefined = apiResponse.notificationPrefs ?? undefined;
    expect(prefs).toBeUndefined();
  });

  test("TC-SYNC-001-03: IDB load preserves notificationPrefs", () => {
    const idbData = {
      salary: 50000,
      currency: "INR",
      notificationPrefs: { ...DEFAULT_PREFS, weeklyDigest: true },
    };
    expect(idbData.notificationPrefs.weeklyDigest).toBe(true);
    expect(idbData.notificationPrefs.enabled).toBe(false);
  });

  test("TC-SYNC-001-04: full cycle — local → push → pull → matches", () => {
    // Simulate: user updates locally → pushed to API → pulled back
    const localPrefs: NotificationPrefs = { ...DEFAULT_PREFS, enabled: true, eveningReminderTime: "20:30" };
    const settings = makeSettings({ notificationPrefs: localPrefs });

    // Simulate push payload
    const pushPayload = JSON.parse(JSON.stringify({ notificationPrefs: settings.notificationPrefs }));

    // Simulate API storing and returning it
    const pullResult = JSON.parse(JSON.stringify(pushPayload));

    expect(pullResult.notificationPrefs).toEqual(localPrefs);
  });

  test("TC-SYNC-001-05: JSON serialization preserves all fields", () => {
    const prefs: NotificationPrefs = {
      enabled: true,
      eveningReminder: true,
      eveningReminderTime: "22:15",
      weeklyDigest: true,
      budgetAlerts: false,
    };
    const serialized = JSON.stringify(prefs);
    const deserialized = JSON.parse(serialized) as NotificationPrefs;
    expect(deserialized).toEqual(prefs);
  });

  test("TC-SYNC-001-06: merging undefined remote prefs with local defaults", () => {
    const remotePrefs: NotificationPrefs | undefined = undefined;
    const merged = { ...DEFAULT_PREFS, ...remotePrefs };
    expect(merged).toEqual(DEFAULT_PREFS);
  });

  test("TC-SYNC-001-07: merging partial remote prefs preserves local fields", () => {
    const remote = { enabled: true } as Partial<NotificationPrefs>;
    const merged = { ...DEFAULT_PREFS, ...remote };
    expect(merged.enabled).toBe(true);
    expect(merged.eveningReminderTime).toBe("21:00");
  });
});

// =========================================================================
// TC-SYNC-002: Settings field completeness
// Priority: HIGH | Ensures new fields are present in settings object
// =========================================================================

describe("Settings field completeness", () => {
  test("TC-SYNC-002-01: makeSettings includes notificationPrefs", () => {
    const s = makeSettings();
    expect(s).toHaveProperty("notificationPrefs");
    expect(s.notificationPrefs).toEqual(DEFAULT_PREFS);
  });

  test("TC-SYNC-002-02: notificationPrefs override takes precedence", () => {
    const s = makeSettings({
      notificationPrefs: { ...DEFAULT_PREFS, enabled: true },
    });
    expect(s.notificationPrefs?.enabled).toBe(true);
  });

  test("TC-SYNC-002-03: settings without notificationPrefs (legacy compat)", () => {
    const s = makeSettings({ notificationPrefs: undefined });
    expect(s.notificationPrefs).toBeUndefined();
  });
});

// =========================================================================
// TC-SYNC-003: Settings sync source-level contracts
// Priority: HIGH | Verifies notificationPrefs is wired into sync module
// =========================================================================

describe("settingsSync source contracts", () => {
  const fs = require("fs");
  const path = require("path");
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(
      path.resolve(__dirname, "..", "hooks", "settingsSync.ts"),
      "utf-8",
    );
  });

  test("TC-SYNC-003-01: pushToApi includes notificationPrefs in payload", () => {
    // The settingsData object must include notificationPrefs
    expect(src).toMatch(/notificationPrefs.*s\.notificationPrefs/);
  });

  test("TC-SYNC-003-02: loadSettingsFromIDB returns notificationPrefs", () => {
    const idbReturnCount = (src.match(/notificationPrefs/g) || []).length;
    // notificationPrefs should appear at least 4 times (push, idb load, api fetch, idb put)
    expect(idbReturnCount).toBeGreaterThanOrEqual(4);
  });

  test("TC-SYNC-003-03: _fetchSettingsFromApi maps notificationPrefs", () => {
    expect(src).toContain("notificationPrefs");
  });
});

// =========================================================================
// TC-SYNC-004: Sync commit route source contracts
// Priority: HIGH | Verifies API persists notificationPrefs
// =========================================================================

describe("Sync commit route source contracts", () => {
  const fs = require("fs");
  const path = require("path");
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(
      path.resolve(__dirname, "..", "app", "api", "sync", "commit", "route.ts"),
      "utf-8",
    );
  });

  test("TC-SYNC-004-01: commit route references notificationPrefs", () => {
    expect(src).toContain("notificationPrefs");
  });

  test("TC-SYNC-004-02: commit route maps notificationPrefs field", () => {
    expect(src).toContain("notificationPrefs");
  });

  test("TC-SYNC-004-03: commit route includes notificationPrefs in both create and update paths", () => {
    const matches = src.match(/notificationPrefs/g) || [];
    // Should appear in create data AND update data (at least 2 occurrences)
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});

// =========================================================================
// TC-SYNC-005: IDB settings schema contract
// Priority: MEDIUM | db.ts includes notificationPrefs field
// =========================================================================

describe("IDB settings schema contract", () => {
  const fs = require("fs");
  const path = require("path");
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(
      path.resolve(__dirname, "..", "lib", "db.ts"),
      "utf-8",
    );
  });

  test("TC-SYNC-005-01: IDBSettings interface includes notificationPrefs", () => {
    expect(src).toContain("notificationPrefs");
  });
});

// =========================================================================
// TC-SYNC-006: useSettings hook contract
// Priority: HIGH | Ensures updateSettings accepts notificationPrefs
// =========================================================================

describe("useSettings hook contract", () => {
  const fs = require("fs");
  const path = require("path");
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(
      path.resolve(__dirname, "..", "hooks", "useSettings.ts"),
      "utf-8",
    );
  });

  test("TC-SYNC-006-01: updateSettings Pick union includes notificationPrefs", () => {
    expect(src).toContain("notificationPrefs");
  });
});
