"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseAnalyticsPeriod, type AnalyticsPeriod } from "@/lib/analyticsCharts";

/**
 * The Analytics history period (3 / 6 / 12 months) lives in the URL
 * (`?period=6`) so it survives refresh and is shareable (IMPLEMENTATION_RULES §11).
 * The param is validated with Zod; anything unexpected falls back to 6 months.
 */
export function useAnalyticsPeriod(): [AnalyticsPeriod, (next: AnalyticsPeriod) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const period = parseAnalyticsPeriod(searchParams.get("period"));

  const setPeriod = useCallback(
    (next: AnalyticsPeriod) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", String(next));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [period, setPeriod];
}
