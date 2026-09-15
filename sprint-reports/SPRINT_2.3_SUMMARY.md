# Sprint 2.3 — Deterministic Conflict UX & Monetary Math Audit — Summary

**Epic:** M2 — Sync Engine Reliability & Correctness · **Horizon:** 1 · **Priority:** P0 · **Effort:** L · **Story points:** 13
**Status:** ✅ Complete (T-2.3.1 … T-2.3.7)

---

## Executive Summary

Sprint 2.3 closes the M2 correctness gate: **money fields can never be silently overwritten, and every monetary calculation is now decimal-safe.** Building on the T-2.3.1 per-field last-writer-wins engine (already complete), this sprint delivered the user-facing conflict resolution UI, a forensic audit trail for resolutions, a branded `Money` type with decimal-safe helpers, a full migration of every raw money-arithmetic site in the codebase, a permanent ESLint guardrail against regressions, and the test suites that lock all of it in CI.

Closes **TD-3** (conflict UX) and **TD-9** (monetary math); mitigates **R-5** (float rounding across analytics) and **R-7** (money-field silent overwrites). Satisfies Architecture §18.1–18.2 and the PROJECT_MASTER_PLAN §14 M2 exit criteria.

---

## Sprint Goal

Money fields never silently overwrite; every arithmetic path uses integer minor units or a decimal-safe helper.

---

## Completed Tasks

| Task | Title | Status |
|------|-------|--------|
| T-2.3.1 | Per-field last-writer-wins in sync engine | ✅ Done (pre-existing foundation, verified) |
| T-2.3.2 | Build ConflictReviewSheet | ✅ Done |
| T-2.3.3 | Audit entry on user-resolved money conflict | ✅ Done |
| T-2.3.4 | Introduce Money branded type + helpers | ✅ Done |
| T-2.3.5 | Migrate all money paths to `Money` | ✅ Done |
| T-2.3.6 | ESLint rule: forbid raw arithmetic on money fields | ✅ Done |
| T-2.3.7 | Conflict + money test suites | ✅ Done |

---

## Acceptance Criteria Status

- **T-2.3.2** — Fully keyboard operable & reduced-motion respectful ✅ (focus-trapped `BottomSheet`, `useReducedMotion`); visual invariants locked by contract test ✅.
- **T-2.3.3** — One `conflict.resolve.money` row per resolution ✅; payload contains **no** `amount*` value (entity/id/side only) ✅.
- **T-2.3.4** — Full-branch coverage on helpers ✅; no raw `Number` money arithmetic remains outside `money.ts` ✅ (enforced by T-2.3.6).
- **T-2.3.5** — No `+`/`-`/`*` on `amount*` identifiers outside `money.ts` ✅ (lint = 0 violations); all calculation tests green ✅.
- **T-2.3.6** — Rule fires on a synthetic violation in a smoke test ✅; `error`-level so CI blocks merges ✅.
- **T-2.3.7** — Two-client `amount` edit always registers a pending conflict (the ConflictReviewSheet trigger) ✅; M2 exit criteria met ✅.

---

## Files Created

- `src/lib/money.ts` — branded `Money` type + `toMinor`, `fromMinor`, `addMoney`, `subMoney`, `mulMoney`, `sumMoney`, `formatMoney`.
- `src/components/sync/ConflictReviewSheet.tsx` — deterministic money-conflict resolution UI.
- `eslint.money-rule.cjs` — shared money-arithmetic selectors (consumed by the ESLint config and the smoke test).
- `src/__tests__/money.helpers.test.ts`
- `src/__tests__/syncEngine.conflict.test.ts`
- `src/__tests__/conflictReviewSheet.contract.test.ts`
- `src/__tests__/moneyLintRule.test.ts`

## Files Modified

- `eslint.config.mjs` — mounts the money-arithmetic guard.
- `src/app/providers.tsx` — mounts `ConflictReviewSheet` globally.
- `src/lib/db.ts` — `IDBMutation.conflict` field.
- `src/lib/validators.ts` — optional `conflict` object on every mutation schema.
- `src/lib/server/audit.ts` — `conflict.resolve.money` action.
- `src/app/api/sync/commit/route.ts` — emits the conflict audit row.
- `src/lib/syncEngine.ts` — corrective upsert carries `conflict` metadata; push forwards it.
- **Money migration (40 files, 108 sites):** `src/lib/{calculations,exchangeRates,filters,fingerprint,correlations,challenges,smartNudges,moneyDna,recurringDetection}.ts`; `src/hooks/{useBusinessCalculations,useCalculations,useAchievements,useEcho,useHistoricalData,usePayments,useWatcher}.ts`; `src/contexts/CalculationsContext.tsx`; `src/components/analytics/{CategoryVelocity,MerchantBreakdown,SpendingForecastCalendar,TimeMachine,YearOverYearChart}.tsx`; `src/components/business/{BusinessExport,PaymentList}.tsx`; `src/components/dashboard/{MoneyDnaCard,UpcomingStream}.tsx`; `src/components/expenses/{ExpenseExport,ExpenseList}.tsx`; `src/components/settings/{AccentColorPicker,RecurringManager}.tsx`; `src/app/{page,analytics/page,business/[ledgerId]/page,category/[slug]/page,settings/page}.tsx`.
- `src/__tests__/calculations.test.ts` — Money-precision block.
- Docs: `IMPLEMENTATION_QUEUE.md`, `SPRINT_BOARD.md`, `CHANGELOG.md`, `RELEASE_NOTES.md`, `TESTING_CHECKLIST.md`, `IMPLEMENTATION_RULES.md`.

---

## Architecture Changes

- **`Money` vocabulary.** `src/lib/money.ts` is now the single source of monetary arithmetic. All operations run in integer minor units (paise/cents) and only re-materialise a major-unit `number` at the boundary. IMPLEMENTATION_RULES §1 updated to point at it.
- **Guardrail.** A `no-restricted-syntax` ESLint rule permanently forbids raw `+`/`-`/`*` (and compound forms) on money-named identifiers everywhere except `money.ts`, codifying the invariant in CI.

## UI / UX Changes

- New `ConflictReviewSheet`: a calm, focus-trapped bottom sheet that surfaces one money conflict at a time, shows both values side by side, and resolves via Keep-mine / Keep-theirs. Tokens-only styling, 48 px targets, reduced-motion aware. No values change until the user chooses.

## Backend Changes

- `/api/sync/commit` emits a `conflict.resolve.money` audit row for each user-resolved money conflict (entity type, id, chosen side — never a monetary value). Mutation validators accept an optional, money-free `conflict` object.

## Database Changes

- No SQL schema change. Client-side Dexie `IDBMutation` gains an optional `conflict` field (additive, no version bump required for existing rows).

## API Changes

- Sync commit mutation payloads may now include an optional `conflict: { field, choice }` object (no monetary values). Backward compatible — the field is optional.

## Performance Improvements

- Helper arithmetic is O(1) integer math; the migration adds no measurable overhead. Analytics no longer accrue float rounding error across long reductions.

## Accessibility Improvements

- `ConflictReviewSheet` is keyboard operable (focus trap + restore), reduced-motion respectful, uses semantic dialog roles via `BottomSheet`, and meets the 48 px touch-target minimum.

## Security Improvements

- Money-conflict audit trail provides forensic traceability for disputes **without** leaking monetary values to logs (R-8): only entity type, id, and chosen side are recorded.

## Tests Added

- `money.helpers.test.ts` (full-branch helper coverage), `syncEngine.conflict.test.ts` (two-client conflict → resolution → audit signal), `conflictReviewSheet.contract.test.ts` (visual invariants), `moneyLintRule.test.ts` (guard smoke test), plus a Money-precision block in `calculations.test.ts`. **+38 passing tests** (1491 → 1529).

## Documentation Updated

`IMPLEMENTATION_QUEUE.md`, `SPRINT_BOARD.md`, `CHANGELOG.md`, `RELEASE_NOTES.md`, `TESTING_CHECKLIST.md`, `IMPLEMENTATION_RULES.md`.

---

## Risks

- **Median rounding in z-scores.** `detectAnomalies` now subtracts via `subMoney`, rounding the category median to the nearest minor unit before differencing. Impact is sub-paisa and does not change anomaly outcomes; all anomaly tests remain green.

## Known Issues

- **Pre-existing, out-of-scope.** The repository baseline has 6 failing test suites (24 tests) that rely on a DOM environment / hex-token contracts, plus 31 ESLint errors and 28 TypeScript errors confined to untouched test files. These predate Sprint 2.3 (verified by a clean-baseline run) and were intentionally **not** modified to avoid scope creep. `next build` compiles successfully regardless.
- **Conflict registry is session-scoped in memory** (inherited from T-2.3.1) — a hard reload before resolution drops pending conflicts; durable persistence is deferred (see below).

## Future Recommendations

- **Durable conflict persistence.** Persist the `MoneyConflict` registry to IndexedDB so pending conflicts survive a reload/crash.
- **Manual-correction resolution.** Consider a future "enter the correct amount" path if product wants a third option beyond keep-mine/keep-theirs (deliberately omitted here — money is scalar and has no automatic merge).
- **`receivedAmount` field.** The money-field vocabulary anticipates `receivedAmount`; it is not yet a persisted column. Wire it into the registry when it lands.
- **Extend the lint guard to `/`** once all money division paths route through a helper (currently display-scaling division like Lakh/Million formatting is intentionally allowed).

---

## Validation Results

| Gate | Result |
|------|--------|
| **Build** (`npm run build`) | ✅ Compiled successfully; all routes generated |
| **Tests** (`npx jest`) | ✅ 1529 passed / 24 pre-existing failures unchanged; all new suites green; **+38** vs baseline |
| **Lint** (`npx eslint`) | ✅ Money guard: **0 violations**; **0 new** errors vs baseline (31 pre-existing, untouched files) |
| **TypeScript** (`npx tsc --noEmit`) | ✅ **0 new** errors vs baseline (28 pre-existing, untouched test files) |
| **Money-arithmetic guard** | ✅ Fires on synthetic violations; clean with helpers; 0 real violations |

---

## Remaining Work

None for Sprint 2.3 — all seven tasks are complete and validated. Milestone M2 exit criteria are met. Durable conflict persistence and the `receivedAmount` wiring are tracked under Future Recommendations for a later horizon.

---

## Suggested Commit

```
feat(sync): complete Sprint 2.3 - deterministic money conflict UX & decimal-safe money math
```
