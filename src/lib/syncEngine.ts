import { db, migrateFromLocalStorage } from "./db";
import type { IDBMutation } from "./db";
import { authFetch, getActiveWorkspaceId, isAuthenticated, subscribeAuth } from "./authClient";
import { supabase } from "./supabase";
import { encryptJSON, decryptJSON, hasEncryptionKey } from "./crypto";
import * as Sentry from "@sentry/nextjs";

// ── Sync logging — visible in browser console for debugging ──

const SYNC_LOG = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SYNC_LOG === "true";
function syncLog(tag: string, ...args: unknown[]) {
  if (SYNC_LOG) console.log(`[sync:${tag}]`, ...args);
}
function syncWarn(tag: string, ...args: unknown[]) {
  console.warn(`[sync:${tag}]`, ...args);
}
function syncErr(tag: string, ...args: unknown[]) {
  console.error(`[sync:${tag}]`, ...args);
  // Report sync errors to Sentry for observability
  const message = args.map(a => (a instanceof Error ? a.message : String(a))).join(" ");
  const error = args.find(a => a instanceof Error) as Error | undefined;
  Sentry.captureException(error ?? new Error(`[sync:${tag}] ${message}`));
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

// ── Observable sync status for UI ──

type SyncPhase = "idle" | "syncing" | "error";
let _syncPhase: SyncPhase = "idle";
const _syncPhaseListeners = new Set<(phase: SyncPhase) => void>();

function _setSyncPhase(phase: SyncPhase) {
  if (_syncPhase === phase) return;
  _syncPhase = phase;
  _syncPhaseListeners.forEach((fn) => fn(phase));
}

export function getSyncPhase(): SyncPhase { return _syncPhase; }

export function onSyncPhaseChange(fn: (phase: SyncPhase) => void): () => void {
  _syncPhaseListeners.add(fn);
  return () => { _syncPhaseListeners.delete(fn); };
}

// ── Workspace access denied observable ──

type AccessDeniedListener = (workspaceId: string) => void;
const _accessDeniedListeners = new Set<AccessDeniedListener>();

export function onWorkspaceAccessDenied(fn: AccessDeniedListener): () => void {
  _accessDeniedListeners.add(fn);
  return () => { _accessDeniedListeners.delete(fn); };
}

function _notifyAccessDenied(workspaceId: string) {
  syncWarn("pull", `Access denied (403) for workspace ${workspaceId.slice(0, 8)}…`);
  _accessDeniedListeners.forEach((fn) => fn(workspaceId));
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

const MAX_MUTATION_QUEUE_SIZE = 500;

export async function enqueueMutation(
  mutation: Omit<IDBMutation, "localId" | "createdAt" | "workspaceId">,
  workspaceId: string,
): Promise<void> {
  // Cap the mutation queue to prevent unbounded growth while offline
  const count = await db.mutations.where("workspaceId").equals(workspaceId).count();
  if (count >= MAX_MUTATION_QUEUE_SIZE) {
    syncErr("enqueue", `Mutation queue full (${count}/${MAX_MUTATION_QUEUE_SIZE}). Dropping oldest entries.`);
    // Remove oldest 10% to make room
    const oldest = await db.mutations
      .where("workspaceId")
      .equals(workspaceId)
      .sortBy("createdAt");
    const toRemove = oldest.slice(0, Math.ceil(MAX_MUTATION_QUEUE_SIZE * 0.1));
    await db.mutations.bulkDelete(toRemove.map((m) => m.localId!));
  }

  syncLog("enqueue", `${mutation.table}:${mutation.operation} id=${mutation.id?.slice(0,8)}… key=${mutation.idempotencyKey}`);

  // Encrypt mutation data at rest if encryption key is available
  let storedData = mutation.data;
  if (hasEncryptionKey() && mutation.data && Object.keys(mutation.data).length > 0) {
    const encrypted = await encryptJSON(mutation.data);
    storedData = { __enc: encrypted };
  }

  await db.mutations.add({
    ...mutation,
    data: storedData,
    workspaceId,
    createdAt: Date.now(),
  });

  // Register Background Sync so the SW wakes us when connectivity returns
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((reg) => (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register("mutation-push"))
      .catch(() => { /* Background Sync not supported or denied */ });
  }
}

// ── Pull changes from server into IDB ──

let _migrated = false;
const _pullInFlight = new Map<string, Promise<boolean>>();

export async function pullChanges(workspaceId?: string): Promise<boolean> {
  // Wait for cursor clear to finish before pulling
  await _initReady;

  const wid = workspaceId ?? getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) {
    // No sync possible — resolve the gate so local-only recurring can proceed
    if (_firstPullResolve) { _firstPullResolve(); _firstPullResolve = null; }
    return false;
  }

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
      // Use stored cursor if available; only do full sync if no cursor exists.
      // This avoids re-fetching all data on every page load.
      const syncMeta = await db.syncMeta.get(wid);
      const useFullSync = !syncMeta?.cursor;
      if (!_firstPullDone) _firstPullDone = true;

      const params = new URLSearchParams({ workspaceId: wid });
      if (!useFullSync && syncMeta?.cursor) {
        params.set("since", syncMeta.cursor);
      }
      syncLog("pull", `Fetching changes for workspace=${wid.slice(0,8)}… since=${useFullSync ? "NONE (forced full sync)" : (syncMeta?.cursor ?? "NONE (no cursor)")}`);
      const res = await authFetch(`/api/sync/changes?${params}`, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        if (res.status === 403) {
          _notifyAccessDenied(wid);
          return false;
        }
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

      // Track whether we actually wrote something (skip _notifySyncPull if no real changes)
      let didWrite = false;

      // Pre-read existing settings to avoid redundant writes
      const existingSettings = changes.settings ? await db.settings.get(wid) : null;

      await db.transaction(
        "rw",
        [db.expenses, db.settings, db.ledgers, db.payments, db.syncMeta],
        async () => {
          // ── Expenses ──
          if (changes.expenses?.length) {
            // Batch-fetch all existing records for conflict detection (one query vs N)
            const incomingIds = changes.expenses
              .filter((r: Record<string, unknown>) => !r.deletedAt && !pendingDeleteIds.has(r.id as string))
              .map((r: Record<string, unknown>) => r.id as string);
            const existingMap = new Map(
              (await db.expenses.bulkGet(incomingIds))
                .filter(Boolean)
                .map((e) => [e!.id, e!])
            );

            let conflictCount = 0;
            for (const row of changes.expenses) {
              if (pendingDeleteIds.has(row.id)) continue;
              if (row.deletedAt) {
                await db.expenses.delete(row.id);
              } else {
                const serverUpdatedAt = new Date(row.updatedAt).getTime();
                const existing = existingMap.get(row.id);
                if (existing && existing.updatedAt > serverUpdatedAt) {
                  conflictCount++;
                }
                await db.expenses.put({
                  id: row.id,
                  workspaceId: wid,
                  category: row.category,
                  amount: Number(row.amount),
                  currency: row.currency ?? undefined,
                  day: Number(row.day),
                  month: Number(row.month),
                  year: Number(row.year),
                  remark: row.remark ?? undefined,
                  isRecurring: row.isRecurring ?? false,
                  recurringId: row.recurringId ?? undefined,
                  createdAt: new Date(row.createdAt).getTime(),
                  updatedAt: serverUpdatedAt,
                  deletedAt: null,
                });
              }
              didWrite = true;
            }
            if (conflictCount > 0 && _broadcastChannel) {
              _broadcastChannel.postMessage({ type: "sync-conflict", count: conflictCount });
            }
          }

          // ── Settings ──
          if (changes.settings) {
            const s = changes.settings;
            const incoming = {
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
              rolloverCap: s.rolloverCap ?? 0,
              rolloverHistory: s.rolloverHistory ?? {},
              monthlyBudgets: s.monthlyBudgets ?? {},
              businessMode: s.businessMode ?? false,
              revenueExpectations: s.revenueExpectations ?? [],
              businessTags: s.businessTags ?? [],
              dashboardLayout: s.dashboardLayout ?? undefined,
              multiCurrencyEnabled: s.multiCurrencyEnabled ?? false,
              dismissedRecurringSuggestions: s.dismissedRecurringSuggestions ?? [],
              autoRules: s.autoRules ?? [],
              achievements: s.achievements ?? [],
              accentColor: s.accentColor ?? undefined,
              sunsetTheme: s.sunsetTheme ?? false,
              notificationPrefs: s.notificationPrefs ?? undefined,
              updatedAt: new Date(s.updatedAt as string).getTime(),
            };
            // Only write if settings actually changed (avoids unnecessary
            // Dexie observable triggers → re-renders → onSyncPull loops)
            const hasPendingSettingsMutation = pendingMutations.some(
              m => m.table === "workspace_settings"
            );
            const settingsChanged = !existingSettings
              || existingSettings.salary !== incoming.salary
              || existingSettings.currency !== incoming.currency
              || existingSettings.updatedAt !== incoming.updatedAt
              || JSON.stringify(existingSettings.categories) !== JSON.stringify(incoming.categories)
              || JSON.stringify(existingSettings.categoryBudgets) !== JSON.stringify(incoming.categoryBudgets)
              || JSON.stringify(existingSettings.recurringExpenses) !== JSON.stringify(incoming.recurringExpenses)
              || JSON.stringify(existingSettings.autoRules) !== JSON.stringify(incoming.autoRules)
              || JSON.stringify(existingSettings.achievements) !== JSON.stringify(incoming.achievements)
              || JSON.stringify(existingSettings.monthlyBudgets) !== JSON.stringify(incoming.monthlyBudgets)
              || existingSettings.accentColor !== incoming.accentColor
              || existingSettings.rolloverEnabled !== incoming.rolloverEnabled
              || existingSettings.businessMode !== incoming.businessMode
              || existingSettings.multiCurrencyEnabled !== incoming.multiCurrencyEnabled
              || existingSettings.sunsetTheme !== incoming.sunsetTheme
              || JSON.stringify(existingSettings.notificationPrefs) !== JSON.stringify(incoming.notificationPrefs);
            if (hasPendingSettingsMutation) {
              // Local settings mutations are queued but not yet pushed — do not
              // overwrite IDB with potentially stale server data before the push.
              syncLog("pull", "Skipping settings write — pending settings mutation in queue");
            } else if (existingSettings && existingSettings.updatedAt > incoming.updatedAt) {
              // IDB is already newer than what the server sent (e.g. push failed
              // mid-cycle). Preserve local state and let onSyncPull re-push it.
              syncLog("pull", `Skipping settings write — IDB is newer (IDB=${existingSettings.updatedAt}, server=${incoming.updatedAt})`);
            } else if (settingsChanged) {
              syncLog("pull", "Settings changed — writing to IDB");
              // Preserve local-only fields the server may not store yet
              const merged = existingSettings
                ? { ...existingSettings, ...incoming, sunsetTheme: incoming.sunsetTheme || existingSettings.sunsetTheme || false }
                : incoming;
              await db.settings.put(merged);
              didWrite = true;
            } else {
              syncLog("pull", "Settings unchanged — skipping IDB write");
            }
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
              didWrite = true;
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
              didWrite = true;
            }
          }

          // ── Update cursor ──
          if (cursor) {
            await db.syncMeta.put({ workspaceId: wid, cursor, lastSyncAt: Date.now() });
          }
        }
      );

      // Only notify subscribers if we actually wrote data — prevents
      // cascading re-renders and push-pull loops from no-op pulls.
      if (didWrite) {
        syncLog("pull", "Data changed — notifying subscribers");
        _notifySyncPull();
      } else {
        syncLog("pull", "No data changes — skipping notification");
      }

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
    // Resolve the first-pull gate so recurring instantiation can proceed
    if (_firstPullResolve) { _firstPullResolve(); _firstPullResolve = null; }
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
        // Decrypt any encrypted mutation data before sending to server
        const decryptedBatch = await Promise.all(
          batch.map(async (m) => {
            let data = m.data;
            if (data && typeof data.__enc === "string") {
              try {
                data = await decryptJSON<Record<string, unknown>>(data.__enc as string);
              } catch {
                syncWarn("push", `Failed to decrypt mutation ${m.idempotencyKey}, sending as-is`);
              }
            }
            return { ...m, data };
          })
        );
        const payload = {
          workspaceId: wid,
          mutations: decryptedBatch.map(m => ({
            table: m.table,
            operation: m.operation,
            id: m.id,
            data: m.data,
            idempotencyKey: m.idempotencyKey,
          })),
        };
        syncLog("push", `Sending batch ${i/100 + 1}: ${batch.length} mutations`, batch.map(m => `${m.table}:${m.operation}:${m.id?.slice(0,8)}`));
        const pushStart = Date.now();
        const res = await authFetch("/api/sync/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30_000),
        });
        // Update rolling RTT average for adaptive echo suppression
        const rtt = Date.now() - pushStart;
        _measuredRtt = _measuredRtt > 0 ? _measuredRtt * 0.7 + rtt * 0.3 : rtt;
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
          if (res.status === 403) {
            _notifyAccessDenied(wid);
            break;
          }
          // 400 = bad request (validation failure) — log details but DON'T delete,
          // these mutations have valid UUIDs so the issue may be transient (schema mismatch etc.)
          // 401 = needs token refresh — authFetch already retried, so give up for this cycle
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

export function trySyncPush(workspaceId?: string, showSpinner = false) {
  if (!navigator.onLine) { syncWarn("push", "Offline, skipping push"); return; }
  _lastMutationAt = Date.now();
  _schedulePoll(); // Switch to fast polling
  if (showSpinner) _setSyncPhase("syncing");
  pushMutations(workspaceId).then(async (applied) => {
    await pullChanges(workspaceId);
    const wid = workspaceId ?? getActiveWorkspaceId();
    if (wid && applied > 0) _broadcastSyncEvent(wid);
    if (showSpinner) _setSyncPhase("idle");
  }).catch((err) => {
    syncErr("push", "trySyncPush error:", err);
    _setSyncPhase("error");
  });
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
const MAX_BACKOFF_MS = 60_000; // max 60s between retries on error
const FAST_POLL_WINDOW = 120_000; // fast-poll for 2 minutes after last mutation
let _measuredRtt = 0; // Rolling average of push RTT in ms (used for adaptive polling)
let _consecutiveErrors = 0;

// ── Realtime channel setup (auth-aware, can be called multiple times) ──

function _setupRealtimeChannel(wid: string | null) {
  if (_realtimeChannel) {
    supabase.removeChannel(_realtimeChannel);
    _realtimeChannel = null;
  }
  if (!wid) return;

  syncLog("realtime", `Setting up Supabase channel for workspace=${wid.slice(0,8)}…`);
  // postgres_changes listeners removed: RLS (deny-all for anon) blocks them.
  // Cross-device sync is covered by explicit broadcast sent after every push
  // (see _broadcastSyncEvent) plus adaptive polling (3 s fast / 10 s idle).
  _realtimeChannel = supabase
    .channel(`sync-${wid}`)
    .on("broadcast", { event: "sync" }, () => {
      syncLog("realtime", "Received broadcast sync event → pulling");
      pullChanges(wid);
    })
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
  let delay = elapsed < FAST_POLL_WINDOW ? FAST_POLL_MS : SLOW_POLL_MS;
  // Exponential backoff on consecutive errors
  if (_consecutiveErrors > 0) {
    delay = Math.min(delay * Math.pow(2, _consecutiveErrors), MAX_BACKOFF_MS);
  }
  _syncTimeout = setTimeout(async () => {
    try {
      if (document.visibilityState === "visible" && navigator.onLine) {
        await _doSync();
        _consecutiveErrors = 0;
      }
    } catch {
      _consecutiveErrors++;
    } finally {
      // Always reschedule — even if _doSync throws, polling must continue
      _schedulePoll();
    }
  }, delay);
}

async function _doSync() {
  // Wait for cursor clear to finish before any sync work
  await _initReady;

  const wid = getActiveWorkspaceId();
  if (!wid || !isAuthenticated()) {
    syncLog("doSync", `Skipped: wid=${wid ? wid.slice(0,8)+'…' : 'null'} authenticated=${isAuthenticated()}`);
    return;
  }

  // Master timeout: abort entire sync cycle after 60s to prevent hangs
  const masterTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Sync master timeout (60s)")), 60_000)
  );

  try {
    await Promise.race([
      (async () => {
        if (!_migrated) {
          syncLog("migrate", "Running one-time migration…");
          await _migrateStuckData();
          _migrated = true;
          syncLog("migrate", "Migration complete");
        }
        await pushMutations(wid);
        await pullChanges(wid);
        _setSyncPhase("idle");
      })(),
      masterTimeout,
    ]);
  } catch (err) {
    syncErr("doSync", "Exception:", err);
    _setSyncPhase("error");
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

// Promise gate: no sync operations proceed until init is done.
let _initReady: Promise<void> = Promise.resolve();

// One-time repair switch: clear stale cursors created before the
// pagination/cursor fix so clients perform a full pull once.
const CURSOR_REPAIR_KEY = "expenstream-sync-cursor-repair-v1";

// Flag: first pull for each workspace always does a full sync (ignores cursor)
let _firstPullDone = false;

// Promise gate: resolves after the first pullChanges completes (or if user is offline/unauthenticated)
let _firstPullResolve: (() => void) | null = null;
let _firstPullPromise: Promise<void> = new Promise((r) => { _firstPullResolve = r; });

/** Wait until the initial sync pull has completed. Resolves immediately if already done. */
export function waitForFirstPull(): Promise<void> {
  return _firstPullPromise;
}

export function startSyncEngine() {
  if (typeof window === "undefined" || _started) return;
  _started = true;

  syncLog("init", "Starting sync engine…");

  // Init gate — migrate legacy data before any pull can run.
  // Cursor clear is NOT needed: pullChanges ignores stored cursor on first pull.
  _initReady = (async () => {
    try {
      await migrateFromLocalStorage();

      // Force a single full sync after deploying the cursor-safety fix.
      if (typeof localStorage !== "undefined" && localStorage.getItem(CURSOR_REPAIR_KEY) !== "1") {
        await db.syncMeta.clear();
        localStorage.setItem(CURSOR_REPAIR_KEY, "1");
        syncLog("init", "Applied one-time cursor repair: cleared sync cursors for full re-pull");
      }
    } catch {
      // Non-fatal
    }
  })();

  // Set up event handlers — they can fire at any time, but _doSync / pullChanges
  // will await _initReady before doing real work, so the cursor is always clear.
  _onlineHandler = () => { _doSync(); };
  window.addEventListener("online", _onlineHandler);

  // Listen for Background Sync push requests from the SW
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_PUSH_REQUESTED") {
        syncLog("bgSync", "SW requested mutation push after reconnect");
        _doSync();
      }
    });
  }

  _visibilityHandler = () => {
    if (document.visibilityState === "visible") _doSync();
  };
  document.addEventListener("visibilitychange", _visibilityHandler);

  if (typeof BroadcastChannel !== "undefined") {
    _broadcastChannel = new BroadcastChannel("expenstream-sync");
    _broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "sync") pullChanges(event.data.workspaceId);
    };
  }

  _currentWid = getActiveWorkspaceId();
  _unsubAuth = subscribeAuth(() => {
    const newWid = getActiveWorkspaceId();
    if (newWid !== _currentWid) {
      _currentWid = newWid;
      _setupRealtimeChannel(newWid);
      if (newWid) _doSync();
    }
  });

  _setupRealtimeChannel(_currentWid);

  // Kick off first sync after cursor clear completes, then start polling
  _initReady.then(() => _doSync()).finally(() => _schedulePoll());
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
  _firstPullDone = false;
  _firstPullResolve = null;
  _firstPullPromise = new Promise((r) => { _firstPullResolve = r; });
  _initReady = Promise.resolve();
  _setSyncPhase("idle");
}
