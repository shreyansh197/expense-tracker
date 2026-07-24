<!--
  CHANGELOG.md — Technical change log for ExpenStream
  Owner: AI Engineering Team
  Audience: Engineers, auditors, support, returning contributors.
  Companion docs: RELEASE_NOTES.md (user-facing), SPRINT_BOARD.md,
                  IMPLEMENTATION_QUEUE.md, PROJECT_MASTER_PLAN.md.
  Rule: Every merge that changes behavior, schema, dependencies, or docs must
        land an entry here before or with the commit. Group by version using
        Keep a Changelog format. No PII / no monetary values, ever.
-->

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Section guide is captured at the bottom of the file.

**Version scheme:** Sprint-tagged releases (`Sprint N.M`) until the first public tag; semver resumes at v1.0.0 at the Horizon 1 exit gate.

Companion documents: [RELEASE_NOTES.md](RELEASE_NOTES.md) (user-facing highlights), [SPRINT_BOARD.md](SPRINT_BOARD.md), [IMPLEMENTATION_QUEUE.md](IMPLEMENTATION_QUEUE.md).

---

## [Unreleased]

### Added

- **Sync counters (T-2.1.1):** Session-scoped `pullBatches`, `pushBatches`, `conflicts`, `failures`, `lastPullAt`, `lastPushAt`, and redacted `lastError` in [src/lib/syncEngine.ts](../src/lib/syncEngine.ts); exposed via new `useSyncCounters` hook in [src/hooks/useSyncStatus.ts](../src/hooks/useSyncStatus.ts). No PII/money in payload; counters clear on tab close or `resetSyncCounters()`.
- **Sync Diagnostics panel (T-2.1.2):** New `src/components/settings/SyncDiagnosticsCard.tsx` under Settings › Data & Automation; shows queue depth, per-session pull/push counters, conflict count, last pull/push time, last error, and a Reset button. Five states honored (empty/loading/error/offline/success), ≥44 × 44 px target, keyboard + `aria-live` region.
- **Conflict reproduction test (T-2.1.3):** New `src/__tests__/syncEngine.repro.test.ts` — two virtual clients mutating `expense.amount` concurrently; snapshots the current non-deterministic last-write-wins overwrite plus conflict-counter increment so Sprint 2.3 can measure the fix objectively.
- **Docs (T-2.1.4):** [AI_CONTEXT.md §16.1](AI_CONTEXT.md) now documents the `NEXT_PUBLIC_SYNC_LOG` compile-time toggle with sample output and explicit "no monetary values in logs" caveats.

### Changed

- _Pending._

### Fixed

- _Pending._

### Removed

- _Pending._

### Performance

- _Pending._

### Accessibility

- Sync Diagnostics panel meets a11y contract: `role="region"`, `aria-label="Sync diagnostics"`, `aria-live="polite"`, focus-visible ring, ≥44 × 44 px reset control.

### Security

- Sync counters and diagnostics UI never surface monetary values, request bodies, or auth tokens; `lastError` stores only tag + status code / error name (max 200 chars).

### Notes

- Sprint 2.1 (M2) is code-complete. Baseline captured; Sprint 2.2 (persistent queue) and Sprint 2.3 (deterministic conflict UX) will use the new counters to measure improvement.

---

## [Sprint 1.1] — 2026-07-23 — Documentation Truth (M1, part 1 of 2)

Sprint 1.1 is documentation-only. It closes the "empty living docs" debt (TD-1, TD-2, drifts DRIFT-1 through DRIFT-4 recorded in [Sprint 0](#sprint-0--2026-07-22--master-audit-documentation-only)) so any engineer or AI agent can bootstrap from `docs/` without asking clarifying questions.

### Added

- Backfilled [CHANGELOG.md](CHANGELOG.md) (this file) from `git log`, [`prisma/migrations/`](../prisma/migrations), and [RELEASE_NOTES.md](RELEASE_NOTES.md) hints — grouped by version using Keep a Changelog sections.
- Backfilled [RELEASE_NOTES.md](RELEASE_NOTES.md) with a user-facing highlight per shipped era, phrased in the calm editorial voice defined in [AI_CONTEXT.md](AI_CONTEXT.md).
- Authored full [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) covering env vars, migrations, RLS verification, rate-limit table, VAPID keys, Sentry DSN, DNS, backups, and rollback strategy for migrations / deploys / feature flags.
- Authored full [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) covering unit, integration, accessibility contract, sync integration, performance smoke, security scan, and manual smoke gates — each mapped to its owning spec file under [`src/__tests__/`](../src/__tests__).
- Added [sprint-reports/SPRINT_1_SUMMARY.md](../sprint-reports/SPRINT_1_SUMMARY.md) with the executive summary, files touched, and suggested commit message per [`prompts/STANDARD_HEADER.md`](../prompts/STANDARD_HEADER.md) §8.

### Changed

- [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md) Appendix — cross-links updated: removed the _pending_ markers on ARCHITECTURE and SPRINT_BOARD; added links to [IMPLEMENTATION_QUEUE.md](IMPLEMENTATION_QUEUE.md), [IMPLEMENTATION_RULES.md](IMPLEMENTATION_RULES.md), [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md), [UX_DECISIONS.md](UX_DECISIONS.md), [AI_AGENT_HANDBOOK.md](AI_AGENT_HANDBOOK.md) (added in Sprint 1.2), and the ADR index.
- Added `Last reviewed: 2026-07-23` footer to every `docs/*.md` file that lacked one (CHANGELOG, RELEASE_NOTES, PRODUCTION_CHECKLIST, TESTING_CHECKLIST, AI_CONTEXT).
- Marked Sprint 1.1 tasks T-1.1.1 … T-1.1.6 as `[x] Done` in [IMPLEMENTATION_QUEUE.md](IMPLEMENTATION_QUEUE.md); marked Sprint 1.1 as `Done` on [SPRINT_BOARD.md](SPRINT_BOARD.md).

### Fixed

- Sprint 0 DRIFT-4 (empty scaffolds for CHANGELOG / RELEASE_NOTES / PRODUCTION_CHECKLIST / TESTING_CHECKLIST) — closed.

### Removed

- _None — no application code touched._

### Performance / Accessibility / Security

- _No code changes; no runtime effects._

### Notes

- Sprint 1.1 is documentation-only per Sprint 1.1 goal in [SPRINT_BOARD.md](SPRINT_BOARD.md).
- The `Sprint 2 … Sprint 10` scaffolds previously in this file were removed; future sprints append new sections at the top under `[Unreleased]` then get versioned on merge.

---

## [Sprint 1.2] — 2026-07-23 — Documentation Truth (M1, part 2 of 2)

Sprint 1.2 completes M1 by closing the visual, structural, and repo-hygiene gaps that block onboarding and AI-assisted work.

### Added

- [docs/ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) — Mermaid sequence diagrams for the critical flows: password + TOTP login, device-link accept, sync pull, mutation commit, workspace invite accept, and Web Push send. Every diagram labels the guard chain `requireAuth → requireWorkspaceMember → checkRateLimit`.
- [docs/AI_AGENT_HANDBOOK.md](AI_AGENT_HANDBOOK.md) — Repo memory layout, canonical doc-read order (`AI_CONTEXT → ARCHITECTURE → DESIGN_SYSTEM → PROJECT_MASTER_PLAN → SPRINT_BOARD → IMPLEMENTATION_QUEUE`), boundary rules, forbidden actions, and the "do not modify application code without approval" contract.
- [docs/adr/0000-template.md](adr/0000-template.md) — Standard ADR template (Context / Decision / Consequences / Alternatives / References).
- [docs/adr/0001-postgres-over-firestore.md](adr/0001-postgres-over-firestore.md) — Records the historical decision to standardize on Postgres (Supabase) as the source of truth and disable Firestore. References [`firestore.rules`](../firestore.rules) as the legacy artifact retained for audit only.
- [`prisma/legacy/`](../prisma/legacy) — new folder for archived, non-Prisma-authored SQL kept for provenance.

### Changed

- Migrations consolidation (TD-12): moved the six root-level Supabase SQL files into `prisma/legacy/` — `supabase-migration.sql`, `supabase-migration-business.sql`, `supabase-migration-device-id.sql`, `supabase-migration-goals.sql`, `supabase-migration-settings.sql`, `supabase-migration-workspace.sql`, and `supabase-setup.sql`. `prisma/migrations/001_initial_schema.sql` … `013_rate_limit_table.sql` remain the sole authoritative migration history.
- [ARCHITECTURE.md §8.3 (Migration history)](ARCHITECTURE.md) — clarified that `prisma/migrations/` is authoritative and `prisma/legacy/` is provenance-only (not applied by `prisma migrate`).
- Doc link audit (T-1.2.5): normalized relative links across `docs/*.md`; every outbound link resolves within the repo tree.
- Marked Sprint 1.2 tasks T-1.2.1 … T-1.2.5 as `[x] Done` in [IMPLEMENTATION_QUEUE.md](IMPLEMENTATION_QUEUE.md); marked Sprint 1.2 as `Done` on [SPRINT_BOARD.md](SPRINT_BOARD.md); marked milestone M1 as `Done`.

### Fixed

- Sprint 0 DRIFT-3 (stray `.sql` files at repo root shadowing Prisma migration authority) — closed.

### Removed

- No application code removed. The seven root-level `supabase-*.sql` files were relocated (not deleted) into `prisma/legacy/` for audit continuity.

### Performance / Accessibility

- _No code changes._

### Security

- ADR-0001 records why Firestore rules at [`firestore.rules`](../firestore.rules) are inactive and how [migration 012](../prisma/migrations/012_enable_rls_all_tables.sql) enforces authorization via Postgres RLS instead.

### Notes

- Milestone **M1 — Documentation Truth** is now complete. Next active milestone is **M2 — Sync Engine Reliability & Correctness**; see [Sprint 2.1](IMPLEMENTATION_QUEUE.md#sprint-21) for the first task set.

---

## [Sprint 0] — 2026-07-22 — Master Audit (documentation only)

### Added

- [`sprint-reports/SPRINT_0_SUMMARY.md`](../sprint-reports/SPRINT_0_SUMMARY.md) — full Master Audit per [`prompts/MASTER_AUDIT.md`](../prompts/MASTER_AUDIT.md): Executive Summary, source-verified Current State, Critical Issues (CI-1..9), High-Priority Improvements (HP-1..12), audits across UI / UX / Accessibility / Performance / Backend / Security / Architecture, Technical Debt register, retention audit, competitive comparison, 14-milestone priority roadmap, sprint recommendations, risks, category scoring, Final Score 72/100.
- [`docs/IMPLEMENTATION_QUEUE.md`](IMPLEMENTATION_QUEUE.md) verified present and complete: `Sprint × Epic × Task` decomposition for Sprints 1.1 → 14.3 with the full attribute set (Sprint, Epic, Task ID, Description, Business Value, Technical Value, Priority, Impact, Effort, Dependencies, Affected Files, Acceptance Criteria, Status — all default `Pending`).

### Changed

- Recorded four drifts (SPRINT_0_SUMMARY §12) and routed them to milestone M1: DRIFT-1 (spec-file count in `AI_CONTEXT §15`), DRIFT-2 (missing `challenges`/`chronicle`/`moneyDna`/`supabase` in `ARCHITECTURE §11`), DRIFT-3 (stray `firestore.rules`), DRIFT-4 (empty scaffolds for CHANGELOG / RELEASE_NOTES / PRODUCTION_CHECKLIST / TESTING_CHECKLIST).

### Fixed

- _No application source code modified during Sprint 0._

### Notes

- Sprint 0 mode was documentation-only per the "IMPORTANT RULES" in [`prompts/MASTER_AUDIT.md`](../prompts/MASTER_AUDIT.md).
- Roadmap of record: [SPRINT_BOARD.md](SPRINT_BOARD.md). Execution plan of record: [IMPLEMENTATION_QUEUE.md](IMPLEMENTATION_QUEUE.md).

---

## [Pre-Sprint 0] — 2026-03-21 → 2026-07-22 — Historical development

Consolidated retrospective entry backfilled from `git log` and [`prisma/migrations/`](../prisma/migrations). Grouped by milestone rather than by commit to keep the log readable; per-commit archaeology is available via `git log`.

### Added — Foundation (2026-03)

- **Core schema (`001_initial_schema.sql`, 2026-03-21):** workspaces, memberships, expenses, categories, budgets, recurring templates, savings goals, business ledger tables (`business_customers`, `business_invoices`, `business_payments`), sync columns (`updated_at`, `deleted_at`, `client_id`, `version`).
- **Auth stack (`002_auth_schema.sql`, 2026-03-23):** users, refresh tokens, TOTP secrets, WebAuthn credentials, devices, audit log.
- **EOM forecast + MAD anomaly detection** on the analytics surface (2026-03-21).
- **Google OAuth sign-in** and **savings goals dashboard widget** (`003_google_oauth.sql`, 2026-03-25).
- **Phone OTP sign-in** (`004_phone_otp.sql`, 2026-03-25).
- **Stable per-browser client device ID** for multi-device linking (`005_device_client_id.sql`, 2026-03-28).
- **Multi-currency + expanded workspace settings** columns (`006_new_settings_columns.sql`, 2026-03-31).

### Added — Premium visual redesign (2026-04)

- **Design token system, motion variants, character illustrations, spending-pulse card, savings-goals widget** — the "Living Terrain 2026" pass ([DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) codename).
- **Comprehensive audit improvements (P0 + P1 + P2)** including workspace-scoped encryption key (`008_workspace_encryption_key.sql`).
- **Achievements + accent-color personalization** (`009_achievements_accent_color.sql`, 2026-04-11).
- **Web Push notifications**: `push_subscriptions` table, VAPID plumbing, notification preferences (`010_push_subscriptions_notification_prefs.sql`, 2026-04-18).
- **Forgot / reset password flow** via Resend transactional email (2026-04-08).
- **Verification tokens** table for email verification + password reset (`011_verification_tokens.sql`, 2026-04-23).
- **Category chip peek, voice input, MoneyEcho, SpendingHeatmap, Monthly Postcard** analytics surfaces.
- **Currency-column-per-expense** to support multi-currency ledgers (`007_expense_currency_column.sql`, 2026-03-31 → surfaced in April).

### Added — PWA + security posture (2026-04 → 2026-05)

- **PWA improvements pass** (2026-04-23): manifest polish, service worker resilience.
- **RLS on all tables** (`012_enable_rls_all_tables.sql`, 2026-05-06) — every domain table now filters by `workspace_id`; `postgres_changes` listeners removed in the same commit.
- **Biometric app unlock, native PIN keyboard, configurable lock timeout** (2026-05-06); later refined to WebAuthn Conditional UI on iOS.
- **Weekly digest, budget alerts, smart nudges (≤ 2/day) via server cron push** (2026-05-06).
- **PaceGauge** replaces HeroOrb on the dashboard hero (2026-05-01).
- **Today's Allowance hero, Quick Templates, Category View toggle** (2026-05-14).
- **Animated numbers + contextual help / info system + auth soft-network-error handling** (2026-05-16).

### Added — Premium overhaul + rate-limit hardening (2026-06 → 2026-07)

- **Premium overhaul (`feat1`, 2026-06-17):** DB-backed rate-limit table (`013_rate_limit_table.sql`), broader UI polish pass.
- **AI Development Kit v1** — living docs skeleton (2026-07-22) landing [`docs/AI_CONTEXT.md`](AI_CONTEXT.md), [`docs/PROJECT_MASTER_PLAN.md`](PROJECT_MASTER_PLAN.md), [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), [`docs/UX_DECISIONS.md`](UX_DECISIONS.md), [`docs/PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md), [`docs/IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md), [`docs/SPRINT_BOARD.md`](SPRINT_BOARD.md), and this file's scaffold.

### Changed — Reliability & UX polish (rolling)

- **Sync engine cross-platform reliability** — race-condition and re-auth handling stabilized (2026-05).
- **Scroll jank fix** — address-bar resize events no longer misidentified as keyboard events; removed `dvh` overrides that regressed mobile scrolling (2026-05).
- **Design-token migration & spec test suite** (2026-04-11 "Week 4+ UI/UX overhaul") — replaced hard-coded tokens with semantic tokens; added `src/__tests__/` accessibility and design-token contract tests.

### Fixed — Selected regressions (representative, not exhaustive)

- Expense data erasure on currency-column migration path (2026-03-31).
- Google OAuth 401 caused by middleware ordering (2026-03-25).
- Vercel TS error from invalid cast in `_setShared` (2026-05).
- Duplicate biometric prompt after feature removal (2026-05-06).
- Multiple mobile UX regressions on the expenses page — toggle row, template delete, calendar overflow (2026-04).

### Security

- Postgres **Row-Level Security enforced on every table** (migration 012, 2026-05-06). Removed direct `postgres_changes` client listeners in the same landing.
- **DB-backed sliding-window rate limiter** (migration 013, 2026-06-17) — replaces in-memory limiter for horizontally scaled deploys.
- **Workspace-scoped encryption key** (migration 008) — client-side envelope encryption prerequisite.
- **Passkeys (WebAuthn)** with Conditional UI on iOS (2026-05-06) — reduces reliance on password memory.

### Notes

- This block is a retrospective. Individual commits remain the ground truth; consult `git log --follow <path>` for byte-level provenance.
- Per project rule, **no PII or monetary values** appear in this changelog. If a future entry needs to reference a currency amount, replace with a bucketed label (e.g., "amounts under a small threshold").

---

<!--
Section Guide (Keep a Changelog):
- Added         — new features
- Changed       — changes to existing functionality
- Fixed         — bug fixes
- Removed       — features removed in this release
- Performance   — performance improvements
- Accessibility — a11y improvements (WCAG, keyboard, screen reader, contrast)
- Security      — vulnerabilities addressed, hardening changes
- Notes         — context, migration guidance, known issues
-->

**Last reviewed:** 2026-07-23
