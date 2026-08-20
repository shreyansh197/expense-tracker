<!--
  SPRINT_BOARD.md — Live milestone & sprint plan for ExpenStream
  Owner: Product + AI Engineering
  Audience: PMs, engineers, designers, QA, and AI agents.
  Companion docs: PROJECT_MASTER_PLAN.md, ARCHITECTURE.md, AI_CONTEXT.md,
                  DESIGN_SYSTEM.md, TESTING_CHECKLIST.md, PRODUCTION_CHECKLIST.md.
  Rule: This file is the single source of truth for what is being worked on now
        and what is queued next. Update in place. Status values: Pending,
        In Progress, Blocked, Done. All items below start as Pending.
-->

# ExpenStream — Sprint Board

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-22

This board decomposes the entire product roadmap defined in [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md) into **milestones**, each containing multiple **2‑week sprints**. Every sprint carries a Goal, Tasks, Files, Dependencies, Acceptance Criteria, Estimated Effort, and Priority. Nothing here modifies application code on its own — it is the plan of record.

**Legend**

- **Status:** `Pending` · `In Progress` · `Blocked` · `Done`
- **Priority:** `P0` (data safety / security / a11y — always on) · `P1` (current theme) · `P2` (next horizon) · `P3` (later)
- **Effort:** `XS` ≈ ½ day · `S` ≈ 1–2 days · `M` ≈ 3–5 days · `L` ≈ 6–9 days · `XL` ≈ full 2‑week sprint · Sprint totals in story points (Fibonacci: 1/2/3/5/8/13)

**Definition of Done** (applies to every sprint — from [PROJECT_MASTER_PLAN §16.1](PROJECT_MASTER_PLAN.md)): TS strict, ESLint/Prettier clean, tests co-located under `src/__tests__/`, Zod at every API boundary, `requireAuth` + workspace guard + rate limit on every mutation route, idempotent + queueable mutations, no hard‑coded design tokens, ≥ 44×44 px touch targets, keyboard + SR labeled, `prefers-reduced-motion` honored, five states (empty/loading/error/offline/success), docs + CHANGELOG updated, no PII/money in logs or analytics.

---

## Table of Contents

- [M1 — Documentation Truth](#m1--documentation-truth)
- [M2 — Sync Engine Reliability & Correctness](#m2--sync-engine-reliability--correctness)
- [M3 — Notification UX Hardening](#m3--notification-ux-hardening)
- [M4 — Accessibility Contracts Coverage](#m4--accessibility-contracts-coverage)
- [M5 — Security & Compliance Hardening](#m5--security--compliance-hardening)
- [M6 — Observability & Ops Foundation](#m6--observability--ops-foundation)
- [M7 — Business Ledger Polish & Payment Reminders](#m7--business-ledger-polish--payment-reminders)
- [M8 — Envelope Budgets](#m8--envelope-budgets)
- [M9 — Performance & Bundle Discipline](#m9--performance--bundle-discipline)
- [M10 — Architecture Modularity Refactor](#m10--architecture-modularity-refactor)
- [M11 — Data Lifecycle & Ownership](#m11--data-lifecycle--ownership)
- [M12 — PWA & Platform Expansion](#m12--pwa--platform-expansion)
- [M13 — Collaboration Expansion](#m13--collaboration-expansion)
- [M14 — AI-Native Surfaces (Opt‑In)](#m14--ai-native-surfaces-optin)
- [M15 — UI Foundation (Product Experience Documentation)](#m15--ui-foundation-product-experience-documentation)
- [Roll‑up & Traceability](#rollup--traceability)

---

## M1 — Documentation Truth

**Horizon:** 1 · **PRD Milestone:** M1 · **Debt covered:** TD-1, TD-2, TD-12 · **Status:** Done (2026-07-23)

**Outcome:** Every doc in [docs/](.) is truthful, cross-linked, and freshly reviewed so a new engineer or AI agent can bootstrap without asking clarifying questions. The `docs/` folder becomes the trusted map of the codebase.

### Sprint 1.1 — Populate Sprint Board & Refresh Living Docs

- **Status:** Done (2026-07-23) · **Priority:** P1 · **Effort:** M · **Story points:** 8
- **Goal:** Replace all empty living docs with the current, verified state of the product. Publish this sprint board.
- **Tasks:**
  1. Populate [SPRINT_BOARD.md](SPRINT_BOARD.md) with the full milestone/sprint decomposition (this document).
  2. Populate [CHANGELOG.md](CHANGELOG.md) from git history, migration numbers, and [RELEASE_NOTES.md](RELEASE_NOTES.md) hints.
  3. Populate [RELEASE_NOTES.md](RELEASE_NOTES.md) with the user‑visible highlights per shipped version.
  4. Populate [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) covering env vars, migrations, RLS, rate‑limit table, VAPID, Sentry, DNS, backups, rollback.
  5. Populate [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) covering per‑release gates (unit, integration, a11y, sync, perf, security, manual smoke).
  6. Cross‑link every doc from [PROJECT_MASTER_PLAN.md §Appendix](PROJECT_MASTER_PLAN.md) and add a `Last reviewed` date footer to each.
- **Files:**
  - [docs/SPRINT_BOARD.md](SPRINT_BOARD.md)
  - [docs/CHANGELOG.md](CHANGELOG.md)
  - [docs/RELEASE_NOTES.md](RELEASE_NOTES.md)
  - [docs/PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
  - [docs/TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
  - [docs/PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md) (Appendix cross‑links)
- **Dependencies:** None. Docs‑only; no code changes.
- **Acceptance Criteria:**
  - No `docs/*.md` is empty.
  - Every doc opens with owner, audience, version, last‑reviewed date.
  - `PROJECT_MASTER_PLAN.md`'s Appendix links all resolve.
  - This board's TOC is navigable and every milestone anchor works.

### Sprint 1.2 — Sequence Diagrams, Migration Consolidation, AI‑Agent Handbook

- **Status:** Done (2026-07-23) · **Priority:** P1 · **Effort:** M · **Story points:** 8
- **Goal:** Add the visual references and repo‑hygiene items that make onboarding and AI‑assisted work reliable. Closes TD‑12 and Architecture §18.25.
- **Tasks:**
  1. Add `docs/ARCHITECTURE_DIAGRAMS.md` with Mermaid sequence diagrams: login → 2FA, device‑link accept, sync pull, mutation commit, invite accept, push send.
  2. Move stray root migrations (`supabase-migration*.sql`, `supabase-setup.sql`) into `prisma/migrations/` as numbered SQL or archive them under `prisma/legacy/`.
  3. Author `docs/AI_AGENT_HANDBOOK.md` describing repo memory layout, doc‑read order, boundary rules, and the "do not modify application code" contract.
  4. Add ADR template `docs/adr/0000-template.md` and record ADR‑0001 = "Adopt Postgres over Firestore".
  5. Verify every doc's outbound links (no 404s in repo tree).
- **Files:**
  - `docs/ARCHITECTURE_DIAGRAMS.md` (new)
  - `docs/AI_AGENT_HANDBOOK.md` (new)
  - `docs/adr/` (new folder + template + ADR‑0001)
  - `prisma/migrations/` (moves)
  - Root `supabase-*.sql` files (moved/archived)
- **Dependencies:** Sprint 1.1.
- **Acceptance Criteria:**
  - Diagrams render in GitHub Markdown preview.
  - No SQL migration files remain at repo root.
  - AI agent handbook lists read order: `AI_CONTEXT` → `ARCHITECTURE` → `DESIGN_SYSTEM` → `PROJECT_MASTER_PLAN` → `SPRINT_BOARD`.
  - ADR‑0001 committed with context, decision, consequences.

---

## M2 — Sync Engine Reliability & Correctness

**Horizon:** 1 · **PRD Milestone:** M2 · **Debt covered:** TD-3, TD-9 · **Risks addressed:** R-1, R-5, R-7 · **Status:** Pending

**Outcome:** No lost mutations, no silent overwrites, deterministic conflict UX for money fields, provably correct monetary math. Sync success ≥ 99.5%, conflict ≤ 0.5% in dogfood telemetry.

### Sprint 2.1 — Sync Instrumentation & Conflict Reproduction

- **Status:** Done (2026-07-24) · **Priority:** P1 · **Effort:** M · **Story points:** 5
- **Goal:** Make sync engine behavior observable and reproduce a real money‑field conflict end‑to‑end.
- **Tasks:**
  1. Add pull/push/conflict counters to [src/lib/syncEngine.ts](../src/lib/syncEngine.ts) exposed via `useSyncStatus`.
  2. Add a Diagnostics panel (Settings > Data) that shows queue depth, last pull time, last error, conflict count.
  3. Write a reproduction script under `src/__tests__/syncEngine.repro.test.ts` that creates a two‑client conflict on `expense.amount` and asserts current behavior.
  4. Add `NEXT_PUBLIC_SYNC_LOG` toggle instructions to [docs/AI_CONTEXT.md](AI_CONTEXT.md) §16.
- **Files:**
  - [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
  - [src/hooks/useSyncStatus.ts](../src/hooks/useSyncStatus.ts)
  - `src/components/settings/SyncDiagnosticsCard.tsx` (new)
  - `src/__tests__/syncEngine.repro.test.ts` (new)
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Counters visible in Diagnostics panel; reset on demand.
  - Repro test captures the current non‑deterministic behavior with a snapshot.
  - No PII/monetary values in any counter payload.

### Sprint 2.2 — Persistent Mutation Queue & Guaranteed‑Once Delivery

- **Status:** ✅ Done — Sprint 2.2 · **Priority:** P0 · **Effort:** L · **Story points:** 13
- **Goal:** Mutation queue survives tab close, network loss, and re‑auth. Every mutation is delivered exactly once. Closes Architecture §18.8.
- **Tasks:**
  1. Persist queue attempts + backoff schedule in Dexie `mutations` table.
  2. Retry drain on `online` and `visibilitychange` events.
  3. Server‑side idempotency de‑dup: add unique index on `(workspaceId, idempotencyKey)` in a new migration `014_mutation_idempotency.sql`; enforce in [/api/sync/commit](../src/app/api/sync/commit).
  4. Add dead‑letter surface in the Diagnostics panel with per‑item "retry" / "discard" affordances.
  5. New tests: `src/__tests__/syncEngine.reliability.test.ts` (tab‑close, offline, re‑auth), `src/__tests__/syncCommit.idempotency.test.ts`.
- **Files:**
  - [src/lib/db.ts](../src/lib/db.ts)
  - [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
  - `src/app/api/sync/commit/route.ts`
  - `prisma/migrations/014_mutation_idempotency.sql` (new)
  - [prisma/schema.prisma](../prisma/schema.prisma)
  - `src/components/settings/SyncDiagnosticsCard.tsx`
  - `src/__tests__/syncEngine.reliability.test.ts` (new)
  - `src/__tests__/syncCommit.idempotency.test.ts` (new)
- **Dependencies:** Sprint 2.1.
- **Acceptance Criteria:**
  - Queue survives forced tab close and comes back on next open.
  - Retried commit with same idempotency key returns 200 with the original entity (no duplicate row).
  - Dead‑letter items surface within 30 s of terminal failure.
  - `syncEngine.reliability.test.ts` and `syncCommit.idempotency.test.ts` green.

### Sprint 2.3 — Deterministic Conflict UX & Monetary Math Audit

- **Status:** Pending · **Priority:** P0 · **Effort:** L · **Story points:** 13
- **Goal:** Money fields never silently overwrite. Every path uses integer minor units or a decimal‑safe helper. Closes TD‑3, TD‑9 and Architecture §18.1–18.2.
- **Tasks:**
  1. Implement per‑field last‑writer‑wins in [src/lib/syncEngine.ts](../src/lib/syncEngine.ts) with a user prompt for `amount`, `expectedAmount`, `receivedAmount` collisions.
  2. Build `ConflictReviewSheet` (extends `useSyncConflictToast`) rendering both versions side by side with "keep mine / keep theirs / merge" actions.
  3. Emit `audit_logs` entry on every user‑resolved money conflict.
  4. Introduce `Money` branded type (`type Money = number & { __brand: "minor-units" }`) and helpers `toMinor(major)`, `fromMinor(minor)`, `addMoney`, `subMoney`.
  5. Audit every path touching `amount` / `expectedAmount` / `receivedAmount` in [src/lib/calculations.ts](../src/lib/calculations.ts), [src/lib/exchangeRates.ts](../src/lib/exchangeRates.ts), and all analytics components; migrate to `Money`.
  6. Add ESLint rule (custom or `no-restricted-syntax`) forbidding `+`/`-`/`*` on `amount*` identifiers outside `money.ts`.
  7. Tests: `syncEngine.conflict.test.ts`, `money.helpers.test.ts`, extend `calculations.test.ts`.
- **Files:**
  - [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
  - `src/lib/money.ts` (new)
  - [src/lib/calculations.ts](../src/lib/calculations.ts)
  - [src/lib/exchangeRates.ts](../src/lib/exchangeRates.ts)
  - `src/components/sync/ConflictReviewSheet.tsx` (new)
  - [src/hooks/useSyncConflictToast](../src/hooks/) (adjust)
  - [src/lib/server/audit.ts](../src/lib/server/audit.ts)
  - [eslint.config.mjs](../eslint.config.mjs)
  - `src/__tests__/syncEngine.conflict.test.ts` (new)
  - `src/__tests__/money.helpers.test.ts` (new)
- **Dependencies:** Sprint 2.2.
- **Acceptance Criteria:**
  - Two‑client edit on the same `amount` always surfaces `ConflictReviewSheet`; no silent overwrite.
  - Every resolution writes an `audit_logs` row.
  - No `number`‑typed `amount` remains outside `money.ts`; lint rule green.
  - Milestone M2 exit criteria in [PROJECT_MASTER_PLAN §14](PROJECT_MASTER_PLAN.md) met.

---

## M3 — Notification UX Hardening

**Horizon:** 1 · **PRD Milestone:** M3 · **Debt covered:** TD-4 · **Risks addressed:** R-6, R-13 · **Status:** Pending

**Outcome:** ≥ 95% push delivery over 7 days, timezone/quiet‑hours honored, weekly digests correct, failed pushes observable.

### Sprint 3.1 — Server Scheduler, Retries & Dead‑Letter

- **Status:** Pending · **Priority:** P1 · **Effort:** L · **Story points:** 13
- **Goal:** Server‑scheduled evening reminders and digests with reliable retry and dead‑letter surface.
- **Tasks:**
  1. Rework `/api/push/send` to accept a batched schedule with per‑subscription retry state.
  2. Add `push_deliveries` table (migration `015_push_deliveries.sql`) tracking `subscriptionId`, `scheduledFor`, `attempts`, `lastError`, `status` (`pending|sent|failed|dead`).
  3. Exponential backoff (30s → 5min → 30min → dead) with jitter.
  4. Cron entry (Vercel/Node scheduler) that ticks `/api/push/send` every minute, guarded by `CRON_SECRET`.
  5. Auto‑prune stale `push_subscriptions` on `410 Gone` / `404 Not Found` from the push service.
  6. Tests: `pushSend.retry.test.ts`, `pushSubscription.stale.test.ts`.
- **Files:**
  - `src/app/api/push/send/route.ts`
  - `src/app/api/push/subscribe/route.ts`
  - `prisma/migrations/015_push_deliveries.sql` (new)
  - [prisma/schema.prisma](../prisma/schema.prisma)
  - `src/lib/server/pushDispatcher.ts` (new)
  - `src/__tests__/pushSend.retry.test.ts` (new)
  - `src/__tests__/pushSubscription.stale.test.ts` (new)
- **Dependencies:** None (independent of M2).
- **Acceptance Criteria:**
  - Scheduled reminder fires within ±60 s of user local time.
  - Failing endpoints hit dead‑letter after 4 attempts and are unsubscribed on `410`.
  - Cron endpoint returns per‑batch counts (sent/failed/dead).

### Sprint 3.2 — Quiet Hours, Timezone Correctness & Ops Dashboard

- **Status:** Pending · **Priority:** P1 · **Effort:** M · **Story points:** 8
- **Goal:** Respect user quiet‑hours across timezones; give operators visibility into push health.
- **Tasks:**
  1. Extend `NotificationPrefs` with `quietHoursStart`, `quietHoursEnd`, `quietHoursTimezone` (defaults to `timezone`).
  2. Update [src/components/settings/NotificationSettings.tsx](../src/components/settings/NotificationSettings.tsx) with paired time pickers and a "Quiet hours" toggle.
  3. Server dispatcher skips deliveries falling inside a user's quiet‑hours window.
  4. Weekly digest correctness: compute week bounds in user timezone (Luxon/`date-fns-tz`), not UTC; extend [src/lib/calculations.ts](../src/lib/calculations.ts) tests.
  5. Build `/api/admin/push/health` (auth: `CRON_SECRET` or admin session) returning last 24 h counts and top failing endpoints; render in a lightweight `docs/ops/push.md` runbook.
  6. Tests: `notificationSettings.test.ts` (extend), `pushQuietHours.test.ts`, `weeklyDigest.timezone.test.ts`.
- **Files:**
  - [src/components/settings/NotificationSettings.tsx](../src/components/settings/NotificationSettings.tsx)
  - [src/hooks/useNotifications.ts](../src/hooks/useNotifications.ts)
  - `src/lib/server/pushDispatcher.ts`
  - [src/lib/calculations.ts](../src/lib/calculations.ts)
  - `src/app/api/admin/push/health/route.ts` (new)
  - `docs/ops/push.md` (new)
  - [src/**tests**/notificationSettings.test.ts](../src/__tests__/notificationSettings.test.ts)
  - `src/__tests__/pushQuietHours.test.ts` (new)
  - `src/__tests__/weeklyDigest.timezone.test.ts` (new)
- **Dependencies:** Sprint 3.1.
- **Acceptance Criteria:**
  - No push fires during a user's quiet‑hours window (verified per timezone).
  - Weekly digest week starts on the user's locale week‑start.
  - `/api/admin/push/health` returns delivery counters; runbook documents thresholds.
  - Milestone M3 exit criteria met.

---

## M4 — Accessibility Contracts Coverage

**Horizon:** 1 · **PRD Milestone:** M4 · **Debt covered:** TD-6 · **Risks addressed:** R-9 · **Status:** Pending

**Outcome:** Every component ships with a contract test; CI enforces presence for new components; every chart has a text alternative.

### Sprint 4.1 — Contract Template & CI Enforcement

- **Status:** Pending · **Priority:** P0 · **Effort:** M · **Story points:** 8
- **Goal:** Formalize the contract‑test pattern and make it non‑optional in CI.
- **Tasks:**
  1. Author `docs/CONTRACT_TESTS.md` describing shape, matchers, and reduced‑motion / focus‑ring assertions.
  2. Add a codegen script `scripts/gen-contract-test.js` that scaffolds a spec for a given component.
  3. Add CI step: fail if a file under `src/components/` lacks a matching `src/__tests__/*.contract.test.ts` (allowlist for pure‑presentation primitives).
  4. Backfill contract tests for the top 20 uncovered components identified by the script.
- **Files:**
  - `docs/CONTRACT_TESTS.md` (new)
  - `scripts/gen-contract-test.js` (new)
  - `.github/workflows/ci.yml` (or equivalent — add step)
  - `src/__tests__/*.contract.test.ts` (new — up to 20 files)
  - [src/**tests**/accessibilityContracts.test.ts](../src/__tests__/accessibilityContracts.test.ts)
- **Dependencies:** None.
- **Acceptance Criteria:**
  - CI fails on a new component without a contract test.
  - The 20 backfilled specs are green.
  - Docs describe how to add a contract test in ≤ 5 minutes.

### Sprint 4.2 — Chart Text Alternatives & A11y Audit Pass

- **Status:** Pending · **Priority:** P0 · **Effort:** M · **Story points:** 8
- **Goal:** Every chart has a text/data‑table alternative; complete accessibility audit of top pages.
- **Tasks:**
  1. Add `DataTableView` toggle to `RollingAverageChart`, `YearOverYearChart`, `RidgeLine`, `CollectionChart`, `LedgerProgressRing`, `MerchantBreakdown`, `CategoryVelocity`, `CategorySeasons`.
  2. Ensure toggle state is announced to screen readers; keyboard operable.
  3. Manual axe/AXE‑DevTools pass on `/`, `/analytics`, `/business`, `/settings`, `/expenses`; log findings in `docs/a11y/2026‑audit.md`.
  4. Fix all P0 audit findings; open P1/P2 as new tickets.
  5. Extend `phaseFContracts.test.ts` to require `role="table"` alternative for any component with a `<svg>` chart.
- **Files:**
  - `src/components/analytics/*.tsx`
  - `src/components/business/*.tsx`
  - `src/components/ui/DataTableView.tsx` (new)
  - `docs/a11y/2026-audit.md` (new)
  - [src/**tests**/phaseFContracts.test.ts](../src/__tests__/phaseFContracts.test.ts)
- **Dependencies:** Sprint 4.1.
- **Acceptance Criteria:**
  - Every listed chart has a text alternative reachable via toggle and keyboard.
  - Audit doc records all findings; P0 items closed.
  - Milestone M4 exit criteria met.

---

## M5 — Security & Compliance Hardening

**Horizon:** 1–2 · **PRD Milestones:** M7 (session anomaly) · **Debt covered:** TD-7, TD-8 · **Risks addressed:** R-2, R-3, R-4, R-8, R-10 · **Status:** Pending

**Outcome:** Automated dependency updates with CVE SLA, session anomaly surface for users, CSP tightening, encryption key rotation path, guard/RLS coverage tests.

### Sprint 5.1 — Dependency Automation & CVE SLA

- **Status:** Pending · **Priority:** P0 · **Effort:** S · **Story points:** 5
- **Goal:** Every dependency stays current; Critical/High CVEs patched within 24 h.
- **Tasks:**
  1. Enable Renovate (or Dependabot) with grouped weekly PRs for minor/patch and immediate PRs for security advisories.
  2. Add `.github/renovate.json` or `.github/dependabot.yml` with schedule, grouping, and reviewer rules.
  3. Wire `npm audit --audit-level=high` into CI; fail on High/Critical.
  4. Add `docs/SECURITY.md` documenting CVE SLA, disclosure address, and rotation policy.
- **Files:**
  - `.github/renovate.json` (new) or `.github/dependabot.yml`
  - `.github/workflows/ci.yml` (audit step)
  - `docs/SECURITY.md` (new)
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Dry‑run Renovate produces a PR against `main`.
  - CI blocks on `npm audit` High/Critical.
  - `SECURITY.md` linked from [README.md](../README.md).

### Sprint 5.2 — Session Anomaly Surface & Audit Coverage Expansion

- **Status:** Pending · **Priority:** P1 · **Effort:** M · **Story points:** 8
- **Goal:** Users see and can act on unusual‑IP / new‑country logins. Every privileged action is auditable.
- **Tasks:**
  1. Add `session.new`, `session.revoke`, `2fa.enable`, `2fa.disable`, `passkey.register`, `passkey.remove` to [src/lib/server/audit.ts](../src/lib/server/audit.ts).
  2. Compute geo class (via IP‑to‑country lookup with an in‑repo static DB or a privacy‑preserving service) at login; store `country` hash on `sessions`.
  3. Compare against last N sessions; flag `anomalous=true` on unknown country + unknown device.
  4. Surface anomalies in Security card with "revoke" and "it was me" buttons.
  5. Optional email nudge via [src/lib/server/email.ts](../src/lib/server/email.ts) using Resend.
  6. Tests: `audit.coverage.test.ts`, `sessionAnomaly.test.ts`.
- **Files:**
  - [src/lib/server/audit.ts](../src/lib/server/audit.ts)
  - `src/lib/server/geo.ts` (new)
  - `src/app/api/auth/login/route.ts`
  - `src/components/settings/SecurityCard.tsx`
  - `prisma/migrations/016_session_geo.sql` (new)
  - [prisma/schema.prisma](../prisma/schema.prisma)
  - `src/__tests__/audit.coverage.test.ts` (new)
  - `src/__tests__/sessionAnomaly.test.ts` (new)
- **Dependencies:** Sprint 5.1.
- **Acceptance Criteria:**
  - Anomalous sessions render a distinct badge; revoke works with one tap.
  - No PII in the audit log (IP is SHA‑256‑hashed as today).
  - False‑positive rate ≤ 5% in dogfood (PRD M7 exit).

### Sprint 5.3 — CSP Tightening, `server-only` Markers & RLS Smoke Test

- **Status:** Pending · **Priority:** P0 · **Effort:** M · **Story points:** 8
- **Goal:** Reduce XSS blast radius, guarantee server‑only modules never leak to the client, prove RLS on every table on every CI run. Closes Architecture §18.4, §18.16, §18.20.
- **Tasks:**
  1. Add `import "server-only"` to every entry file under [src/lib/server/](../src/lib/server/).
  2. Remove `'unsafe-eval'`; adopt strict‑CSP with per‑request nonces in [next.config.ts](../next.config.ts) and [src/middleware.ts](../src/middleware.ts).
  3. Add `.github/workflows/rls-smoke.yml` that spins up ephemeral Postgres, runs `prisma migrate`, and executes `scripts/rls-smoke.ts` asserting cross‑workspace reads/writes are denied.
  4. Add `scripts/rls-smoke.ts` scripting the assertion.
  5. Tests: `serverOnly.import.test.ts` (asserts each `src/lib/server/*` file starts with `"server-only"`).
- **Files:**
  - [src/lib/server/](../src/lib/server/) (all entries)
  - [next.config.ts](../next.config.ts)
  - [src/middleware.ts](../src/middleware.ts)
  - `scripts/rls-smoke.ts` (new)
  - `.github/workflows/rls-smoke.yml` (new)
  - `src/__tests__/serverOnly.import.test.ts` (new)
- **Dependencies:** Sprint 5.2.
- **Acceptance Criteria:**
  - CSP has no `'unsafe-eval'`; strict nonces verified in headers snapshot.
  - RLS smoke workflow green on `main`.
  - `serverOnly.import.test.ts` green.

### Sprint 5.4 — Encryption Key Rotation

- **Status:** Pending · **Priority:** P1 · **Effort:** L · **Story points:** 13
- **Goal:** A per‑workspace key can be rotated with re‑encryption of sensitive at‑rest fields. Closes Architecture §18.21; addresses R‑10.
- **Tasks:**
  1. Add `encryptionKeyVersion` column on `workspaces` and per encrypted payload prefix `enc:v2:iv:ct`.
  2. Add `POST /api/workspaces/rotate-key` (OWNER only, rate‑limited, audited).
  3. Background job re‑encrypts flagged fields in `expenses`, `business_ledgers`, `business_payments` in batches; progress row in `key_rotations` table.
  4. Client `crypto.ts` accepts multiple key versions during transition.
  5. Tests: `crypto.rotation.test.ts`, `keyRotation.api.test.ts`.
- **Files:**
  - [src/lib/crypto.ts](../src/lib/crypto.ts)
  - `src/app/api/workspaces/rotate-key/route.ts` (new)
  - `src/lib/server/keyRotation.ts` (new)
  - `prisma/migrations/017_key_rotation.sql` (new)
  - [prisma/schema.prisma](../prisma/schema.prisma)
  - `src/__tests__/crypto.rotation.test.ts` (new)
  - `src/__tests__/keyRotation.api.test.ts` (new)
- **Dependencies:** Sprint 5.3.
- **Acceptance Criteria:**
  - Rotation completes without data loss on a 10 k‑record workspace fixture.
  - Both key versions decrypt during transition; old version purged on completion.
  - OWNER‑only enforcement + audit entry verified.

---

## M6 — Observability & Ops Foundation

**Horizon:** 1–2 · **Debt covered:** TD-4, TD-11 · **Architecture §:** 18.14, 18.15, 18.17 · **Status:** Pending

**Outcome:** Structured logging, health/readiness endpoints, a swappable rate‑limit backend, CI bundle budgets.

### Sprint 6.1 — Structured Logger & Health Endpoints

- **Status:** Pending · **Priority:** P1 · **Effort:** M · **Story points:** 5
- **Goal:** Replace ad‑hoc `console` with a thin `logger.ts`; add uptime probes.
- **Tasks:**
  1. Add `src/lib/server/logger.ts` (pino‑style JSON in prod, pretty in dev), integrated with Sentry breadcrumbs.
  2. Replace `console.*` in `src/lib/server/**` and `src/app/api/**` with the new logger.
  3. Add `GET /api/health` (fast liveness), `GET /api/ready` (DB probe, migration head check). Both public, `Cache-Control: no-store`.
  4. Add ESLint rule forbidding `console.log` in `src/lib/server/**` and `src/app/api/**`.
- **Files:**
  - `src/lib/server/logger.ts` (new)
  - `src/app/api/health/route.ts` (new)
  - `src/app/api/ready/route.ts` (new)
  - `src/app/api/**` and `src/lib/server/**` (console → logger)
  - [eslint.config.mjs](../eslint.config.mjs)
- **Dependencies:** None.
- **Acceptance Criteria:**
  - `/api/health` < 50 ms P95; `/api/ready` returns 503 on DB down.
  - No `console.*` in server code (lint enforced).

### Sprint 6.2 — Rate‑Limit Backend Interface & Bundle Budgets in CI

- **Status:** Pending · **Priority:** P1 · **Effort:** M · **Story points:** 8
- **Goal:** Rate‑limit backend is swappable; CI blocks perf regressions. Closes TD‑11, Architecture §18.11, §18.17.
- **Tasks:**
  1. Extract `RateLimitBackend` interface from [src/lib/server/rateLimit.ts](../src/lib/server/rateLimit.ts) with `PostgresBackend`, `MemoryBackend`, and stub `RedisBackend`.
  2. Add config‑selected backend via `RATE_LIMIT_BACKEND` env var.
  3. Wire `@next/bundle-analyzer` output into CI; add `scripts/check-bundle-budget.js` enforcing route caps (`/` ≤ 180 KB gz, `/analytics` ≤ 220 KB gz, `/settings` ≤ 220 KB gz, `/business` ≤ 200 KB gz).
  4. Fail CI on regression; produce a size diff in the PR comment.
- **Files:**
  - [src/lib/server/rateLimit.ts](../src/lib/server/rateLimit.ts)
  - `src/lib/server/rateLimit/backends/*` (new)
  - `scripts/check-bundle-budget.js` (new)
  - `.github/workflows/ci.yml`
- **Dependencies:** Sprint 6.1.
- **Acceptance Criteria:**
  - Switching backends via env var passes existing rate‑limit tests.
  - Bundle regression test fails a synthetic 30 KB inflation PR.

---

## M7 — Business Ledger Polish & Payment Reminders

**Horizon:** 2 · **PRD Milestone:** M6 · **Debt covered:** TD-4 (reuse) · **Risks addressed:** R-13 · **Status:** Pending

**Outcome:** Overdue signals refined, collections export parity with in‑app view, push + email reminders per ledger due date with snooze/cancel.

### Sprint 7.1 — Overdue Signals & Export Parity

- **Status:** Pending · **Priority:** P1 · **Effort:** M · **Story points:** 8
- **Goal:** Business KPIs and exports tell the same story as the in‑app view.
- **Tasks:**
  1. Refine `useBusinessCalculations` overdue detection (grace period setting, timezone‑correct).
  2. Update `BusinessKpiCards` overdue tile with severity tiers (soft/medium/hard).
  3. `BusinessExport` CSV/JSON parity: columns match on‑screen `LedgerCard` + payments; include `status`, `dueDate`, `tags`, `progress%`.
  4. Add a preview + column‑selector step to the export flow.
  5. Tests: `businessCalculations.overdue.test.ts`, `businessExport.parity.test.ts`.
- **Files:**
  - [src/hooks/useBusinessCalculations.ts](../src/hooks/useBusinessCalculations.ts)
  - `src/components/business/BusinessKpiCards.tsx`
  - `src/components/business/BusinessExport.tsx`
  - `src/__tests__/businessCalculations.overdue.test.ts` (new)
  - `src/__tests__/businessExport.parity.test.ts` (new)
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Overdue tiers reflect grace period; timezone shifts do not misclassify.
  - Export CSV opens cleanly in Excel + Google Sheets; every on‑screen field is present.

### Sprint 7.2 — Payment Reminders (Push + Email)

- **Status:** Pending · **Priority:** P1 · **Effort:** L · **Story points:** 13
- **Goal:** Reminders scheduled per ledger due date; ≥ 95% delivery; snooze + cancel supported.
- **Tasks:**
  1. Add `reminders` table (migration `018_ledger_reminders.sql`): `ledgerId`, `channel` (`push|email`), `scheduledFor`, `snoozeUntil`, `status`.
  2. Reminder scheduler in `src/lib/server/reminderDispatcher.ts` reusing `pushDispatcher` (M3.1) and `email.ts`.
  3. UI: per‑ledger "Remind me" affordance in `LedgerCard` and `LedgerForm` with lead‑time picker (1/3/7 days).
  4. Snooze (1d/3d/7d) and cancel from the ledger sheet.
  5. Opt‑out respected via `NotificationPrefs.paymentReminders`.
  6. Tests: `ledgerReminder.dispatch.test.ts`, `ledgerReminder.ui.test.ts`.
- **Files:**
  - `prisma/migrations/018_ledger_reminders.sql` (new)
  - [prisma/schema.prisma](../prisma/schema.prisma)
  - `src/lib/server/reminderDispatcher.ts` (new)
  - `src/components/business/LedgerCard.tsx`
  - `src/components/business/LedgerForm.tsx`
  - [src/components/settings/NotificationSettings.tsx](../src/components/settings/NotificationSettings.tsx)
  - `src/app/api/ledgers/[id]/reminders/route.ts` (new)
  - `src/__tests__/ledgerReminder.dispatch.test.ts` (new)
  - `src/__tests__/ledgerReminder.ui.test.ts` (new)
- **Dependencies:** M3 (push dispatcher + quiet hours).
- **Acceptance Criteria:**
  - Reminder fires within ±60 s of scheduled time, respecting quiet hours.
  - Snooze + cancel update `reminders.status` and emit `audit_logs` entry.
  - Delivery ≥ 95% over a 7‑day dogfood window (PRD M6 exit).

---

## M8 — Envelope Budgets

**Horizon:** 2 · **PRD Milestone:** M5 · **Status:** Pending

**Outcome:** Per‑category budgets with per‑month overrides and rollover; analytics surface envelope status.

### Sprint 8.1 — Envelope Data Model & Setting UI

- **Status:** Pending · **Priority:** P2 · **Effort:** L · **Story points:** 13
- **Goal:** Store, edit, and version per‑category envelopes.
- **Tasks:**
  1. Extend `WorkspaceSettings` JSONB with `envelopes: { [categoryId]: { amount, currency, rolloverCap, monthlyOverrides: { "YYYY-MM": amount } } }`.
  2. UI in Settings > Finances > Categories: per‑category envelope editor with rollover cap toggle.
  3. Validation: envelopes sum should be ≤ monthly budget with a warning (not hard block).
  4. Sync: envelope changes flow through the mutation queue (idempotent).
  5. Tests: `envelope.schema.test.ts`, `envelope.settings.ui.test.ts`.
- **Files:**
  - [src/lib/validators.ts](../src/lib/validators.ts)
  - `src/components/settings/CategoryManager.tsx` (extend)
  - `src/components/settings/EnvelopeEditor.tsx` (new)
  - [src/hooks/settingsStore.ts](../src/hooks/) (extend)
  - `src/__tests__/envelope.schema.test.ts` (new)
  - `src/__tests__/envelope.settings.ui.test.ts` (new)
- **Dependencies:** M2 (queueable/idempotent mutations).
- **Acceptance Criteria:**
  - Envelope CRUD works offline; syncs on reconnect.
  - Sum‑exceeds‑budget shows a warning with breakdown.

### Sprint 8.2 — Envelope Calculations & Analytics Surface

- **Status:** Pending · **Priority:** P2 · **Effort:** M · **Story points:** 8
- **Goal:** Dashboard and analytics reflect envelope health per category.
- **Tasks:**
  1. Extend [src/lib/calculations.ts](../src/lib/calculations.ts) with `computeEnvelopeStatus(categoryId, month, year)` returning `{ spent, budget, remaining, rolloverIn, status }`.
  2. Add `EnvelopeRing` component per category card on dashboard.
  3. Add "Envelopes" panel on the analytics page (grid of rings + list view toggle).
  4. Extend anomaly detection to flag envelope over‑spend.
  5. Tests: `envelope.calculations.test.ts`, `envelope.analytics.test.ts`.
- **Files:**
  - [src/lib/calculations.ts](../src/lib/calculations.ts)
  - `src/components/dashboard/EnvelopeRing.tsx` (new)
  - `src/components/analytics/EnvelopesPanel.tsx` (new)
  - `src/__tests__/envelope.calculations.test.ts` (new)
  - `src/__tests__/envelope.analytics.test.ts` (new)
- **Dependencies:** Sprint 8.1.
- **Acceptance Criteria:**
  - Envelope status renders on dashboard within 100 ms after data load.
  - Analytics panel supports keyboard nav + data‑table alt view (per M4).
  - Milestone M5 exit criteria met.

---

## M9 — Performance & Bundle Discipline

**Horizon:** 2 · **Debt covered:** TD-11 · **Architecture §:** 18.11–18.13 · **Status:** Pending

**Outcome:** Route‑level bundle caps enforced, analytics math off the main thread, streaming delta sync for large first pulls, tuned HTTP caching for static assets.

### Sprint 9.1 — Web Worker for Analytics Math

- **Status:** Pending · **Priority:** P2 · **Effort:** L · **Story points:** 13
- **Goal:** Move heavy analytics off the main thread to protect INP.
- **Tasks:**
  1. Package `correlations.ts`, `recurringDetection.ts`, and rolling‑average passes as a Web Worker bundle.
  2. Add `useWorkerQuery` hook wrapping message passing with a stable API.
  3. Migrate `RollingAverageChart`, `YearOverYearChart`, `CategoryVelocity`, `CategorySeasons`, `MerchantBreakdown` to the worker.
  4. Fall back to main‑thread compute if `Worker` unavailable.
  5. Tests: `worker.contract.test.ts` (mocked Worker), perf smoke via CI script.
- **Files:**
  - `src/workers/analytics.worker.ts` (new)
  - `src/hooks/useWorkerQuery.ts` (new)
  - `src/components/analytics/**`
  - `src/__tests__/worker.contract.test.ts` (new)
- **Dependencies:** None.
- **Acceptance Criteria:**
  - INP on `/analytics` improves ≥ 30 % on mid‑tier Android fixture.
  - No regression in test suite; fallback path exercised.

### Sprint 9.2 — Streaming Delta, Cursor Stability & HTTP Caching

- **Status:** Pending · **Priority:** P2 · **Effort:** M · **Story points:** 8
- **Goal:** Large first pulls stream chunked; cursor eliminates the boundary‑duplicate edge; static assets are cached long. Closes Architecture §18.9, §18.10, §18.13.
- **Tasks:**
  1. Rework `/api/sync/changes` to a chunked/streaming response using fetch streams; client consumes via `ReadableStream`.
  2. Change cursor to compound `(updatedAt, id)`; update client parser + server ordering.
  3. Add `Cache-Control: public, max-age=31536000, immutable` for `/_next/static/**` and hashed asset paths.
  4. Revisit icon `Cache-Control`: hashed variants long‑cached, `manifest.json` `no-cache`.
  5. Tests: `syncEngine.stream.test.ts`, `syncCursor.stability.test.ts`.
- **Files:**
  - `src/app/api/sync/changes/route.ts`
  - [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
  - [next.config.ts](../next.config.ts)
  - [public/manifest.json](../public/manifest.json) (headers)
  - `src/__tests__/syncEngine.stream.test.ts` (new)
  - `src/__tests__/syncCursor.stability.test.ts` (new)
- **Dependencies:** M2 (sync engine hardening).
- **Acceptance Criteria:**
  - First‑pull memory footprint bounded (< 20 MB) for 50 k‑row fixture.
  - No duplicate rows at cursor boundary in stress test.
  - Static assets served with immutable caching (verified via curl in CI).

---

## M10 — Architecture Modularity Refactor

**Horizon:** 2 · **Debt covered:** TD-10 · **Architecture §:** 18.5–18.7 · **Status:** Pending

**Outcome:** Repositories layer for domain aggregates, shared typed API contracts, feature‑verticalized structure — all without changing product behavior.

### Sprint 10.1 — Repositories Layer & Typed API Contracts

- **Status:** Pending · **Priority:** P2 · **Effort:** L · **Story points:** 13
- **Goal:** Consolidate the `where: { workspaceId, deletedAt: null }` pattern; single source for DTOs.
- **Tasks:**
  1. Extract `src/lib/server/repositories/{expense,ledger,payment,settings,workspace,user}.ts`.
  2. Every route handler migrates to call the repository (no direct `prisma.*` in handlers, except in repositories).
  3. Move DTOs to `src/types/api/*.ts`; derive Zod schemas from a single source (`zod` + `z.infer` on repo return types).
  4. ESLint rule forbidding `prisma` imports outside `src/lib/server/repositories/**` and `src/lib/server/prisma.ts`.
  5. Tests: `repositories.contract.test.ts` (per aggregate).
- **Files:**
  - `src/lib/server/repositories/**` (new)
  - `src/app/api/**` (call repositories)
  - `src/types/api/**` (new)
  - [src/lib/validators.ts](../src/lib/validators.ts) (re‑exports)
  - [eslint.config.mjs](../eslint.config.mjs)
  - `src/__tests__/repositories.contract.test.ts` (new)
- **Dependencies:** M5.3 (`server-only` markers).
- **Acceptance Criteria:**
  - Zero `prisma.` calls in `src/app/api/**` (lint enforced).
  - Full test suite green with no route‑handler behavioral change.

### Sprint 10.2 — Feature‑Folder Verticalization

- **Status:** Pending · **Priority:** P3 · **Effort:** L · **Story points:** 13
- **Goal:** Reduce cross‑imports as the surface grows.
- **Tasks:**
  1. Introduce `src/features/{expenses,business,analytics,settings,notifications}/` housing `components/`, `hooks/`, `lib/` per feature.
  2. Move existing files; keep public API stable via `index.ts` re‑exports from old paths (deprecated with JSDoc).
  3. ESLint rule: feature X cannot import from feature Y's internals — only its `index.ts`.
  4. Docs update: [ARCHITECTURE.md §2](ARCHITECTURE.md) folder tree, [AI_CONTEXT.md §9](AI_CONTEXT.md).
- **Files:**
  - `src/features/**` (new)
  - `src/components/**`, `src/hooks/**`, `src/lib/**` (moves + re‑exports)
  - [eslint.config.mjs](../eslint.config.mjs)
  - [docs/ARCHITECTURE.md](ARCHITECTURE.md)
  - [docs/AI_CONTEXT.md](AI_CONTEXT.md)
- **Dependencies:** Sprint 10.1.
- **Acceptance Criteria:**
  - Test suite fully green post‑move.
  - Lint rule catches a synthetic cross‑feature internal import.
  - Docs reflect new layout.

---

## M11 — Data Lifecycle & Ownership

**Horizon:** 3 · **Architecture §:** 18.22–18.23 · **PRD Future §17.2 · Status:** Pending

**Outcome:** Soft‑deleted rows get hard‑purged after retention; backups are periodically verified; users can export an end‑to‑end encrypted archive.

### Sprint 11.1 — Hard‑Purge Job & Backup Verification

- **Status:** Pending · **Priority:** P2 · **Effort:** M · **Story points:** 8
- **Goal:** Deleted data actually leaves; backups are known‑restorable.
- **Tasks:**
  1. Add `PURGE_RETENTION_DAYS` env var (default 90); scheduled worker that hard‑deletes rows with `deletedAt < now - retention` across all domain tables.
  2. Emit audit entry `data.purge` with counts (no PII/money).
  3. Backup verification: nightly workflow restores a Supabase snapshot into an ephemeral DB and runs `prisma migrate deploy` + a smoke query set.
  4. Ops runbook `docs/ops/backups.md` documenting restore procedure.
- **Files:**
  - `src/app/api/cron/purge/route.ts` (new, `CRON_SECRET`‑gated)
  - `src/lib/server/purge.ts` (new)
  - `.github/workflows/backup-verify.yml` (new)
  - `docs/ops/backups.md` (new)
  - [src/lib/server/audit.ts](../src/lib/server/audit.ts)
- **Dependencies:** M6.1 (logger), M5.2 (audit expansion).
- **Acceptance Criteria:**
  - Purge run against a fixture removes only rows past retention; audit records counts.
  - Backup workflow completes with green smoke query result.

### Sprint 11.2 — End‑to‑End Encrypted Export Archive

- **Status:** Pending · **Priority:** P3 · **Effort:** L · **Story points:** 13
- **Goal:** Passphrase‑protected export decryptable outside the app. PRD Future §17.2.
- **Tasks:**
  1. Extend `ExportImportWizard` with an "E2E encrypted archive" option: user supplies a passphrase; client derives a key via `PBKDF2` (SHA‑256, 600 k iters) and encrypts the JSON v2 blob with AES‑256‑GCM.
  2. Package as `.expenstream` (ZIP with `manifest.json` + `payload.enc`) with a plain‑text README describing decryption.
  3. Companion CLI `scripts/decrypt-archive.ts` for offline decryption (documented).
  4. Import path accepts encrypted archives with passphrase prompt.
  5. Tests: `export.encrypted.test.ts`, `import.encrypted.test.ts`, `decryptCli.test.ts`.
- **Files:**
  - `src/components/settings/ExportImportWizard.tsx`
  - `src/lib/crypto.ts` (KDF helper)
  - `scripts/decrypt-archive.ts` (new)
  - `docs/EXPORT_ARCHIVE.md` (new)
  - `src/__tests__/export.encrypted.test.ts` (new)
  - `src/__tests__/import.encrypted.test.ts` (new)
  - `src/__tests__/decryptCli.test.ts` (new)
- **Dependencies:** M5.4 (crypto surface).
- **Acceptance Criteria:**
  - Round‑trip export → decrypt CLI → import yields byte‑equal data.
  - Weak passphrase (< 12 chars) warned but allowed with confirmation.
  - No plaintext leak in intermediate files.

---

## M12 — PWA & Platform Expansion

**Horizon:** 3 · **PRD Milestone:** M8 · **Debt covered:** TD-5 · **Risks addressed:** R-12 · **Status:** Pending

**Outcome:** iOS install rate lifts via an educational flow; PWA polish across platforms.

### Sprint 12.1 — iOS PWA Install Education

- **Status:** Pending · **Priority:** P3 · **Effort:** M · **Story points:** 5
- **Goal:** Safari‑detected users see a calm, one‑time explanation of "Add to Home Screen".
- **Tasks:**
  1. Detect iOS Safari (no `beforeinstallprompt`) in `InstallButton`.
  2. New `IosInstallSheet` component: illustrated 3‑step guide (Share → Add to Home Screen → Confirm).
  3. One‑time dismissal persisted in `localStorage`; revisitable via Settings > Appearance.
  4. Cohort tracking of install rate (anonymous, per AI_CONTEXT §7).
- **Files:**
  - [src/components/pwa/InstallButton.tsx](../src/components/pwa/InstallButton.tsx)
  - `src/components/pwa/IosInstallSheet.tsx` (new)
  - `src/components/settings/AccountCard.tsx` (or Appearance section) — re‑open link
  - `src/__tests__/iosInstall.contract.test.ts` (new)
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Sheet only appears on iOS Safari, once, non‑blocking.
  - Fully keyboard + screen‑reader operable.
  - Milestone M8 exit criteria met (measurable install lift in cohort).

### Sprint 12.2 — PWA Polish: Widgets, Share Target, Offline Fallback

- **Status:** Pending · **Priority:** P3 · **Effort:** M · **Story points:** 8
- **Goal:** Deeper PWA integration on capable platforms.
- **Tasks:**
  1. Add `share_target` to [public/manifest.json](../public/manifest.json) so amounts can be shared into ExpenStream from other apps; landing route pre‑fills the expense form.
  2. Add offline HTML fallback page cached by [public/sw.js](../public/sw.js).
  3. Improve icon set / maskable icons; refresh via `scripts/gen-icons.js`.
  4. Wire feature detection so unsupported platforms hide affordances gracefully.
- **Files:**
  - [public/manifest.json](../public/manifest.json)
  - [public/sw.js](../public/sw.js)
  - `src/app/share-target/page.tsx` (new)
  - [scripts/gen-icons.js](../scripts/gen-icons.js)
- **Dependencies:** Sprint 12.1.
- **Acceptance Criteria:**
  - Share‑target intent pre‑fills the amount + remark.
  - Offline fallback shown when navigating a not‑cached route offline.
  - Lighthouse PWA remains 100.

---

## M13 — Collaboration Expansion

**Horizon:** 3 · **PRD Future §17.3–17.4 · Status:** Pending

**Outcome:** Read‑only client portal for a single ledger; opt‑in household activity feed.

### Sprint 13.1 — Read‑Only Client Portal (Single Ledger)

- **Status:** Pending · **Priority:** P3 · **Effort:** L · **Story points:** 13
- **Goal:** A signed, expiring URL surfaces one ledger to a customer with no auth.
- **Tasks:**
  1. New `ledger_portal_tokens` table: `ledgerId`, `tokenHash`, `expiresAt`, `revokedAt`, `viewsCount`.
  2. `POST /api/ledgers/[id]/portal` (OWNER/ADMIN) mints a token; `GET /portal/[token]` renders a stripped‑down public view.
  3. Public view: ledger name, expected, received, payment history — no other workspace data.
  4. Revoke + rotate from `LedgerForm`.
  5. Rate limit + audit entry on mint/view.
  6. Tests: `ledgerPortal.api.test.ts`, `ledgerPortal.page.test.ts`.
- **Files:**
  - `prisma/migrations/019_ledger_portal.sql` (new)
  - [prisma/schema.prisma](../prisma/schema.prisma)
  - `src/app/api/ledgers/[id]/portal/route.ts` (new)
  - `src/app/portal/[token]/page.tsx` (new)
  - `src/components/business/LedgerForm.tsx`
  - `src/__tests__/ledgerPortal.api.test.ts` (new)
  - `src/__tests__/ledgerPortal.page.test.ts` (new)
- **Dependencies:** M5.2 (audit expansion), M6.2 (rate limit backend).
- **Acceptance Criteria:**
  - Portal page shows only the target ledger; no cross‑workspace data leak (verified by RLS smoke).
  - Revoked / expired tokens return 410 Gone.
  - Views counter increments; audit entry emitted.

### Sprint 13.2 — Household Activity Feed (Opt‑In)

- **Status:** Pending · **Priority:** P3 · **Effort:** L · **Story points:** 13
- **Goal:** Workspace members see who did what, with redaction respected.
- **Tasks:**
  1. `activity_events` table logging `expense.create`, `expense.update`, `expense.delete`, `settings.update` (opt‑in per workspace).
  2. Workspace setting `activityFeedEnabled` (OWNER controlled).
  3. Feed page `src/app/activity/page.tsx` with per‑member filter, day grouping, redaction of monetary values behind a tap.
  4. Push toast on new activity for members (uses M3 pipeline, respects quiet hours).
  5. Tests: `activityFeed.data.test.ts`, `activityFeed.redaction.test.ts`.
- **Files:**
  - `prisma/migrations/020_activity_feed.sql` (new)
  - [prisma/schema.prisma](../prisma/schema.prisma)
  - `src/app/activity/page.tsx` (new)
  - `src/lib/server/activityFeed.ts` (new)
  - `src/components/settings/WorkspaceMembersCard.tsx`
  - `src/__tests__/activityFeed.data.test.ts` (new)
  - `src/__tests__/activityFeed.redaction.test.ts` (new)
- **Dependencies:** M3 (push pipeline), M5.2 (audit patterns), M10.1 (repositories).
- **Acceptance Criteria:**
  - Disabled by default; enabling is OWNER‑only and audited.
  - Amounts are hidden by default; unlock is per‑user preference.
  - Cross‑workspace data never appears.

---

## M14 — AI‑Native Surfaces (Opt‑In)

**Horizon:** 4 · **PRD §4.3, §4.11 & §17.1 · Status:** Pending

**Outcome:** Calm, opt‑in AI surfaces that never leak monetary values to third parties: on‑device categorization, natural‑language filters, anomaly explanations.

### Sprint 14.1 — On‑Device Categorization Suggestions

- **Status:** Pending · **Priority:** P3 · **Effort:** L · **Story points:** 13
- **Goal:** Suggest a category as the user types a remark, entirely on‑device.
- **Tasks:**
  1. Bundle a small on‑device model (WASM/onnxruntime‑web) or a lightweight rule/embedding hybrid — no server call.
  2. `useCategorySuggestion(remark, amount)` hook returns top‑3 with confidence.
  3. UI: inline chips in expense form; tap to accept, learns via local rule additions in `AutoRulesManager`.
  4. Privacy contract: model never uploaded, no telemetry with remark/amount.
  5. Tests: `categorySuggestion.contract.test.ts`, `categorySuggestion.privacy.test.ts`.
- **Files:**
  - `src/lib/ai/categorySuggestion.ts` (new)
  - `src/hooks/useCategorySuggestion.ts` (new)
  - `src/components/expenses/ExpenseForm.tsx`
  - `src/__tests__/categorySuggestion.contract.test.ts` (new)
  - `src/__tests__/categorySuggestion.privacy.test.ts` (new)
- **Dependencies:** M9.1 (Web Worker infra for model inference).
- **Acceptance Criteria:**
  - Suggestion latency < 100 ms P95 on mid‑tier Android.
  - No network request from the suggestion path (asserted in test).
  - Accepted suggestion optionally becomes an `AutoRule`.

### Sprint 14.2 — Natural‑Language Filter Bar (Analytics)

- **Status:** Pending · **Priority:** P3 · **Effort:** L · **Story points:** 13
- **Goal:** "food last month over 500" translates to structured filters, on‑device.
- **Tasks:**
  1. Local tokenizer + intent parser in `src/lib/ai/nlFilter.ts` (grammar‑first with fuzzy category matching).
  2. Query bar on analytics page that echoes the interpreted filter chip‑style; explicit "clear".
  3. Never send text off‑device (contract test).
  4. Accessible: `aria-live` region announcing the parsed filter.
  5. Tests: `nlFilter.parse.test.ts`, `nlFilter.privacy.test.ts`, `nlFilter.a11y.test.ts`.
- **Files:**
  - `src/lib/ai/nlFilter.ts` (new)
  - `src/components/analytics/NlFilterBar.tsx` (new)
  - `src/app/analytics/page.tsx`
  - `src/__tests__/nlFilter.parse.test.ts` (new)
  - `src/__tests__/nlFilter.privacy.test.ts` (new)
  - `src/__tests__/nlFilter.a11y.test.ts` (new)
- **Dependencies:** M4 (a11y contract template).
- **Acceptance Criteria:**
  - Parses 20 canonical phrases correctly; graceful fallback on unknown input.
  - Zero outbound network calls from the filter bar.

### Sprint 14.3 — Inline Anomaly Explanations

- **Status:** Pending · **Priority:** P3 · **Effort:** M · **Story points:** 8
- **Goal:** When an anomaly is flagged, render a calm plain‑language "why" beneath the chart — not an alert.
- **Tasks:**
  1. Extend anomaly detection to emit a structured `reason` (`recurring-missed`, `category-spike`, `unusual-merchant`, …).
  2. Templated explanation renderer in `src/components/analytics/AnomalyExplanation.tsx` — no LLM calls.
  3. Inline in `AnomalyCallout`; expandable "why" panel with the underlying data table (a11y‑friendly).
  4. Tests: `anomaly.reason.test.ts`, `anomaly.explanation.a11y.test.ts`.
- **Files:**
  - `src/lib/anomaly/reasons.ts` (new)
  - `src/components/analytics/AnomalyCallout.tsx`
  - `src/components/analytics/AnomalyExplanation.tsx` (new)
  - `src/__tests__/anomaly.reason.test.ts` (new)
  - `src/__tests__/anomaly.explanation.a11y.test.ts` (new)
- **Dependencies:** M4.2 (chart text alternatives).
- **Acceptance Criteria:**
  - Every anomaly has a reason string; renderer covers all reason types.
  - Panel is fully keyboard operable and reduced‑motion respectful.
  - No external calls.

---

## M15 — UI Foundation (Product Experience Documentation)

**Horizon:** 1 · **PRD Milestone:** M1 (extension) · **Debt covered:** UI-Foundation audit gap · **Status:** Done (2026-07-24)

**Outcome:** ExpenStream has a formal **Product Experience** documentation family — the missing middle between doctrine (`PRODUCT_PRINCIPLES.md`) and mechanics (`DESIGN_SYSTEM.md`). Future AI agents and human contributors can bootstrap a _premium finance experience_ mindset without additional prompting. Documentation-only sprint — **no application source code touched**.

Full audit that authorised this milestone: [`sprint-reports/UI_FOUNDATION_AUDIT.md`](../sprint-reports/UI_FOUNDATION_AUDIT.md).
Execution report: [`sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md`](../sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md).

### Sprint 15.1 — Author Product Experience Family & Extend Anchor Docs

- **Status:** Done (2026-07-24) · **Priority:** P1 · **Effort:** M · **Story points:** 8
- **Goal:** Land the three approved new documents, five approved in-place extensions, and prompt-layer updates from the UI Foundation Audit.
- **Tasks:**
  1. Create [`docs/EXPERIENCE_VISION.md`](EXPERIENCE_VISION.md) — the north-star narrative + Six Qualities + benchmark qualities (never designs).
  2. Create [`docs/SCREEN_GUIDELINES.md`](SCREEN_GUIDELINES.md) — canonical composition and five states for Dashboard, Expenses, Analytics, Business, Category, Settings, Login, Landing.
  3. Create [`docs/FINANCIAL_PSYCHOLOGY.md`](FINANCIAL_PSYCHOLOGY.md) — money-bias catalogue with a per-bias guardrail and refused anti-pattern.
  4. Extend [`docs/PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) with §7.5 Emotional design commitments and §7.6 Financial-psychology guardrails.
  5. Extend [`docs/PROJECT_MASTER_PLAN.md`](PROJECT_MASTER_PLAN.md) §7 with per-journey emotional arc sub-bullets.
  6. Extend [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) with §22 UI Evolution & Versioning.
  7. Extend [`docs/AI_AGENT_HANDBOOK.md`](AI_AGENT_HANDBOOK.md) §1 memory layout, §2 canonical read order, §8 prompts of record.
  8. Extend [`prompts/STANDARD_HEADER.md`](../prompts/STANDARD_HEADER.md) STEP 1 to list the three new docs.
  9. Extend [`prompts/IMPLEMENT_SPRINT.md`](../prompts/IMPLEMENT_SPRINT.md) Phase 2 to consult Experience Vision + Screen Guidelines.
  10. Generate [`sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md`](../sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md).
- **Files:**
  - `docs/EXPERIENCE_VISION.md` (new)
  - `docs/SCREEN_GUIDELINES.md` (new)
  - `docs/FINANCIAL_PSYCHOLOGY.md` (new)
  - `docs/PRODUCT_PRINCIPLES.md` (updated: §7.5, §7.6)
  - `docs/PROJECT_MASTER_PLAN.md` (updated: §7 emotional arcs)
  - `docs/DESIGN_SYSTEM.md` (updated: §22)
  - `docs/AI_AGENT_HANDBOOK.md` (updated: §1, §2, §8, §9)
  - `prompts/STANDARD_HEADER.md` (updated: STEP 1 doc list)
  - `prompts/IMPLEMENT_SPRINT.md` (updated: Phase 2 bullets)
  - `sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md` (new)
- **Dependencies:** [`sprint-reports/UI_FOUNDATION_AUDIT.md`](../sprint-reports/UI_FOUNDATION_AUDIT.md) approval.
- **Acceptance Criteria:**
  - The three new docs each explain: why the feature exists, problem it solves, business + product value, user mindset, emotional goal, user journey, loading / empty / error / offline states, accessibility, motion expectations, information hierarchy, interaction philosophy, design rationale, future evolution, and common implementation mistakes.
  - No existing high-quality section is rewritten; every extension is additive.
  - No `src/` file is modified.
  - Reading order in `AI_AGENT_HANDBOOK §2` includes the three new docs in the positions defined by the audit §6.
  - `STANDARD_HEADER.md` STEP 1 lists the three new docs.
  - Cross-references between the four Product Experience docs and their doctrine anchors resolve (no 404s).

---

### Milestone Status Summary

| ID  | Milestone                                        | Horizon | Priority | Sprints | Status            |
| --- | ------------------------------------------------ | ------- | -------- | ------- | ----------------- |
| M1  | Documentation Truth                              | 1       | P1       | 2       | Pending           |
| M2  | Sync Engine Reliability & Correctness            | 1       | P0       | 3       | Pending           |
| M3  | Notification UX Hardening                        | 1       | P1       | 2       | Pending           |
| M4  | Accessibility Contracts Coverage                 | 1       | P0       | 2       | Pending           |
| M5  | Security & Compliance Hardening                  | 1–2     | P0/P1    | 4       | Pending           |
| M6  | Observability & Ops Foundation                   | 1–2     | P1       | 2       | Pending           |
| M7  | Business Ledger Polish & Reminders               | 2       | P1       | 2       | Pending           |
| M8  | Envelope Budgets                                 | 2       | P2       | 2       | Pending           |
| M9  | Performance & Bundle Discipline                  | 2       | P2       | 2       | Pending           |
| M10 | Architecture Modularity Refactor                 | 2       | P2/P3    | 2       | Pending           |
| M11 | Data Lifecycle & Ownership                       | 3       | P2/P3    | 2       | Pending           |
| M12 | PWA & Platform Expansion                         | 3       | P3       | 2       | Pending           |
| M13 | Collaboration Expansion                          | 3       | P3       | 2       | Pending           |
| M14 | AI‑Native Surfaces (Opt‑In)                      | 4       | P3       | 3       | Pending           |
| M15 | UI Foundation (Product Experience Documentation) | 1       | P1       | 1       | Done (2026-07-24) |

**Totals:** 15 milestones · 33 sprints · 1 Done (M15), 14 Pending.

### Traceability to PRD

| Source                                    | Landed in |
| ----------------------------------------- | --------- |
| PRD M1 — Documentation Truth              | M1        |
| PRD M2 — Sync Reliability                 | M2        |
| PRD M3 — Notification UX                  | M3        |
| PRD M4 — A11y Contracts                   | M4        |
| PRD M5 — Envelope Budgets                 | M8        |
| PRD M6 — Payment Reminders                | M7.2      |
| PRD M7 — Session Anomaly Surface          | M5.2      |
| PRD M8 — iOS PWA Education                | M12.1     |
| TD‑1, TD‑2, TD‑12 (Documentation)         | M1        |
| TD‑3 (Conflict UX)                        | M2.3      |
| TD‑4 (Push retry)                         | M3.1      |
| TD‑5 (iOS install)                        | M12.1     |
| TD‑6 (Chart text alt)                     | M4.2      |
| TD‑7 (Dep automation)                     | M5.1      |
| TD‑8 (Session anomaly)                    | M5.2      |
| TD‑9 (Monetary math)                      | M2.3      |
| TD‑10 (Feature boundary)                  | M10       |
| TD‑11 (Bundle budgets)                    | M6.2, M9  |
| Architecture §18.1 (conflict)             | M2.3      |
| Architecture §18.2 (money)                | M2.3      |
| Architecture §18.3 (idempotency)          | M2.2      |
| Architecture §18.4 (`server-only`)        | M5.3      |
| Architecture §18.5–18.7 (repos/verticals) | M10       |
| Architecture §18.8 (guaranteed once)      | M2.2      |
| Architecture §18.9–18.10 (stream/cursor)  | M9.2      |
| Architecture §18.11–18.13 (perf)          | M6.2, M9  |
| Architecture §18.14–18.17 (observability) | M6        |
| Architecture §18.18–18.21 (security)      | M5        |
| Architecture §18.22–18.23 (lifecycle)     | M11.1     |
| Architecture §18.24–18.25 (docs)          | M1        |
| PRD Future §17.1 (AI)                     | M14       |
| PRD Future §17.2 (E2E archive)            | M11.2     |
| PRD Future §17.3 (client portal)          | M13.1     |
| PRD Future §17.4 (household feed)         | M13.2     |

### Risk Coverage

| Risk | Description                     | Mitigating sprint(s) |
| ---- | ------------------------------- | -------------------- |
| R‑1  | Sync mutation loss              | M2.2                 |
| R‑2  | Cross‑workspace leak            | M5.3, M10.1          |
| R‑3  | Secret leak in client bundle    | M5.3, M6.1           |
| R‑4  | Dependency CVE unpatched        | M5.1                 |
| R‑5  | Monetary precision bug          | M2.3                 |
| R‑6  | Push unreliable on iOS          | M3.1, M12            |
| R‑7  | Offline conflict silent drop    | M2.3                 |
| R‑8  | Money to third‑party analytics  | M6.1 (logger)        |
| R‑9  | Accessibility regression        | M4                   |
| R‑10 | Encryption key lost mid‑session | M5.4                 |
| R‑11 | Account lockout w/o recovery    | (existing surface)   |
| R‑12 | Low iOS install rate            | M12.1                |
| R‑13 | Overdue signal missed           | M7                   |

---

_All items above are **Pending**. Update `Status:` in place when work begins or completes. This board mirrors [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md) — if the two disagree, the PRD wins for scope and the code wins for behavior; then update this file._

---

**Last reviewed:** 2026-07-23
