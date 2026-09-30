# Sprint 3.1 — Server Scheduler, Retries & Dead-Letter

## Executive Summary

Sprint 3.1 turns ExpenStream's push notifications from a best-effort, fire-and-forget
cron into a reliable, observable delivery pipeline. Every scheduled notification is now
materialised as a durable `push_deliveries` row and driven through an explicit lifecycle
(`pending → sent`, or `pending → failed → dead`). A new server-only dispatcher
(`src/lib/server/pushDispatcher.ts`) sends due deliveries, retries transient failures on a
`30s → 5min → 30min → dead` exponential backoff with ±20% jitter (dead-lettered after 4
attempts), and auto-prunes stale subscriptions on `404`/`410` with a privacy-safe audit
entry. The `/api/push/send` route is reworked to enqueue + delegate, is rate-limited on top
of the existing `CRON_SECRET` gate, and returns per-batch counters `{ sent, failed, dead }`.
A per-minute Vercel cron entry and an operations runbook complete the loop. All six tasks
are done; two new hermetic test suites form the retry/dead-letter proof, and the wider suite
regressed by zero tests.

## Sprint Goal

Reliable server-scheduled evening reminders and digests with retry and dead-letter surface.
Mitigates R-6, R-13; closes TD-4 (M3 groundwork).

## Completed Tasks

- ✅ **T-3.1.1 — Rework `/api/push/send` to batched scheduler** — route enqueues
  `push_deliveries` and delegates to the dispatcher; rate-limited + `CRON_SECRET`-gated;
  returns `{ sent, failed, dead, enqueued, time }`.
- ✅ **T-3.1.2 — `push_deliveries` table migration** — `015_push_deliveries.sql` + Prisma
  `PushDelivery` model; RLS enabled; indexed on `(status, scheduled_for)`.
- ✅ **T-3.1.3 — Exponential backoff with jitter** — `30s → 5min → 30min → dead`, ±20%
  jitter, in `pushDispatcher.ts`; unit-tested schedule + bounds.
- ✅ **T-3.1.4 — Cron entry ticking every minute** — `vercel.json` (`* * * * *`); middleware
  whitelist verified; documented in `docs/ops/push.md`.
- ✅ **T-3.1.5 — Auto-prune stale push subscriptions** — `404`/`410` removes the
  `push_subscriptions` row (deliveries cascade) and emits `push.subscription_pruned`.
- ✅ **T-3.1.6 — Retry + stale tests** — `pushSend.retry.test.ts`,
  `pushSubscription.stale.test.ts`.

## Acceptance Criteria Status

| Criterion                                                               | Status |
| ----------------------------------------------------------------------- | ------ |
| Endpoint returns `{ sent, failed, dead }` counts                        | ✅     |
| Endpoint rate-limited and `CRON_SECRET`-gated                           | ✅     |
| `push_deliveries` RLS enabled; indexed on `(status, scheduledFor)`      | ✅     |
| Unit test asserts backoff schedule and jitter bounds                    | ✅     |
| Cron entry documented in `docs/ops/push.md`; middleware allows secret   | ✅     |
| Stale endpoint unsubscribed within one dispatch cycle                   | ✅     |
| Failing endpoint hits dead-letter after 4 attempts                      | ✅     |
| Stale subscription pruned on `410` in test fixture                      | ✅     |

## Files Created

- `prisma/migrations/015_push_deliveries.sql`
- `src/lib/server/pushDispatcher.ts`
- `src/__tests__/pushSend.retry.test.ts`
- `src/__tests__/pushSubscription.stale.test.ts`
- `vercel.json`
- `docs/ops/push.md`

## Files Modified

- `src/app/api/push/send/route.ts` — enqueue + delegate to dispatcher; rate limit; new counters.
- `prisma/schema.prisma` — `PushDelivery` model.
- `src/lib/server/audit.ts` — `push.subscription_pruned` audit action.
- `src/__tests__/notificationSettings.test.ts` — push-route contract updated for the new architecture.
- `docs/IMPLEMENTATION_QUEUE.md`, `docs/SPRINT_BOARD.md`, `docs/CHANGELOG.md`,
  `docs/ARCHITECTURE.md`, `docs/TESTING_CHECKLIST.md`, `docs/PRODUCTION_CHECKLIST.md`,
  `docs/RELEASE_NOTES.md` — documentation sync.

## Architecture Changes

The push pipeline gains a persistence + dispatch layer. `/api/push/send` (per-minute cron)
now: (1) computes due notifications per user local time as before; (2) enqueues one
`push_deliveries` row per (subscription × payload); (3) calls `dispatchDueDeliveries`, which
drains all due rows — freshly enqueued **and** retries scheduled by earlier ticks. The
dispatcher is the single owner of send, retry/backoff, dead-lettering, and stale-endpoint
pruning, and is injectable (db + sender + rng + clock) for hermetic testing.

## Database Changes

New `push_deliveries` table: `id`, `subscription_id` (FK → `push_subscriptions`,
`ON DELETE CASCADE`), `scheduled_for`, `attempts`, `last_error`, `status`
(`pending|sent|failed|dead`, CHECK-constrained), `payload`, `created_at`, `updated_at`.
Indexed on `(status, scheduled_for)` for the scheduler hot path and `(subscription_id)` for
prune cascades. RLS enabled (deny-all; service-role access only, matching migration 012).

## API Changes

`POST /api/push/send` now returns `{ sent, failed, dead, enqueued, time }` and responds
`429` with `Retry-After` when the `cron:push-send` rate limit (10/min) is exceeded. The
`CRON_SECRET` gate, optional timestamp/HMAC replay hardening, and VAPID setup are unchanged.

## Performance Improvements

- Scheduler selects due rows via the `(status, scheduled_for)` index rather than scanning.
- Subscriptions are batch-loaded once per tick; stale endpoints are pruned once per endpoint
  even across multiple deliveries.
- Jittered backoff prevents thundering-herd retries against the push service.

## Accessibility Improvements

None — this sprint is server/back-end only; no UI surfaces were added or changed.

## Security Improvements

- `push_deliveries` is RLS-enabled (deny-all; accessed only via the service-role Prisma client).
- `last_error` and the `push.subscription_pruned` audit meta store only status codes, short
  messages, and workspace/subscription ids — never PII or monetary values.
- `/api/push/send` is rate-limited in addition to the `CRON_SECRET` gate.

## Tests Added

- `pushSend.retry.test.ts` — backoff schedule + jitter bounds; a persistently-failing endpoint
  is dead-lettered after exactly 4 attempts; a healthy send is marked `sent` on attempt 1.
- `pushSubscription.stale.test.ts` — `410`/`404` prunes the subscription within one cycle,
  dead-letters the delivery, emits one audit entry (deduplicated per endpoint); healthy
  subscriptions are never pruned.
- `notificationSettings.test.ts` — updated push-route contract assertions.

## Documentation Updated

IMPLEMENTATION_QUEUE, SPRINT_BOARD, CHANGELOG, ARCHITECTURE, TESTING_CHECKLIST,
PRODUCTION_CHECKLIST, RELEASE_NOTES, and the new `docs/ops/push.md` runbook.

## Risks

- Duplicate enqueue if the cron fires more than once within the same clock minute. Impact is
  benign: browsers de-duplicate by notification `tag`, so the user sees at most one banner.
- The migration must be applied before the reworked route runs; a missing `push_deliveries`
  table would fail a dispatch tick. Covered by the production-checklist migration gate.

## Known Issues

None specific to this sprint. Pre-existing unrelated test failures (design-token / UI-contract
suites: `zIndexScale`, `accentColor`, `colorTokenConsistency`, `quickTemplatesAndViewMode`,
`phaseFContracts`, `bugFixes`, and the flaky-in-full-run `syncEngine.integration`, which passes
in isolation) exist on the baseline and are out of this sprint's scope.

## Future Recommendations

- Add a de-duplication guard (unique key on subscription + notification tag + scheduled day)
  if a cron provider is observed double-firing within a minute.
- Sprint 3.2 will add quiet-hours enforcement, timezone-correct weekly digests, and the
  `/api/admin/push/health` dashboard that surfaces the counters this sprint persists.
- Consider a TTL sweep for terminal (`sent`/`dead`) `push_deliveries` rows older than N days.

## Validation Results

- **TypeScript:** `tsc --noEmit` — zero errors in all Sprint 3.1 files (route, dispatcher,
  audit, tests). Pre-existing unrelated test-file type errors are untouched.
- **ESLint:** clean on all changed files (incl. the money-arithmetic guard).
- **Tests:** `pushSend.retry.test.ts` + `pushSubscription.stale.test.ts` — 9/9 green;
  `notificationSettings.test.ts` — 59/59 green. Full suite: 1537 passed; the only failing
  suites are pre-existing/unrelated (confirmed against the stashed baseline).

## Remaining Work

None for Sprint 3.1. Quiet hours, timezone correctness, and the ops dashboard are Sprint 3.2.

## Suggested Commit Message

```
feat(push): complete Sprint 3.1 - server scheduler, retries & dead-letter
```
