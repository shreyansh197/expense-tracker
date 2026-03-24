import { authFetch } from "@/lib/authClient";

/**
 * Shared fetch coordinator for /api/sync/changes.
 * Deduplicates in-flight requests: if multiple hooks call fetchSyncData
 * with the same workspaceId at the same time, they share one HTTP request.
 * Responses are cached for a short TTL to avoid re-fetching on rapid mounts.
 */

interface CacheEntry {
  data: unknown;
  at: number;
}

const CACHE_TTL = 2_000; // 2 seconds
const inflight = new Map<string, Promise<unknown>>();
const cache = new Map<string, CacheEntry>();

export async function fetchSyncData(workspaceId: string): Promise<unknown> {
  // Return cached response if fresh
  const cached = cache.get(workspaceId);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.data;
  }

  // Reuse in-flight request if one exists
  const existing = inflight.get(workspaceId);
  if (existing) return existing;

  const promise = (async () => {
    const params = new URLSearchParams({ workspaceId });
    const res = await authFetch(`/api/sync/changes?${params}`);
    if (!res.ok) throw new Error(`sync/changes failed: ${res.status}`);
    const data = await res.json();
    cache.set(workspaceId, { data, at: Date.now() });
    return data;
  })();

  inflight.set(workspaceId, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(workspaceId);
  }
}

/** Invalidate the cache so the next fetch hits the server */
export function invalidateSyncCache(workspaceId?: string) {
  if (workspaceId) {
    cache.delete(workspaceId);
  } else {
    cache.clear();
  }
}
