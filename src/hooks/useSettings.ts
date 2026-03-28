"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SALARY } from "@/lib/constants";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { authFetch, getActiveWorkspaceId, isAuthenticated } from "@/lib/authClient";
import { makeIdempotencyKey } from "@/lib/syncClient";
import { fetchSyncData, invalidateSyncCache } from "@/lib/syncFetch";
import { supabase } from "@/lib/supabase";
import type { UserSettings, CategoryMeta } from "@/types";

const STORAGE_KEY_BASE = "expense-tracker-settings";
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

  await authFetch("/api/sync/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceId: wid,
      mutations: [{
        table: "workspace_settings",
        operation: "upsert",
        data: {
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
        },
        idempotencyKey: makeIdempotencyKey(),
      }],
    }),
  });
}

/** Fetch settings from API */
async function fetchSettingsFromApi(): Promise<UserSettings | null> {
  const wid = getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return null;

  try {
    const data = await fetchSyncData(wid) as Record<string, unknown>;
    const changes = data.changes as Record<string, unknown> | undefined;
    const s = changes?.settings as Record<string, unknown> | null;
    if (!s) return null;

    return {
      salary: Number(s.salary),
      currency: s.currency as string,
      categories: (s.categories as string[]) || DEFAULT_CATEGORIES,
      customCategories: (s.customCategories as CategoryMeta[]) || [],
      hiddenDefaults: (s.hiddenDefaults as string[]) || [],
      categoryBudgets: (s.categoryBudgets as Record<string, number>) ?? {},
      recurringExpenses: (s.recurringExpenses as UserSettings["recurringExpenses"]) ?? [],
      savedFilters: (s.savedFilters as UserSettings["savedFilters"]) ?? [],
      goals: (s.goals as UserSettings["goals"]) ?? [],
      rolloverEnabled: (s.rolloverEnabled as boolean) ?? false,
      rolloverHistory: (s.rolloverHistory as Record<string, number>) ?? {},
      businessMode: (s.businessMode as boolean) ?? false,
      revenueExpectations: (s.revenueExpectations as UserSettings["revenueExpectations"]) ?? [],
      businessTags: (s.businessTags as string[]) ?? [],
      createdAt: Date.now(),
      updatedAt: new Date(s.updatedAt as string).getTime(),
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

/** Fetch from API and merge — always called with _currentUserId already set. */
function _syncFromApi() {
  // Capture userId at call time so the async callback uses the right key
  // even if _currentUserId changes (e.g. logout) before the fetch resolves.
  const userIdAtCallTime = _currentUserId;
  if (!userIdAtCallTime) return; // Not logged in — skip

  fetchSettingsFromApi().then((remote) => {
    // Bail out if user has logged out or switched accounts while fetch was in-flight
    if (_currentUserId !== userIdAtCallTime) return;

    if (!remote) {
      // No remote row yet — do NOT push here; we might push stale default state.
      // The DB row will be created when the user explicitly sets settings.
      return;
    }
    const localTs = _settings.updatedAt || 0;
    const remoteTs = remote.updatedAt || 0;
    if (remoteTs >= localTs) {
      // Prefer remote — but never overwrite a valid local salary with remote salary=0.
      // This guards against a bad DB state (e.g. from markOnboarded pushing defaults).
      if (remote.salary === 0 && _settings.salary > 0) {
        // Remote has been reset but local is intact — restore DB from local.
        if (localTs > 0) pushToApi(_settings);
        return;
      }
      localStorage.setItem(storageKeyForUser(userIdAtCallTime), JSON.stringify(remote));
      _setShared(remote);
    } else {
      // Local is newer — push to remote to keep DB in sync.
      if (localTs > 0) pushToApi(_settings);
    }
  }).catch(() => { /* ignore network errors */ });
}

export function switchSettingsUser(userId: string) {
  // Skip if already set to this user — prevents double API sync from
  // AuthProvider's useEffect firing after explicit login already handled it.
  if (_currentUserId === userId) return;
  _currentUserId = userId;
  const local = loadSettings(userId);
  _setShared(local);
  // Sync from API — _currentUserId is captured inside _syncFromApi so it's safe.
  _syncFromApi();
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

  // On mount: subscribe to realtime workspace settings changes only.
  // API sync is handled by switchSettingsUser (called from AuthProvider) which
  // guarantees _currentUserId is set before the fetch resolves — no race condition.
  useEffect(() => {
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const channel = supabase
      .channel("settings-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_settings", filter: `workspace_id=eq.${wid}` },
        () => {
          // On realtime change, re-fetch from API
          invalidateSyncCache();
          fetchSettingsFromApi().then((remote) => {
            if (remote && remote.updatedAt > _settings.updatedAt) {
              saveLocal(remote);
              _setShared(remote);
            }
          });
        }
      )
      .subscribe();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        invalidateSyncCache();
        fetchSettingsFromApi().then((remote) => {
          if (remote && remote.updatedAt > _settings.updatedAt) {
            saveLocal(remote);
            _setShared(remote);
          }
        });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<UserSettings, "salary" | "currency" | "categories" | "customCategories" | "hiddenDefaults" | "categoryBudgets" | "recurringExpenses" | "savedFilters" | "goals" | "rolloverEnabled" | "rolloverHistory" | "businessMode" | "revenueExpectations" | "businessTags">>) => {
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
