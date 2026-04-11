/**
 * Settings sync — handles IDB read/write and API push/fetch.
 * Extracted from useSettings.ts for separation of concerns.
 */
import { getActiveWorkspaceId, isAuthenticated, authFetch } from "@/lib/authClient";
import { db } from "@/lib/db";
import {
  makeIdempotencyKey,
  enqueueMutation,
  trySyncPush,
} from "@/lib/syncEngine";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import type { UserSettings } from "@/types";
import {
  _settings,
  _setShared,
  _currentUserId,
  loadSettings,
  saveLocal,
  storageKeyForUser,
} from "./settingsStore";

/** Push settings via sync/commit API — never pushes unmodified defaults */
export async function pushToApi(s: UserSettings) {
  if (s.updatedAt === 0) return;
  const wid = getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return;

  const settingsData = {
    salary: s.salary,
    currency: s.currency,
    categories: s.categories,
    customCategories: s.customCategories,
    hiddenDefaults: s.hiddenDefaults,
    categoryBudgets: s.categoryBudgets || {},
    recurringExpenses: s.recurringExpenses || [],
    savedFilters: s.savedFilters || [],
    goals: s.goals || [],
    rolloverEnabled: s.rolloverEnabled ?? false,
    rolloverHistory: s.rolloverHistory || {},
    monthlyBudgets: s.monthlyBudgets || {},
    businessMode: s.businessMode ?? false,
    revenueExpectations: s.revenueExpectations || [],
    businessTags: s.businessTags || [],
    dashboardLayout: s.dashboardLayout || undefined,
    multiCurrencyEnabled: s.multiCurrencyEnabled ?? false,
    dismissedRecurringSuggestions: s.dismissedRecurringSuggestions ?? [],
    autoRules: s.autoRules ?? [],
    achievements: s.achievements ?? [],
    accentColor: s.accentColor,
  };

  await db.settings.put({
    workspaceId: wid,
    ...settingsData,
    updatedAt: s.updatedAt,
  });

  await enqueueMutation({
    table: "workspace_settings",
    operation: "upsert",
    data: settingsData,
    idempotencyKey: makeIdempotencyKey(),
  }, wid);

  trySyncPush(wid);
}

/** Load settings from IDB (populated by sync engine pulls) */
export async function loadSettingsFromIDB(): Promise<UserSettings | null> {
  const wid = getActiveWorkspaceId();
  if (!wid) return null;

  try {
    const s = await db.settings.get(wid);
    if (!s) return null;

    return {
      salary: s.salary,
      currency: s.currency,
      categories: s.categories || DEFAULT_CATEGORIES,
      customCategories: s.customCategories || [],
      hiddenDefaults: s.hiddenDefaults || [],
      categoryBudgets: s.categoryBudgets ?? {},
      recurringExpenses: s.recurringExpenses ?? [],
      savedFilters: s.savedFilters ?? [],
      goals: s.goals ?? [],
      rolloverEnabled: s.rolloverEnabled ?? false,
      rolloverHistory: s.rolloverHistory ?? {},
      monthlyBudgets: s.monthlyBudgets ?? {},
      businessMode: s.businessMode ?? false,
      revenueExpectations: s.revenueExpectations ?? [],
      businessTags: s.businessTags ?? [],
      dashboardLayout: s.dashboardLayout,
      multiCurrencyEnabled: s.multiCurrencyEnabled ?? false,
      dismissedRecurringSuggestions: s.dismissedRecurringSuggestions ?? [],
      autoRules: s.autoRules ?? [],
      achievements: s.achievements ?? [],
      accentColor: s.accentColor,
      createdAt: Date.now(),
      updatedAt: s.updatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Failsafe: directly fetch settings from the API when IDB + localStorage
 * both have default/empty settings.
 */
let _directFetchDone = false;
export async function _fetchSettingsFromApi(): Promise<UserSettings | null> {
  if (_directFetchDone) return null;

  const wid = getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return null;

  _directFetchDone = true;

  try {
    console.log(`[settings:apiFetch] Fetching settings directly from API for workspace=${wid.slice(0,8)}…`);
    const res = await authFetch(`/api/sync/changes?workspaceId=${encodeURIComponent(wid)}&since=1970-01-01T00:00:00.000Z`);
    if (!res.ok) { console.log(`[settings:apiFetch] HTTP ${res.status}`); return null; }

    const data = await res.json();
    if (!data.changes?.settings) { console.log(`[settings:apiFetch] No settings in response`); return null; }

    const s = data.changes.settings;
    console.log(`[settings:apiFetch] Got settings: salary=${s.salary}, updatedAt=${s.updatedAt}`);
    const settings: UserSettings = {
      salary: Number(s.salary) || 0,
      currency: s.currency || "INR",
      categories: s.categories || DEFAULT_CATEGORIES,
      customCategories: s.customCategories || [],
      hiddenDefaults: s.hiddenDefaults || [],
      categoryBudgets: s.categoryBudgets ?? {},
      recurringExpenses: s.recurringExpenses ?? [],
      savedFilters: s.savedFilters ?? [],
      goals: s.goals ?? [],
      rolloverEnabled: s.rolloverEnabled ?? false,
      rolloverHistory: s.rolloverHistory ?? {},
      monthlyBudgets: s.monthlyBudgets ?? {},
      businessMode: s.businessMode ?? false,
      revenueExpectations: s.revenueExpectations ?? [],
      businessTags: s.businessTags ?? [],
      dashboardLayout: s.dashboardLayout ?? undefined,
      multiCurrencyEnabled: s.multiCurrencyEnabled ?? false,
      dismissedRecurringSuggestions: s.dismissedRecurringSuggestions ?? [],
      autoRules: s.autoRules ?? [],
      achievements: s.achievements ?? [],
      accentColor: s.accentColor ?? undefined,
      createdAt: Date.now(),
      updatedAt: new Date(s.updatedAt).getTime(),
    };

    await db.settings.put({
      workspaceId: wid,
      salary: settings.salary,
      currency: settings.currency,
      categories: settings.categories,
      customCategories: settings.customCategories,
      hiddenDefaults: settings.hiddenDefaults,
      categoryBudgets: settings.categoryBudgets ?? {},
      recurringExpenses: settings.recurringExpenses ?? [],
      savedFilters: settings.savedFilters ?? [],
      goals: settings.goals ?? [],
      rolloverEnabled: settings.rolloverEnabled ?? false,
      rolloverHistory: settings.rolloverHistory ?? {},
      monthlyBudgets: settings.monthlyBudgets ?? {},
      businessMode: settings.businessMode ?? false,
      revenueExpectations: settings.revenueExpectations ?? [],
      businessTags: settings.businessTags ?? [],
      dashboardLayout: settings.dashboardLayout,
      multiCurrencyEnabled: settings.multiCurrencyEnabled ?? false,
      dismissedRecurringSuggestions: settings.dismissedRecurringSuggestions ?? [],
      autoRules: settings.autoRules ?? [],
      achievements: settings.achievements ?? [],
      accentColor: settings.accentColor,
      updatedAt: settings.updatedAt,
    });

    return settings;
  } catch {
    return null;
  }
}

/** Sync settings from IDB (populated by sync engine). */
export function _syncFromIDB() {
  const userIdAtCallTime = _currentUserId;
  if (!userIdAtCallTime) return;

  loadSettingsFromIDB().then(async (remote) => {
    if (_currentUserId !== userIdAtCallTime) return;

    const local = loadSettings(userIdAtCallTime);
    const bestKnownSalary = Math.max(_settings.salary, local.salary);
    console.log(`[settings:syncFromIDB] remote.salary=${remote?.salary ?? 'null'}, local.salary=${local.salary}, inMemory.salary=${_settings.salary}, best=${bestKnownSalary}`);

    if ((!remote || remote.salary === 0) && bestKnownSalary === 0) {
      console.log(`[settings:syncFromIDB] All sources have salary=0, trying failsafe API fetch…`);
      const apiSettings = await _fetchSettingsFromApi();
      if (apiSettings && apiSettings.salary > 0 && _currentUserId === userIdAtCallTime) {
        saveLocal(apiSettings);
        _setShared(apiSettings);
      }
      return;
    }

    if (!remote) return;

    if (remote.salary === 0 && bestKnownSalary > 0) {
      const best = _settings.salary >= local.salary ? _settings : local;
      if (best.updatedAt > 0) pushToApi(best);
      if (_settings.salary < bestKnownSalary) {
        _setShared({ ...local, salary: bestKnownSalary });
      }
      return;
    }

    const localTs = local.updatedAt || 0;
    const remoteTs = remote.updatedAt || 0;

    if (remoteTs > localTs) {
      localStorage.setItem(storageKeyForUser(userIdAtCallTime), JSON.stringify(remote));
      _setShared(remote);
    } else if (localTs > remoteTs && localTs > 0) {
      if (_settings.updatedAt < localTs) _setShared(local);
      pushToApi(local);
    } else {
      // Timestamps equal — use content hash to detect actual differences
      const { settingsContentHash } = await import("./settingsStore");
      if (settingsContentHash(remote) !== settingsContentHash(local)) {
        // Content differs at same timestamp — prefer remote (server as source of truth)
        saveLocal(remote);
        _setShared(remote);
      }
      // Hashes match → already in sync, no action needed
    }
  }).catch(() => {});
}
