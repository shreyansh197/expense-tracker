"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { fetchRates, getRateInfo, clearRateCache } from "@/lib/exchangeRates";

/** Shows live rate source, sample conversions, and a refresh button */
export function RateSourceInfo({ baseCurrency }: { baseCurrency: string }) {
  const [info, setInfo] = useState<{ source: string; fetchedAt: Date; base: string } | null>(() => getRateInfo());
  const [sampleRates, setSampleRates] = useState<Record<string, number> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadInfo = () => {
    const cached = getRateInfo();
    setInfo(cached);
  };

  useEffect(() => {
    let cancelled = false;
    fetchRates(baseCurrency).then((rates) => {
      if (cancelled) return;
      setSampleRates(rates);
      setInfo(getRateInfo());
    });
    return () => { cancelled = true; };
  }, [baseCurrency]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await clearRateCache();
    const rates = await fetchRates(baseCurrency);
    setSampleRates(rates);
    loadInfo();
    setRefreshing(false);
  };

  const sourceLabel: Record<string, string> = {
    frankfurter: "European Central Bank (frankfurter.dev)",
    fawazahmed: "Open Source Rates (fawazahmed0)",
    fallback: "Offline fallback rates",
  };

  const otherCurrencies = ["INR", "USD", "EUR", "GBP"].filter(c => c !== baseCurrency);

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--surface-secondary)" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
          Exchange Rates
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
          style={{ color: "var(--brand)", background: "var(--accent-soft)" }}
        >
          <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Fetching..." : "Refresh"}
        </button>
      </div>
      {info && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Source: {sourceLabel[info.source] ?? info.source} · Updated {info.fetchedAt.toLocaleTimeString()}
        </p>
      )}
      {sampleRates && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {otherCurrencies.map(c => {
            const rate = sampleRates[c];
            if (!rate) return null;
            return (
              <span key={c} className="text-xs text-amount font-medium" style={{ color: "var(--text-secondary)" }}>
                1 {baseCurrency} = {rate < 1 ? rate.toFixed(4) : rate.toFixed(2)} {c}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
