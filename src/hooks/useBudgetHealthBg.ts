"use client";

import { useEffect } from "react";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * Writes --page-bg on <body> based on current budget health band.
 * Business routes use a cool-slate background instead of warm-terrain.
 *
 * Health bands (personal):
 *   0–60%   → chalk   #FAF7F2
 *   60–80%  → parchment #F0EBE0
 *   80–95%  → sand   #EDE4D4
 *   95%+    → terracotta blush #E8D4C4
 *
 * The 2s CSS transition on body handles the smooth drift.
 * prefers-reduced-motion is handled by the CSS rule in globals.css.
 */

const PERSONAL_BANDS = [
  { threshold: 60,  value: "#FAF7F2" }, // chalk — healthy
  { threshold: 80,  value: "#F5F0E8" }, // approaching — slightly cooler parchment
  { threshold: 95,  value: "#F0E8DC" }, // warning — warm sand tightening
  { threshold: Infinity, value: "#EDE0D4" }, // over budget — terracotta blush
] as const;

const DARK_PERSONAL_BANDS = [
  { threshold: 60,  value: "#1A1B2E" }, // obsidian — healthy
  { threshold: 80,  value: "#1E1C30" }, // approaching — slight warmth
  { threshold: 95,  value: "#22192E" }, // warning — subtle plum tint
  { threshold: Infinity, value: "#261828" }, // over budget — deep terracotta tint
] as const;

const BIZ_BG = "#EBF0F5"; // cool slate — professional, not warm
const DARK_BIZ_BG = "#141C28";

export function useBudgetHealthBg(): void {
  const { budgetUsedPercent } = useCalculationsContext();
  const pathname = usePathname();
  const { resolved: resolvedTheme } = useTheme();

  useEffect(() => {
    const isBizRoute = pathname.startsWith("/business");
    const isDark = resolvedTheme === "dark";

    let bg: string;
    if (isBizRoute) {
      bg = isDark ? DARK_BIZ_BG : BIZ_BG;
    } else if (isDark) {
      const band = DARK_PERSONAL_BANDS.find((b) => budgetUsedPercent < b.threshold);
      bg = band?.value ?? "#261828";
    } else {
      const band = PERSONAL_BANDS.find((b) => budgetUsedPercent < b.threshold);
      bg = band?.value ?? "#EDE0D4";
    }

    document.documentElement.style.setProperty("--page-bg", bg);
    document.body.style.transition = "background-color 0.8s ease";
  }, [budgetUsedPercent, pathname, resolvedTheme]);
}
