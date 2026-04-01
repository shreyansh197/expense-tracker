/**
 * Simple in-memory sliding-window rate limiter.
 * Key by IP hash to limit auth endpoint abuse.
 *
 * Not suitable for multi-instance deployments without a shared store.
 * For horizontal scaling, replace the Map with Redis/Upstash.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, win] of store) {
    if (now > win.resetAt) store.delete(key);
  }
}

/**
 * Check and consume a rate limit token.
 * @returns `{ ok: true }` if allowed, `{ ok: false, retryAfter }` if blocked.
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  cleanup();
  const now = Date.now();
  const win = store.get(key);

  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (win.count < max) {
    win.count++;
    return { ok: true };
  }

  return { ok: false, retryAfter: Math.ceil((win.resetAt - now) / 1000) };
}
