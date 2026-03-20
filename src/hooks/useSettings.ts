"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_SALARY } from "@/lib/constants";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import type { UserSettings } from "@/types";

const STORAGE_KEY = "expense-tracker-settings";

const DEFAULT_SETTINGS: UserSettings = {
  salary: DEFAULT_SALARY,
  currency: "INR",
  categories: DEFAULT_CATEGORIES,
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

  useEffect(() => {
    setSettings(loadSettings());
    setLoading(false);
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<UserSettings, "salary" | "currency" | "categories">>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates, updatedAt: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return { settings, loading, updateSettings };
}
