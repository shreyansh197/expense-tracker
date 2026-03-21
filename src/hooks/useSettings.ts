"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { DEFAULT_SALARY } from "@/lib/constants";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import { getSyncCode } from "@/lib/deviceId";
import type { UserSettings, CategoryMeta, RecurringExpense, SavedFilter, Goal } from "@/types";

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/** Push settings to Supabase user_settings table */
async function pushToSupabase(s: UserSettings) {
  const syncCode = getSyncCode();
  if (!syncCode) return;

  // Try with all columns (including newest: goals, rollover_enabled, rollover_history)
  const { error } = await supabase.from("user_settings").upsert({
    sync_code: syncCode,
    salary: s.salary,
    currency: s.currency,
    categories: s.categories,
    custom_categories: s.customCategories,
    hidden_defaults: s.hiddenDefaults,
    category_budgets: s.categoryBudgets || {},
    recurring_expenses: s.recurringExpenses || [],
    saved_filters: s.savedFilters || [],
    goals: s.goals || [],
    rollover_enabled: s.rolloverEnabled ?? false,
    rollover_history: s.rolloverHistory || {},
    updated_at: new Date(s.updatedAt).toISOString(),
  }, { onConflict: "sync_code" });

  if (error && error.message?.includes("column")) {
    // Fallback: try without the 3 newest columns (goals, rollover_enabled, rollover_history)
    const { error: err2 } = await supabase.from("user_settings").upsert({
      sync_code: syncCode,
      salary: s.salary,
      currency: s.currency,
      categories: s.categories,
      custom_categories: s.customCategories,
      hidden_defaults: s.hiddenDefaults,
      category_budgets: s.categoryBudgets || {},
      recurring_expenses: s.recurringExpenses || [],
      saved_filters: s.savedFilters || [],
      updated_at: new Date(s.updatedAt).toISOString(),
    }, { onConflict: "sync_code" });

    if (err2 && err2.message?.includes("column")) {
      // Last resort: only original columns
      await supabase.from("user_settings").upsert({
        sync_code: syncCode,
        salary: s.salary,
        currency: s.currency,
        categories: s.categories,
        custom_categories: s.customCategories,
        hidden_defaults: s.hiddenDefaults,
        updated_at: new Date(s.updatedAt).toISOString(),
      }, { onConflict: "sync_code" });
    }
  }
}

/** Fetch settings from Supabase for a given sync code */
export async function fetchSettingsFromSupabase(syncCode: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("sync_code", syncCode)
    .single();
  if (error || !data) return null;
  return {
    salary: Number(data.salary),
    currency: data.currency as string,
    categories: data.categories as string[],
    customCategories: (data.custom_categories as CategoryMeta[]) || [],
    hiddenDefaults: (data.hidden_defaults as string[]) || [],
    categoryBudgets: (data.category_budgets as Record<string, number>) ?? {},
    recurringExpenses: (data.recurring_expenses as RecurringExpense[]) ?? [],
    savedFilters: (data.saved_filters as SavedFilter[]) ?? [],
    goals: (data.goals as Goal[]) ?? [],
    rolloverEnabled: (data.rollover_enabled as boolean) ?? false,
    rolloverHistory: (data.rollover_history as Record<string, number>) ?? {},
    createdAt: Date.now(),
    updatedAt: new Date(data.updated_at as string).getTime(),
  };
}

// ── Initialization guards (module-level, run once across all consumers) ──
let _initialized = false;
let _pushGuard = false;

export function useSettings() {
  const settings = useSyncExternalStore(_subscribe, _getSnapshot, () => DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!_initialized);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // On mount: load from localStorage, then sync with Supabase
  useEffect(() => {
    // Only initialize once across all instances
    if (_initialized) { setLoading(false); return; }
    _initialized = true;

    const hasExisting = localStorage.getItem(STORAGE_KEY) !== null;
    setIsFirstVisit(!hasExisting);
    const local = loadSettings();
    _setShared(local);
    setLoading(false);

    const syncCode = getSyncCode();
    if (!syncCode) return;

    // Fetch remote settings and merge
    fetchSettingsFromSupabase(syncCode).then((remote) => {
      if (!remote) {
        // No remote row yet — push local settings (migration for existing users)
        if (hasExisting && !_pushGuard) {
          _pushGuard = true;
          pushToSupabase(local);
        }
        return;
      }
      // Remote exists — use whichever is newer
      const localTs = local.updatedAt || 0;
      const remoteTs = remote.updatedAt || 0;
      if (remoteTs > localTs) {
        saveLocal(remote);
        _setShared(remote);
      } else if (localTs > remoteTs && hasExisting) {
        pushToSupabase(local);
      }
    });

    // Subscribe to realtime changes on this sync code's settings
    const channel = supabase
      .channel("settings-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_settings", filter: `sync_code=eq.${syncCode}` },
        (payload) => {
          const d = payload.new as Record<string, unknown>;
          if (!d) return;
          const incoming: UserSettings = {
            salary: Number(d.salary),
            currency: d.currency as string,
            categories: d.categories as string[],
            customCategories: (d.custom_categories as CategoryMeta[]) || [],
            hiddenDefaults: (d.hidden_defaults as string[]) || [],
            categoryBudgets: (d.category_budgets as Record<string, number>) ?? {},
            recurringExpenses: (d.recurring_expenses as RecurringExpense[]) ?? [],
            savedFilters: (d.saved_filters as SavedFilter[]) ?? [],
            goals: (d.goals as Goal[]) ?? [],
            rolloverEnabled: (d.rollover_enabled as boolean) ?? false,
            rolloverHistory: (d.rollover_history as Record<string, number>) ?? {},
            createdAt: Date.now(),
            updatedAt: new Date(d.updated_at as string).getTime(),
          };
          if (incoming.updatedAt > _settings.updatedAt) {
            saveLocal(incoming);
            _setShared(incoming);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<UserSettings, "salary" | "currency" | "categories" | "customCategories" | "hiddenDefaults" | "categoryBudgets" | "recurringExpenses" | "savedFilters" | "goals" | "rolloverEnabled" | "rolloverHistory">>) => {
      const next = { ..._settings, ...updates, updatedAt: Date.now() };
      saveLocal(next);
      _setShared(next);
      pushToSupabase(next);
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
    pushToSupabase(next);
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
    pushToSupabase(next);
  }, []);

  const markOnboarded = useCallback(() => {
    setIsFirstVisit(false);
    if (!localStorage.getItem(STORAGE_KEY)) {
      const initial = { ...DEFAULT_SETTINGS, updatedAt: Date.now() };
      saveLocal(initial);
      _setShared(initial);
      pushToSupabase(initial);
    }
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    _setShared(DEFAULT_SETTINGS);
    setIsFirstVisit(true);
  }, []);

  return { settings, loading, isFirstVisit, updateSettings, addCategory, deleteCategory, markOnboarded, resetSettings };
}
