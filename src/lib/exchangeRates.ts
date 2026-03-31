/**
 * Real-time exchange rate system.
 *
 * Primary:  frankfurter.dev — European Central Bank rates (free, no key, ~4PM CET daily)
 * Fallback: cdn.jsdelivr.net/npm/@fawazahmed0/currency-api — community-maintained, updates more frequently
 * Cache:    localStorage + in-memory, TTL 4 hours for fresher rates
 */

interface RateCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
  source: "frankfurter" | "fawazahmed" | "fallback";
}

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
let _memoryCache: RateCache | null = null;
// Track in-flight fetches to avoid duplicate requests
const _pendingFetches = new Map<string, Promise<Record<string, number>>>();

function loadFromStorage(base: string): RateCache | null {
  try {
    const stored = localStorage.getItem(`expenstream-rates-${base}`);
    if (!stored) return null;
    const parsed: RateCache = JSON.parse(stored);
    if (Date.now() - parsed.fetchedAt < CACHE_TTL && parsed.source !== "fallback") return parsed;
    return null; // expired or was a fallback (always re-fetch over fallback)
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

/** Fetch from frankfurter.dev (ECB — European Central Bank) */
async function fetchFrankfurter(base: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.rates) return null;
    // frankfurter doesn't include the base currency in rates
    return { [base]: 1, ...data.rates };
  } catch {
    return null;
  }
}

/** Fetch from Fawaz Ahmed's open-source currency API (fallback) */
async function fetchFawazAhmed(base: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data[base.toLowerCase()];
    if (!raw) return null;
    // Normalize keys to uppercase
    const rates: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      rates[k.toUpperCase()] = v as number;
    }
    return rates;
  } catch {
    return null;
  }
}

export async function fetchRates(base: string): Promise<Record<string, number>> {
  // Memory cache (only if from a real API source)
  if (_memoryCache && _memoryCache.base === base && _memoryCache.source !== "fallback" && Date.now() - _memoryCache.fetchedAt < CACHE_TTL) {
    return _memoryCache.rates;
  }

  // Storage cache (rejects fallback-sourced entries)
  const stored = loadFromStorage(base);
  if (stored) {
    _memoryCache = stored;
    return stored.rates;
  }

  // Deduplicate concurrent fetches for the same base currency
  const pending = _pendingFetches.get(base);
  if (pending) return pending;

  const promise = (async () => {
    // Try primary API (frankfurter.dev — ECB rates)
    let rates = await fetchFrankfurter(base);
    let source: RateCache["source"] = "frankfurter";

    // Fallback to Fawaz Ahmed's API
    if (!rates) {
      rates = await fetchFawazAhmed(base);
      source = "fawazahmed";
    }

    if (rates) {
      const cache: RateCache = { base, rates, fetchedAt: Date.now(), source };
      _memoryCache = cache;
      saveToStorage(cache);
      return rates;
    }

    // Last resort: hardcoded fallback rates (not cached to storage)
    return getFallbackRates(base);
  })();

  _pendingFetches.set(base, promise);
  try {
    return await promise;
  } finally {
    _pendingFetches.delete(base);
  }
}

export function getFallbackRates(base: string): Record<string, number> {
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
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return amount; // unknown currency — return as-is
  return Math.round((amount * toRate / fromRate) * 100) / 100;
}

/** Get info about the currently cached rates (for debugging / settings display) */
export function getRateInfo(): { source: string; fetchedAt: Date; base: string } | null {
  if (!_memoryCache) return null;
  return {
    source: _memoryCache.source,
    fetchedAt: new Date(_memoryCache.fetchedAt),
    base: _memoryCache.base,
  };
}

/** Force-clear all rate caches (useful if old format is stuck) */
export function clearRateCache() {
  _memoryCache = null;
  if (typeof localStorage !== "undefined") {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("expenstream-rates-")) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
}
