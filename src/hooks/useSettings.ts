"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SALARY } from "@/lib/constants";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { getActiveWorkspaceId, isAuthenticated, authFetch } from "@/lib/authClient";
import { db } from "@/lib/db";
import {
  makeIdempotencyKey,
  enqueueMutation,
  trySyncPush,
  onSyncPull,
} from "@/lib/syncEngine";
import type { UserSettings, CategoryMeta } from "@/types";

const STORAGE_KEY_BASE = "expenstream-settings";
function storageKeyForUser(userId: string | null): string {
  return userId ? `${STORAGE_KEY_BASE}-${userId}` : STORAGE_KEY_BASE;
}
let _currentUserId: string | null = null;

const DEFAULT_SETTINGS: UserSettings = {
  salary: DEFAULT_SALARY,
  currency: "INR",
  categories: DEFAULT_CATEGORIES,
  customCategories: [],
  hiddenDefaults: [],
  categoryBudgets: {},
  recurringExpenses: [],
  savedFilters: [],
  goals: [],
  rolloverEnabled: false,
  rolloverHistory: {},
  monthlyBudgets: {},
  businessMode: false,
  revenueExpectations: [],
  businessTags: [],
  multiCurrencyEnabled: false,
  dismissedRecurringSuggestions: [],
  autoRules: [],
  createdAt: 0,
  updatedAt: 0,
};

// ── Shared module-level state so ALL useSettings() consumers stay in sync ──
let _settings: UserSettings = DEFAULT_SETTINGS;
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

function _setShared(next: UserSettings) {
  if (next.salary !== _settings.salary) {
    console.log(`[settings] salary changed: ${_settings.salary} → ${next.salary} (updatedAt=${next.updatedAt})`);
  }
  _settings = next;
  _notify();
}

function _getSnapshot(): UserSettings {
  return _settings;
}

function _subscribe(cb: () => void): () => void {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

function loadSettings(userId: string | null = _currentUserId): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const key = storageKeyForUser(userId);
    const raw = localStorage.getItem(key);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };

    // Migration: check old unscoped key (pre user-scoped key change)
    if (userId !== null) {
      const oldRaw = localStorage.getItem(STORAGE_KEY_BASE);
      if (oldRaw) {
        const parsed = JSON.parse(oldRaw);
        if (parsed.salary > 0 || parsed.updatedAt > 0) {
          localStorage.setItem(key, oldRaw);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveLocal(s: UserSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKeyForUser(_currentUserId), JSON.stringify(s));
}

/** Push settings via sync/commit API — never pushes unmodified defaults */
async function pushToApi(s: UserSettings) {
  // Guard: never push default/unmodified settings to prevent overwriting real data
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
  };

  // Persist to IDB
  await db.settings.put({
    workspaceId: wid,
    ...settingsData,
    updatedAt: s.updatedAt,
  });

  // Enqueue mutation and push
  await enqueueMutation({
    table: "workspace_settings",
    operation: "upsert",
    data: settingsData,
    idempotencyKey: makeIdempotencyKey(),
  }, wid);

  trySyncPush(wid);
}

/** Load settings from IDB (populated by sync engine pulls) */
async function loadSettingsFromIDB(): Promise<UserSettings | null> {
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
      createdAt: Date.now(),
      updatedAt: s.updatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Failsafe: directly fetch settings from the API when IDB + localStorage
 * both have default/empty settings. This bypasses the sync cursor entirely.
 * Only runs once per session to avoid hammering the server.
 */
let _directFetchDone = false;
async function _fetchSettingsFromApi(): Promise<UserSettings | null> {
  if (_directFetchDone) return null;

  const wid = getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return null;

  // Only mark as done once we have a valid workspace and will attempt the fetch
  _directFetchDone = true;

  try {
    console.log(`[settings:apiFetch] Fetching settings directly from API for workspace=${wid.slice(0,8)}…`);
    // Fetch ALL changes (since=epoch) — the server returns settings if they exist
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
      createdAt: Date.now(),
      updatedAt: new Date(s.updatedAt).getTime(),
    };

    // Populate IDB so future sync pulls have data
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
      updatedAt: settings.updatedAt,
    });

    return settings;
  } catch {
    return null;
  }
}

// ── Module-level initialization (runs once when module loads) ──
if (typeof window !== "undefined") {
  // Read auth state from localStorage directly (no circular dependency)
  // to ensure settings load with the correct user-scoped key from the start.
  try {
    const authRaw = localStorage.getItem("expenstream-auth");
    const authState = authRaw ? JSON.parse(authRaw) : null;
    const userId = authState?.user?.id ?? null;
    _currentUserId = userId;
    const local = loadSettings(userId);
    console.log(`[settings:init] userId=${userId?.slice(0,8) ?? 'null'} local.salary=${local.salary} local.updatedAt=${local.updatedAt}`);
    _setShared(local);
  } catch {
    const local = loadSettings(null);
    _setShared(local);
  }
}

/** Sync settings from IDB (populated by sync engine). */
function _syncFromIDB() {
  const userIdAtCallTime = _currentUserId;
  if (!userIdAtCallTime) return;

  loadSettingsFromIDB().then(async (remote) => {
    if (_currentUserId !== userIdAtCallTime) return;

    // Failsafe: if IDB has no settings (or salary=0) and in-memory + localStorage
    // also have salary=0, directly fetch from the API. This handles the case where
    // the sync cursor wasn't cleared properly and the incremental pull returned 0 settings.
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

    // Never overwrite a known salary with 0
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
    } else if (localTs > 0) {
      if (_settings.updatedAt < localTs) _setShared(local);
      pushToApi(local);
    }
  }).catch(() => {});
}

export function switchSettingsUser(userId: string) {
  const changed = _currentUserId !== userId;
  _currentUserId = userId;
  if (changed) {
    const local = loadSettings(userId);
    console.log(`[settings:switchUser] userId=${userId.slice(0,8)}… changed=${changed} local.salary=${local.salary}`);
    _setShared(local);
  } else {
    console.log(`[settings:switchUser] userId=${userId.slice(0,8)}… changed=false, still syncing from IDB`);
  }
  // Always sync from IDB — even if userId was pre-set by module init,
  // IDB may have newer data from a previous sync session.
  _syncFromIDB();
}

export function clearSettingsForCurrentUser() {
  // Do NOT remove localStorage — it's already user-scoped, so no leakage risk.
  // Preserving it means the user's data loads instantly on next login without an API round-trip.
  // We only reset the in-memory state so nothing is visible while logged out.
  _currentUserId = null;
  _setShared(DEFAULT_SETTINGS);
}

export function useSettings() {
  const settings = useSyncExternalStore(_subscribe, _getSnapshot, () => DEFAULT_SETTINGS);
  const loading = false;
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKeyForUser(_currentUserId)) === null;
  });

  // On mount: subscribe to sync engine pull notifications.
  // When the sync engine pulls new data into IDB, we check if settings changed.
  // Guard: prevent push-pull-push cycle — if a push was triggered by this
  // handler recently, skip to avoid re-entry loops with the sync engine.
  useEffect(() => {
    let lastHandlerPushAt = 0;
    const HANDLER_DEBOUNCE = 5_000; // ms — don't push back within 5s of last handler push

    const unsubscribe = onSyncPull(() => {
      loadSettingsFromIDB().then(async (remote) => {
        // Gather all known sources of salary truth
        const local = loadSettings(_currentUserId);
        const bestKnownSalary = Math.max(_settings.salary, local.salary);
        console.log(`[settings:onSyncPull] remote.salary=${remote?.salary ?? 'null'}, local.salary=${local.salary}, inMemory.salary=${_settings.salary}, best=${bestKnownSalary}`);

        // Helper: guarded push that prevents re-entry loops
        const guardedPush = (s: UserSettings) => {
          const now = Date.now();
          if (now - lastHandlerPushAt < HANDLER_DEBOUNCE) {
            console.log(`[settings:onSyncPull] Skipping push — debounced (${now - lastHandlerPushAt}ms since last)`);
            return;
          }
          lastHandlerPushAt = now;
          pushToApi(s);
        };

        // Failsafe: if all sources have salary=0, fetch directly from API
        if ((!remote || remote.salary === 0) && bestKnownSalary === 0) {
          const apiSettings = await _fetchSettingsFromApi();
          if (apiSettings && apiSettings.salary > 0) {
            saveLocal(apiSettings);
            _setShared(apiSettings);
          }
          return;
        }

        if (!remote) return;

        // Never overwrite a known non-zero salary with 0
        if (remote.salary === 0 && bestKnownSalary > 0) {
          const best = _settings.salary >= local.salary ? _settings : local;
          if (best.updatedAt > 0) guardedPush(best);
          if (_settings.salary < bestKnownSalary) {
            const merged = { ...local, salary: bestKnownSalary };
            saveLocal(merged);
            _setShared(merged);
          }
          return;
        }

        // Remote has real data — compare timestamps
        const localTs = local.updatedAt || 0;
        const remoteTs = remote.updatedAt || 0;

        if (remoteTs > localTs) {
          // Remote is strictly newer — accept it
          saveLocal(remote);
          _setShared(remote);
        } else if (localTs > 0 && localTs > remoteTs) {
          // Local is newer — ensure in-memory matches and push
          if (_settings.updatedAt < localTs) _setShared(local);
          guardedPush(local);
        } else {
          // Same timestamp or both 0 — prefer whichever has real data
          if (remote.salary > 0 && local.salary === 0) {
            saveLocal(remote);
            _setShared(remote);
          } else if (localTs > 0 && _settings.updatedAt < localTs) {
            _setShared(local);
          }
        }
      });
    });

    return () => { unsubscribe(); };
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<UserSettings, "salary" | "currency" | "categories" | "customCategories" | "hiddenDefaults" | "categoryBudgets" | "recurringExpenses" | "savedFilters" | "goals" | "rolloverEnabled" | "rolloverHistory" | "monthlyBudgets" | "businessMode" | "revenueExpectations" | "businessTags" | "dashboardLayout" | "multiCurrencyEnabled" | "dismissedRecurringSuggestions" | "autoRules">>) => {
      const next = { ..._settings, ...updates, updatedAt: Date.now() };
      saveLocal(next);
      _setShared(next);
      pushToApi(next);
    },
    []
  );

  const addCategory = useCallback((cat: CategoryMeta) => {
    const next = {
      ..._settings,
      customCategories: [..._settings.customCategories, cat],
      categories: [..._settings.categories, cat.id],
      updatedAt: Date.now(),
    };
    saveLocal(next);
    _setShared(next);
    pushToApi(next);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    const isCustom = _settings.customCategories.some((c) => c.id === id);
    const next = {
      ..._settings,
      customCategories: _settings.customCategories.filter((c) => c.id !== id),
      categories: _settings.categories.filter((c) => c !== id),
      hiddenDefaults: isCustom ? _settings.hiddenDefaults : [...(_settings.hiddenDefaults || []), id],
      updatedAt: Date.now(),
    };
    saveLocal(next);
    _setShared(next);
    pushToApi(next);
  }, []);

  const markOnboarded = useCallback(() => {
    setIsFirstVisit(false);
    // Do NOT write to localStorage here.
    // Writing DEFAULT_SETTINGS (salary=0) with updatedAt=Date.now() gives it a
    // newer timestamp than the real DB data — local would then win the merge and
    // permanently show salary=0 for existing users logging in on a new device.
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(storageKeyForUser(_currentUserId));
    _setShared(DEFAULT_SETTINGS);
    setIsFirstVisit(true);
  }, []);

  return { settings, loading, isFirstVisit, updateSettings, addCategory, deleteCategory, markOnboarded, resetSettings };
}
