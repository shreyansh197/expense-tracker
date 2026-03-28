import { authFetch } from "./authClient";
import { getActiveWorkspaceId } from "./authClient";

const SYNC_CURSOR_KEY = "expenstream-sync-cursor";

// ── Cursor persistence ───────────────────────────────────────

function getCursor(workspaceId: string): string | null {
  if (typeof window === "undefined") return null;
  const map = JSON.parse(localStorage.getItem(SYNC_CURSOR_KEY) ?? "{}");
  return map[workspaceId] ?? null;
}

function setCursor(workspaceId: string, cursor: string) {
  if (typeof window === "undefined") return;
  const map = JSON.parse(localStorage.getItem(SYNC_CURSOR_KEY) ?? "{}");
  map[workspaceId] = cursor;
  localStorage.setItem(SYNC_CURSOR_KEY, JSON.stringify(map));
}

// ── Delta sync: pull changes ─────────────────────────────────

export interface SyncChanges {
  cursor: string;
  hasMore: boolean;
  changes: {
    expenses: unknown[];
    settings: unknown | null;
    businessLedgers: unknown[];
    businessPayments: unknown[];
  };
}

export async function pullChanges(
  workspaceId?: string,
): Promise<SyncChanges | null> {
  const wid = workspaceId ?? getActiveWorkspaceId();
  if (!wid) return null;

  const since = getCursor(wid);
  const params = new URLSearchParams({ workspaceId: wid });
  if (since) params.set("since", since);

  const res = await authFetch(`/api/sync/changes?${params}`);
  if (!res.ok) return null;

  const data: SyncChanges = await res.json();
  setCursor(wid, data.cursor);
  return data;
}

// ── Batch commit: push mutations ─────────────────────────────

export interface SyncMutation {
  table: "expenses" | "workspace_settings" | "business_ledgers" | "business_payments";
  operation: "upsert" | "delete";
  id?: string;
  data: Record<string, unknown>;
  idempotencyKey: string;
}

export async function pushMutations(
  mutations: SyncMutation[],
  workspaceId?: string,
): Promise<{ results: { idempotencyKey: string; status: string; id?: string }[] } | null> {
  const wid = workspaceId ?? getActiveWorkspaceId();
  if (!wid) return null;

  const res = await authFetch("/api/sync/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: wid, mutations }),
  });

  if (!res.ok) return null;
  return res.json();
}

// ── Idempotency key generation ───────────────────────────────

let _counter = 0;

export function makeIdempotencyKey(): string {
  _counter += 1;
  return `${Date.now()}-${_counter}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Offline mutation queue ───────────────────────────────────

const OFFLINE_QUEUE_KEY = "expenstream-offline-mutations";

export function enqueueOfflineMutation(mutation: SyncMutation) {
  if (typeof window === "undefined") return;
  const queue: SyncMutation[] = JSON.parse(
    localStorage.getItem(OFFLINE_QUEUE_KEY) ?? "[]",
  );
  queue.push(mutation);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function getOfflineQueue(): SyncMutation[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? "[]");
}

export function clearOfflineQueue() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export async function flushOfflineQueue(workspaceId?: string): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  const result = await pushMutations(queue, workspaceId);
  if (result) {
    clearOfflineQueue();
    return result.results.filter((r) => r.status === "applied").length;
  }
  return 0;
}
