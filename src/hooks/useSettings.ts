"use client";

/**
 * useSettings — thin facade hook that composes settingsStore and settingsSync.
 * All module-level state lives in settingsStore.ts.
 * All IDB/API sync logic lives in settingsSync.ts.
 */
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { onSyncPull } from "@/lib/syncEngine";
import type { UserSettings, CategoryMeta } from "@/types";
import {
  DEFAULT_SETTINGS,
  _settings,
  _setShared,
  _getSnapshot,
  _subscribe,
  _currentUserId,
  setCurrentUserId,
  loadSettings,
  saveLocal,
  storageKeyForUser,
} from "./settingsStore";
import {
  pushToApi,
  loadSettingsFromIDB,
  _fetchSettingsFromApi,
  _syncFromIDB,
} from "./settingsSync";

// ── Exports consumed by AuthProvider and other modules ──

export function switchSettingsUser(userId: string) {
  const changed = _currentUserId !== userId;
  setCurrentUserId(userId);
  if (changed) {
    const local = loadSettings(userId);
    console.log(`[settings:switchUser] userId=${userId.slice(0,8)}… changed=${changed} local.salary=${local.salary}`);
    _setShared(local);
  } else {
    console.log(`[settings:switchUser] userId=${userId.slice(0,8)}… changed=false, still syncing from IDB`);
  }
  _syncFromIDB();
}

export function clearSettingsForCurrentUser() {
  setCurrentUserId(null);
  _setShared(DEFAULT_SETTINGS);
}

// ── Hook ──

export function useSettings() {
  const settings = useSyncExternalStore(_subscribe, _getSnapshot, () => DEFAULT_SETTINGS);
  const loading = false;
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKeyForUser(_currentUserId)) === null;
  });

  // On mount: subscribe to sync engine pull notifications
  useEffect(() => {
    let lastHandlerPushAt = 0;
    const HANDLER_DEBOUNCE = 5_000;

    const unsubscribe = onSyncPull(() => {
      loadSettingsFromIDB().then(async (remote) => {
        const local = loadSettings(_currentUserId);
        const bestKnownSalary = Math.max(_settings.salary, local.salary);
        console.log(`[settings:onSyncPull] remote.salary=${remote?.salary ?? 'null'}, local.salary=${local.salary}, inMemory.salary=${_settings.salary}, best=${bestKnownSalary}`);

        const guardedPush = (s: UserSettings) => {
          const now = Date.now();
          if (now - lastHandlerPushAt < HANDLER_DEBOUNCE) {
            console.log(`[settings:onSyncPull] Skipping push — debounced (${now - lastHandlerPushAt}ms since last)`);
            return;
          }
          lastHandlerPushAt = now;
          pushToApi(s);
        };

        if ((!remote || remote.salary === 0) && bestKnownSalary === 0) {
          const apiSettings = await _fetchSettingsFromApi();
          if (apiSettings && apiSettings.salary > 0) {
            saveLocal(apiSettings);
            _setShared(apiSettings);
          }
          return;
        }

        if (!remote) return;

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

        const localTs = local.updatedAt || 0;
        const remoteTs = remote.updatedAt || 0;

        if (remoteTs > localTs) {
          // Remote is newer — take it as-is (pure LWW).
          // Do NOT merge collection fields here: mergeById cannot distinguish
          // "intentionally deleted" from "never added without tombstones,
          // causing deleted rules to be resurrected from stale local state.
          // Spread DEFAULT_SETTINGS first to ensure new fields survive.
          // Preserve sunsetTheme from current state if remote doesn't carry it.
          const merged = {
            ...DEFAULT_SETTINGS,
            ...remote,
            sunsetTheme: remote.sunsetTheme || _settings.sunsetTheme || false,
          };
          saveLocal(merged);
          _setShared(merged);
        } else if (localTs > 0 && localTs > remoteTs) {
          if (_settings.updatedAt < localTs) _setShared(local);
          guardedPush(local);
        } else {
          // Timestamps equal — use content hash tiebreaker
          const { settingsContentHash } = await import("./settingsStore");
          if (settingsContentHash(remote) !== settingsContentHash(local)) {
            // Content differs at the same timestamp. Prefer local over remote to
            // guard against an old cached app version that pushed settings without
            // newer fields (e.g. autoRules, monthlyBudgets), wiping them on the
            // server. Push local back to repair any server-side data loss.
            if (_settings.updatedAt < localTs) _setShared(local);
            guardedPush(local);
          } else if (remote.salary > 0 && local.salary === 0) {
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
    async (updates: Partial<Pick<UserSettings, "salary" | "currency" | "categories" | "customCategories" | "hiddenDefaults" | "categoryBudgets" | "recurringExpenses" | "savedFilters" | "goals" | "rolloverEnabled" | "rolloverHistory" | "monthlyBudgets" | "businessMode" | "revenueExpectations" | "businessTags" | "dashboardLayout" | "multiCurrencyEnabled" | "dismissedRecurringSuggestions" | "autoRules" | "achievements" | "activeChallenges" | "accentColor" | "sunsetTheme" | "notificationPrefs" | "quickTemplates">>) => {
      const next = { ..._settings, ...updates, updatedAt: Date.now() };
      saveLocal(next);
      _setShared(next);
      await pushToApi(next);
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
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(storageKeyForUser(_currentUserId));
    _setShared(DEFAULT_SETTINGS);
    setIsFirstVisit(true);
  }, []);

  return { settings, loading, isFirstVisit, updateSettings, addCategory, deleteCategory, markOnboarded, resetSettings };
}
