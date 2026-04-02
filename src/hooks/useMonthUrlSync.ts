"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";

/**
 * Two-way sync between the Zustand month/year state and URL search params (?m=4&y=2026).
 * - On mount: if URL has valid m/y params, apply them to the store.
 * - On store change: update the URL (replaceState, no navigation).
 * - Skips the "reset to current month" pattern — callers should remove that.
 */
export function useMonthUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { currentMonth, currentYear, setMonth } = useUIStore();
  const initialized = useRef(false);

  // 1. On mount: read URL → store
  useEffect(() => {
    const mParam = searchParams.get("m");
    const yParam = searchParams.get("y");
    if (mParam && yParam) {
      const m = parseInt(mParam, 10);
      const y = parseInt(yParam, 10);
      if (m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
        setMonth(m, y);
      }
    }
    initialized.current = true;
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Store → URL (shallow replace)
  useEffect(() => {
    if (!initialized.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("m", String(currentMonth));
    params.set("y", String(currentYear));
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [currentMonth, currentYear, pathname, router, searchParams]);
}
