import { db, migrateFromLocalStorage } from "./db";
import type { IDBMutation } from "./db";
import { authFetch, getActiveWorkspaceId, isAuthenticated, subscribeAuth } from "./authClient";
import { supabase } from "./supabase";

// ── Sync logging — visible in browser console for debugging ──

const SYNC_LOG = true; // Set false in production
function syncLog(tag: string, ...args: unknown[]) {
  if (SYNC_LOG) console.log(`[sync:${tag}]`, ...args);
}
function syncWarn(tag: string, ...args: unknown[]) {
  console.warn(`[sync:${tag}]`, ...args);
}
function syncErr(tag: string, ...args: unknown[]) {
  console.error(`[sync:${tag}]`, ...args);
}

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  syncLog("enqueue", `${mutation.table}:${mutation.operation} id=${mutation.id?.slice(0,8)}… key=${mutation.idempotencyKey}`);
  await db.mutations.add({
    ...mutation,
    workspaceId,
    createdAt: Date.now(),
  });
}

// ── Pull changes from server into IDB ──

let _migrated = false;
const _pullInFlight = new Map<string, Promise<boolean>>();

export async function pullChanges(workspaceId?: string): Promise<boolean> {
  const wid = workspaceId ?? getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return false;

  // Ensure migration has completed before pulling — prevents race where a
  // realtime/broadcast-triggered pull deletes temp- records before migration
  // can rescue them.
  if (!_migrated) {
    try { await _migrateStuckData(); _migrated = true; } catch { /* non-fatal */ }
  }

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
      syncLog("pull", `Fetching changes for workspace=${wid.slice(0,8)}… since=${syncMeta?.cursor ?? "NONE (full sync)"}`);
      const res = await authFetch(`/api/sync/changes?${params}`);
      if (!res.ok) {
        syncErr("pull", `HTTP ${res.status} from /api/sync/changes`);
        try { syncErr("pull", await res.text()); } catch {}
        return false;
      }

      const data = await res.json();
      const { cursor, changes } = data;

      const expCount = changes.expenses?.length ?? 0;
      const settCount = changes.settings ? 1 : 0;
      const ledCount = changes.businessLedgers?.length ?? 0;
      const payCount = changes.businessPayments?.length ?? 0;
      syncLog("pull", `Received: ${expCount} expenses, ${settCount} settings, ${ledCount} ledgers, ${payCount} payments, cursor=${cursor}, hasMore=${data.hasMore}`);

      // Skip if nothing changed
      if (expCount === 0 && settCount === 0 && ledCount === 0 && payCount === 0) {
        // Still update cursor if server sent one
        if (cursor && cursor !== syncMeta?.cursor) {
          await db.syncMeta.put({ workspaceId: wid, cursor, lastSyncAt: Date.now() });
        }
        return true;
      }

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
    } catch (err) {
      syncErr("pull", "Exception in pullChanges:", err);
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

let _pushInFlight = false;

export async function pushMutations(workspaceId?: string): Promise<number> {
  const wid = workspaceId ?? getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) return 0;

  // Mutex: prevent concurrent pushes (dedup from trySyncPush + _doSync overlap)
  if (_pushInFlight) return 0;
  _pushInFlight = true;

  try {
    const allMutations = await db.mutations
      .where("workspaceId").equals(wid)
      .sortBy("localId");
    if (allMutations.length === 0) return 0;

    // Purge mutations with non-UUID ids — they will always fail Zod validation
    const invalidMutations = allMutations.filter(m => m.id && !UUID_RE.test(m.id));
    if (invalidMutations.length > 0) {
      syncWarn("push", `Purging ${invalidMutations.length} mutations with non-UUID ids`);
      await db.mutations.bulkDelete(invalidMutations.map(m => m.localId!).filter(Boolean));
    }

    const mutations = allMutations.filter(m => !m.id || UUID_RE.test(m.id));
    if (mutations.length === 0) return 0;

    syncLog("push", `Pushing ${mutations.length} mutations for workspace=${wid.slice(0,8)}…`);

    let applied = 0;
    for (let i = 0; i < mutations.length; i += 100) {
      const batch = mutations.slice(i, i + 100);
      try {
        const payload = {
          workspaceId: wid,
          mutations: batch.map(m => ({
            table: m.table,
            operation: m.operation,
            id: m.id,
            data: m.data,
            idempotencyKey: m.idempotencyKey,
          })),
        };
        syncLog("push", `Sending batch ${i/100 + 1}: ${batch.length} mutations`, batch.map(m => `${m.table}:${m.operation}:${m.id?.slice(0,8)}`));
        const res = await authFetch("/api/sync/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const body = await res.json();
          syncLog("push", `Server response:`, body.results.map((r: { status: string; id?: string; error?: string }) => `${r.status}${r.error ? ':'+r.error : ''}`));
          // Delete ALL processed mutations from queue
          const processedLocalIds = batch.map(m => m.localId!).filter(Boolean);
          if (processedLocalIds.length > 0) {
            await db.mutations.bulkDelete(processedLocalIds);
          }
          applied += body.results.filter(
            (r: { status: string }) => r.status === "applied"
          ).length;
        } else {
          const bodyText = await res.text().catch(() => "");
          syncErr("push", `HTTP ${res.status} from /api/sync/commit:`, bodyText);
          // 400 = bad request (validation failure) — log details but DON'T delete,
          // these mutations have valid UUIDs so the issue may be transient (schema mismatch etc.)
          // 401 = needs token refresh — authFetch already retried, so give up for this cycle
          // 403 = not a workspace member — skip for now, don't delete user data
          // Other = server error, retry later
          break;
        }
      } catch (err) {
        syncErr("push", "Network error during push:", err);
        break; // Network error — stop, retry later (mutations stay in queue)
      }
    }
    syncLog("push", `Push complete: ${applied} applied, ${mutations.length - applied} remaining`);
    return applied;
  } finally {
    _pushInFlight = false;
  }
}

// ── Immediate push attempt (non-blocking) ──

export function trySyncPush(workspaceId?: string) {
  if (!navigator.onLine) { syncWarn("push", "Offline, skipping push"); return; }
  _lastMutationAt = Date.now();
  _schedulePoll(); // Switch to fast polling
  pushMutations(workspaceId).then(async () => {
    await pullChanges(workspaceId);
    const wid = workspaceId ?? getActiveWorkspaceId();
    if (wid) _broadcastSyncEvent(wid);
  }).catch((err) => { syncErr("push", "trySyncPush error:", err); });
}

// ── Pending mutation count ──

export async function getPendingMutationCount(): Promise<number> {
  return db.mutations.count();
}

// ── Sync engine lifecycle ──

let _syncTimeout: ReturnType<typeof setTimeout> | null = null;
let _onlineHandler: (() => void) | null = null;
let _visibilityHandler: (() => void) | null = null;
let _realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let _broadcastChannel: BroadcastChannel | null = null;
let _unsubAuth: (() => void) | null = null;
let _started = false;
let _currentWid: string | null = null;
let _lastMutationAt = 0;

const FAST_POLL_MS = 3_000;    // 3s after recent mutations
const SLOW_POLL_MS = 10_000;   // 10s when idle
const FAST_POLL_WINDOW = 120_000; // fast-poll for 2 minutes after last mutation

// ── Realtime channel setup (auth-aware, can be called multiple times) ──

function _setupRealtimeChannel(wid: string | null) {
  if (_realtimeChannel) {
    supabase.removeChannel(_realtimeChannel);
    _realtimeChannel = null;
  }
  if (!wid) return;

  syncLog("realtime", `Setting up Supabase channel for workspace=${wid.slice(0,8)}…`);
  _realtimeChannel = supabase
    .channel(`sync-${wid}`)
    .on("broadcast", { event: "sync" }, () => {
      syncLog("realtime", "Received broadcast sync event → pulling");
      pullChanges(wid);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `workspace_id=eq.${wid}` }, () => {
      syncLog("realtime", "postgres_changes on expenses → pulling");
      pullChanges(wid);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "workspace_settings", filter: `workspace_id=eq.${wid}` }, () => pullChanges(wid))
    .on("postgres_changes", { event: "*", schema: "public", table: "business_ledgers", filter: `workspace_id=eq.${wid}` }, () => pullChanges(wid))
    .on("postgres_changes", { event: "*", schema: "public", table: "business_payments", filter: `workspace_id=eq.${wid}` }, () => pullChanges(wid))
    .subscribe((status) => {
      syncLog("realtime", `Supabase channel status: ${status}`);
    });
}

// ── Broadcast to other devices/tabs after a successful push ──

function _broadcastSyncEvent(wid: string) {
  // Supabase Broadcast — cross-device notification
  if (_realtimeChannel) {
    syncLog("broadcast", `Sending Supabase broadcast for workspace=${wid.slice(0,8)}…`);
    _realtimeChannel.send({
      type: "broadcast",
      event: "sync",
      payload: { workspaceId: wid },
    }).then(() => syncLog("broadcast", "Supabase broadcast sent OK"))
      .catch((err: unknown) => syncErr("broadcast", "Supabase broadcast failed:", err));
  }
  // BroadcastChannel API — cross-tab notification (same browser)
  if (_broadcastChannel) {
    _broadcastChannel.postMessage({ type: "sync", workspaceId: wid });
  }
}

// ── Adaptive polling (fast after mutations, slow when idle) ──

function _schedulePoll() {
  if (_syncTimeout) { clearTimeout(_syncTimeout); _syncTimeout = null; }
  const elapsed = Date.now() - _lastMutationAt;
  const delay = elapsed < FAST_POLL_WINDOW ? FAST_POLL_MS : SLOW_POLL_MS;
  _syncTimeout = setTimeout(async () => {
    try {
      if (document.visibilityState === "visible" && navigator.onLine) {
        await _doSync();
      }
    } finally {
      // Always reschedule — even if _doSync throws, polling must continue
      _schedulePoll();
    }
  }, delay);
}

async function _doSync() {
  const wid = getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) {
    syncLog("doSync", `Skipped: wid=${wid ? wid.slice(0,8)+'…' : 'null'} authenticated=${isAuthenticated()}`);
    return;
  }
  try {
    if (!_migrated) {
      syncLog("migrate", "Running one-time migration…");
      await _migrateStuckData();
      _migrated = true;
      syncLog("migrate", "Migration complete");
    }
    await pushMutations(wid);
    await pullChanges(wid);
  } catch (err) {
    syncErr("doSync", "Exception:", err);
  }
}

// ── One-time migration: rescue temp- records and purge invalid mutations ──

async function _migrateStuckData() {
  try {
    // 1. Migrate temp- expenses to proper UUIDs and re-enqueue for sync
    const tempExpenses = await db.expenses.filter(e => e.id.startsWith("temp-")).toArray();
    for (const exp of tempExpenses) {
      const newId = generateUUID();
      await db.expenses.put({ ...exp, id: newId });
      await db.expenses.delete(exp.id);
      await db.mutations.add({
        table: "expenses",
        operation: "upsert",
        id: newId,
        data: {
          category: exp.category,
          amount: exp.amount,
          currency: exp.currency || null,
          day: exp.day,
          month: exp.month,
          year: exp.year,
          remark: exp.remark || null,
          isRecurring: exp.isRecurring ?? false,
          recurringId: exp.recurringId || null,
        },
        idempotencyKey: makeIdempotencyKey(),
        workspaceId: exp.workspaceId,
        createdAt: Date.now(),
      });
    }

    // 2. Migrate temp- ledgers
    const tempLedgers = await db.ledgers.filter(l => l.id.startsWith("temp-")).toArray();
    for (const led of tempLedgers) {
      const newId = generateUUID();
      await db.ledgers.put({ ...led, id: newId });
      await db.ledgers.delete(led.id);
      await db.mutations.add({
        table: "business_ledgers",
        operation: "upsert",
        id: newId,
        data: {
          name: led.name,
          expectedAmount: led.expectedAmount,
          currency: led.currency,
          status: led.status,
          dueDate: led.dueDate || null,
          tags: led.tags,
          notes: led.notes,
        },
        idempotencyKey: makeIdempotencyKey(),
        workspaceId: led.workspaceId,
        createdAt: Date.now(),
      });
    }

    // 3. Migrate temp- payments
    const tempPayments = await db.payments.filter(p => p.id.startsWith("temp-")).toArray();
    for (const pay of tempPayments) {
      const newId = generateUUID();
      await db.payments.put({ ...pay, id: newId });
      await db.payments.delete(pay.id);
      await db.mutations.add({
        table: "business_payments",
        operation: "upsert",
        id: newId,
        data: {
          ledgerId: pay.ledgerId,
          amount: pay.amount,
          date: pay.date,
          method: pay.method || null,
          reference: pay.reference || null,
          notes: pay.notes || null,
        },
        idempotencyKey: makeIdempotencyKey(),
        workspaceId: pay.workspaceId,
        createdAt: Date.now(),
      });
    }

    // 4. Purge all remaining mutations with non-UUID ids (stale, will always fail)
    const allMutations = await db.mutations.toArray();
    const toDelete = allMutations
      .filter(m => m.id && !UUID_RE.test(m.id))
      .map(m => m.localId!)
      .filter(Boolean);
    if (toDelete.length > 0) {
      await db.mutations.bulkDelete(toDelete);
    }
  } catch {
    // Non-fatal — pushMutations also filters invalid mutations as defense in depth
  }
}

export function startSyncEngine() {
  if (typeof window === "undefined" || _started) return;
  _started = true;

  syncLog("init", "Starting sync engine…");

  // Migrate legacy localStorage data to IDB
  migrateFromLocalStorage();

  // Force full re-sync on startup: clear saved cursors so the first pull
  // fetches ALL data from the server.
  db.syncMeta.clear().then(() => syncLog("init", "Cleared sync cursors for full re-sync"))
    .catch(() => {});

  // Auto-sync on reconnect
  _onlineHandler = () => { _doSync(); };
  window.addEventListener("online", _onlineHandler);

  // Auto-sync on tab focus
  _visibilityHandler = () => {
    if (document.visibilityState === "visible") _doSync();
  };
  document.addEventListener("visibilitychange", _visibilityHandler);

  // BroadcastChannel for cross-tab sync (same browser, instant)
  if (typeof BroadcastChannel !== "undefined") {
    _broadcastChannel = new BroadcastChannel("expenstream-sync");
    _broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "sync") pullChanges(event.data.workspaceId);
    };
  }

  // Auth-aware: re-subscribe Realtime when workspace changes
  _currentWid = getActiveWorkspaceId();
  _unsubAuth = subscribeAuth(() => {
    const newWid = getActiveWorkspaceId();
    if (newWid !== _currentWid) {
      _currentWid = newWid;
      _setupRealtimeChannel(newWid);
      if (newWid) _doSync();
    }
  });

  // Setup initial Realtime channel (if workspace already known)
  _setupRealtimeChannel(_currentWid);

  // Start adaptive polling
  _schedulePoll();

  // Initial sync
  _doSync();
}

export function stopSyncEngine() {
  if (_syncTimeout) { clearTimeout(_syncTimeout); _syncTimeout = null; }
  if (_onlineHandler) { window.removeEventListener("online", _onlineHandler); _onlineHandler = null; }
  if (_visibilityHandler) { document.removeEventListener("visibilitychange", _visibilityHandler); _visibilityHandler = null; }
  if (_realtimeChannel) { supabase.removeChannel(_realtimeChannel); _realtimeChannel = null; }
  if (_broadcastChannel) { _broadcastChannel.close(); _broadcastChannel = null; }
  if (_unsubAuth) { _unsubAuth(); _unsubAuth = null; }
  _started = false;
  _currentWid = null;
  _migrated = false;
  _pushInFlight = false;
}
