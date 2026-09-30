# Sprint 2.3 · T-2.3.1 — Per-field Last-Writer-Wins in Sync Engine

> Task-scoped report. Sprint 2.3 is **in progress** — only T-2.3.1 is complete.
> A full `SPRINT_2.3_SUMMARY.md` will be generated when the sprint closes.

## Executive Summary

The sync engine no longer silently overwrites financial numbers. `pullChanges`
now merges every pulled record **field by field**: non-money fields keep the
existing deterministic whole-record timestamp last-writer-wins, while money
fields (`amount` on expenses/payments, `expectedAmount` on ledgers) are
**preserved locally on a divergent collision** and registered as a
`MoneyConflict`. A contested money value is only ever reconciled through an
explicit user event — the new `resolveMoneyConflict(key, "mine" | "theirs")`
API — never by a pull. This satisfies both acceptance criteria and closes the
first item of Architecture §18.1. No monetary values are logged.

## Task Goal

Implement per-field LWW in `src/lib/syncEngine.ts`; when a field in
`{amount, expectedAmount, receivedAmount}` collides, defer to a user prompt
instead of auto-merging. Non-money fields resolve deterministically by
timestamp.

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Money-field collisions never resolve without a user event | ✅ Met | `_mergePulledRecord` keeps the local money value on collision and registers a `MoneyConflict`; only `resolveMoneyConflict` (a user event) reconciles it. Test: repro "local money is preserved and deferred" (`finalAmount: 150`, one pending conflict). |
| Non-money fields use timestamp-based LWW deterministically | ✅ Met | `_mergePulledRecord` selects the whole record by `serverUpdatedAt >= existing.updatedAt` for all non-money fields; money fields are overlaid separately. |

Note on `receivedAmount`: it is named in the queue/PRD but is **not** a
persisted field in the current schema (`prisma/schema.prisma` has `amount` and
`expectedAmount` only; there is no `receivedAmount` column or IDB field). The
implementation is table-driven via `MONEY_FIELDS`, so adding `receivedAmount`
later is a one-line change. Recorded so the queue description and code stay
honest.

## Files Modified

- `src/lib/syncEngine.ts` — money-conflict registry + resolution-intent guard,
  `_mergePulledRecord` per-field merge, `resolveMoneyConflict`,
  `getPendingMoneyConflicts`, `onMoneyConflictsChange`, `clearMoneyConflicts`,
  `MoneyConflict`/`ConflictEntity`/`ConflictChoice` types; pull integration for
  expenses/ledgers/payments (ledger & payment pulls now batch-fetch existing
  rows for collision detection); tombstone deletes clear dangling conflicts;
  registry cleared on `stopSyncEngine`.
- `src/__tests__/syncEngine.repro.test.ts` — flipped from the silent-overwrite
  baseline snapshot to the deterministic contract; added `mine`/`theirs`
  resolution coverage and a pre-push re-pull "no re-open" assertion.

## Documentation Updated

- `docs/IMPLEMENTATION_QUEUE.md` — T-2.3.1 marked ✅ Done with implementation notes.
- `docs/SPRINT_BOARD.md` — Sprint 2.3 status "In progress (T-2.3.1 ✅ Done)".
- `docs/CHANGELOG.md` — Added + Changed entries under [Unreleased].
- `docs/ARCHITECTURE.md` — §18.1 item 1 marked partially delivered; durability follow-ups listed.
- `docs/TESTING_CHECKLIST.md` — repro test entry updated to the fixed contract.

## Tests Run

- `syncEngine.repro.test.ts`, `syncEngine.integration.test.ts`,
  `syncEngine.reliability.test.ts`, `syncCommit.idempotency.test.ts` —
  **4 suites, 30 tests, all green**; 1 inline snapshot updated intentionally.
- `tsc --noEmit` — no errors in `syncEngine.ts` (repo has one pre-existing,
  unrelated error in `achievements.test.ts`).
- `eslint src/lib/syncEngine.ts src/__tests__/syncEngine.repro.test.ts` — clean.
- Full `jest` run: 1491 passing; the 24 failures are pre-existing UI/design-token
  tests (accentColor, zIndexScale, colorTokenConsistency, phaseFContracts,
  quickTemplatesAndViewMode, bugFixes) that also fail on the unmodified tree
  (verified via `git stash`). None touch sync.

## Security

- Conflict registry, counters, and diagnostics never carry monetary values off
  the client; `resolveMoneyConflict` performs local IDB writes and re-queues a
  redacted `{ field: value }` upsert through the existing encrypted mutation path.

## Future Recommendations (deferred — out of T-2.3.1's `syncEngine.ts`-only scope)

Raised during self/rubber-duck review; each needs schema or cross-module work
beyond this task and is queued for follow-up (some overlap T-2.3.2/T-2.3.3):

1. **Durable conflict + intent persistence.** The registry is in-memory; a
   reload loses the pending prompt (the local money value is still safe in IDB
   and re-detected on the next divergent pull, but the prompt state is lost).
   Persist conflicts/intents in a Dexie table and reload on startup; block
   contested mutations from draining until resolved.
2. **Queue coalescing on resolution.** A dead-lettered/backoff upsert retried
   after the corrective push could re-apply a superseded money value. Coalesce
   all queued upserts for a table/id into one fresh mutation on resolution.
3. **Durable per-field money baseline.** Record-level divergence detection can
   false-positive (a remark-only local edit flags a remote amount change → an
   extra, safe prompt). A per-field dirty baseline would eliminate it.
4. **Pull/resolution serialization.** A narrow race between a pull's post-commit
   reconcile and a concurrent resolution; the intent guard mitigates it, but
   atomic/versioned conflict state would make it race-free.
5. **`receivedAmount`** once the field is added to the schema/IDB.

## Remaining Work (Sprint 2.3)

T-2.3.2 (ConflictReviewSheet UI over this engine), T-2.3.3 (audit entry on
resolution), T-2.3.4–T-2.3.7 (Money branded type, migration, ESLint rule, tests).
