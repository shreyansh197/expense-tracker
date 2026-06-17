/**
 * Sliding-window rate limiter with two backends:
 *   1. PostgreSQL (preferred) — safe for multi-instance deployments.
 *   2. In-memory Map (fallback) — used when DB is unavailable.
 *
 * The DB backend uses an UPSERT on the `rate_limits` table created by
 * migration 013_rate_limit_table.sql.
 */
import { prisma } from "@/lib/server/prisma";

// ── In-memory fallback ─────────────────────────────────────────────────────────

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

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

function inMemoryRateLimit(
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

// ── DB backend ─────────────────────────────────────────────────────────────────

async function dbRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const now = new Date();
  const resetAt = new Date(Date.now() + windowMs);

  type Row = { count: number; reset_at: Date };

  // UPSERT: if row doesn't exist or window has expired, reset; otherwise increment
  const rows = await prisma.$queryRaw<Row[]>`
    INSERT INTO rate_limits ("key", "count", "reset_at")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE
      SET
        "count"    = CASE WHEN rate_limits.reset_at < ${now} THEN 1        ELSE rate_limits.count + 1 END,
        "reset_at" = CASE WHEN rate_limits.reset_at < ${now} THEN ${resetAt} ELSE rate_limits.reset_at END
    RETURNING "count", "reset_at"
  `;

  const row = rows[0];
  if (!row) return { ok: true };

  if (row.count <= max) return { ok: true };

  const retryAfter = Math.ceil((row.reset_at.getTime() - Date.now()) / 1000);
  return { ok: false, retryAfter: Math.max(retryAfter, 1) };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Check and consume a rate limit token.
 * Uses the PostgreSQL backend when available, in-memory as fallback.
 * @returns `{ ok: true }` if allowed, `{ ok: false, retryAfter }` if blocked.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  try {
    return await dbRateLimit(key, max, windowMs);
  } catch {
    // Prisma not available or table missing — fall back to in-memory
    return inMemoryRateLimit(key, max, windowMs);
  }
}
