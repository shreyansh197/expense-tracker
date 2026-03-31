"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SALARY } from "@/lib/constants";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { authFetch, getActiveWorkspaceId, isAuthenticated } from "@/lib/authClient";
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
  businessMode: false,
  revenueExpectations: [],
  businessTags: [],
  multiCurrencyEnabled: false,
  dismissedRecurringSuggestions: [],
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
    businessMode: s.businessMode ?? false,
    revenueExpectations: s.revenueExpectations || [],
    businessTags: s.businessTags || [],
    dashboardLayout: s.dashboardLayout || undefined,
    multiCurrencyEnabled: s.multiCurrencyEnabled ?? false,
    dismissedRecurringSuggestions: s.dismissedRecurringSuggestions ?? [],
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
      businessMode: s.businessMode ?? false,
      revenueExpectations: s.revenueExpectations ?? [],
      businessTags: s.businessTags ?? [],
      dashboardLayout: s.dashboardLayout,
      multiCurrencyEnabled: s.multiCurrencyEnabled ?? false,
      dismissedRecurringSuggestions: s.dismissedRecurringSuggestions ?? [],
      createdAt: Date.now(),
      updatedAt: s.updatedAt,
    };
  } catch {
    return null;
  }
}

// ── Module-level initialization (runs once when module loads) ──
if (typeof window !== "undefined") {
  const local = loadSettings(null);
  _setShared(local);
}

/** Sync settings from IDB (populated by sync engine). */
function _syncFromIDB() {
  const userIdAtCallTime = _currentUserId;
  if (!userIdAtCallTime) return;

  loadSettingsFromIDB().then((remote) => {
    if (_currentUserId !== userIdAtCallTime) return;

    if (!remote) return;

    const localTs = _settings.updatedAt || 0;
    const remoteTs = remote.updatedAt || 0;
    if (remoteTs >= localTs) {
      if (remote.salary === 0 && _settings.salary > 0) {
        if (localTs > 0) pushToApi(_settings);
        return;
      }
      localStorage.setItem(storageKeyForUser(userIdAtCallTime), JSON.stringify(remote));
      _setShared(remote);
    } else {
      if (localTs > 0) pushToApi(_settings);
    }
  }).catch(() => {});
}

export function switchSettingsUser(userId: string) {
  if (_currentUserId === userId) return;
  _currentUserId = userId;
  const local = loadSettings(userId);
  _setShared(local);
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
  useEffect(() => {
    const unsubscribe = onSyncPull(() => {
      loadSettingsFromIDB().then((remote) => {
        if (remote && remote.updatedAt > _settings.updatedAt) {
          saveLocal(remote);
          _setShared(remote);
        }
      });
    });

    return () => { unsubscribe(); };
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<UserSettings, "salary" | "currency" | "categories" | "customCategories" | "hiddenDefaults" | "categoryBudgets" | "recurringExpenses" | "savedFilters" | "goals" | "rolloverEnabled" | "rolloverHistory" | "businessMode" | "revenueExpectations" | "businessTags" | "dashboardLayout" | "multiCurrencyEnabled" | "dismissedRecurringSuggestions">>) => {
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
