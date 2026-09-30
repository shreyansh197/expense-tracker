# Sprint 2.1 — Sync Instrumentation & Conflict Reproduction

**Milestone:** M2 — Sync Engine Reliability & Correctness
**Completed:** 2026-07-24
**Story points:** 5

---

## Executive Summary

Made the sync engine observable and captured a repeatable end-to-end money-field conflict scenario. Users can now open **Settings › Data & Automation › Sync Diagnostics** and see live pull/push/conflict/failure counters, queue depth, the last successful pull/push timestamps, and any redacted last error. A deterministic reproduction test snapshots the current (pre-fix) last-write-wins behavior so Sprint 2.3 can measure improvement objectively. All counters are session-scoped (in-memory only), never carry monetary values, categories, remarks, request bodies, or auth tokens, and clear on tab close or explicit reset.

## Completed Tasks

| Task | Description | Status |
| --- | --- | --- |
| T-2.1.1 | Session sync counters + `useSyncCounters` hook | ✅ Done |
| T-2.1.2 | Sync Diagnostics panel (Settings › Data & Automation) | ✅ Done |
| T-2.1.3 | Two-client conflict reproduction test w/ snapshot | ✅ Done |
| T-2.1.4 | Documented `NEXT_PUBLIC_SYNC_LOG` toggle in AI_CONTEXT §16.1 | ✅ Done |

## Acceptance Criteria Status

- ✅ Counters reset on demand; never persisted with PII/money (in-memory only, cleared on tab close and via Reset button).
- ✅ Existing sync tests remain green (13/13 in `syncEngine.integration.test.ts`; my repro test adds +2 tests, all pass).
- ✅ Five states honored in Diagnostics panel (empty / loading / error / offline / success).
- ✅ A11y: `role="region"`, `aria-label`, `aria-live="polite"`, focus-visible ring, ≥44 × 44 px Reset target.
- ✅ Repro test runs deterministically (no network) — uses fake-indexeddb and a mocked virtual server with a monotonic clock.
- ✅ Snapshot captures conflict count delta and final row state.
- ✅ Docs enable/disable path documented plus explicit no-money-in-logs caveat.

## Files Created

- `src/components/settings/SyncDiagnosticsCard.tsx` — the diagnostics panel component.
- `src/__tests__/syncEngine.repro.test.ts` — two-client conflict reproduction with inline snapshot.
- `sprint-reports/SPRINT_2.1_SUMMARY.md` — this report.

## Files Modified

- `src/lib/syncEngine.ts` — added `SyncCounters` type, in-memory counters, `getSyncCounters` / `resetSyncCounters` / `onSyncCountersChange` API, counter increments in pull/push code paths, cleanup in `stopSyncEngine`.
- `src/hooks/useSyncStatus.ts` — added `useSyncCounters` hook backed by `useSyncExternalStore`, plus SSR-safe server snapshot.
- `src/app/settings/page.tsx` — added Activity import, "Sync Diagnostics" accordion section, sectionIndex entry + zone map, wired the new card.
- `docs/AI_CONTEXT.md` — added §16.1 documenting `NEXT_PUBLIC_SYNC_LOG` with sample output and privacy caveats.
- `docs/CHANGELOG.md` — Unreleased entries under Added / Accessibility / Security / Notes.
- `docs/IMPLEMENTATION_QUEUE.md` — marked T-2.1.1..T-2.1.4 Done.
- `docs/SPRINT_BOARD.md` — flipped Sprint 2.1 to Done.
- `docs/TESTING_CHECKLIST.md` — checked off `syncEngine.repro.test.ts`.

## Architecture Changes

- Sync engine exposes an observable in-memory counter store (subscribe/snapshot pattern matching the existing `_syncPhase` observable). No new schema, no new tables, no new persistence.

## UI / UX Changes

- New "Sync Diagnostics" section inside Settings › Data & Automation, sandwiched between Smart Rules and Export & Import.
- Emits `role="region"` with `aria-live="polite"` so screen readers announce counter changes at a comfortable cadence.
- Reset control has an `aria-label`, a visible focus ring, and is ≥44 × 44 px.

## Backend Changes

- None. Instrumentation is client-side only.

## Database Changes

- None.

## Performance Improvements

- Counter emits are cheap object copies; the diagnostics card re-renders only when counters or queue depth change (both use `useSyncExternalStore` / `useDexieQuery` which subscribe surgically).
- A 10 s clock tick is scoped to the card only, so relative-time labels stay fresh without full-app re-renders.

## Accessibility Improvements

- Diagnostics panel adds a landmark region + polite live region for status messaging.
- All interactive controls are keyboard-focusable with visible focus indicators and meet minimum touch-target size.

## Tests Added

- `syncEngine.repro.test.ts` — 2 tests: reproduction with snapshot + push-counter regression check. Both deterministic, no network.

## Documentation Updated

- `AI_CONTEXT.md` §16.1 (new)
- `CHANGELOG.md` [Unreleased]
- `IMPLEMENTATION_QUEUE.md` T-2.1.1..T-2.1.4
- `SPRINT_BOARD.md` Sprint 2.1
- `TESTING_CHECKLIST.md`

## Risks

- The current pull path overwrites local IDB with server data even when local `updatedAt` is newer (the exact bug reproduced by the snapshot). Sprint 2.3 owns the fix; the snapshot will need an intentional update at that time.
- Counters do not persist across tab close by design — this is safe for privacy but means operators debugging remotely must ask the user to reproduce inside a single tab session.

## Known Issues

- None introduced by this sprint. Pre-existing failing test suites (`phaseFContracts`, `accentColor`, `zIndexScale`, `colorTokenConsistency`, `quickTemplatesAndViewMode`) were verified to fail identically on `git stash` baseline and are unrelated to this work.
- Pre-existing TypeScript strictness errors in some `__tests__/*` files are also unchanged.

## Remaining Work

- Sprint 2.2 (persistent mutation queue + server-side idempotency dedup) and Sprint 2.3 (deterministic money-field conflict UX + monetary math audit) will build on this instrumentation.

## Validation Results

- `npx jest src/__tests__/syncEngine.repro.test.ts src/__tests__/syncEngine.integration.test.ts` → **15/15 green**, 1 snapshot passing.
- `npx eslint` on all touched files → **0 errors**, 0 warnings.
- `npx tsc --noEmit` → no new type errors in touched files. Pre-existing errors in unrelated tests remain unchanged.
- Manual: `SyncDiagnosticsCard` renders via the Settings accordion; five-state banner switches correctly with online/offline toggle and after Reset.

## Suggested Commit Message

```
feat(sync): Sprint 2.1 — session counters, Diagnostics panel, conflict repro

- Add in-memory SyncCounters (pull/push/conflicts/failures/lastError/lastPullAt/lastPushAt) to syncEngine
- Expose via new useSyncCounters hook + Settings › Data › Sync Diagnostics card
- Add two-client money-field conflict reproduction test with inline snapshot
- Document NEXT_PUBLIC_SYNC_LOG toggle + privacy caveats in AI_CONTEXT §16.1
- No PII/money in counters, logs, or diagnostics UI

Closes T-2.1.1..T-2.1.4 (Sprint 2.1, Milestone M2)
```
