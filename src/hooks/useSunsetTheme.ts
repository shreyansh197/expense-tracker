"use client";

import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * Approximate sunrise/sunset based on time of year (simple solar model).
 * Returns hours in 24h format for the user's locale.
 */
function getSunTimes(): { sunrise: number; sunset: number } {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  // Simple sinusoidal model: sunrise ranges 5–7, sunset ranges 17–20
  const phase = Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);
  const sunrise = 6 - phase * 1; // ~5 in summer, ~7 in winter
  const sunset = 18.5 + phase * 1.5; // ~20 in summer, ~17 in winter
  return { sunrise: Math.round(sunrise * 2) / 2, sunset: Math.round(sunset * 2) / 2 };
}

/**
 * Auto-switches theme based on time of day when sunsetTheme is enabled.
 * Checks every 5 minutes.
 */
export function useSunsetTheme() {
  const { settings } = useSettings();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!settings.sunsetTheme) return;

    function apply() {
      const { sunrise, sunset } = getSunTimes();
      const hour = new Date().getHours() + new Date().getMinutes() / 60;
      if (hour >= sunrise && hour < sunset) {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    }

    apply();
    const interval = setInterval(apply, 5 * 60 * 1000); // check every 5 min
    return () => clearInterval(interval);
  }, [settings.sunsetTheme, setTheme]);
}
