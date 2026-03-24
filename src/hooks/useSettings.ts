"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SALARY } from "@/lib/constants";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { authFetch, getActiveWorkspaceId, isAuthenticated } from "@/lib/authClient";
import { makeIdempotencyKey } from "@/lib/syncClient";
import { fetchSyncData } from "@/lib/syncFetch";
import { supabase } from "@/lib/supabase";
import type { UserSettings, CategoryMeta } from "@/types";

const STORAGE_KEY = "expense-tracker-settings";

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
  createdAt: Date.now(),
  updatedAt: Date.now(),
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

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveLocal(s: UserSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/** Push settings via sync/commit API */
async function pushToApi(s: UserSettings) {
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
  const local = loadSettings();
  _setShared(local);
}

export function useSettings() {
  const settings = useSyncExternalStore(_subscribe, _getSnapshot, () => DEFAULT_SETTINGS);
  const loading = false;
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === null;
  });

  // On mount: sync with API
  useEffect(() => {
    const hasExisting = localStorage.getItem(STORAGE_KEY) !== null;
    const local = _getSnapshot();

    // Fetch remote settings via API and merge
    fetchSettingsFromApi().then((remote) => {
      if (!remote) {
        // No remote row yet — push local settings
        if (hasExisting) {
          pushToApi(local);
        }
        return;
      }
      const localTs = local.updatedAt || 0;
      const remoteTs = remote.updatedAt || 0;
      if (remoteTs > localTs) {
        saveLocal(remote);
        _setShared(remote);
      } else if (localTs > remoteTs && hasExisting) {
        pushToApi(local);
      }
    });

    // Subscribe to realtime changes on this workspace's settings
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const channel = supabase
      .channel("settings-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_settings", filter: `workspace_id=eq.${wid}` },
        () => {
          // On realtime change, re-fetch from API
          fetchSettingsFromApi().then((remote) => {
            if (remote && remote.updatedAt > _settings.updatedAt) {
              saveLocal(remote);
              _setShared(remote);
            }
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
    if (!localStorage.getItem(STORAGE_KEY)) {
      const initial = { ...DEFAULT_SETTINGS, updatedAt: Date.now() };
      saveLocal(initial);
      _setShared(initial);
      pushToApi(initial);
    }
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    _setShared(DEFAULT_SETTINGS);
    setIsFirstVisit(true);
  }, []);

  return { settings, loading, isFirstVisit, updateSettings, addCategory, deleteCategory, markOnboarded, resetSettings };
}
