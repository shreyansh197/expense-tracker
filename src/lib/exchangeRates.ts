import { db } from "./db";

/**
 * Exchange rate cache using IDB.
 * Fetches from open.er-api.com (free, no key required).
 * Rates cached for 24 hours.
 */

interface RateCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
let _memoryCache: RateCache | null = null;

const IDB_STORE = "exchangeRates";

async function loadFromIDB(base: string): Promise<RateCache | null> {
  try {
    // Use a generic get on the syncMeta table reusing workspaceId field
    const stored = localStorage.getItem(`expenstream-rates-${base}`);
    if (!stored) return null;
    const parsed: RateCache = JSON.parse(stored);
    if (Date.now() - parsed.fetchedAt < CACHE_TTL) return parsed;
    return null; // expired
  } catch {
    return null;
  }
}

function saveToStorage(cache: RateCache) {
  try {
    localStorage.setItem(`expenstream-rates-${cache.base}`, JSON.stringify(cache));
  } catch {
    // quota exceeded — ignore
  }
}

export async function fetchRates(base: string): Promise<Record<string, number>> {
  // Memory cache
  if (_memoryCache && _memoryCache.base === base && Date.now() - _memoryCache.fetchedAt < CACHE_TTL) {
    return _memoryCache.rates;
  }

  // Storage cache
  const stored = await loadFromIDB(base);
  if (stored) {
    _memoryCache = stored;
    return stored.rates;
  }

  // Fetch from API
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!res.ok) throw new Error(`Rate API: ${res.status}`);
    const data = await res.json();
    if (data.result !== "success") throw new Error("Rate API error");

    const cache: RateCache = {
      base,
      rates: data.rates as Record<string, number>,
      fetchedAt: Date.now(),
    };
    _memoryCache = cache;
    saveToStorage(cache);
    return cache.rates;
  } catch {
    // Return fallback rates (1:1 for same currency, rough estimates for common pairs)
    return getFallbackRates(base);
  }
}

function getFallbackRates(base: string): Record<string, number> {
  const table: Record<string, Record<string, number>> = {
    INR: { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095 },
    USD: { INR: 83.5, USD: 1, EUR: 0.92, GBP: 0.79 },
    EUR: { INR: 90.5, USD: 1.09, EUR: 1, GBP: 0.86 },
    GBP: { INR: 105.5, USD: 1.27, EUR: 1.16, GBP: 1 },
  };
  return table[base] ?? { [base]: 1 };
}

export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  if (from === to) return amount;
  const rate = rates[to];
  if (!rate) return amount; // unknown currency — return as-is
  return Math.round(amount * rate * 100) / 100;
}
