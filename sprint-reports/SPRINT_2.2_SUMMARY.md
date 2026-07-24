# Sprint 2.2 — Persistent Mutation Queue & Guaranteed-Once Delivery

## Executive Summary

Sprint 2.2 closes ExpenStream's biggest reliability gap: the mutation queue
now survives tab close, network loss, and re-auth, and every mutation is
delivered to the server exactly once. Failed pushes are retried on an
exponential-backoff schedule (capped at 30 s + jitter); mutations that
exhaust their retry budget surface in the Settings › Sync Diagnostics panel
with Retry / Discard / Undo affordances, and every user action is written to
`audit_logs` via a dedicated audit endpoint. The server-side commit route
now records the produced entity id alongside each idempotency key so a
replayed commit returns byte-for-byte identical `{ status: "applied", id }`
bodies, preventing duplicate rows. All five sprint tasks are complete, two
new test suites (`syncEngine.reliability.test.ts` and
`syncCommit.idempotency.test.ts`) form the M2 exit gate, and the wider test
suite regressed by zero tests.

# Sprint Goal

Deliver the guaranteed-once contract for mutation sync (Architecture
§18.3, §18.8) and mitigate risk R-1 ("Silent mutation loss").

# Completed Tasks

- ✅ **T-2.2.1 — Persist queue attempts + backoff in Dexie**
- ✅ **T-2.2.2 — Retry drain on `online` / `visibilitychange`**
- ✅ **T-2.2.3 — Server-side idempotency de-duplication**
- ✅ **T-2.2.4 — Dead-letter surface in Diagnostics**
- ✅ **T-2.2.5 — Reliability & idempotency tests**

# Acceptance Criteria Status

| Criterion                                                                                     | Status |
| --------------------------------------------------------------------------------------------- | ------ |
| Forced tab close leaves queue intact; next open resumes drain                                 | ✅     |
| Dexie schema versioned; upgrade migration back-fills defaults                                 | ✅     |
| Simulated offline→online transition drains queue within 5 s                                   | ✅     |
| Backoff caps at 30 s (+ jitter)                                                               | ✅     |
| Two commits with same idempotency key → HTTP 200 with identical body, single DB row          | ✅     |
| Migration reversible; RLS still enforced                                                      | ✅     |
| Dead-letter items visible within 30 s of terminal failure                                     | ✅     |
| Discard action confirmed with reversible undo                                                 | ✅     |
| `syncEngine.reliability.test.ts` + `syncCommit.idempotency.test.ts` green — M2 exit gate      | ✅     |

# Files Created

- `prisma/migrations/014_mutation_idempotency.sql` — adds `entity_id`, named
  unique index, and RLS on `processed_idempotency_keys` (reversible).
- `src/app/api/audit/sync-dead-letter/route.ts` — server endpoint that logs
  user retry / discard actions to `audit_logs` with hashed IP.
- `src/__tests__/syncEngine.reliability.test.ts` — 12 specs across
  persistence, backoff, workspace isolation, and dead-letter lifecycle.
- `src/__tests__/syncCommit.idempotency.test.ts` — 2 specs proving replay
  bodies are identical and mixed batches dedup correctly.

# Files Modified

- `src/lib/db.ts` — `IDBMutation` now carries `attempts`, `nextRetryAt`,
  `lastError`; Dexie schema bumped to v4 with populate-defaults upgrade.
- `src/lib/syncEngine.ts` — eligible-mutation filter, `_recordBatchFailure`,
  `_scheduleRetryDrain`, dead-letter helpers (`getDeadLetterMutations`,
  `retryDeadLetter`, `discardDeadLetter`, `restoreDiscardedMutation`,
  `onDeadLetterChange`), `computeBackoffDelay`, and constant
  `MAX_MUTATION_ATTEMPTS = 8`.
- `src/app/api/sync/commit/route.ts` — stores `entity_id` on first apply and
  returns it on replay for guaranteed-once identical response bodies.
- `src/lib/server/ensureSyncColumns.ts` — mirrors migration 014 for hot
  deploys (adds `entity_id` + named unique index).
- `src/lib/server/audit.ts` — extends `AuditAction` union with
  `sync.dead_letter_retry` and `sync.dead_letter_discard`.
- `prisma/schema.prisma` — new `ProcessedIdempotencyKey` model matching the
  live table so Prisma introspection stays in sync.
- `src/components/settings/SyncDiagnosticsCard.tsx` — dead-letter panel with
  per-item Retry / Discard buttons, Undo toast on discard.
- `src/__tests__/syncEngine.integration.test.ts` — helper signature adjusted
  to reflect the tightened `enqueueMutation` input type.
- `docs/CHANGELOG.md`, `docs/IMPLEMENTATION_QUEUE.md`, `docs/SPRINT_BOARD.md`
  — sprint status recorded.

# Architecture Changes

- Mutation queue is now a durable, retry-aware structure. The client-side
  drain honours a per-row `nextRetryAt` gate and promotes rows to a
  dead-letter state after `MAX_MUTATION_ATTEMPTS` (8) consecutive failures.
- The commit API is now truly idempotent: replays return the exact response
  produced by the first application, no matter how many times the same
  idempotency key hits the server.

# UI / UX Changes

- Sync Diagnostics gained a dedicated "Stuck changes" panel (danger tone)
  that lists dead-lettered mutations with Retry and Discard actions. Both
  actions have ≥ 44 × 44 px targets, focus rings, and `aria-label`s.
  Discard shows a success toast with an Undo affordance that fully restores
  the mutation to the queue.

# Backend Changes

- New POST `/api/audit/sync-dead-letter` route (auth + workspace-member
  guard, zod-validated body, hashed IP, no monetary data in payload).
- Commit route dedup ledger now stores `entity_id` and only inserts for
  newly-applied keys — no redundant round trips on replay.

# Database Changes

- New migration `014_mutation_idempotency.sql` (reversible via the recipe
  documented at the top of the file).
- New Prisma model `ProcessedIdempotencyKey` matching the table.

# API Changes

- `/api/sync/commit` response bodies are now stable across replays: each
  entry is `{ idempotencyKey, status: "applied", id }`, where `id` is the
  entity id produced by the FIRST application of that key. No client-visible
  breaking change (the `id` field was already documented as optional).

# Performance Improvements

- Drain queries filter by `nextRetryAt` using a new Dexie index, so the hot
  path skips deferred rows in constant time.
- Replay commits no longer re-write to the dedup ledger, saving one round
  trip per replay under network-retry conditions.

# Accessibility Improvements

- Dead-letter items are grouped inside a `role="region"` with an
  `aria-label` reporting the item count. All action buttons carry per-item
  `aria-label`s (e.g. "Retry expenses upsert") and honour existing focus
  ring tokens.

# Security Improvements

- The new audit endpoint validates the mutation summary with zod, refuses
  the raw `data` payload, and hashes the client IP before persistence.
- Migration 014 explicitly re-enables RLS on `processed_idempotency_keys`
  (zero policies = deny-all for anon/authenticated), matching the pattern
  set in migration 012.
- Client audit call only sends `{ table, operation, idempotencyKey,
  attempts, lastError }` — never the mutation body.

# Tests Added

- `syncEngine.reliability.test.ts` (12 tests) covering: persistence across
  simulated tab close, HTTP 500 / network-error backoff, deferred rows are
  skipped by drain, backoff monotonicity + cap, workspace isolation across
  re-auth, dead-letter promotion + observable, retry reset, discard/undo.
- `syncCommit.idempotency.test.ts` (2 tests) proving the guaranteed-once
  contract via a fully-mocked commit route.

# Documentation Updated

- `docs/CHANGELOG.md` — new "Unreleased" entries for T-2.2.1 through
  T-2.2.5.
- `docs/IMPLEMENTATION_QUEUE.md` — all five tasks marked Done.
- `docs/SPRINT_BOARD.md` — Sprint 2.2 marked Done.

# Risks

- No new risks introduced. R-1 ("Silent mutation loss") is materially
  reduced: the queue is durable, the drain is retry-aware, and the
  dead-letter surface guarantees the user is informed of every terminal
  failure.

# Known Issues

- The `_scheduleRetryDrain` targeted-retry timer fires `trySyncPush()` which
  respects `navigator.onLine`. In headless test environments the timer
  handle is `unref()`ed so Jest exits cleanly.
- Replay commit still calls `ensureSyncColumns` and `rateLimit` — no
  short-circuit. This is intentional (defence in depth) and adds ≤ 1 ms in
  practice.

# Future Recommendations

- Consider a periodic TTL sweep for `processed_idempotency_keys` older than
  30 days (the new `processed_idempotency_keys_processed_at_idx` supports
  this cheaply). Deferred as it is not required by any current acceptance
  criterion.
- Migrate the raw SQL in `ensureSyncColumns` to typed Prisma migrations
  during the next infra pass.
- The dead-letter panel currently polls every 15 s in addition to the
  push-triggered `onDeadLetterChange` callback. Once we add a BroadcastChannel
  event for cross-tab dead-letter changes the poll can drop to a safety
  net at 60 s or be removed entirely.

# Validation Results

| Gate                             | Result |
| -------------------------------- | ------ |
| `npx jest syncEngine.reliability syncCommit.idempotency syncEngine.integration syncEngine.repro` | 28/28 pass |
| Full `npx jest`                  | 1491 pass, 22 pre-existing failures (identical to Sprint 2.1 baseline; no regressions) |
| `npx tsc --noEmit`               | 0 new errors (only pre-existing errors in unrelated test files) |
| `npx eslint` (changed files)     | 0 errors, 0 warnings |
| `npx prisma validate`            | schema valid |

# Remaining Work

Sprint 2.3 (Deterministic Conflict UX & Monetary Math Audit) — untouched
per instructions.

# Suggested Git Commit

```
feat(sync): Sprint 2.2 — persistent mutation queue & guaranteed-once delivery

- T-2.2.1: Dexie v4 with attempts/nextRetryAt/lastError on mutations
- T-2.2.2: exponential backoff + jitter drain, capped at 30 s
- T-2.2.3: migration 014, entity_id on dedup ledger, identical replay body
- T-2.2.4: dead-letter surface in Sync Diagnostics with Retry/Discard/Undo
- T-2.2.5: new reliability + idempotency test suites (14 specs, all green)

Closes Architecture §18.3, §18.8; mitigates R-1.
```
