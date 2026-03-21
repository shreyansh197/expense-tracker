"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  // Try with new columns first; fall back to legacy columns if they don't exist
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
    // New columns not yet in DB — push without them
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

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const pushRef = useRef(false); // guard against double-push on mount

  // On mount: load from localStorage, then sync with Supabase
  useEffect(() => {
    const hasExisting = localStorage.getItem(STORAGE_KEY) !== null;
    setIsFirstVisit(!hasExisting);
    const local = loadSettings();
    setSettings(local);
    setLoading(false);

    const syncCode = getSyncCode();
    if (!syncCode) return;

    // Fetch remote settings and merge
    fetchSettingsFromSupabase(syncCode).then((remote) => {
      if (!remote) {
        // No remote row yet — push local settings (migration for existing users)
        if (hasExisting && !pushRef.current) {
          pushRef.current = true;
          pushToSupabase(local);
        }
        return;
      }
      // Remote exists — use whichever is newer
      const localTs = local.updatedAt || 0;
      const remoteTs = remote.updatedAt || 0;
      if (remoteTs > localTs) {
        saveLocal(remote);
        setSettings(remote);
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
          setSettings((prev) => {
            if (incoming.updatedAt > prev.updatedAt) {
              saveLocal(incoming);
              return incoming;
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<UserSettings, "salary" | "currency" | "categories" | "customCategories" | "hiddenDefaults" | "categoryBudgets" | "recurringExpenses" | "savedFilters" | "goals" | "rolloverEnabled" | "rolloverHistory">>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates, updatedAt: Date.now() };
        saveLocal(next);
        pushToSupabase(next);
        return next;
      });
    },
    []
  );

  const addCategory = useCallback((cat: CategoryMeta) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        customCategories: [...prev.customCategories, cat],
        categories: [...prev.categories, cat.id],
        updatedAt: Date.now(),
      };
      saveLocal(next);
      pushToSupabase(next);
      return next;
    });
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setSettings((prev) => {
      const isCustom = prev.customCategories.some((c) => c.id === id);
      const next = {
        ...prev,
        customCategories: prev.customCategories.filter((c) => c.id !== id),
        categories: prev.categories.filter((c) => c !== id),
        hiddenDefaults: isCustom ? prev.hiddenDefaults : [...(prev.hiddenDefaults || []), id],
        updatedAt: Date.now(),
      };
      saveLocal(next);
      pushToSupabase(next);
      return next;
    });
  }, []);

  const markOnboarded = useCallback(() => {
    setIsFirstVisit(false);
    if (!localStorage.getItem(STORAGE_KEY)) {
      const initial = { ...DEFAULT_SETTINGS, updatedAt: Date.now() };
      saveLocal(initial);
      pushToSupabase(initial);
    }
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    setIsFirstVisit(true);
  }, []);

  return { settings, loading, isFirstVisit, updateSettings, addCategory, deleteCategory, markOnboarded, resetSettings };
}
