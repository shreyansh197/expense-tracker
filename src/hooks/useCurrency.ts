"use client";

import { useCallback } from "react";
import { useSettings } from "./useSettings";
import { formatCurrency, formatCurrencyCompact, getCurrencySymbol } from "@/lib/utils";

export function useCurrency() {
  const { settings } = useSettings();
  const code = settings.currency || "INR";

  const fc = useCallback(
    (amount: number) => formatCurrency(amount, code),
    [code],
  );

  const fcc = useCallback(
    (amount: number) => formatCurrencyCompact(amount, code),
    [code],
  );

  const symbol = getCurrencySymbol(code);

  return { currency: code, symbol, formatCurrency: fc, formatCurrencyCompact: fcc };
}
