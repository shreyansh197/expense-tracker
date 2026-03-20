"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_SALARY } from "@/lib/constants";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import type { UserSettings, CategoryMeta } from "@/types";

const STORAGE_KEY = "expense-tracker-settings";

const DEFAULT_SETTINGS: UserSettings = {
  salary: DEFAULT_SALARY,
  currency: "INR",
  categories: DEFAULT_CATEGORIES,
  customCategories: [],
  hiddenDefaults: [],
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

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const hasExisting = localStorage.getItem(STORAGE_KEY) !== null;
    setIsFirstVisit(!hasExisting);
    setSettings(loadSettings());
    setLoading(false);
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<UserSettings, "salary" | "currency" | "categories" | "customCategories" | "hiddenDefaults">>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates, updatedAt: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markOnboarded = useCallback(() => {
    setIsFirstVisit(false);
    // Persist default settings so isFirstVisit stays false on subsequent visits
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, updatedAt: Date.now() }));
    }
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    setIsFirstVisit(true);
  }, []);

  return { settings, loading, isFirstVisit, updateSettings, addCategory, deleteCategory, markOnboarded, resetSettings };
}
