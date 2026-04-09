# ExpenStream — Sync Engine Architecture

## Overview

ExpenStream uses an **offline-first, optimistic sync** architecture. All writes go to IndexedDB first, then are pushed to the server in the background. Changes from other devices are pulled via cursor-based pagination and Supabase Realtime subscriptions.

```
┌─────────────────────────────────────────────────────────┐
│  Client (Browser)                                       │
│                                                         │
│  User Action → IDB Write (optimistic) → UI Update       │
│       │                                                 │
│       ▼                                                 │
│  Mutation Queue (IDB `mutations` table)                 │
│       │                                                 │
│       ▼                                                 │
│  Push Loop ──→ POST /api/sync/commit (batch ≤100)       │
│       │                                                 │
│       ▼                                                 │
│  Pull Loop ──→ GET /api/sync/changes?since=<cursor>     │
│       │                                                 │
│       ▼                                                 │
│  IDB Merge → Notify UI subscribers → Re-render          │
│                                                         │
│  Realtime: Supabase channels + BroadcastChannel API     │
└─────────────────────────────────────────────────────────┘
```

## Key Files

| File                                | Purpose                             |
| ----------------------------------- | ----------------------------------- |
| `src/lib/syncEngine.ts`             | Core sync orchestration (~820 LOC)  |
| `src/lib/db.ts`                     | Dexie schema, IDB tables, migration |
| `src/lib/authClient.ts`             | `authFetch()` with auto-refresh     |
| `src/app/api/sync/changes/route.ts` | Server: pull changes endpoint       |
| `src/app/api/sync/commit/route.ts`  | Server: push mutations endpoint     |

---

## Push Flow

### Mutation Enqueueing

1. User creates/edits/deletes an expense
2. Write to IDB immediately (optimistic)
3. Call `enqueueMutation()` → inserts into `mutations` table with:
   - `idempotencyKey`: `${Date.now()}-${counter}-${Math.random()}`
   - `table`: "expenses" | "workspace_settings" | "business_ledgers" | "business_payments"
   - `operation`: "upsert" | "delete"
   - `data`: full row data
4. Call `trySyncPush()` → non-blocking, switches to fast polling

### Push Execution (`pushMutations()`)

```
1. Guard: _pushInFlight flag prevents concurrent pushes
2. Read all mutations from IDB for workspace
3. Filter: only mutations with valid UUID ids (skip temp- IDs)
4. Batch: 100 mutations per POST request
5. POST /api/sync/commit with batch
6. On 200: delete processed mutations from IDB queue
7. On 400: log error, keep mutations (may be transient)
8. On 401: authFetch already retried; give up for this cycle
9. On 403: notify access denied listeners, stop
10. On timeout (30s): abort, mutations stay in queue
11. On network error: stop, retry next cycle
```

### Idempotency

Each mutation has a unique `idempotencyKey`. The server checks for duplicates and skips already-applied mutations, returning `status: "skipped"`. This prevents duplicate writes from retries.

---

## Pull Flow

### Cursor-Based Pagination (`pullChanges()`)

```
1. Guard: _pullInFlight Map deduplicates concurrent pulls per workspace
2. First pull after page load: ALWAYS full sync (ignore stored cursor)
3. Subsequent pulls: use stored cursor from `syncMeta` table
4. GET /api/sync/changes?workspaceId=<wid>&since=<cursor>
5. Server returns: { cursor, changes, hasMore }
6. Timeout: 15s per request
7. On 403: notify access denied, return false
```

### Merge Logic

```
For each incoming change:
  1. Check pending local mutations:
     - If local DELETE pending for this ID → skip incoming change
     - This ensures local deletes always win
  2. If incoming has deletedAt → delete from IDB
  3. Otherwise → upsert into IDB
  4. Update cursor in syncMeta
  5. If hasMore → recurse (paginate)
  6. Notify all UI subscribers via _notifySyncPull()
```

### Settings Merge (Special Case)

Settings sync uses timestamp comparison:

- `remote.updatedAt > local.updatedAt` → accept remote
- `local.updatedAt > remote.updatedAt` → push local back
- Equal timestamps → prefer whichever has real data (salary > 0)
- Never overwrite non-zero salary with 0 (safeguard)

---

## Conflict Resolution

| Scenario                     | Resolution                       | Rationale                         |
| ---------------------------- | -------------------------------- | --------------------------------- |
| Local delete + server update | **Local delete wins**            | User intent to delete is stronger |
| Server newer timestamp       | **Server wins**                  | Latest write wins                 |
| Local newer timestamp        | **Local wins, push back**        | Local changes pushed to server    |
| Concurrent edits             | **Last-write-wins** by timestamp | Simple, predictable               |
| Same timestamp               | **Prefer data over empty**       | Conservative, prevents data loss  |

---

## Realtime

### Supabase Channels

```
Channel: sync-${workspaceId}
  .on('broadcast', { event: 'sync' })  → pullChanges()
  .on('postgres_changes', expenses)     → pullChanges()
  .on('postgres_changes', settings)     → pullChanges()
  .on('postgres_changes', ledgers)      → pullChanges()
  .on('postgres_changes', payments)     → pullChanges()
```

### Echo Suppression

After a push, the realtime subscription will receive the same changes back. A 3-second cooldown (`REALTIME_ECHO_COOLDOWN`) after the last push suppresses redundant pulls.

### BroadcastChannel API

Used for same-browser cross-tab sync. When one tab pushes changes, it broadcasts to other tabs to trigger a pull.

---

## Adaptive Polling

| Phase      | Interval   | Trigger                                   |
| ---------- | ---------- | ----------------------------------------- |
| **Fast**   | 3 seconds  | After any local mutation (for 2 minutes)  |
| **Slow**   | 10 seconds | Default idle state                        |
| **Paused** | None       | Tab hidden, offline, or not authenticated |

The polling interval adapts based on `_lastMutationAt`:

- If `Date.now() - _lastMutationAt < FAST_POLL_WINDOW (120s)` → fast poll
- Otherwise → slow poll

Additional triggers that bypass polling interval:

- `window.online` event → immediate sync
- `visibilitychange` (tab restored) → immediate sync
- BroadcastChannel message from another tab → immediate pull
- Supabase Realtime event → immediate pull

---

## Timeout Protection

| Operation                   | Timeout | Behavior on Timeout                   |
| --------------------------- | ------- | ------------------------------------- |
| `pullChanges()` per request | 15s     | Abort, return false, retry next cycle |
| `pushMutations()` per batch | 30s     | Abort, mutations stay in queue        |
| `_doSync()` master          | 60s     | Abort entire cycle, reset to idle     |

---

## Migration Handling

### localStorage → IDB Migration

On first use of IDB, migrates:

- `expenstream-offline-mutations` → IDB `mutations` table
- `expenstream-sync-cursor` → IDB `syncMeta` table
- Flag: `expenstream-idb-migrated` in localStorage

### Temp ID Migration

Expenses created offline get temporary IDs (`temp-${uuid}`). On startup:

1. `_migrateStuckData()` finds all temp- records
2. Re-enqueues them as new mutations with proper UUIDs
3. Deletes the temp- records from IDB

---

## Error Handling

| HTTP Status   | Pull Behavior                        | Push Behavior                          |
| ------------- | ------------------------------------ | -------------------------------------- |
| 200           | Merge changes, update cursor         | Delete processed mutations             |
| 400           | Log error, return false              | Log, keep mutations (may be transient) |
| 401           | authFetch retried; give up for cycle | Same                                   |
| 403           | Notify access denied, stop           | Notify access denied, stop             |
| 5xx           | Log error, retry next cycle          | Log error, retry next cycle            |
| Timeout       | Abort, retry next cycle              | Abort, mutations stay in queue         |
| Network error | Log, retry next cycle                | Log, retry next cycle                  |

---

## Known Edge Cases

1. **Double updates on poor networks**: Realtime may lag while polling catches up, causing double pulls. Mitigated by cursor dedup and IDB upsert idempotency.

2. **MAD anomaly with identical amounts**: If all expenses in a category have the same amount, MAD = 0 and no anomalies are flagged. This is correct behavior (no variance = no anomalies).

3. **Settings timestamp equality**: When local and remote have the same timestamp but different content, the system prefers whichever has real data (e.g., salary > 0). A content-hash tiebreaker would be more robust.

4. **Exchange rate staleness**: Rates are cached in IDB for 24 hours. If all API sources fail, hardcoded fallback rates from April 2026 are used but NOT cached.

5. **Offline queue data exposure**: Pending mutations in the offline queue contain sensitive data. Local encryption should be enabled for production deployments.
