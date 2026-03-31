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
}

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
let _memoryCache: RateCache | null = null;

async function loadFromStorage(base: string): Promise<RateCache | null> {
  try {
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
  // Memory cache
  if (_memoryCache && _memoryCache.base === base && Date.now() - _memoryCache.fetchedAt < CACHE_TTL) {
    return _memoryCache.rates;
  }

  // Storage cache
  const stored = await loadFromStorage(base);
  if (stored) {
    _memoryCache = stored;
    return stored.rates;
  }

  // Try primary API (frankfurter.dev — ECB rates)
  let rates = await fetchFrankfurter(base);

  // Fallback to Fawaz Ahmed's API
  if (!rates) {
    rates = await fetchFawazAhmed(base);
  }

  if (rates) {
    const cache: RateCache = { base, rates, fetchedAt: Date.now() };
    _memoryCache = cache;
    saveToStorage(cache);
    return rates;
  }

  // Last resort: hardcoded fallback rates
  return getFallbackRates(base);
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
