import { db, migrateFromLocalStorage } from "./db";
import type { IDBMutation } from "./db";
import { authFetch, getActiveWorkspaceId, isAuthenticated } from "./authClient";
import { supabase } from "./supabase";

// ── Notification system for hooks to react to IDB changes ──

type SyncListener = () => void;
const _syncListeners = new Set<SyncListener>();

export function onSyncPull(fn: SyncListener): () => void {
  _syncListeners.add(fn);
  return () => { _syncListeners.delete(fn); };
}

function _notifySyncPull() {
  _syncListeners.forEach((fn) => fn());
}

// ── Idempotency key generation ──

let _counter = 0;

export function makeIdempotencyKey(): string {
  _counter += 1;
  return `${Date.now()}-${_counter}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── UUID generation (crypto-based, valid UUIDv4) ──

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ── Enqueue a mutation to IDB ──

export async function enqueueMutation(
  mutation: Omit<IDBMutation, "localId" | "createdAt" | "workspaceId">,
  workspaceId: string,
): Promise<void> {
  await db.mutations.add({
    ...mutation,
    workspaceId,
    createdAt: Date.now(),
  });
}

// ── Pull changes from server into IDB ──

const _pullInFlight = new Map<string, Promise<boolean>>();

export async function pullChanges(workspaceId?: string): Promise<boolean> {
  const wid = workspaceId ?? getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return false;

  // Dedup concurrent pulls per workspace
  const existing = _pullInFlight.get(wid);
  if (existing) return existing;

  const promise = (async () => {
    try {
      // Read the last sync cursor so we only fetch changes since then
      const syncMeta = await db.syncMeta.get(wid);
      const params = new URLSearchParams({ workspaceId: wid });
      if (syncMeta?.cursor) {
        params.set("since", syncMeta.cursor);
      }
      const res = await authFetch(`/api/sync/changes?${params}`);
      if (!res.ok) return false;

      const data = await res.json();
      const { cursor, changes } = data;

      // Get pending mutation IDs to avoid overwriting optimistic changes
      const pendingMutations = await db.mutations
        .where("workspaceId").equals(wid).toArray();
      const pendingDeleteIds = new Set(
        pendingMutations.filter(m => m.operation === "delete" && m.id).map(m => m.id!)
      );

      await db.transaction(
        "rw",
        [db.expenses, db.settings, db.ledgers, db.payments, db.syncMeta],
        async () => {
          // ── Expenses ──
          if (changes.expenses?.length) {
            for (const row of changes.expenses) {
              if (pendingDeleteIds.has(row.id)) continue;
              if (row.deletedAt) {
                await db.expenses.delete(row.id);
              } else {
                await db.expenses.put({
                  id: row.id,
                  workspaceId: wid,
                  category: row.category,
                  amount: Number(row.amount),
                  currency: row.currency ?? undefined,
                  day: row.day,
                  month: row.month,
                  year: row.year,
                  remark: row.remark ?? undefined,
                  isRecurring: row.isRecurring ?? false,
                  recurringId: row.recurringId ?? undefined,
                  createdAt: new Date(row.createdAt).getTime(),
                  updatedAt: new Date(row.updatedAt).getTime(),
                  deletedAt: null,
                });
              }
            }

            // Clean up any legacy temp- prefixed records that may be orphaned
            const tempExpenses = await db.expenses
              .where("workspaceId").equals(wid)
              .filter(e => e.id.startsWith("temp-"))
              .toArray();
            if (tempExpenses.length > 0) {
              await db.expenses.bulkDelete(tempExpenses.map(e => e.id));
            }
          }

          // ── Settings ──
          if (changes.settings) {
            const s = changes.settings;
            await db.settings.put({
              workspaceId: wid,
              salary: Number(s.salary),
              currency: s.currency as string,
              categories: (s.categories as string[]) || [],
              customCategories: s.customCategories || [],
              hiddenDefaults: s.hiddenDefaults || [],
              categoryBudgets: s.categoryBudgets ?? {},
              recurringExpenses: s.recurringExpenses ?? [],
              savedFilters: s.savedFilters ?? [],
              goals: s.goals ?? [],
              rolloverEnabled: s.rolloverEnabled ?? false,
              rolloverHistory: s.rolloverHistory ?? {},
              businessMode: s.businessMode ?? false,
              revenueExpectations: s.revenueExpectations ?? [],
              businessTags: s.businessTags ?? [],
              dashboardLayout: s.dashboardLayout ?? undefined,
              multiCurrencyEnabled: s.multiCurrencyEnabled ?? false,
              dismissedRecurringSuggestions: s.dismissedRecurringSuggestions ?? [],
              autoRules: s.autoRules ?? [],
              updatedAt: new Date(s.updatedAt as string).getTime(),
            });
          }

          // ── Ledgers ──
          if (changes.businessLedgers?.length) {
            for (const row of changes.businessLedgers) {
              if (pendingDeleteIds.has(row.id)) continue;
              if (row.deletedAt) {
                await db.ledgers.delete(row.id);
              } else {
                await db.ledgers.put({
                  id: row.id,
                  workspaceId: wid,
                  name: row.name,
                  expectedAmount: Number(row.expectedAmount),
                  currency: row.currency,
                  status: row.status,
                  dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : undefined,
                  tags: row.tags || [],
                  notes: row.notes || "",
                  createdAt: new Date(row.createdAt).getTime(),
                  updatedAt: new Date(row.updatedAt).getTime(),
                  deletedAt: null,
                });
              }
            }
          }

          // ── Payments ──
          if (changes.businessPayments?.length) {
            for (const row of changes.businessPayments) {
              if (pendingDeleteIds.has(row.id)) continue;
              if (row.deletedAt) {
                await db.payments.delete(row.id);
              } else {
                await db.payments.put({
                  id: row.id,
                  workspaceId: wid,
                  ledgerId: row.ledgerId,
                  amount: Number(row.amount),
                  date: row.date,
                  method: row.method || undefined,
                  reference: row.reference || undefined,
                  notes: row.notes || undefined,
                  createdAt: new Date(row.createdAt).getTime(),
                  updatedAt: new Date(row.updatedAt).getTime(),
                  deletedAt: null,
                });
              }
            }
          }

          // ── Update cursor ──
          if (cursor) {
            await db.syncMeta.put({ workspaceId: wid, cursor, lastSyncAt: Date.now() });
          }
        }
      );

      _notifySyncPull();

      // If server indicated more data is available, pull again
      if (data.hasMore) {
        // Release the inflight lock first so the recursive call can proceed
        _pullInFlight.delete(wid);
        await pullChanges(wid);
      }

      return true;
    } catch {
      return false;
    }
  })();

  _pullInFlight.set(wid, promise);
  try {
    return await promise;
  } finally {
    _pullInFlight.delete(wid);
  }
}

// ── Push pending mutations to server ──

export async function pushMutations(workspaceId?: string): Promise<number> {
  const wid = workspaceId ?? getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return 0;

  const mutations = await db.mutations
    .where("workspaceId").equals(wid)
    .sortBy("localId");
  if (mutations.length === 0) return 0;

  let applied = 0;
  for (let i = 0; i < mutations.length; i += 100) {
    const batch = mutations.slice(i, i + 100);
    try {
      const res = await authFetch("/api/sync/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: wid,
          mutations: batch.map(m => ({
            table: m.table,
            operation: m.operation,
            id: m.id,
            data: m.data,
            idempotencyKey: m.idempotencyKey,
          })),
        }),
      });
      if (res.ok) {
        const body = await res.json();
        // Only delete mutations that the server actually applied or skipped (idempotent).
        // Keep mutations with "error" status so they can be retried.
        const succeededKeys = new Set(
          body.results
            .filter((r: { status: string }) => r.status === "applied" || r.status === "skipped")
            .map((r: { idempotencyKey: string }) => r.idempotencyKey)
        );
        const toDelete = batch
          .filter(m => succeededKeys.has(m.idempotencyKey))
          .map(m => m.localId!)
          .filter(Boolean);
        if (toDelete.length > 0) await db.mutations.bulkDelete(toDelete);
        applied += body.results.filter(
          (r: { status: string }) => r.status === "applied"
        ).length;
      } else {
        break; // Stop on HTTP error
      }
    } catch {
      break; // Network error — stop, retry later
    }
  }
  return applied;
}

// ── Immediate push attempt (non-blocking) ──

export function trySyncPush(workspaceId?: string) {
  if (!navigator.onLine) return;
  pushMutations(workspaceId).then((n) => {
    if (n > 0) pullChanges(workspaceId);
  }).catch(() => {});
}

// ── Pending mutation count ──

export async function getPendingMutationCount(): Promise<number> {
  return db.mutations.count();
}

// ── Sync engine lifecycle ──

let _syncInterval: ReturnType<typeof setInterval> | null = null;
let _onlineHandler: (() => void) | null = null;
let _visibilityHandler: (() => void) | null = null;
let _realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let _started = false;

async function _doSync() {
  const wid = getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return;
  await pushMutations(wid);
  await pullChanges(wid);
}

export function startSyncEngine() {
  if (typeof window === "undefined" || _started) return;
  _started = true;

  // Migrate legacy localStorage data to IDB
  migrateFromLocalStorage();

  // Auto-sync on reconnect
  _onlineHandler = () => { _doSync(); };
  window.addEventListener("online", _onlineHandler);

  // Auto-sync on tab focus
  _visibilityHandler = () => {
    if (document.visibilityState === "visible") _doSync();
  };
  document.addEventListener("visibilitychange", _visibilityHandler);

  // Poll every 30s when active
  _syncInterval = setInterval(() => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      _doSync();
    }
  }, 30_000);

  // Supabase Realtime — subscribe to all relevant tables for this workspace
  const wid = getActiveWorkspaceId();
  if (wid) {
    _realtimeChannel = supabase
      .channel(`sync-engine-${wid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `workspace_id=eq.${wid}` }, () => pullChanges(wid))
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_settings", filter: `workspace_id=eq.${wid}` }, () => pullChanges(wid))
      .on("postgres_changes", { event: "*", schema: "public", table: "business_ledgers", filter: `workspace_id=eq.${wid}` }, () => pullChanges(wid))
      .on("postgres_changes", { event: "*", schema: "public", table: "business_payments", filter: `workspace_id=eq.${wid}` }, () => pullChanges(wid))
      .subscribe();
  }

  // Initial sync
  _doSync();
}

export function stopSyncEngine() {
  if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null; }
  if (_onlineHandler) { window.removeEventListener("online", _onlineHandler); _onlineHandler = null; }
  if (_visibilityHandler) { document.removeEventListener("visibilitychange", _visibilityHandler); _visibilityHandler = null; }
  if (_realtimeChannel) { supabase.removeChannel(_realtimeChannel); _realtimeChannel = null; }
  _started = false;
}
