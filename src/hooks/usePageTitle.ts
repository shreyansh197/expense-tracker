"use client";

import { useEffect } from "react";

const BASE = "ExpenStream";

/**
 * Sets document.title to "Page — ExpenStream" on mount.
 * Pass just the page name, e.g. usePageTitle("Expenses").
 */
export function usePageTitle(page: string) {
  useEffect(() => {
    document.title = page ? `${page} — ${BASE}` : BASE;
    return () => { document.title = BASE; };
  }, [page]);
}
