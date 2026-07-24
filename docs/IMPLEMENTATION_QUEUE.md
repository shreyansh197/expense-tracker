<!--
  IMPLEMENTATION_QUEUE.md - Single source of truth for execution
  Owner: Product + AI Engineering
  Audience: Engineers, AI agents, PMs, QA.
  Companion docs: PROJECT_MASTER_PLAN.md, SPRINT_BOARD.md, ARCHITECTURE.md,
                  AI_CONTEXT.md, DESIGN_SYSTEM.md, TESTING_CHECKLIST.md,
                  PRODUCTION_CHECKLIST.md, CHANGELOG.md, RELEASE_NOTES.md.
  Rule: This file is the ordered execution plan for the entire product roadmap.
        It decomposes every milestone and sprint from SPRINT_BOARD.md into
        Sprint -> Epic -> Task tuples. Update `Status` in place as tasks move
        through the pipeline. Do not fork. If this file and SPRINT_BOARD.md
        disagree, SPRINT_BOARD.md wins for scope and this file must be rebased.
-->

# ExpenStream - Implementation Queue

**Status:** Living document - **Version:** 1.0 - **Last reviewed:** 2026-07-22

This queue is the ordered, task-level execution plan for the entire ExpenStream roadmap defined in [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md) and decomposed into milestones and sprints in [SPRINT_BOARD.md](SPRINT_BOARD.md). Every task is atomic, owner-assignable, and independently verifiable. **No code is implemented by this document** - it is a plan of record.

## How to read this queue

Work is nested as **Sprint -> Epic -> Task**:

- **Sprint** - A 2-week timebox from [SPRINT_BOARD.md](SPRINT_BOARD.md) (e.g., `Sprint 1.1`, `Sprint 2.2`). Sprints are executed in ascending order unless a higher-priority Sprint is pulled forward.
- **Epic** - The parent milestone (`M1 ... M14`). One Epic per Sprint in this queue (the Epic-per-Sprint mapping mirrors the milestone breakdown in [SPRINT_BOARD.md](SPRINT_BOARD.md)).
- **Task** - A single atomic unit of work. Every task carries the full attribute set below.

### Task attributes

| Field                   | Meaning                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Task ID**             | Stable identifier `T-<sprint>.<n>` (e.g., `T-2.3.4`). Never renumbered.                                                        |
| **Sprint**              | Parent sprint (`Sprint X.Y`).                                                                                                  |
| **Epic**                | Parent milestone (`M1 ... M14`) and its human title.                                                                           |
| **Feature**             | Product feature or subsystem touched (e.g., "Sync Engine", "Business Ledger", "Notification").                                 |
| **Description**         | One-paragraph statement of what the task changes or produces.                                                                  |
| **Business Value**      | Why the user or the business cares. Maps to PRD Goals / KPIs where possible.                                                   |
| **Technical Value**     | Why the codebase cares. Maps to Architecture section, Technical Debt items, or Risks.                                          |
| **Priority**            | `P0` (data safety / security / a11y) - `P1` (current theme) - `P2` (next horizon) - `P3` (later).                              |
| **Impact**              | `High` / `Medium` / `Low` - expected reach on users, code health, or risk reduction.                                           |
| **Effort**              | `XS` ~ half day - `S` ~ 1-2 days - `M` ~ 3-5 days - `L` ~ 6-9 days - `XL` ~ full sprint.                                       |
| **Dependencies**        | Other Task IDs, milestones, or infra that must land first. `None` if independent.                                              |
| **Affected Files**      | Concrete files/folders the task creates or modifies.                                                                           |
| **Acceptance Criteria** | Objective, testable conditions for "done". Must satisfy the DoD in [PROJECT_MASTER_PLAN section 16.1](PROJECT_MASTER_PLAN.md). |
| **Status**              | `[ ] Pending` - `[~] In Progress` - `[!] Blocked` - `[x] Done`. All tasks default to `[ ] Pending`.                            |

### Global Definition of Done

Applied to every task, in addition to task-specific Acceptance Criteria - see [PROJECT_MASTER_PLAN section 16.1](PROJECT_MASTER_PLAN.md):

TypeScript strict - ESLint/Prettier clean - Tests co-located under `src/__tests__/` - Zod at every API boundary - `requireAuth` + workspace guard + rate limit on every mutation route - Idempotent + queueable mutations - No hard-coded design tokens - >= 44x44 px touch targets - Keyboard + SR labeled - `prefers-reduced-motion` honored - Five states (empty/loading/error/offline/success) - Docs + CHANGELOG updated - No PII/money in logs or analytics.

---

## Table of Contents

- [Sprint 1.1 - Populate Sprint Board & Refresh Living Docs (Epic M1)](#sprint-11)
- [Sprint 1.2 - Sequence Diagrams, Migration Consolidation, AI-Agent Handbook (Epic M1)](#sprint-12)
- [Sprint 2.1 - Sync Instrumentation & Conflict Reproduction (Epic M2)](#sprint-21)
- [Sprint 2.2 - Persistent Mutation Queue & Guaranteed-Once Delivery (Epic M2)](#sprint-22)
- [Sprint 2.3 - Deterministic Conflict UX & Monetary Math Audit (Epic M2)](#sprint-23)
- [Sprint 3.1 - Server Scheduler, Retries & Dead-Letter (Epic M3)](#sprint-31)
- [Sprint 3.2 - Quiet Hours, Timezone Correctness & Ops Dashboard (Epic M3)](#sprint-32)
- [Sprint 4.1 - Contract Template & CI Enforcement (Epic M4)](#sprint-41)
- [Sprint 4.2 - Chart Text Alternatives & A11y Audit Pass (Epic M4)](#sprint-42)
- [Sprint 5.1 - Dependency Automation & CVE SLA (Epic M5)](#sprint-51)
- [Sprint 5.2 - Session Anomaly Surface & Audit Coverage Expansion (Epic M5)](#sprint-52)
- [Sprint 5.3 - CSP Tightening, `server-only` Markers & RLS Smoke Test (Epic M5)](#sprint-53)
- [Sprint 5.4 - Encryption Key Rotation (Epic M5)](#sprint-54)
- [Sprint 6.1 - Structured Logger & Health Endpoints (Epic M6)](#sprint-61)
- [Sprint 6.2 - Rate-Limit Backend Interface & Bundle Budgets in CI (Epic M6)](#sprint-62)
- [Sprint 7.1 - Overdue Signals & Export Parity (Epic M7)](#sprint-71)
- [Sprint 7.2 - Payment Reminders (Push + Email) (Epic M7)](#sprint-72)
- [Sprint 8.1 - Envelope Data Model & Setting UI (Epic M8)](#sprint-81)
- [Sprint 8.2 - Envelope Calculations & Analytics Surface (Epic M8)](#sprint-82)
- [Sprint 9.1 - Web Worker for Analytics Math (Epic M9)](#sprint-91)
- [Sprint 9.2 - Streaming Delta, Cursor Stability & HTTP Caching (Epic M9)](#sprint-92)
- [Sprint 10.1 - Repositories Layer & Typed API Contracts (Epic M10)](#sprint-101)
- [Sprint 10.2 - Feature-Folder Verticalization (Epic M10)](#sprint-102)
- [Sprint 11.1 - Hard-Purge Job & Backup Verification (Epic M11)](#sprint-111)
- [Sprint 11.2 - End-to-End Encrypted Export Archive (Epic M11)](#sprint-112)
- [Sprint 12.1 - iOS PWA Install Education (Epic M12)](#sprint-121)
- [Sprint 12.2 - PWA Polish: Widgets, Share Target, Offline Fallback (Epic M12)](#sprint-122)
- [Sprint 13.1 - Read-Only Client Portal (Single Ledger) (Epic M13)](#sprint-131)
- [Sprint 13.2 - Household Activity Feed (Opt-In) (Epic M13)](#sprint-132)
- [Sprint 14.1 - On-Device Categorization Suggestions (Epic M14)](#sprint-141)
- [Sprint 14.2 - Natural-Language Filter Bar (Analytics) (Epic M14)](#sprint-142)
- [Sprint 14.3 - Inline Anomaly Explanations (Epic M14)](#sprint-143)
- [Sprint 15.1 - Author Product Experience Family & Extend Anchor Docs (Epic M15)](#sprint-151)
- [Roll-Up & Traceability](#roll-up--traceability)

---

<a id="sprint-11"></a>

## Sprint 1.1 - Populate Sprint Board & Refresh Living Docs

**Epic:** M1 - Documentation Truth - **Horizon:** 1 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Replace every empty living doc with a truthful, cross-linked, freshly reviewed record so that any engineer or AI agent can bootstrap without asking clarifying questions.

### T-1.1.1 - Publish Sprint Board decomposition

- **Task ID:** T-1.1.1
- **Sprint:** Sprint 1.1
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - Sprint Board
- **Description:** Populate [docs/SPRINT_BOARD.md](SPRINT_BOARD.md) with the full milestone/sprint decomposition covering Horizons 1-4, including per-sprint goals, tasks, files, dependencies, acceptance criteria, priority and effort.
- **Business Value:** Establishes visible truth of "what we are building next" for the whole team; unblocks planning conversations.
- **Technical Value:** Closes TD-2; gives AI agents an authoritative sprint context to reason about.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [docs/SPRINT_BOARD.md](SPRINT_BOARD.md)
- **Acceptance Criteria:**
  - File is non-empty and cross-linked from [PROJECT_MASTER_PLAN Appendix](PROJECT_MASTER_PLAN.md).
  - Every milestone anchor in the TOC resolves.
  - Each sprint carries Goal, Tasks, Files, Dependencies, Acceptance Criteria, Effort, Priority.
- **Status:** [x] Done (2026-07-23)

### T-1.1.2 - Backfill CHANGELOG from git + migrations

- **Task ID:** T-1.1.2
- **Sprint:** Sprint 1.1
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - Changelog
- **Description:** Populate [docs/CHANGELOG.md](CHANGELOG.md) from git history, numbered `prisma/migrations/*`, and hints in [RELEASE_NOTES.md](RELEASE_NOTES.md). Group entries by version using Keep-a-Changelog format.
- **Business Value:** Restores institutional memory for auditors, support, and returning contributors.
- **Technical Value:** Traceability from a released version back to code, schema, and doc state.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [docs/CHANGELOG.md](CHANGELOG.md)
- **Acceptance Criteria:**
  - Each versioned block lists Added/Changed/Fixed/Security/Removed.
  - Every migration `NNN_*.sql` referenced under its version.
  - No PII/monetary values.
- **Status:** [x] Done (2026-07-23)

### T-1.1.3 - Backfill user-facing Release Notes

- **Task ID:** T-1.1.3
- **Sprint:** Sprint 1.1
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - Release Notes
- **Description:** Populate [docs/RELEASE_NOTES.md](RELEASE_NOTES.md) with user-visible highlights per shipped version, phrased in the calm editorial voice from [AI_CONTEXT.md](AI_CONTEXT.md).
- **Business Value:** Users and stakeholders can see what changed for them; supports "What's new" surfacing.
- **Technical Value:** Companion to CHANGELOG (technical) with a user-story lens.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-1.1.2
- **Affected Files:** [docs/RELEASE_NOTES.md](RELEASE_NOTES.md)
- **Acceptance Criteria:**
  - Each version has >= 1 human-readable highlight per shipped feature.
  - No guilt-tripping / gamified copy.
  - Cross-linked from CHANGELOG.
- **Status:** [x] Done (2026-07-23)

### T-1.1.4 - Author Production Checklist

- **Task ID:** T-1.1.4
- **Sprint:** Sprint 1.1
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - Ops
- **Description:** Populate [docs/PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) covering env vars, migrations, RLS verification, rate-limit table, VAPID keys, Sentry DSN, DNS/domains, backups, rollback strategy.
- **Business Value:** Ships-without-incident guarantee; recovery playbook exists.
- **Technical Value:** Enforces release gating and reduces on-call load.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [docs/PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- **Acceptance Criteria:**
  - Every checklist item is objectively verifiable (pass / fail).
  - Rollback path documented for at least: migration, deploy, feature-flag.
- **Status:** [x] Done (2026-07-23)

### T-1.1.5 - Author Testing Checklist

- **Task ID:** T-1.1.5
- **Sprint:** Sprint 1.1
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - QA
- **Description:** Populate [docs/TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) covering per-release gates: unit, integration, a11y contracts, sync integration, perf smoke, security scan, manual smoke.
- **Business Value:** Every release meets a shared quality bar; regressions caught before merge.
- **Technical Value:** Formalizes CI gates and manual verification steps.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [docs/TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
- **Acceptance Criteria:**
  - Checklist enumerates automated + manual gates with owners.
  - References the specific spec files (`accessibilityContracts.test.ts`, `syncEngine.integration.test.ts`, etc.).
- **Status:** [x] Done (2026-07-23)

### T-1.1.6 - Cross-link docs from PRD Appendix

- **Task ID:** T-1.1.6
- **Sprint:** Sprint 1.1
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - Cross-links
- **Description:** Update [PROJECT_MASTER_PLAN Appendix](PROJECT_MASTER_PLAN.md) so every companion doc is linked; add a `Last reviewed` footer to each doc.
- **Business Value:** One entry point (PRD) discovers the whole doc set.
- **Technical Value:** Prevents doc drift by anchoring to the PRD.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-1.1.1, T-1.1.2, T-1.1.3, T-1.1.4, T-1.1.5
- **Affected Files:** [docs/PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md), all `docs/*.md` footers
- **Acceptance Criteria:**
  - No broken link in `docs/`.
  - Each doc footer states `Last reviewed: YYYY-MM-DD`.
- **Status:** [x] Done (2026-07-23)

---

<a id="sprint-12"></a>

## Sprint 1.2 - Sequence Diagrams, Migration Consolidation, AI-Agent Handbook

**Epic:** M1 - Documentation Truth - **Horizon:** 1 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Close the visual, structural, and repo-hygiene gaps that block onboarding and AI-assisted work. Closes TD-12 and Architecture section 18.25.

### T-1.2.1 - Author Architecture Diagrams

- **Task ID:** T-1.2.1
- **Sprint:** Sprint 1.2
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - Diagrams
- **Description:** Create `docs/ARCHITECTURE_DIAGRAMS.md` with Mermaid sequence diagrams for: login -> 2FA, device-link accept, sync pull, mutation commit, invite accept, push send.
- **Business Value:** New contributors grasp critical flows in minutes, not days.
- **Technical Value:** Living diagrams anchor future refactors and security reviews.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-1.1.6
- **Affected Files:** `docs/ARCHITECTURE_DIAGRAMS.md` (new)
- **Acceptance Criteria:**
  - Diagrams render in GitHub Markdown preview (Mermaid).
  - Each flow labels the guard chain (`requireAuth -> requireWorkspaceMember -> checkRateLimit`).
- **Status:** [x] Done (2026-07-23)

### T-1.2.2 - Consolidate stray SQL migrations

- **Task ID:** T-1.2.2
- **Sprint:** Sprint 1.2
- **Epic:** M1 - Documentation Truth
- **Feature:** Repo hygiene - Migrations
- **Description:** Move stray root migrations (`supabase-migration*.sql`, `supabase-setup.sql`) into `prisma/migrations/` as numbered files or archive under `prisma/legacy/`.
- **Business Value:** One canonical migration history reduces production drift risk.
- **Technical Value:** Closes TD-12; keeps `prisma migrate` authoritative.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** None
- **Affected Files:** `prisma/migrations/*`, `prisma/legacy/*` (new), root `supabase-*.sql`
- **Acceptance Criteria:**
  - Repo root contains no `.sql` files.
  - `prisma migrate status` remains clean on a fresh clone.
- **Status:** [x] Done (2026-07-23)

### T-1.2.3 - Author AI Agent Handbook

- **Task ID:** T-1.2.3
- **Sprint:** Sprint 1.2
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - AI ops
- **Description:** Create `docs/AI_AGENT_HANDBOOK.md` describing repo memory layout, doc-read order, boundary rules, the "do not modify application code without approval" contract, and standard tool usage.
- **Business Value:** Predictable, safe, high-signal AI-assisted work.
- **Technical Value:** Guardrails against speculative edits; consistent context bootstrap.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-1.1.6
- **Affected Files:** `docs/AI_AGENT_HANDBOOK.md` (new)
- **Acceptance Criteria:**
  - Handbook lists read order: `AI_CONTEXT -> ARCHITECTURE -> DESIGN_SYSTEM -> PROJECT_MASTER_PLAN -> SPRINT_BOARD -> IMPLEMENTATION_QUEUE`.
  - Lists forbidden actions (unapproved deps, secret leaks, cross-feature imports).
- **Status:** [x] Done (2026-07-23)

### T-1.2.4 - Introduce ADR framework & ADR-0001

- **Task ID:** T-1.2.4
- **Sprint:** Sprint 1.2
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - ADR
- **Description:** Create `docs/adr/0000-template.md` (context/decision/consequences) and record ADR-0001 = "Adopt Postgres over Firestore" capturing the historical decision.
- **Business Value:** Prevents re-litigating past decisions; institutional memory.
- **Technical Value:** Explicit, versioned decision log for future architecture debates.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** None
- **Affected Files:** `docs/adr/0000-template.md` (new), `docs/adr/0001-postgres-over-firestore.md` (new)
- **Acceptance Criteria:**
  - Template follows standard ADR format.
  - ADR-0001 references [firestore.rules](../firestore.rules) as legacy artifact.
- **Status:** [x] Done (2026-07-23)

### T-1.2.5 - Doc link audit

- **Task ID:** T-1.2.5
- **Sprint:** Sprint 1.2
- **Epic:** M1 - Documentation Truth
- **Feature:** Docs - QA
- **Description:** Verify every outbound link in `docs/*.md` resolves within the repo tree; fix or remove broken ones.
- **Business Value:** No dead-end doc journeys for users or agents.
- **Technical Value:** Low-effort trust boost across the whole doc set.
- **Priority:** P2
- **Impact:** Low
- **Effort:** XS
- **Dependencies:** T-1.2.1, T-1.2.3, T-1.2.4
- **Affected Files:** All `docs/*.md`
- **Acceptance Criteria:**
  - Zero unresolved relative links across `docs/`.
- **Status:** [x] Done (2026-07-23)

---

<a id="sprint-21"></a>

## Sprint 2.1 - Sync Instrumentation & Conflict Reproduction

**Epic:** M2 - Sync Engine Reliability & Correctness - **Horizon:** 1 - **Priority:** P1 - **Effort:** M - **Story points:** 5

**Sprint goal:** Make sync-engine behavior observable and reproduce a real money-field conflict end-to-end so that fixes in Sprint 2.2/2.3 can be measured.

### T-2.1.1 - Add sync counters (pull/push/conflict)

- **Task ID:** T-2.1.1
- **Sprint:** Sprint 2.1
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync Engine - Telemetry
- **Description:** Extend [src/lib/syncEngine.ts](../src/lib/syncEngine.ts) with per-session counters for `pullBatches`, `pushBatches`, `conflicts`, `failures`, exposed via [src/hooks/useSyncStatus.ts](../src/hooks/useSyncStatus.ts).
- **Business Value:** Users and operators can see sync is actually working.
- **Technical Value:** Baseline for M2 KPIs (>= 99.5% success, <= 0.5% conflict).
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [src/lib/syncEngine.ts](../src/lib/syncEngine.ts), [src/hooks/useSyncStatus.ts](../src/hooks/useSyncStatus.ts)
- **Acceptance Criteria:**
  - Counters reset on demand; never persisted with PII/money.
  - Existing sync tests remain green.
- **Status:** [x] Done (2026-07-24)

### T-2.1.2 - Build Sync Diagnostics panel

- **Task ID:** T-2.1.2
- **Sprint:** Sprint 2.1
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Settings - Diagnostics
- **Description:** New `src/components/settings/SyncDiagnosticsCard.tsx` under Settings > Data showing queue depth, last pull time, last error, conflict count, reset button.
- **Business Value:** Advanced users can self-diagnose sync issues; support reduces triage time.
- **Technical Value:** Surface for future M2 dead-letter items.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-2.1.1
- **Affected Files:** `src/components/settings/SyncDiagnosticsCard.tsx` (new), settings page wiring
- **Acceptance Criteria:**
  - Five states honored (empty/loading/error/offline/success).
  - Contract test asserts a11y (labels, focus ring, >= 44 px targets).
- **Status:** [x] Done (2026-07-24)

### T-2.1.3 - Author reproduction test for money-field conflict

- **Task ID:** T-2.1.3
- **Sprint:** Sprint 2.1
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync Engine - Tests
- **Description:** Create `src/__tests__/syncEngine.repro.test.ts` that spins two virtual clients, mutates `expense.amount` concurrently, and asserts the current non-deterministic behavior with a snapshot.
- **Business Value:** Guarantees the fix in Sprint 2.3 can be measured objectively.
- **Technical Value:** Regression net against future silent overwrites (R-7).
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-2.1.1
- **Affected Files:** `src/__tests__/syncEngine.repro.test.ts` (new)
- **Acceptance Criteria:**
  - Test runs deterministically in CI (no network dependence).
  - Captures the observed conflict count and final row state.
- **Status:** [x] Done (2026-07-24)

### T-2.1.4 - Document `NEXT_PUBLIC_SYNC_LOG` toggle

- **Task ID:** T-2.1.4
- **Sprint:** Sprint 2.1
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Docs - AI Context
- **Description:** Add `NEXT_PUBLIC_SYNC_LOG` toggle instructions to [AI_CONTEXT.md section 16](AI_CONTEXT.md) with example console output and privacy caveats.
- **Business Value:** Faster field debugging.
- **Technical Value:** Prevents ad-hoc `console.log`s leaking to prod.
- **Priority:** P2
- **Impact:** Low
- **Effort:** XS
- **Dependencies:** T-2.1.1
- **Affected Files:** [docs/AI_CONTEXT.md](AI_CONTEXT.md)
- **Acceptance Criteria:**
  - Docs show enable/disable path and warn about not logging monetary values.
- **Status:** [x] Done (2026-07-24)

---

<a id="sprint-22"></a>

## Sprint 2.2 - Persistent Mutation Queue & Guaranteed-Once Delivery

**Epic:** M2 - Sync Engine Reliability & Correctness - **Horizon:** 1 - **Priority:** P0 - **Effort:** L - **Story points:** 13

**Sprint goal:** The mutation queue survives tab close, network loss, and re-auth. Every mutation is delivered exactly once. Closes Architecture section 18.8 and mitigates R-1.

### T-2.2.1 - Persist queue attempts + backoff in Dexie

- **Task ID:** T-2.2.1
- **Sprint:** Sprint 2.2
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync Engine - Persistence
- **Description:** Extend Dexie `mutations` schema in [src/lib/db.ts](../src/lib/db.ts) with `attempts`, `nextRetryAt`, `lastError`; persist all queue state so it survives tab close.
- **Business Value:** Users never lose an expense typed on a flaky network.
- **Technical Value:** Foundation for guaranteed-once delivery (Architecture section 18.8).
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-2.1.1
- **Affected Files:** [src/lib/db.ts](../src/lib/db.ts), [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
- **Acceptance Criteria:**
  - Forced tab close leaves queue intact; next open resumes drain.
  - Dexie schema versioned; upgrade migration tested.
- **Status:** [x] ✅ Done — Sprint 2.2

### T-2.2.2 - Retry drain on `online` / `visibilitychange`

- **Task ID:** T-2.2.2
- **Sprint:** Sprint 2.2
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync Engine - Retry
- **Description:** Hook `window.addEventListener('online', ...)` and `document.addEventListener('visibilitychange', ...)` in syncEngine to trigger drain with exponential backoff + jitter.
- **Business Value:** Recovery is invisible when the network returns.
- **Technical Value:** Prevents queue starvation without a poller.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-2.2.1
- **Affected Files:** [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
- **Acceptance Criteria:**
  - Simulated offline->online transition drains queue within 5 s.
  - Backoff caps at reasonable ceiling (e.g., 30 s).
- **Status:** [x] Done - Sprint 2.2

### T-2.2.3 - Server-side idempotency de-duplication

- **Task ID:** T-2.2.3
- **Sprint:** Sprint 2.2
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** API - Sync Commit
- **Description:** Add migration `014_mutation_idempotency.sql` with a unique index on `(workspaceId, idempotencyKey)`; enforce dedup in `/api/sync/commit/route.ts` returning the original entity on replay.
- **Business Value:** Repeated network retries never create duplicate rows.
- **Technical Value:** Guaranteed-once contract (Architecture section 18.3).
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-2.2.1
- **Affected Files:** `prisma/migrations/014_mutation_idempotency.sql` (new), [prisma/schema.prisma](../prisma/schema.prisma), `src/app/api/sync/commit/route.ts`
- **Acceptance Criteria:**
  - Two commits with same key -> HTTP 200 with identical body, single row in DB.
  - Migration reversible; RLS still enforced on the new index.
- **Status:** [x] Done - Sprint 2.2

### T-2.2.4 - Dead-letter surface in Diagnostics

- **Task ID:** T-2.2.4
- **Sprint:** Sprint 2.2
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync Engine - Dead-letter
- **Description:** Surface terminally-failed mutations in `SyncDiagnosticsCard` with per-item "retry" and "discard" actions; log user action to `audit_logs`.
- **Business Value:** Users regain control over stuck items instead of silent loss.
- **Technical Value:** Observable failure boundary for R-1.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-2.1.2, T-2.2.1
- **Affected Files:** `src/components/settings/SyncDiagnosticsCard.tsx`, [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
- **Acceptance Criteria:**
  - Dead-letter items visible within 30 s of terminal failure.
  - Discard action confirmed with reversible undo.
- **Status:** [x] Done - Sprint 2.2

### T-2.2.5 - Reliability & idempotency tests

- **Task ID:** T-2.2.5
- **Sprint:** Sprint 2.2
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync Engine - Tests
- **Description:** New `src/__tests__/syncEngine.reliability.test.ts` (tab close, offline, re-auth) and `src/__tests__/syncCommit.idempotency.test.ts` covering the new invariants.
- **Business Value:** Ships with proof, not hope.
- **Technical Value:** M2 exit gate.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-2.2.1, T-2.2.2, T-2.2.3
- **Affected Files:** `src/__tests__/syncEngine.reliability.test.ts` (new), `src/__tests__/syncCommit.idempotency.test.ts` (new)
- **Acceptance Criteria:**
  - Both specs green in CI; used as M2 exit gate.
- **Status:** [x] Done - Sprint 2.2

---

<a id="sprint-23"></a>

## Sprint 2.3 - Deterministic Conflict UX & Monetary Math Audit

**Epic:** M2 - Sync Engine Reliability & Correctness - **Horizon:** 1 - **Priority:** P0 - **Effort:** L - **Story points:** 13

**Sprint goal:** Money fields never silently overwrite; every arithmetic path uses integer minor units or a decimal-safe helper. Closes TD-3, TD-9; mitigates R-5, R-7.

### T-2.3.1 - Per-field last-writer-wins in sync engine

- **Task ID:** T-2.3.1
- **Sprint:** Sprint 2.3
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync Engine - Conflict
- **Description:** Implement per-field LWW in [src/lib/syncEngine.ts](../src/lib/syncEngine.ts); when a field in `{amount, expectedAmount, receivedAmount}` collides, defer to a user prompt instead of auto-merging.
- **Business Value:** No hidden overwrites of financial numbers.
- **Technical Value:** Deterministic conflict semantics (Architecture section 18.1).
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-2.2.5
- **Affected Files:** [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
- **Acceptance Criteria:**
  - Money-field collisions never resolve without a user event.
  - Non-money fields use timestamp-based LWW deterministically.
- **Status:** [ ] Pending

### T-2.3.2 - Build ConflictReviewSheet

- **Task ID:** T-2.3.2
- **Sprint:** Sprint 2.3
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync - UI
- **Description:** New `src/components/sync/ConflictReviewSheet.tsx` extending `useSyncConflictToast` to render both versions side by side with keep-mine / keep-theirs / merge actions.
- **Business Value:** Users confidently resolve conflicts without ambiguity.
- **Technical Value:** Standard component to reuse across expense/ledger/payment conflicts.
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-2.3.1
- **Affected Files:** `src/components/sync/ConflictReviewSheet.tsx` (new), [src/hooks/useSyncConflictToast](../src/hooks/)
- **Acceptance Criteria:**
  - Fully keyboard operable and reduced-motion respectful.
  - Snapshot test locks visual invariants.
- **Status:** [ ] Pending

### T-2.3.3 - Audit entry on user-resolved money conflict

- **Task ID:** T-2.3.3
- **Sprint:** Sprint 2.3
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Audit
- **Description:** Emit `audit_logs` row `conflict.resolve.money` on every user-resolved money conflict, capturing entity type, id, chosen side (no monetary values).
- **Business Value:** Forensic trail for disputes.
- **Technical Value:** Traceability without leaking money to logs (R-8).
- **Priority:** P0
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-2.3.2
- **Affected Files:** [src/lib/server/audit.ts](../src/lib/server/audit.ts), `src/app/api/sync/commit/route.ts`
- **Acceptance Criteria:**
  - Row emitted per resolution; payload contains no `amount*` values.
- **Status:** [ ] Pending

### T-2.3.4 - Introduce Money branded type + helpers

- **Task ID:** T-2.3.4
- **Sprint:** Sprint 2.3
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Money - Types
- **Description:** New `src/lib/money.ts` with `type Money = number & { __brand: 'minor-units' }` plus `toMinor`, `fromMinor`, `addMoney`, `subMoney`, `mulMoney`, `formatMoney`.
- **Business Value:** Eliminates a whole class of precision bugs at input, sync, and display.
- **Technical Value:** Closes TD-9; single vocabulary for money in the codebase.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `src/lib/money.ts` (new)
- **Acceptance Criteria:**
  - 100% branch coverage on helpers.
  - No `Number`-typed `amount` remains outside `money.ts` after migration (see T-2.3.5).
- **Status:** [ ] Pending

### T-2.3.5 - Migrate all money paths to `Money`

- **Task ID:** T-2.3.5
- **Sprint:** Sprint 2.3
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Money - Migration
- **Description:** Audit every path touching `amount`, `expectedAmount`, `receivedAmount` in [src/lib/calculations.ts](../src/lib/calculations.ts), [src/lib/exchangeRates.ts](../src/lib/exchangeRates.ts), and all analytics components; convert to `Money`.
- **Business Value:** Charts, KPIs, exports, and forecasts are precision-safe.
- **Technical Value:** Removes silent float rounding across the codebase (R-5).
- **Priority:** P0
- **Impact:** High
- **Effort:** L
- **Dependencies:** T-2.3.4
- **Affected Files:** [src/lib/calculations.ts](../src/lib/calculations.ts), [src/lib/exchangeRates.ts](../src/lib/exchangeRates.ts), `src/components/analytics/**`, `src/components/business/**`
- **Acceptance Criteria:**
  - No `+`/`-`/`*` on `amount*` identifiers outside `money.ts` (enforced by T-2.3.6).
  - All calculation tests remain green after migration.
- **Status:** [ ] Pending

### T-2.3.6 - ESLint rule: forbid raw arithmetic on money fields

- **Task ID:** T-2.3.6
- **Sprint:** Sprint 2.3
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Lint - Money
- **Description:** Add a custom or `no-restricted-syntax` rule in [eslint.config.mjs](../eslint.config.mjs) forbidding `+`/`-`/`*` on identifiers matching `/amount|expectedAmount|receivedAmount/` outside `src/lib/money.ts`.
- **Business Value:** Precision bugs cannot regress in the future.
- **Technical Value:** Codifies TD-9 remediation as a permanent guardrail.
- **Priority:** P0
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-2.3.5
- **Affected Files:** [eslint.config.mjs](../eslint.config.mjs)
- **Acceptance Criteria:**
  - Rule fires on a synthetic violation in a smoke test.
  - CI blocks merges violating the rule.
- **Status:** [ ] Pending

### T-2.3.7 - Conflict + money test suites

- **Task ID:** T-2.3.7
- **Sprint:** Sprint 2.3
- **Epic:** M2 - Sync Engine Reliability
- **Feature:** Sync/Money - Tests
- **Description:** Add `src/__tests__/syncEngine.conflict.test.ts` and `src/__tests__/money.helpers.test.ts`; extend `calculations.test.ts` for `Money` types.
- **Business Value:** Proof of M2 exit criteria.
- **Technical Value:** Locks the new invariants in CI.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-2.3.2, T-2.3.4
- **Affected Files:** `src/__tests__/syncEngine.conflict.test.ts` (new), `src/__tests__/money.helpers.test.ts` (new), [src/**tests**/calculations.test.ts](../src/__tests__/calculations.test.ts)
- **Acceptance Criteria:**
  - Two-client edit on `amount` always triggers `ConflictReviewSheet`.
  - M2 exit criteria in [PROJECT_MASTER_PLAN section 14](PROJECT_MASTER_PLAN.md) satisfied.
- **Status:** [ ] Pending

---

<a id="sprint-31"></a>

## Sprint 3.1 - Server Scheduler, Retries & Dead-Letter

**Epic:** M3 - Notification UX Hardening - **Horizon:** 1 - **Priority:** P1 - **Effort:** L - **Story points:** 13

**Sprint goal:** Reliable server-scheduled evening reminders and digests with retry and dead-letter surface. Mitigates R-6, R-13; closes TD-4.

### T-3.1.1 - Rework `/api/push/send` to batched scheduler

- **Task ID:** T-3.1.1
- **Sprint:** Sprint 3.1
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - API
- **Description:** Refactor `src/app/api/push/send/route.ts` to accept a batched schedule with per-subscription retry state; guard with `CRON_SECRET`; return per-batch counters.
- **Business Value:** Nightly reminders actually arrive.
- **Technical Value:** Foundation for observability and retries.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** None
- **Affected Files:** `src/app/api/push/send/route.ts`, `src/lib/server/pushDispatcher.ts` (new)
- **Acceptance Criteria:**
  - Endpoint returns `{ sent, failed, dead }` counts.
  - Rate-limited and `CRON_SECRET`-gated.
- **Status:** [ ] Pending

### T-3.1.2 - `push_deliveries` table migration

- **Task ID:** T-3.1.2
- **Sprint:** Sprint 3.1
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Schema
- **Description:** Migration `015_push_deliveries.sql` adding `push_deliveries(id, subscriptionId, scheduledFor, attempts, lastError, status pending|sent|failed|dead)` with RLS enabled.
- **Business Value:** Every push has an observable lifecycle.
- **Technical Value:** Persistence for retry/dead-letter.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-3.1.1
- **Affected Files:** `prisma/migrations/015_push_deliveries.sql` (new), [prisma/schema.prisma](../prisma/schema.prisma)
- **Acceptance Criteria:**
  - RLS policies verified by smoke test.
  - Indexed on `(status, scheduledFor)` for scheduler efficiency.
- **Status:** [ ] Pending

### T-3.1.3 - Exponential backoff with jitter

- **Task ID:** T-3.1.3
- **Sprint:** Sprint 3.1
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Retry
- **Description:** Backoff schedule 30 s -> 5 min -> 30 min -> dead with +/-20% jitter, implemented in `pushDispatcher.ts`.
- **Business Value:** Transient outages don't drop reminders.
- **Technical Value:** Prevents thundering-herd retries.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-3.1.2
- **Affected Files:** `src/lib/server/pushDispatcher.ts`
- **Acceptance Criteria:**
  - Unit test asserts schedule and jitter bounds.
- **Status:** [ ] Pending

### T-3.1.4 - Cron entry ticking every minute

- **Task ID:** T-3.1.4
- **Sprint:** Sprint 3.1
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Cron
- **Description:** Vercel/Node scheduler that hits `/api/push/send` every minute, guarded by `CRON_SECRET` (whitelisted in [src/middleware.ts](../src/middleware.ts)).
- **Business Value:** Timely delivery within +/-60 s.
- **Technical Value:** Deterministic tick source.
- **Priority:** P1
- **Impact:** High
- **Effort:** XS
- **Dependencies:** T-3.1.1
- **Affected Files:** `vercel.json` (or equivalent), [src/middleware.ts](../src/middleware.ts)
- **Acceptance Criteria:**
  - Cron entry documented in `docs/ops/push.md`.
  - Middleware allows the secret-bearing request through.
- **Status:** [ ] Pending

### T-3.1.5 - Auto-prune stale push subscriptions

- **Task ID:** T-3.1.5
- **Sprint:** Sprint 3.1
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Hygiene
- **Description:** On `410 Gone` / `404 Not Found` from push service, remove the corresponding `push_subscriptions` row and emit audit entry.
- **Business Value:** No wasted sends to dead endpoints.
- **Technical Value:** Keeps delivery metrics honest.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-3.1.1, T-3.1.2
- **Affected Files:** `src/app/api/push/subscribe/route.ts`, `src/lib/server/pushDispatcher.ts`
- **Acceptance Criteria:**
  - Stale endpoint unsubscribed within one dispatch cycle.
- **Status:** [ ] Pending

### T-3.1.6 - Retry + stale tests

- **Task ID:** T-3.1.6
- **Sprint:** Sprint 3.1
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Tests
- **Description:** Add `src/__tests__/pushSend.retry.test.ts` and `src/__tests__/pushSubscription.stale.test.ts`.
- **Business Value:** Ships with delivery proof.
- **Technical Value:** M3 exit gate.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-3.1.3, T-3.1.5
- **Affected Files:** `src/__tests__/pushSend.retry.test.ts` (new), `src/__tests__/pushSubscription.stale.test.ts` (new)
- **Acceptance Criteria:**
  - Failing endpoint hits dead-letter after 4 attempts.
  - Stale subscription pruned on 410 in test fixture.
- **Status:** [ ] Pending

---

<a id="sprint-32"></a>

## Sprint 3.2 - Quiet Hours, Timezone Correctness & Ops Dashboard

**Epic:** M3 - Notification UX Hardening - **Horizon:** 1 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Respect user quiet-hours across timezones; give operators visibility into push health. Closes M3 exit.

### T-3.2.1 - Extend `NotificationPrefs` with quiet-hours

- **Task ID:** T-3.2.1
- **Sprint:** Sprint 3.2
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Prefs
- **Description:** Add `quietHoursStart`, `quietHoursEnd`, `quietHoursTimezone` to `NotificationPrefs` schema (Zod + Prisma JSONB); defaults to user `timezone`.
- **Business Value:** Users are never woken by push after hours.
- **Technical Value:** Model foundation for delivery gating.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-3.1.1
- **Affected Files:** [src/lib/validators.ts](../src/lib/validators.ts), [src/hooks/useNotifications.ts](../src/hooks/useNotifications.ts)
- **Acceptance Criteria:**
  - Zod validation guards start < end (or overnight wrap-around).
  - Sync migration handles missing fields gracefully.
- **Status:** [ ] Pending

### T-3.2.2 - Settings UI: quiet-hours pickers

- **Task ID:** T-3.2.2
- **Sprint:** Sprint 3.2
- **Epic:** M3 - Notification UX
- **Feature:** Settings - UI
- **Description:** Extend [NotificationSettings](../src/components/settings/NotificationSettings.tsx) with paired time pickers and a Quiet Hours toggle; contract-tested for a11y.
- **Business Value:** Discoverable, honest control.
- **Technical Value:** Reusable time-picker pattern.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-3.2.1
- **Affected Files:** [src/components/settings/NotificationSettings.tsx](../src/components/settings/NotificationSettings.tsx)
- **Acceptance Criteria:**
  - Keyboard operable; reduced-motion respected.
  - Contract test covers labels + focus ring.
- **Status:** [ ] Pending

### T-3.2.3 - Dispatcher honors quiet hours per timezone

- **Task ID:** T-3.2.3
- **Sprint:** Sprint 3.2
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Dispatcher
- **Description:** `pushDispatcher.ts` skips deliveries whose target time falls inside the user's quiet-hours window in their timezone.
- **Business Value:** No 3 AM pings, regardless of server timezone.
- **Technical Value:** Central rule; no scattered timezone math.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-3.2.1
- **Affected Files:** `src/lib/server/pushDispatcher.ts`
- **Acceptance Criteria:**
  - Deliveries during quiet-hours are re-scheduled to the next allowed slot.
- **Status:** [ ] Pending

### T-3.2.4 - Weekly digest timezone correctness

- **Task ID:** T-3.2.4
- **Sprint:** Sprint 3.2
- **Epic:** M3 - Notification UX
- **Feature:** Analytics - Digest
- **Description:** Compute week bounds in user timezone (Luxon / `date-fns-tz`) in [src/lib/calculations.ts](../src/lib/calculations.ts) and any digest generator; not UTC.
- **Business Value:** Digest matches the week the user actually lived.
- **Technical Value:** Removes silent boundary errors.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-3.2.1
- **Affected Files:** [src/lib/calculations.ts](../src/lib/calculations.ts)
- **Acceptance Criteria:**
  - Digest for a Sunday-first-week locale differs correctly from a Monday-first-week locale.
- **Status:** [ ] Pending

### T-3.2.5 - `/api/admin/push/health` endpoint + runbook

- **Task ID:** T-3.2.5
- **Sprint:** Sprint 3.2
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Ops
- **Description:** New `src/app/api/admin/push/health/route.ts` returning last 24 h counts, top failing endpoints (auth: `CRON_SECRET` or admin session); add `docs/ops/push.md` runbook.
- **Business Value:** Operators can spot outages before users complain.
- **Technical Value:** Formalized health surface for M3 KPIs.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-3.1.2
- **Affected Files:** `src/app/api/admin/push/health/route.ts` (new), `docs/ops/push.md` (new)
- **Acceptance Criteria:**
  - Endpoint rate-limited and authed; response contains no PII.
  - Runbook documents alert thresholds.
- **Status:** [ ] Pending

### T-3.2.6 - Quiet-hours, timezone, notification-settings tests

- **Task ID:** T-3.2.6
- **Sprint:** Sprint 3.2
- **Epic:** M3 - Notification UX
- **Feature:** Notifications - Tests
- **Description:** Extend [notificationSettings.test.ts](../src/__tests__/notificationSettings.test.ts); add `src/__tests__/pushQuietHours.test.ts` and `src/__tests__/weeklyDigest.timezone.test.ts`.
- **Business Value:** Locks in M3 exit criteria.
- **Technical Value:** Regression net for timezone edge cases.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-3.2.2, T-3.2.3, T-3.2.4
- **Affected Files:** [src/**tests**/notificationSettings.test.ts](../src/__tests__/notificationSettings.test.ts), `src/__tests__/pushQuietHours.test.ts` (new), `src/__tests__/weeklyDigest.timezone.test.ts` (new)
- **Acceptance Criteria:**
  - All three specs green; delivery >= 95% asserted in a fixture.
- **Status:** [ ] Pending

---

<a id="sprint-41"></a>

## Sprint 4.1 - Contract Template & CI Enforcement

**Epic:** M4 - Accessibility Contracts Coverage - **Horizon:** 1 - **Priority:** P0 - **Effort:** M - **Story points:** 8

**Sprint goal:** Formalize the accessibility contract-test pattern and make its presence non-optional in CI. Mitigates R-9.

### T-4.1.1 - Author `docs/CONTRACT_TESTS.md`

- **Task ID:** T-4.1.1
- **Sprint:** Sprint 4.1
- **Epic:** M4 - A11y Contracts
- **Feature:** Docs - A11y
- **Description:** Write `docs/CONTRACT_TESTS.md` describing the standard shape of a contract test, common matchers, reduced-motion assertions, focus-ring assertions, and touch-target checks.
- **Business Value:** Every component is accessible from day one.
- **Technical Value:** Shared vocabulary and template reduce authoring cost.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `docs/CONTRACT_TESTS.md` (new)
- **Acceptance Criteria:**
  - Doc explains how to add a contract test in <= 5 minutes.
  - Cross-linked from [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) and [AI_CONTEXT.md](AI_CONTEXT.md).
- **Status:** [ ] Pending

### T-4.1.2 - Codegen script for contract-test scaffolding

- **Task ID:** T-4.1.2
- **Sprint:** Sprint 4.1
- **Epic:** M4 - A11y Contracts
- **Feature:** Tooling - A11y
- **Description:** New `scripts/gen-contract-test.js` that, given a component path, scaffolds a matching `*.contract.test.ts` under `src/__tests__/`.
- **Business Value:** Zero-friction adoption for contributors.
- **Technical Value:** Consistent structure across specs.
- **Priority:** P0
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-4.1.1
- **Affected Files:** `scripts/gen-contract-test.js` (new)
- **Acceptance Criteria:**
  - Script generates a passing skeleton spec for a sample component.
- **Status:** [ ] Pending

### T-4.1.3 - CI enforcement of contract-test presence

- **Task ID:** T-4.1.3
- **Sprint:** Sprint 4.1
- **Epic:** M4 - A11y Contracts
- **Feature:** CI - A11y
- **Description:** Add a CI step that fails if any file under `src/components/` lacks a matching `src/__tests__/*.contract.test.ts` (allowlist for pure-presentation primitives in a config file).
- **Business Value:** No component ever ships without a contract.
- **Technical Value:** Enforces DoD in [PROJECT_MASTER_PLAN section 16.1](PROJECT_MASTER_PLAN.md).
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-4.1.2
- **Affected Files:** `.github/workflows/ci.yml`, `contract-tests.allowlist.json` (new)
- **Acceptance Criteria:**
  - Synthetic PR that adds a component without a spec fails CI.
- **Status:** [ ] Pending

### T-4.1.4 - Backfill top 20 uncovered components

- **Task ID:** T-4.1.4
- **Sprint:** Sprint 4.1
- **Epic:** M4 - A11y Contracts
- **Feature:** A11y - Backfill
- **Description:** Run the coverage script, identify top 20 uncovered components, and author their contract tests. Extend [accessibilityContracts.test.ts](../src/__tests__/accessibilityContracts.test.ts) inventory if needed.
- **Business Value:** Immediate coverage lift on production surfaces.
- **Technical Value:** Baseline before turning CI enforcement on.
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-4.1.2
- **Affected Files:** `src/__tests__/*.contract.test.ts` (up to 20 new), [src/**tests**/accessibilityContracts.test.ts](../src/__tests__/accessibilityContracts.test.ts)
- **Acceptance Criteria:**
  - All 20 backfilled specs green.
  - Component coverage report shows >= 90% of components covered.
- **Status:** [ ] Pending

---

<a id="sprint-42"></a>

## Sprint 4.2 - Chart Text Alternatives & A11y Audit Pass

**Epic:** M4 - Accessibility Contracts Coverage - **Horizon:** 1 - **Priority:** P0 - **Effort:** M - **Story points:** 8

**Sprint goal:** Every chart has a text/data-table alternative; complete an accessibility audit of top pages. Closes TD-6.

### T-4.2.1 - Add `DataTableView` toggle to core charts

- **Task ID:** T-4.2.1
- **Sprint:** Sprint 4.2
- **Epic:** M4 - A11y Contracts
- **Feature:** Analytics - A11y
- **Description:** Add a text alternative (`DataTableView` toggle) to `RollingAverageChart`, `YearOverYearChart`, `RidgeLine`, `CollectionChart`, `LedgerProgressRing`, `MerchantBreakdown`, `CategoryVelocity`, `CategorySeasons`.
- **Business Value:** Screen-reader users get the story visual users get.
- **Technical Value:** Removes a whole class of WCAG failures.
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-4.1.4
- **Affected Files:** `src/components/analytics/*.tsx`, `src/components/business/*.tsx`, `src/components/ui/DataTableView.tsx` (new)
- **Acceptance Criteria:**
  - Toggle reachable via keyboard; state announced via `aria-live`.
  - Data table matches chart values exactly.
- **Status:** [ ] Pending

### T-4.2.2 - A11y audit of top pages

- **Task ID:** T-4.2.2
- **Sprint:** Sprint 4.2
- **Epic:** M4 - A11y Contracts
- **Feature:** A11y - Audit
- **Description:** Manual axe / AXE-DevTools pass on `/`, `/analytics`, `/business`, `/settings`, `/expenses`; log findings in `docs/a11y/2026-audit.md`.
- **Business Value:** Known-good baseline for WCAG 2.2 AA.
- **Technical Value:** Recorded audit trail for future regressions.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-4.2.1
- **Affected Files:** `docs/a11y/2026-audit.md` (new)
- **Acceptance Criteria:**
  - Every top page audited; findings triaged P0/P1/P2.
- **Status:** [ ] Pending

### T-4.2.3 - Fix all P0 audit findings

- **Task ID:** T-4.2.3
- **Sprint:** Sprint 4.2
- **Epic:** M4 - A11y Contracts
- **Feature:** A11y - Remediation
- **Description:** Address every P0 finding from the audit; open P1/P2 as follow-up tickets referencing this queue.
- **Business Value:** Removes critical a11y blockers before shipping M4.
- **Technical Value:** Restores WCAG 2.2 AA compliance across audited screens.
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-4.2.2
- **Affected Files:** Varies - components identified by audit
- **Acceptance Criteria:**
  - Zero open P0 items in `docs/a11y/2026-audit.md`.
- **Status:** [ ] Pending

### T-4.2.4 - Chart-with-SVG contract test extension

- **Task ID:** T-4.2.4
- **Sprint:** Sprint 4.2
- **Epic:** M4 - A11y Contracts
- **Feature:** A11y - Tests
- **Description:** Extend [phaseFContracts.test.ts](../src/__tests__/phaseFContracts.test.ts) to assert that any component rendering `<svg>` also exposes a `role="table"` text alternative.
- **Business Value:** Prevents chart-a11y regressions.
- **Technical Value:** Formal DoD contract for viz components.
- **Priority:** P0
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-4.2.1
- **Affected Files:** [src/**tests**/phaseFContracts.test.ts](../src/__tests__/phaseFContracts.test.ts)
- **Acceptance Criteria:**
  - Extended spec green on `main`.
- **Status:** [ ] Pending

### T-4.2.5 - M4 exit verification

- **Task ID:** T-4.2.5
- **Sprint:** Sprint 4.2
- **Epic:** M4 - A11y Contracts
- **Feature:** A11y - Exit gate
- **Description:** Verify M4 exit criteria in [PROJECT_MASTER_PLAN section 14](PROJECT_MASTER_PLAN.md): CI enforces contract-test presence, every chart has a text alternative, audit clean.
- **Business Value:** Explicit sign-off before moving to M5.
- **Technical Value:** Prevents partial-milestone drift.
- **Priority:** P0
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-4.2.3, T-4.2.4
- **Affected Files:** [docs/SPRINT_BOARD.md](SPRINT_BOARD.md) (status update), this file (status updates)
- **Acceptance Criteria:**
  - M4 status flipped to Done in board + queue.
- **Status:** [ ] Pending

---

<a id="sprint-51"></a>

## Sprint 5.1 - Dependency Automation & CVE SLA

**Epic:** M5 - Security & Compliance Hardening - **Horizon:** 1-2 - **Priority:** P0 - **Effort:** S - **Story points:** 5

**Sprint goal:** Every dependency stays current; Critical/High CVEs patched within 24 h. Closes TD-7; mitigates R-4.

### T-5.1.1 - Enable Renovate / Dependabot

- **Task ID:** T-5.1.1
- **Sprint:** Sprint 5.1
- **Epic:** M5 - Security Hardening
- **Feature:** Security - Dependencies
- **Description:** Enable Renovate (or Dependabot) with grouped weekly PRs for minor/patch and immediate PRs for security advisories.
- **Business Value:** Users protected from known CVEs quickly.
- **Technical Value:** Removes manual toil; predictable update cadence.
- **Priority:** P0
- **Impact:** High
- **Effort:** XS
- **Dependencies:** None
- **Affected Files:** `.github/renovate.json` (new) or `.github/dependabot.yml`
- **Acceptance Criteria:**
  - Dry run produces at least one PR against `main` on a synthetic outdated dep.
- **Status:** [ ] Pending

### T-5.1.2 - Configure grouping and reviewer rules

- **Task ID:** T-5.1.2
- **Sprint:** Sprint 5.1
- **Epic:** M5 - Security Hardening
- **Feature:** Security - Dependencies
- **Description:** Group Prisma, Next.js, Sentry, Framer, Visx families; auto-assign reviewers; label PRs `deps`, `security`.
- **Business Value:** Reduces reviewer fatigue.
- **Technical Value:** Consistent handling of dep updates.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-5.1.1
- **Affected Files:** `.github/renovate.json` or `.github/dependabot.yml`
- **Acceptance Criteria:**
  - Grouped PRs verified in the dry-run.
- **Status:** [ ] Pending

### T-5.1.3 - CI: `npm audit` gate on High/Critical

- **Task ID:** T-5.1.3
- **Sprint:** Sprint 5.1
- **Epic:** M5 - Security Hardening
- **Feature:** CI - Security
- **Description:** Add `npm audit --audit-level=high` step to CI that fails on High/Critical vulnerabilities.
- **Business Value:** No unshipped vulnerabilities in prod.
- **Technical Value:** Enforces the SLA in CI.
- **Priority:** P0
- **Impact:** High
- **Effort:** XS
- **Dependencies:** T-5.1.1
- **Affected Files:** `.github/workflows/ci.yml`
- **Acceptance Criteria:**
  - Synthetic high-severity dep fails CI.
- **Status:** [ ] Pending

### T-5.1.4 - Author `docs/SECURITY.md`

- **Task ID:** T-5.1.4
- **Sprint:** Sprint 5.1
- **Epic:** M5 - Security Hardening
- **Feature:** Docs - Security
- **Description:** New `docs/SECURITY.md` documenting CVE SLA, disclosure address, rotation policy, supported versions, contact procedure.
- **Business Value:** Trust signal for enterprise/regulated users.
- **Technical Value:** Formal responsible-disclosure entry point.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** None
- **Affected Files:** `docs/SECURITY.md` (new), [README.md](../README.md)
- **Acceptance Criteria:**
  - Linked from [README.md](../README.md).
- **Status:** [ ] Pending

---

<a id="sprint-52"></a>

## Sprint 5.2 - Session Anomaly Surface & Audit Coverage Expansion

**Epic:** M5 - Security & Compliance Hardening - **Horizon:** 1-2 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Users see and can act on unusual-IP / new-country logins; every privileged action is auditable. Closes TD-8; PRD M7.

### T-5.2.1 - Expand audit action set

- **Task ID:** T-5.2.1
- **Sprint:** Sprint 5.2
- **Epic:** M5 - Security Hardening
- **Feature:** Audit - Coverage
- **Description:** Extend [src/lib/server/audit.ts](../src/lib/server/audit.ts) with `session.new`, `session.revoke`, `2fa.enable`, `2fa.disable`, `passkey.register`, `passkey.remove`.
- **Business Value:** Users can reconstruct account history.
- **Technical Value:** Trust and forensic completeness.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [src/lib/server/audit.ts](../src/lib/server/audit.ts), auth route handlers
- **Acceptance Criteria:**
  - Every privileged action emits exactly one audit row.
- **Status:** [ ] Pending

### T-5.2.2 - Geo lookup at login

- **Task ID:** T-5.2.2
- **Sprint:** Sprint 5.2
- **Epic:** M5 - Security Hardening
- **Feature:** Auth - Geo
- **Description:** New `src/lib/server/geo.ts` computing country class from client IP using an in-repo static DB or a privacy-preserving service; store `country` on `sessions` (hashed per privacy policy).
- **Business Value:** Foundation for anomaly detection.
- **Technical Value:** Central geo helper; no scattered logic.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `src/lib/server/geo.ts` (new), `src/app/api/auth/login/route.ts`
- **Acceptance Criteria:**
  - No PII stored beyond hashed country code.
- **Status:** [ ] Pending

### T-5.2.3 - Session anomaly detection

- **Task ID:** T-5.2.3
- **Sprint:** Sprint 5.2
- **Epic:** M5 - Security Hardening
- **Feature:** Auth - Anomaly
- **Description:** Compare new session against last N sessions; flag `anomalous=true` when country and device are both unknown.
- **Business Value:** Users spot compromise fast.
- **Technical Value:** Bounded false-positive design.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-5.2.2
- **Affected Files:** `src/app/api/auth/login/route.ts`, `prisma/migrations/016_session_geo.sql` (new), [prisma/schema.prisma](../prisma/schema.prisma)
- **Acceptance Criteria:**
  - Detection <= 5% false positive rate in dogfood fixture.
- **Status:** [ ] Pending

### T-5.2.4 - Security card UI: anomaly + revoke

- **Task ID:** T-5.2.4
- **Sprint:** Sprint 5.2
- **Epic:** M5 - Security Hardening
- **Feature:** Settings - Security
- **Description:** Surface anomalies in the existing Security card with "revoke" and "it was me" buttons; contract test.
- **Business Value:** One-tap incident response.
- **Technical Value:** Clean state contract for the card.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-5.2.3
- **Affected Files:** `src/components/settings/SecurityCard.tsx`
- **Acceptance Criteria:**
  - Anomalous badge visible; both actions accessible via keyboard.
- **Status:** [ ] Pending

### T-5.2.5 - Optional email nudge

- **Task ID:** T-5.2.5
- **Sprint:** Sprint 5.2
- **Epic:** M5 - Security Hardening
- **Feature:** Auth - Email
- **Description:** Send an anomaly email via [src/lib/server/email.ts](../src/lib/server/email.ts) using Resend, respecting user notification preferences.
- **Business Value:** Users hear about anomalies even when offline.
- **Technical Value:** Standard email path reused.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-5.2.4
- **Affected Files:** [src/lib/server/email.ts](../src/lib/server/email.ts), auth login route
- **Acceptance Criteria:**
  - Email contains no PII beyond city-level generalization; unsubscribable.
- **Status:** [ ] Pending

### T-5.2.6 - Audit + anomaly tests

- **Task ID:** T-5.2.6
- **Sprint:** Sprint 5.2
- **Epic:** M5 - Security Hardening
- **Feature:** Security - Tests
- **Description:** Add `src/__tests__/audit.coverage.test.ts` and `src/__tests__/sessionAnomaly.test.ts`.
- **Business Value:** Locks in M5.2 exit criteria.
- **Technical Value:** Regression proof for privileged flows.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-5.2.1, T-5.2.3
- **Affected Files:** `src/__tests__/audit.coverage.test.ts` (new), `src/__tests__/sessionAnomaly.test.ts` (new)
- **Acceptance Criteria:**
  - Both specs green.
- **Status:** [ ] Pending

---

<a id="sprint-53"></a>

## Sprint 5.3 - CSP Tightening, `server-only` Markers & RLS Smoke Test

**Epic:** M5 - Security & Compliance Hardening - **Horizon:** 1-2 - **Priority:** P0 - **Effort:** M - **Story points:** 8

**Sprint goal:** Reduce XSS blast radius, guarantee server-only modules never leak to the client, prove RLS on every CI run. Closes Architecture section 18.4, 18.16, 18.20.

### T-5.3.1 - Add `import "server-only"` markers

- **Task ID:** T-5.3.1
- **Sprint:** Sprint 5.3
- **Epic:** M5 - Security Hardening
- **Feature:** Security - Boundaries
- **Description:** Add `import "server-only"` to every entry file under [src/lib/server/](../src/lib/server/).
- **Business Value:** Prevents accidental leakage of secrets or heavy code to the client bundle.
- **Technical Value:** Compile-time boundary enforcement.
- **Priority:** P0
- **Impact:** High
- **Effort:** XS
- **Dependencies:** None
- **Affected Files:** All entry files under [src/lib/server/](../src/lib/server/)
- **Acceptance Criteria:**
  - Attempted client import of a server module fails build.
- **Status:** [ ] Pending

### T-5.3.2 - Strict CSP with per-request nonces

- **Task ID:** T-5.3.2
- **Sprint:** Sprint 5.3
- **Epic:** M5 - Security Hardening
- **Feature:** Security - CSP
- **Description:** Remove `'unsafe-eval'`; adopt strict CSP with per-request nonces in [next.config.ts](../next.config.ts) and [src/middleware.ts](../src/middleware.ts). Mitigates R-3.
- **Business Value:** Materially harder to exploit XSS.
- **Technical Value:** Modern CSP posture.
- **Priority:** P0
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-5.3.1
- **Affected Files:** [next.config.ts](../next.config.ts), [src/middleware.ts](../src/middleware.ts)
- **Acceptance Criteria:**
  - Headers snapshot test asserts strict CSP.
  - No inline scripts without nonce.
- **Status:** [ ] Pending

### T-5.3.3 - RLS smoke workflow

- **Task ID:** T-5.3.3
- **Sprint:** Sprint 5.3
- **Epic:** M5 - Security Hardening
- **Feature:** Security - CI
- **Description:** New `.github/workflows/rls-smoke.yml` spinning up ephemeral Postgres, running `prisma migrate deploy`, then executing `scripts/rls-smoke.ts` asserting cross-workspace reads/writes are denied.
- **Business Value:** Cross-workspace leak (R-2) is a compile-time impossibility.
- **Technical Value:** Continuous proof of RLS across every table.
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-5.3.1
- **Affected Files:** `.github/workflows/rls-smoke.yml` (new)
- **Acceptance Criteria:**
  - Workflow green on `main`; fails on a synthetic RLS-off migration.
- **Status:** [ ] Pending

### T-5.3.4 - `scripts/rls-smoke.ts`

- **Task ID:** T-5.3.4
- **Sprint:** Sprint 5.3
- **Epic:** M5 - Security Hardening
- **Feature:** Security - CI
- **Description:** Script that creates two workspaces and asserts every table denies cross-workspace SELECT/INSERT/UPDATE/DELETE.
- **Business Value:** Direct proof of the trust promise.
- **Technical Value:** Fixture generator for other tests.
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** None
- **Affected Files:** `scripts/rls-smoke.ts` (new)
- **Acceptance Criteria:**
  - Covers every table in [prisma/schema.prisma](../prisma/schema.prisma).
- **Status:** [ ] Pending

### T-5.3.5 - `server-only` import test

- **Task ID:** T-5.3.5
- **Sprint:** Sprint 5.3
- **Epic:** M5 - Security Hardening
- **Feature:** Security - Tests
- **Description:** New `src/__tests__/serverOnly.import.test.ts` asserting each `src/lib/server/*` entry starts with `import "server-only"`.
- **Business Value:** Prevents future drift.
- **Technical Value:** Static regression net.
- **Priority:** P0
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-5.3.1
- **Affected Files:** `src/__tests__/serverOnly.import.test.ts` (new)
- **Acceptance Criteria:**
  - Spec green; fails on a synthetic missing marker.
- **Status:** [ ] Pending

---

<a id="sprint-54"></a>

## Sprint 5.4 - Encryption Key Rotation

**Epic:** M5 - Security & Compliance Hardening - **Horizon:** 1-2 - **Priority:** P1 - **Effort:** L - **Story points:** 13

**Sprint goal:** A per-workspace key can be rotated with re-encryption of sensitive fields at rest. Closes Architecture section 18.21; mitigates R-10.

### T-5.4.1 - Add `encryptionKeyVersion` + payload version prefix

- **Task ID:** T-5.4.1
- **Sprint:** Sprint 5.4
- **Epic:** M5 - Security Hardening
- **Feature:** Crypto - Rotation
- **Description:** Add `encryptionKeyVersion` column on `workspaces`; prefix each encrypted payload as `enc:v2:iv:ct`.
- **Business Value:** Foundation for lossless key rotation.
- **Technical Value:** Backwards-compatible envelope format.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `prisma/migrations/017_key_rotation.sql` (new), [prisma/schema.prisma](../prisma/schema.prisma), [src/lib/crypto.ts](../src/lib/crypto.ts)
- **Acceptance Criteria:**
  - Old payloads without a prefix continue to decrypt.
- **Status:** [ ] Pending

### T-5.4.2 - `POST /api/workspaces/rotate-key` endpoint

- **Task ID:** T-5.4.2
- **Sprint:** Sprint 5.4
- **Epic:** M5 - Security Hardening
- **Feature:** Crypto - API
- **Description:** OWNER-only, rate-limited, audited endpoint that mints a new key version and enqueues re-encryption.
- **Business Value:** Users can rotate a compromised key without support.
- **Technical Value:** Explicit surface for a sensitive operation.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-5.4.1
- **Affected Files:** `src/app/api/workspaces/rotate-key/route.ts` (new)
- **Acceptance Criteria:**
  - Non-owner attempt returns 403; audit entry `workspace.key.rotate` emitted.
- **Status:** [ ] Pending

### T-5.4.3 - Background re-encryption job

- **Task ID:** T-5.4.3
- **Sprint:** Sprint 5.4
- **Epic:** M5 - Security Hardening
- **Feature:** Crypto - Rotation
- **Description:** `src/lib/server/keyRotation.ts` re-encrypts flagged fields in `expenses`, `business_ledgers`, `business_payments` in batches; progress in `key_rotations` table.
- **Business Value:** Rotation is safe on large workspaces.
- **Technical Value:** Bounded memory, resumable.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-5.4.2
- **Affected Files:** `src/lib/server/keyRotation.ts` (new), migration `017_key_rotation.sql`
- **Acceptance Criteria:**
  - Rotation completes on a 10 k-record fixture without data loss.
- **Status:** [ ] Pending

### T-5.4.4 - Client `crypto.ts` multi-version support

- **Task ID:** T-5.4.4
- **Sprint:** Sprint 5.4
- **Epic:** M5 - Security Hardening
- **Feature:** Crypto - Client
- **Description:** Update client crypto to accept multiple key versions during transition; discard old version once rotation completes.
- **Business Value:** Users don't see errors during rotation.
- **Technical Value:** Zero-downtime rotation.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-5.4.1
- **Affected Files:** [src/lib/crypto.ts](../src/lib/crypto.ts), `/api/auth/encryption-key`
- **Acceptance Criteria:**
  - Both key versions decrypt correctly during transition window.
- **Status:** [ ] Pending

### T-5.4.5 - Rotation tests

- **Task ID:** T-5.4.5
- **Sprint:** Sprint 5.4
- **Epic:** M5 - Security Hardening
- **Feature:** Crypto - Tests
- **Description:** Add `src/__tests__/crypto.rotation.test.ts` and `src/__tests__/keyRotation.api.test.ts`.
- **Business Value:** Ships with rotation proof.
- **Technical Value:** Regression net for envelope changes.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-5.4.3, T-5.4.4
- **Affected Files:** `src/__tests__/crypto.rotation.test.ts` (new), `src/__tests__/keyRotation.api.test.ts` (new)
- **Acceptance Criteria:**
  - Round-trip test asserts no data loss across a rotation cycle.
- **Status:** [ ] Pending

---

<a id="sprint-61"></a>

## Sprint 6.1 - Structured Logger & Health Endpoints

**Epic:** M6 - Observability & Ops Foundation - **Horizon:** 1-2 - **Priority:** P1 - **Effort:** M - **Story points:** 5

**Sprint goal:** Replace ad-hoc `console` with a thin `logger.ts`; add uptime probes. Closes Architecture section 18.14-18.15.

### T-6.1.1 - Author `src/lib/server/logger.ts`

- **Task ID:** T-6.1.1
- **Sprint:** Sprint 6.1
- **Epic:** M6 - Observability
- **Feature:** Observability - Logger
- **Description:** New `src/lib/server/logger.ts` (pino-style JSON in prod, pretty in dev), integrated with Sentry breadcrumbs; scrubs PII and money.
- **Business Value:** Faster incident triage.
- **Technical Value:** Central log point; consistent shape.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `src/lib/server/logger.ts` (new)
- **Acceptance Criteria:**
  - Scrubber test verifies no money/PII leaks.
- **Status:** [ ] Pending

### T-6.1.2 - Replace `console.*` in server code

- **Task ID:** T-6.1.2
- **Sprint:** Sprint 6.1
- **Epic:** M6 - Observability
- **Feature:** Observability - Cleanup
- **Description:** Replace `console.*` calls in `src/lib/server/**` and `src/app/api/**` with the new logger.
- **Business Value:** Consistent log stream in production.
- **Technical Value:** Removes noisy stdout in dev/test.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-6.1.1
- **Affected Files:** `src/lib/server/**`, `src/app/api/**`
- **Acceptance Criteria:**
  - Grep for `console.` in these paths returns zero matches.
- **Status:** [ ] Pending

### T-6.1.3 - `/api/health` & `/api/ready` endpoints

- **Task ID:** T-6.1.3
- **Sprint:** Sprint 6.1
- **Epic:** M6 - Observability
- **Feature:** Observability - Probes
- **Description:** `GET /api/health` (fast liveness), `GET /api/ready` (DB probe + migration head check). Both public, `Cache-Control: no-store`.
- **Business Value:** Ops can detect regressions early.
- **Technical Value:** Standard probe surface for schedulers.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-6.1.1
- **Affected Files:** `src/app/api/health/route.ts` (new), `src/app/api/ready/route.ts` (new)
- **Acceptance Criteria:**
  - `/api/health` < 50 ms P95; `/api/ready` returns 503 on DB down in fixture.
- **Status:** [ ] Pending

### T-6.1.4 - ESLint rule: forbid `console.log` server-side

- **Task ID:** T-6.1.4
- **Sprint:** Sprint 6.1
- **Epic:** M6 - Observability
- **Feature:** Observability - Lint
- **Description:** Extend [eslint.config.mjs](../eslint.config.mjs) to forbid `console.log` (and `warn`/`error` optionally) in `src/lib/server/**` and `src/app/api/**`.
- **Business Value:** Prevents future noise regression.
- **Technical Value:** Codifies the logger contract.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-6.1.2
- **Affected Files:** [eslint.config.mjs](../eslint.config.mjs)
- **Acceptance Criteria:**
  - Rule fires on synthetic violation.
- **Status:** [ ] Pending

---

<a id="sprint-62"></a>

## Sprint 6.2 - Rate-Limit Backend Interface & Bundle Budgets in CI

**Epic:** M6 - Observability & Ops Foundation - **Horizon:** 1-2 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Rate-limit backend is swappable; CI blocks perf regressions. Closes TD-11, Architecture section 18.11 & 18.17.

### T-6.2.1 - Extract `RateLimitBackend` interface

- **Task ID:** T-6.2.1
- **Sprint:** Sprint 6.2
- **Epic:** M6 - Observability
- **Feature:** Rate limit - Backends
- **Description:** Extract interface from [src/lib/server/rateLimit.ts](../src/lib/server/rateLimit.ts) with concrete `PostgresBackend`, `MemoryBackend`, and stubbed `RedisBackend`.
- **Business Value:** Portability across hosting providers.
- **Technical Value:** Clean abstraction; testable in isolation.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** M
- **Dependencies:** None
- **Affected Files:** [src/lib/server/rateLimit.ts](../src/lib/server/rateLimit.ts), `src/lib/server/rateLimit/backends/*` (new)
- **Acceptance Criteria:**
  - Existing rate-limit tests pass unchanged.
- **Status:** [ ] Pending

### T-6.2.2 - Config-selected backend

- **Task ID:** T-6.2.2
- **Sprint:** Sprint 6.2
- **Epic:** M6 - Observability
- **Feature:** Rate limit - Config
- **Description:** Select backend via `RATE_LIMIT_BACKEND` env var (`postgres` default).
- **Business Value:** Runtime-configurable without code change.
- **Technical Value:** Clean deployment story.
- **Priority:** P1
- **Impact:** Low
- **Effort:** XS
- **Dependencies:** T-6.2.1
- **Affected Files:** [src/lib/server/rateLimit.ts](../src/lib/server/rateLimit.ts)
- **Acceptance Criteria:**
  - Switching to `memory` in tests passes the existing suite.
- **Status:** [ ] Pending

### T-6.2.3 - Bundle budget check script

- **Task ID:** T-6.2.3
- **Sprint:** Sprint 6.2
- **Epic:** M6 - Observability
- **Feature:** Perf - CI
- **Description:** New `scripts/check-bundle-budget.js` enforcing route caps: `/` <= 180 KB gz, `/analytics` <= 220 KB gz, `/settings` <= 220 KB gz, `/business` <= 200 KB gz.
- **Business Value:** Fast first paint stays fast.
- **Technical Value:** Perf regression net.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `scripts/check-bundle-budget.js` (new)
- **Acceptance Criteria:**
  - Script fails on synthetic 30 KB inflation.
- **Status:** [ ] Pending

### T-6.2.4 - Wire bundle budgets into CI

- **Task ID:** T-6.2.4
- **Sprint:** Sprint 6.2
- **Epic:** M6 - Observability
- **Feature:** Perf - CI
- **Description:** Add `@next/bundle-analyzer` output to CI + a PR comment with size diff.
- **Business Value:** Reviewers see cost of every PR.
- **Technical Value:** Continuous perf accountability.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-6.2.3
- **Affected Files:** `.github/workflows/ci.yml`
- **Acceptance Criteria:**
  - CI comment appears on a synthetic PR.
- **Status:** [ ] Pending

---

<a id="sprint-71"></a>

## Sprint 7.1 - Reminders Schema & Overdue Tiers

**Epic:** M7 - Business Ledger Enhancements - **Horizon:** 2 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Overdue ledgers escalate visibly, exports match on-screen totals. Closes PRD FR-BL-05; mitigates R-11.

### T-7.1.1 - Overdue tier taxonomy

- **Task ID:** T-7.1.1
- **Sprint:** Sprint 7.1
- **Epic:** M7 - Business Ledger
- **Feature:** Ledger - Overdue
- **Description:** Add `overdueTier` (`0`, `1-7`, `8-14`, `15+`) computed via [src/lib/calculations.ts](../src/lib/calculations.ts) `computeLedgerOverdue`.
- **Business Value:** Users instantly see escalation.
- **Technical Value:** Consistent tier definition across UI, exports, reminders.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [src/lib/calculations.ts](../src/lib/calculations.ts)
- **Acceptance Criteria:**
  - Tier boundaries verified by unit test.
- **Status:** [ ] Pending

### T-7.1.2 - `LedgerCard` tier chip

- **Task ID:** T-7.1.2
- **Sprint:** Sprint 7.1
- **Epic:** M7 - Business Ledger
- **Feature:** Ledger - UI
- **Description:** Add tier chip to `src/components/business/LedgerCard.tsx` with tokenized colors from [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- **Business Value:** Visual severity ladder.
- **Technical Value:** Reusable chip component.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-7.1.1
- **Affected Files:** `src/components/business/LedgerCard.tsx`
- **Acceptance Criteria:**
  - Chip meets 4.5:1 contrast; contract test asserts.
- **Status:** [ ] Pending

### T-7.1.3 - Snapshot totals in exports

- **Task ID:** T-7.1.3
- **Sprint:** Sprint 7.1
- **Epic:** M7 - Business Ledger
- **Feature:** Exports - Snapshot
- **Description:** Snapshot totals + FX rates at export time in `src/lib/csvExport.ts` (new) and PDF exporter; header row includes snapshot timestamp.
- **Business Value:** Exports are legally consistent.
- **Technical Value:** Removes drift between screen and file.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `src/lib/csvExport.ts` (new), PDF exporter
- **Acceptance Criteria:**
  - Snapshot test asserts exact match with on-screen totals in fixture.
- **Status:** [ ] Pending

### T-7.1.4 - Reminder table + schema

- **Task ID:** T-7.1.4
- **Sprint:** Sprint 7.1
- **Epic:** M7 - Business Ledger
- **Feature:** Ledger - Reminders
- **Description:** Migration `018_reminders.sql` adding `reminders(id, ledgerId, cadence, quietHoursStart, quietHoursEnd, timezone, nextRunAt)` with RLS.
- **Business Value:** Users can nudge themselves without another app.
- **Technical Value:** Persistence for reminder engine.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `prisma/migrations/018_reminders.sql` (new), [prisma/schema.prisma](../prisma/schema.prisma)
- **Acceptance Criteria:**
  - RLS smoke test covers table.
- **Status:** [ ] Pending

### T-7.1.5 - Reminder dispatcher

- **Task ID:** T-7.1.5
- **Sprint:** Sprint 7.1
- **Epic:** M7 - Business Ledger
- **Feature:** Ledger - Reminders
- **Description:** `src/lib/server/reminderDispatcher.ts` runs on the same cron tick as push, respecting quiet-hours + timezone.
- **Business Value:** Reliable in-app + push nudges.
- **Technical Value:** Reuses push infrastructure from M3.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-7.1.4, T-3.1.4
- **Affected Files:** `src/lib/server/reminderDispatcher.ts` (new)
- **Acceptance Criteria:**
  - Dispatcher green under quiet-hours + timezone fixture.
- **Status:** [ ] Pending

---

<a id="sprint-72"></a>

## Sprint 7.2 - Reminder UI, Metrics & Business Analytics

**Epic:** M7 - Business Ledger Enhancements - **Horizon:** 2 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Users configure reminders per ledger; small merchants get useful analytics. Closes PRD FR-BL-04, FR-AN-03.

### T-7.2.1 - Per-ledger "Remind me" UI

- **Task ID:** T-7.2.1
- **Sprint:** Sprint 7.2
- **Epic:** M7 - Business Ledger
- **Feature:** Ledger - UI
- **Description:** Sheet UI added under `src/components/business/ReminderSheet.tsx` (cadence, quiet-hours, timezone).
- **Business Value:** Users configure without leaving the ledger.
- **Technical Value:** Reusable sheet pattern.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-7.1.4
- **Affected Files:** `src/components/business/ReminderSheet.tsx` (new), ledger detail page
- **Acceptance Criteria:**
  - Keyboard operable; contract test green.
- **Status:** [ ] Pending

### T-7.2.2 - Snooze / cancel controls

- **Task ID:** T-7.2.2
- **Sprint:** Sprint 7.2
- **Epic:** M7 - Business Ledger
- **Feature:** Ledger - UX
- **Description:** Snooze / cancel actions with reversible toast; state persisted through sync.
- **Business Value:** Users maintain control over noise.
- **Technical Value:** Standard reversible-action UX.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-7.2.1
- **Affected Files:** `src/components/business/ReminderSheet.tsx`
- **Acceptance Criteria:**
  - Snoozed reminder resumes after configured window.
- **Status:** [ ] Pending

### T-7.2.3 - Reminder metrics view

- **Task ID:** T-7.2.3
- **Sprint:** Sprint 7.2
- **Epic:** M7 - Business Ledger
- **Feature:** Ledger - Metrics
- **Description:** Small "sent / opened / cleared" counters on the ledger card (aggregated from `push_deliveries`).
- **Business Value:** Users see if reminders help.
- **Technical Value:** Feeds M9 KPIs.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-7.1.5, T-3.1.2
- **Affected Files:** `src/components/business/LedgerCard.tsx`
- **Acceptance Criteria:**
  - Counters accurate against fixture data.
- **Status:** [ ] Pending

### T-7.2.4 - Merchant breakdown per ledger

- **Task ID:** T-7.2.4
- **Sprint:** Sprint 7.2
- **Epic:** M7 - Business Ledger
- **Feature:** Analytics - Business
- **Description:** Extend [merchantBreakdown](../src/components/analytics/MerchantBreakdown.tsx) to accept a `ledgerId` scope.
- **Business Value:** Small businesses see revenue mix per client.
- **Technical Value:** Reuses existing analytics with scope prop.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [src/components/analytics/MerchantBreakdown.tsx](../src/components/analytics/MerchantBreakdown.tsx)
- **Acceptance Criteria:**
  - Scoped view matches un-scoped totals when scope=all.
- **Status:** [ ] Pending

### T-7.2.5 - Revenue vs. expense chart

- **Task ID:** T-7.2.5
- **Sprint:** Sprint 7.2
- **Epic:** M7 - Business Ledger
- **Feature:** Analytics - Business
- **Description:** New `src/components/business/RevenueVsExpenseChart.tsx` (Visx) with `DataTableView` alternative.
- **Business Value:** Founders see net position at a glance.
- **Technical Value:** Consistent with M4 accessibility contract.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** M
- **Dependencies:** T-4.2.1
- **Affected Files:** `src/components/business/RevenueVsExpenseChart.tsx` (new)
- **Acceptance Criteria:**
  - Contract test passes; keyboard toggle works.
- **Status:** [ ] Pending

### T-7.2.6 - Business feature tests

- **Task ID:** T-7.2.6
- **Sprint:** Sprint 7.2
- **Epic:** M7 - Business Ledger
- **Feature:** Business - Tests
- **Description:** Add `src/__tests__/reminderDispatcher.test.ts`, `src/__tests__/ledgerOverdueTier.test.ts`, `src/__tests__/exportSnapshot.test.ts`.
- **Business Value:** Locks M7 exit criteria.
- **Technical Value:** Regression net for business flows.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-7.1.5, T-7.1.3, T-7.1.1
- **Affected Files:** `src/__tests__/reminderDispatcher.test.ts` (new), `src/__tests__/ledgerOverdueTier.test.ts` (new), `src/__tests__/exportSnapshot.test.ts` (new)
- **Acceptance Criteria:**
  - All three specs green.
- **Status:** [ ] Pending

---

<a id="sprint-81"></a>

## Sprint 8.1 - Envelope Schema & Editor

**Epic:** M8 - Envelope Budgeting & Guardrails - **Horizon:** 2 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Users can define per-category monthly caps with rollover behavior. Closes PRD FR-BUD-02.

### T-8.1.1 - Envelope data model

- **Task ID:** T-8.1.1
- **Sprint:** Sprint 8.1
- **Epic:** M8 - Envelopes
- **Feature:** Budgets - Model
- **Description:** Extend `WorkspaceSettings` with `envelopes: Envelope[]` where `Envelope = { categoryId, monthlyCap, rollover: 'none'|'rollover'|'reset' }` stored as JSONB.
- **Business Value:** Empowers zero-based budgeting.
- **Technical Value:** Backwards-compatible extension.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** [src/lib/validators.ts](../src/lib/validators.ts), [prisma/schema.prisma](../prisma/schema.prisma)
- **Acceptance Criteria:**
  - Zod schema validates rollover enum and non-negative cap.
- **Status:** [ ] Pending

### T-8.1.2 - EnvelopeEditor UI

- **Task ID:** T-8.1.2
- **Sprint:** Sprint 8.1
- **Epic:** M8 - Envelopes
- **Feature:** Budgets - UI
- **Description:** New `src/components/settings/EnvelopeEditor.tsx` with per-category rows, live sum vs. income, tokenized colors.
- **Business Value:** Zero-friction envelope setup.
- **Technical Value:** Reusable pattern for other JSONB configs.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-8.1.1
- **Affected Files:** `src/components/settings/EnvelopeEditor.tsx` (new)
- **Acceptance Criteria:**
  - Keyboard operable; contract test green.
- **Status:** [ ] Pending

### T-8.1.3 - Compute envelope status per period

- **Task ID:** T-8.1.3
- **Sprint:** Sprint 8.1
- **Epic:** M8 - Envelopes
- **Feature:** Budgets - Logic
- **Description:** New `src/lib/computeEnvelopeStatus.ts` returning `{ spent, cap, remaining, pct, status: 'ok'|'warn'|'over' }` using `Money` types.
- **Business Value:** Consistent behavior across surfaces.
- **Technical Value:** Central pure function; easy to test.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-2.3.4, T-8.1.1
- **Affected Files:** `src/lib/computeEnvelopeStatus.ts` (new)
- **Acceptance Criteria:**
  - 100% branch coverage.
- **Status:** [ ] Pending

### T-8.1.4 - Persist per-envelope monthly snapshot

- **Task ID:** T-8.1.4
- **Sprint:** Sprint 8.1
- **Epic:** M8 - Envelopes
- **Feature:** Budgets - History
- **Description:** Persist monthly snapshot in a new `envelope_snapshots` table for historical charts.
- **Business Value:** Users can review past adherence.
- **Technical Value:** Enables trend analysis in Sprint 8.2.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-8.1.3
- **Affected Files:** `prisma/migrations/018b_envelope_snapshots.sql` (new), [prisma/schema.prisma](../prisma/schema.prisma)
- **Acceptance Criteria:**
  - Snapshot job runs monthly; verified in fixture.
- **Status:** [ ] Pending

### T-8.1.5 - Envelope model tests

- **Task ID:** T-8.1.5
- **Sprint:** Sprint 8.1
- **Epic:** M8 - Envelopes
- **Feature:** Budgets - Tests
- **Description:** Add `src/__tests__/envelopes.model.test.ts` covering rollover semantics.
- **Business Value:** Correct rollover behavior at month boundary.
- **Technical Value:** Regression net.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-8.1.3
- **Affected Files:** `src/__tests__/envelopes.model.test.ts` (new)
- **Acceptance Criteria:**
  - Spec green for all three rollover modes.
- **Status:** [ ] Pending

---

<a id="sprint-82"></a>

## Sprint 8.2 - Envelope Surfaces & Anomaly Integration

**Epic:** M8 - Envelope Budgeting & Guardrails - **Horizon:** 2 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Envelope status is visible where money moves; overshoot flows through the existing anomaly pipeline. Closes M8 exit.

### T-8.2.1 - `EnvelopeRing` on `ExpenseForm`

- **Task ID:** T-8.2.1
- **Sprint:** Sprint 8.2
- **Epic:** M8 - Envelopes
- **Feature:** Budgets - UI
- **Description:** Show per-category ring in `ExpenseForm` while entering an amount; live update as user types.
- **Business Value:** Coaches users at the moment of decision.
- **Technical Value:** Reusable ring primitive.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-8.1.3
- **Affected Files:** [src/components/expenses/ExpenseForm.tsx](../src/components/expenses/ExpenseForm.tsx), `src/components/ui/EnvelopeRing.tsx` (new)
- **Acceptance Criteria:**
  - Reduced-motion path renders static bar.
- **Status:** [ ] Pending

### T-8.2.2 - Dashboard `EnvelopesPanel`

- **Task ID:** T-8.2.2
- **Sprint:** Sprint 8.2
- **Epic:** M8 - Envelopes
- **Feature:** Dashboard - Envelopes
- **Description:** New `src/components/dashboard/EnvelopesPanel.tsx` sorted by pct spent desc.
- **Business Value:** Envelope overview at glance.
- **Technical Value:** Clean composition of ring + list.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-8.1.3
- **Affected Files:** `src/components/dashboard/EnvelopesPanel.tsx` (new)
- **Acceptance Criteria:**
  - Contract test green; DataTableView alternative provided.
- **Status:** [ ] Pending

### T-8.2.3 - Envelope-over anomaly type

- **Task ID:** T-8.2.3
- **Sprint:** Sprint 8.2
- **Epic:** M8 - Envelopes
- **Feature:** Anomalies - Envelope
- **Description:** Add `envelope-over` anomaly type to `src/lib/anomalyDetection.ts` (new) firing when `pct > 100%` during the current period.
- **Business Value:** Users are alerted before month end.
- **Technical Value:** Reuses anomaly pipeline (no new UI stack).
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-8.1.3
- **Affected Files:** `src/lib/anomalyDetection.ts` (new), `src/components/analytics/*`
- **Acceptance Criteria:**
  - Anomaly card visible on dashboard.
- **Status:** [ ] Pending

### T-8.2.4 - Rollover across month boundary

- **Task ID:** T-8.2.4
- **Sprint:** Sprint 8.2
- **Epic:** M8 - Envelopes
- **Feature:** Budgets - Logic
- **Description:** Implement rollover semantics on the first of the month (`rollover` -> add remainder; `reset` -> zero; `none` -> ignore).
- **Business Value:** Faithful to envelope-budgeting doctrine.
- **Technical Value:** Deterministic month boundary handling.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-8.1.3
- **Affected Files:** `src/lib/computeEnvelopeStatus.ts`, `src/lib/server/envelopeRollover.ts` (new)
- **Acceptance Criteria:**
  - Spec covers timezone edge case at midnight.
- **Status:** [ ] Pending

### T-8.2.5 - Envelope integration tests

- **Task ID:** T-8.2.5
- **Sprint:** Sprint 8.2
- **Epic:** M8 - Envelopes
- **Feature:** Budgets - Tests
- **Description:** Add `src/__tests__/envelopes.form.test.ts` and `src/__tests__/envelopes.anomaly.test.ts`.
- **Business Value:** M8 exit gate.
- **Technical Value:** End-to-end coverage for envelope flow.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-8.2.1, T-8.2.3
- **Affected Files:** `src/__tests__/envelopes.form.test.ts` (new), `src/__tests__/envelopes.anomaly.test.ts` (new)
- **Acceptance Criteria:**
  - Both specs green.
- **Status:** [ ] Pending

---

<a id="sprint-91"></a>

## Sprint 9.1 - Analytics Web Worker & Query Hook

**Epic:** M9 - Performance & Sync Scale - **Horizon:** 2-3 - **Priority:** P1 - **Effort:** L - **Story points:** 13

**Sprint goal:** Heavy analytics computed off the main thread; render remains at 60 fps. Closes Architecture section 18.13.

### T-9.1.1 - Author `analytics.worker.ts`

- **Task ID:** T-9.1.1
- **Sprint:** Sprint 9.1
- **Epic:** M9 - Performance
- **Feature:** Perf - Worker
- **Description:** New `src/workers/analytics.worker.ts` running rolling-avg, YoY, ridge-line, envelope aggregates off the main thread; uses `comlink` or raw postMessage.
- **Business Value:** Smooth scrolling on 500+ expense datasets.
- **Technical Value:** Removes main-thread jank.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** None
- **Affected Files:** `src/workers/analytics.worker.ts` (new)
- **Acceptance Criteria:**
  - Handles 5 k expenses within <= 100 ms in benchmark.
- **Status:** [ ] Pending

### T-9.1.2 - `useWorkerQuery` hook

- **Task ID:** T-9.1.2
- **Sprint:** Sprint 9.1
- **Epic:** M9 - Performance
- **Feature:** Perf - Hook
- **Description:** New `src/hooks/useWorkerQuery.ts` giving Suspense-friendly async access with cancellation on unmount.
- **Business Value:** Idiomatic React consumption.
- **Technical Value:** Cancellation prevents memory leaks.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-9.1.1
- **Affected Files:** `src/hooks/useWorkerQuery.ts` (new)
- **Acceptance Criteria:**
  - Cancellation verified in unit test.
- **Status:** [ ] Pending

### T-9.1.3 - Migrate analytics components to worker

- **Task ID:** T-9.1.3
- **Sprint:** Sprint 9.1
- **Epic:** M9 - Performance
- **Feature:** Perf - Migration
- **Description:** Move computation in `RollingAverageChart`, `YearOverYearChart`, `RidgeLine`, `CategoryVelocity` to the worker.
- **Business Value:** No visible lag on heavy screens.
- **Technical Value:** Uniform pattern for perf-critical viz.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-9.1.2
- **Affected Files:** `src/components/analytics/*.tsx`
- **Acceptance Criteria:**
  - INP <= 200 ms P75 in Lighthouse fixture.
- **Status:** [ ] Pending

### T-9.1.4 - Bundle-size budget update

- **Task ID:** T-9.1.4
- **Sprint:** Sprint 9.1
- **Epic:** M9 - Performance
- **Feature:** Perf - Budgets
- **Description:** Verify `/analytics` remains below the 220 KB gz cap after worker split.
- **Business Value:** No perf regression from the split.
- **Technical Value:** Confirms budget script effectiveness.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-6.2.3
- **Affected Files:** CI logs
- **Acceptance Criteria:**
  - Budget check green in CI.
- **Status:** [ ] Pending

### T-9.1.5 - Worker + benchmark tests

- **Task ID:** T-9.1.5
- **Sprint:** Sprint 9.1
- **Epic:** M9 - Performance
- **Feature:** Perf - Tests
- **Description:** Add `src/__tests__/analytics.worker.test.ts` and a benchmark spec.
- **Business Value:** M9 exit criteria proof.
- **Technical Value:** Ongoing perf net.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-9.1.1
- **Affected Files:** `src/__tests__/analytics.worker.test.ts` (new)
- **Acceptance Criteria:**
  - Benchmark asserts <= 100 ms per 5 k expenses.
- **Status:** [ ] Pending

---

<a id="sprint-92"></a>

## Sprint 9.2 - Streaming Sync & Cache-Control

**Epic:** M9 - Performance & Sync Scale - **Horizon:** 2-3 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Sync scales to > 20 k rows without OOM; static assets cached forever. Closes Architecture section 18.7, 18.10.

### T-9.2.1 - Streaming `/api/sync/changes`

- **Task ID:** T-9.2.1
- **Sprint:** Sprint 9.2
- **Epic:** M9 - Performance
- **Feature:** Sync - Stream
- **Description:** Convert `/api/sync/changes` to `ReadableStream` chunked NDJSON when result count > 500.
- **Business Value:** Large workspaces sync without timeouts.
- **Technical Value:** Constant memory usage.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** None
- **Affected Files:** `src/app/api/sync/changes/route.ts`
- **Acceptance Criteria:**
  - 20 k-row fixture syncs successfully.
- **Status:** [ ] Pending

### T-9.2.2 - Compound cursor `(updatedAt, id)`

- **Task ID:** T-9.2.2
- **Sprint:** Sprint 9.2
- **Epic:** M9 - Performance
- **Feature:** Sync - Cursor
- **Description:** Update cursor semantics to `(updatedAt, id)` for stable pagination in [src/lib/syncEngine.ts](../src/lib/syncEngine.ts) and API.
- **Business Value:** No skipped rows during heavy edits.
- **Technical Value:** Deterministic ordering.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-9.2.1
- **Affected Files:** [src/lib/syncEngine.ts](../src/lib/syncEngine.ts), `src/app/api/sync/changes/route.ts`
- **Acceptance Criteria:**
  - Concurrent-edit test asserts no dropped rows.
- **Status:** [ ] Pending

### T-9.2.3 - Immutable `Cache-Control` on hashed assets

- **Task ID:** T-9.2.3
- **Sprint:** Sprint 9.2
- **Epic:** M9 - Performance
- **Feature:** Perf - Caching
- **Description:** Set `Cache-Control: public, max-age=31536000, immutable` on hashed static assets in [next.config.ts](../next.config.ts).
- **Business Value:** Free CDN win for repeat visits.
- **Technical Value:** Standard PWA optimization.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** None
- **Affected Files:** [next.config.ts](../next.config.ts)
- **Acceptance Criteria:**
  - Headers snapshot test asserts.
- **Status:** [ ] Pending

### T-9.2.4 - Route-level API cache headers

- **Task ID:** T-9.2.4
- **Sprint:** Sprint 9.2
- **Epic:** M9 - Performance
- **Feature:** Perf - Caching
- **Description:** Route-level `Cache-Control` on read-only public endpoints (icons, manifest); ensure sensitive endpoints stay `no-store`.
- **Business Value:** Faster PWA install; safe SSR posture.
- **Technical Value:** Explicit per-route policy.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-9.2.3
- **Affected Files:** Various API routes
- **Acceptance Criteria:**
  - Route audit table in `docs/perf/cache-headers.md` (new).
- **Status:** [ ] Pending

### T-9.2.5 - Streaming + cursor tests

- **Task ID:** T-9.2.5
- **Sprint:** Sprint 9.2
- **Epic:** M9 - Performance
- **Feature:** Perf - Tests
- **Description:** Add `src/__tests__/sync.streaming.test.ts` and `src/__tests__/sync.cursor.test.ts`.
- **Business Value:** M9 exit criteria proof.
- **Technical Value:** Regression net for perf-critical sync path.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-9.2.1, T-9.2.2
- **Affected Files:** `src/__tests__/sync.streaming.test.ts` (new), `src/__tests__/sync.cursor.test.ts` (new)
- **Acceptance Criteria:**
  - Both specs green under 20 k-row fixture.
- **Status:** [ ] Pending

---

<a id="sprint-101"></a>

## Sprint 10.1 - Repositories & API Types

**Epic:** M10 - Modularity & Extension Surface - **Horizon:** 3 - **Priority:** P2 - **Effort:** L - **Story points:** 13

**Sprint goal:** Every Prisma call funnels through repositories; every API returns a typed shape from `src/types/api/**`. Closes Architecture section 18.6.

### T-10.1.1 - Repositories skeleton

- **Task ID:** T-10.1.1
- **Sprint:** Sprint 10.1
- **Epic:** M10 - Modularity
- **Feature:** Refactor - Repositories
- **Description:** New `src/lib/server/repositories/{expense,ledger,payment,workspace,user}Repo.ts`.
- **Business Value:** Cleaner code = faster feature work.
- **Technical Value:** Central seam for RLS, caching, logging.
- **Priority:** P2
- **Impact:** High
- **Effort:** M
- **Dependencies:** None
- **Affected Files:** `src/lib/server/repositories/**` (new)
- **Acceptance Criteria:**
  - Each repo exports typed CRUD; existing routes still green.
- **Status:** [ ] Pending

### T-10.1.2 - Migrate API routes to repositories

- **Task ID:** T-10.1.2
- **Sprint:** Sprint 10.1
- **Epic:** M10 - Modularity
- **Feature:** Refactor - Routes
- **Description:** Replace direct `prisma.*` calls in `src/app/api/**` with repository calls.
- **Business Value:** Uniform data access.
- **Technical Value:** Enables caching + observability in one place.
- **Priority:** P2
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-10.1.1
- **Affected Files:** All API route handlers
- **Acceptance Criteria:**
  - Grep for `prisma.` in `src/app/api/**` returns zero matches.
- **Status:** [ ] Pending

### T-10.1.3 - ESLint rule: forbid `prisma.` in API routes

- **Task ID:** T-10.1.3
- **Sprint:** Sprint 10.1
- **Epic:** M10 - Modularity
- **Feature:** Refactor - Lint
- **Description:** Extend [eslint.config.mjs](../eslint.config.mjs) to forbid `prisma.` in `src/app/api/**`; allowlist for a small set of read-only diagnostics.
- **Business Value:** Prevents regression.
- **Technical Value:** Codifies repository contract.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-10.1.2
- **Affected Files:** [eslint.config.mjs](../eslint.config.mjs)
- **Acceptance Criteria:**
  - Rule fires on synthetic violation.
- **Status:** [ ] Pending

### T-10.1.4 - API DTOs under `src/types/api/**`

- **Task ID:** T-10.1.4
- **Sprint:** Sprint 10.1
- **Epic:** M10 - Modularity
- **Feature:** Refactor - Types
- **Description:** New DTO files per resource; routes return the DTO type explicitly.
- **Business Value:** Predictable API contract.
- **Technical Value:** Enables future OpenAPI generation.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-10.1.1
- **Affected Files:** `src/types/api/**` (new)
- **Acceptance Criteria:**
  - Routes referenced by tests still typed correctly.
- **Status:** [ ] Pending

### T-10.1.5 - Repository tests

- **Task ID:** T-10.1.5
- **Sprint:** Sprint 10.1
- **Epic:** M10 - Modularity
- **Feature:** Refactor - Tests
- **Description:** Add `src/__tests__/repositories.expense.test.ts` and a couple more; assert RLS-friendly signatures.
- **Business Value:** Confidence in the new seam.
- **Technical Value:** Regression net.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-10.1.1
- **Affected Files:** `src/__tests__/repositories.*.test.ts` (new)
- **Acceptance Criteria:**
  - Specs green.
- **Status:** [ ] Pending

---

<a id="sprint-102"></a>

## Sprint 10.2 - Vertical Feature Slices

**Epic:** M10 - Modularity & Extension Surface - **Horizon:** 3 - **Priority:** P2 - **Effort:** M - **Story points:** 8

**Sprint goal:** Reorganize by feature vertical (`src/features/**`) so future engineers or agents pick up a feature end-to-end fast.

### T-10.2.1 - Verticalize sync feature

- **Task ID:** T-10.2.1
- **Sprint:** Sprint 10.2
- **Epic:** M10 - Modularity
- **Feature:** Refactor - Verticalization
- **Description:** Move sync-related code into `src/features/sync/{components,hooks,server,__tests__}`; update imports.
- **Business Value:** Faster onboarding.
- **Technical Value:** Clear feature boundaries.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** M
- **Dependencies:** T-10.1.5
- **Affected Files:** `src/features/sync/**` (moved from `src/**`)
- **Acceptance Criteria:**
  - Build + tests remain green.
- **Status:** [ ] Pending

### T-10.2.2 - Verticalize business feature

- **Task ID:** T-10.2.2
- **Sprint:** Sprint 10.2
- **Epic:** M10 - Modularity
- **Feature:** Refactor - Verticalization
- **Description:** Same treatment for business ledger.
- **Business Value:** Same.
- **Technical Value:** Same.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** M
- **Dependencies:** T-10.2.1
- **Affected Files:** `src/features/business/**`
- **Acceptance Criteria:**
  - Same.
- **Status:** [ ] Pending

### T-10.2.3 - Cross-feature import lint rule

- **Task ID:** T-10.2.3
- **Sprint:** Sprint 10.2
- **Epic:** M10 - Modularity
- **Feature:** Refactor - Lint
- **Description:** Add rule that a feature may not import another feature's internals (only its public `index.ts`).
- **Business Value:** Long-term architecture health.
- **Technical Value:** Enforces isolation.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-10.2.2
- **Affected Files:** [eslint.config.mjs](../eslint.config.mjs)
- **Acceptance Criteria:**
  - Rule fires on synthetic cross-import.
- **Status:** [ ] Pending

### T-10.2.4 - Update ARCHITECTURE.md

- **Task ID:** T-10.2.4
- **Sprint:** Sprint 10.2
- **Epic:** M10 - Modularity
- **Feature:** Docs - Architecture
- **Description:** Reflect the new vertical layout in [ARCHITECTURE.md](ARCHITECTURE.md) with a directory diagram.
- **Business Value:** Docs match code.
- **Technical Value:** Prevents divergence.
- **Priority:** P2
- **Impact:** Low
- **Effort:** XS
- **Dependencies:** T-10.2.2
- **Affected Files:** [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- **Acceptance Criteria:**
  - Doc lists every feature vertical.
- **Status:** [ ] Pending

---

<a id="sprint-111"></a>

## Sprint 11.1 - Automated Purge & Backup Verification

**Epic:** M11 - Data Lifecycle & Portability - **Horizon:** 3 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Deleted workspaces are irrecoverably purged after 30 days; backups are proven usable weekly. Closes PRD FR-DATA-04.

### T-11.1.1 - `/api/cron/purge` endpoint

- **Task ID:** T-11.1.1
- **Sprint:** Sprint 11.1
- **Epic:** M11 - Data Lifecycle
- **Feature:** Data - Purge
- **Description:** New `src/app/api/cron/purge/route.ts`, `CRON_SECRET`-guarded; deletes workspaces flagged `deletedAt < now - 30d`.
- **Business Value:** Meets GDPR erasure expectations.
- **Technical Value:** Automates a manual runbook.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `src/app/api/cron/purge/route.ts` (new)
- **Acceptance Criteria:**
  - Endpoint idempotent; audits `workspace.purge`.
- **Status:** [ ] Pending

### T-11.1.2 - `src/lib/server/purge.ts`

- **Task ID:** T-11.1.2
- **Sprint:** Sprint 11.1
- **Epic:** M11 - Data Lifecycle
- **Feature:** Data - Purge
- **Description:** Cascading delete implementation across expenses, ledgers, payments, settings, audit logs.
- **Business Value:** No orphaned data lingering.
- **Technical Value:** Single-source cascade.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-11.1.1
- **Affected Files:** `src/lib/server/purge.ts` (new)
- **Acceptance Criteria:**
  - Fixture proves 100% row deletion.
- **Status:** [ ] Pending

### T-11.1.3 - Backup restore workflow

- **Task ID:** T-11.1.3
- **Sprint:** Sprint 11.1
- **Epic:** M11 - Data Lifecycle
- **Feature:** Backups - CI
- **Description:** `.github/workflows/backup-verify.yml` weekly: pull latest Supabase backup, restore to ephemeral DB, run `scripts/rls-smoke.ts`.
- **Business Value:** Provable disaster recovery.
- **Technical Value:** Continuous restore rehearsal.
- **Priority:** P0
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-5.3.4
- **Affected Files:** `.github/workflows/backup-verify.yml` (new)
- **Acceptance Criteria:**
  - Workflow green weekly; slack/email alert on failure.
- **Status:** [ ] Pending

### T-11.1.4 - `docs/ops/backups.md` runbook

- **Task ID:** T-11.1.4
- **Sprint:** Sprint 11.1
- **Epic:** M11 - Data Lifecycle
- **Feature:** Docs - Ops
- **Description:** Document RTO, RPO, on-call step-by-step recovery, escalation.
- **Business Value:** Fast incident response.
- **Technical Value:** Institutional memory captured.
- **Priority:** P0
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-11.1.3
- **Affected Files:** `docs/ops/backups.md` (new)
- **Acceptance Criteria:**
  - Cross-linked from [ARCHITECTURE.md](ARCHITECTURE.md) and [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md).
- **Status:** [ ] Pending

---

<a id="sprint-112"></a>

## Sprint 11.2 - Encrypted Archive Export/Import

**Epic:** M11 - Data Lifecycle & Portability - **Horizon:** 3 - **Priority:** P1 - **Effort:** L - **Story points:** 13

**Sprint goal:** Users export/import a fully signed, encrypted archive using their passphrase. Closes PRD FR-DATA-05.

### T-11.2.1 - Archive format spec

- **Task ID:** T-11.2.1
- **Sprint:** Sprint 11.2
- **Epic:** M11 - Data Lifecycle
- **Feature:** Portability - Format
- **Description:** Document `.expenstream` archive format (v1) in `docs/data/archive-v1.md`: manifest, per-entity JSONL, signed integrity hash, PBKDF2 params.
- **Business Value:** Users own their data.
- **Technical Value:** Interoperable spec.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `docs/data/archive-v1.md` (new)
- **Acceptance Criteria:**
  - Reviewable spec; version prefix required.
- **Status:** [ ] Pending

### T-11.2.2 - Export flow (client)

- **Task ID:** T-11.2.2
- **Sprint:** Sprint 11.2
- **Epic:** M11 - Data Lifecycle
- **Feature:** Portability - Export
- **Description:** New `src/lib/archive/export.ts` builds encrypted archive in a worker, streams to `File System Access API` where available.
- **Business Value:** No-limit portability.
- **Technical Value:** Streaming avoids memory ceiling.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-11.2.1
- **Affected Files:** `src/lib/archive/export.ts` (new), Settings UI wiring
- **Acceptance Criteria:**
  - 100 MB fixture exports without OOM.
- **Status:** [ ] Pending

### T-11.2.3 - Import flow (client)

- **Task ID:** T-11.2.3
- **Sprint:** Sprint 11.2
- **Epic:** M11 - Data Lifecycle
- **Feature:** Portability - Import
- **Description:** New `src/lib/archive/import.ts` validates signature, decrypts with passphrase, replays as sync mutations.
- **Business Value:** Onboarding from previous export.
- **Technical Value:** Reuses sync queue.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-11.2.1
- **Affected Files:** `src/lib/archive/import.ts` (new)
- **Acceptance Criteria:**
  - Round-trip test: export -> new workspace -> import -> identical data.
- **Status:** [ ] Pending

### T-11.2.4 - `scripts/decrypt-archive.ts`

- **Task ID:** T-11.2.4
- **Sprint:** Sprint 11.2
- **Epic:** M11 - Data Lifecycle
- **Feature:** Portability - CLI
- **Description:** Offline decryption utility for advanced users / support.
- **Business Value:** Users can inspect their data outside the app.
- **Technical Value:** Ensures format is truly open.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-11.2.1
- **Affected Files:** `scripts/decrypt-archive.ts` (new)
- **Acceptance Criteria:**
  - CLI decrypts fixture archive successfully.
- **Status:** [ ] Pending

### T-11.2.5 - Archive round-trip test

- **Task ID:** T-11.2.5
- **Sprint:** Sprint 11.2
- **Epic:** M11 - Data Lifecycle
- **Feature:** Portability - Tests
- **Description:** Add `src/__tests__/archive.roundtrip.test.ts`.
- **Business Value:** Locks portability contract.
- **Technical Value:** Regression net.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-11.2.2, T-11.2.3
- **Affected Files:** `src/__tests__/archive.roundtrip.test.ts` (new)
- **Acceptance Criteria:**
  - Spec green.
- **Status:** [ ] Pending

---

<a id="sprint-121"></a>

## Sprint 12.1 - iOS Install Sheet & Web Share Target

**Epic:** M12 - PWA Depth & Native Feel - **Horizon:** 3 - **Priority:** P2 - **Effort:** M - **Story points:** 5

**Sprint goal:** iOS/Android users install with confidence; PWA becomes a share target for photos and receipts.

### T-12.1.1 - `IosInstallSheet`

- **Task ID:** T-12.1.1
- **Sprint:** Sprint 12.1
- **Epic:** M12 - PWA
- **Feature:** PWA - Install
- **Description:** New `src/components/pwa/IosInstallSheet.tsx` with animated Add-to-Home-Screen instructions; shown once via localStorage flag.
- **Business Value:** More iOS installs.
- **Technical Value:** Standard iOS PWA education.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `src/components/pwa/IosInstallSheet.tsx` (new)
- **Acceptance Criteria:**
  - Sheet dismissible; never re-shows after dismissal.
- **Status:** [ ] Pending

### T-12.1.2 - Add `share_target` to manifest

- **Task ID:** T-12.1.2
- **Sprint:** Sprint 12.1
- **Epic:** M12 - PWA
- **Feature:** PWA - Share
- **Description:** Extend [public/manifest.json](../public/manifest.json) with `share_target` for images (receipts) and text (paste-in).
- **Business Value:** Faster expense entry from photo/gallery.
- **Technical Value:** Standard PWA capability.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** None
- **Affected Files:** [public/manifest.json](../public/manifest.json)
- **Acceptance Criteria:**
  - Lighthouse recognizes share_target.
- **Status:** [ ] Pending

### T-12.1.3 - Handle shared content in `/share/handler`

- **Task ID:** T-12.1.3
- **Sprint:** Sprint 12.1
- **Epic:** M12 - PWA
- **Feature:** PWA - Share
- **Description:** New `/share/handler` page that prefills `ExpenseForm` with shared receipt image or pasted amount.
- **Business Value:** One-tap capture.
- **Technical Value:** Reuses ExpenseForm.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-12.1.2
- **Affected Files:** `src/app/share/handler/page.tsx` (new)
- **Acceptance Criteria:**
  - Shared image attached; camera OCR left for M14.
- **Status:** [ ] Pending

### T-12.1.4 - Install sheet + share target tests

- **Task ID:** T-12.1.4
- **Sprint:** Sprint 12.1
- **Epic:** M12 - PWA
- **Feature:** PWA - Tests
- **Description:** Add `src/__tests__/iosInstallSheet.test.ts` and `src/__tests__/shareHandler.test.ts`.
- **Business Value:** Locks new PWA surfaces.
- **Technical Value:** Regression net.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-12.1.1, T-12.1.3
- **Affected Files:** `src/__tests__/iosInstallSheet.test.ts` (new), `src/__tests__/shareHandler.test.ts` (new)
- **Acceptance Criteria:**
  - Specs green.
- **Status:** [ ] Pending

---

<a id="sprint-122"></a>

## Sprint 12.2 - Offline Fallback Route & Maskable Icons

**Epic:** M12 - PWA Depth & Native Feel - **Horizon:** 3 - **Priority:** P2 - **Effort:** M - **Story points:** 5

**Sprint goal:** Offline-first UX polish so the app "feels native" everywhere.

### T-12.2.1 - Offline fallback route

- **Task ID:** T-12.2.1
- **Sprint:** Sprint 12.2
- **Epic:** M12 - PWA
- **Feature:** PWA - Offline
- **Description:** New `src/app/offline/page.tsx` shown from [public/sw.js](../public/sw.js) when navigation request fails.
- **Business Value:** Users don't see the browser dinosaur.
- **Technical Value:** Standard SW pattern.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `src/app/offline/page.tsx` (new), [public/sw.js](../public/sw.js)
- **Acceptance Criteria:**
  - Airplane-mode smoke test shows the branded offline page.
- **Status:** [ ] Pending

### T-12.2.2 - Maskable icons

- **Task ID:** T-12.2.2
- **Sprint:** Sprint 12.2
- **Epic:** M12 - PWA
- **Feature:** PWA - Icons
- **Description:** Regenerate maskable icons via [scripts/gen-icons.js](../scripts/gen-icons.js); update manifest.
- **Business Value:** Icon looks great on all Android launchers.
- **Technical Value:** Standard PWA polish.
- **Priority:** P2
- **Impact:** Low
- **Effort:** XS
- **Dependencies:** None
- **Affected Files:** [scripts/gen-icons.js](../scripts/gen-icons.js), [public/manifest.json](../public/manifest.json)
- **Acceptance Criteria:**
  - Lighthouse maskable icon check passes.
- **Status:** [ ] Pending

### T-12.2.3 - Update `docs/PRODUCTION_CHECKLIST.md`

- **Task ID:** T-12.2.3
- **Sprint:** Sprint 12.2
- **Epic:** M12 - PWA
- **Feature:** Docs - PWA
- **Description:** Add PWA and offline items to [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md).
- **Business Value:** Release quality gate.
- **Technical Value:** Institutional memory.
- **Priority:** P2
- **Impact:** Low
- **Effort:** XS
- **Dependencies:** T-12.2.1, T-12.2.2
- **Affected Files:** [docs/PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- **Acceptance Criteria:**
  - Checklist items reviewable.
- **Status:** [ ] Pending

### T-12.2.4 - SW + offline tests

- **Task ID:** T-12.2.4
- **Sprint:** Sprint 12.2
- **Epic:** M12 - PWA
- **Feature:** PWA - Tests
- **Description:** Add `src/__tests__/sw.offline.test.ts` (JSDOM + workbox mock).
- **Business Value:** Locks offline surface.
- **Technical Value:** Regression net for SW.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-12.2.1
- **Affected Files:** `src/__tests__/sw.offline.test.ts` (new)
- **Acceptance Criteria:**
  - Spec green.
- **Status:** [ ] Pending

---

<a id="sprint-131"></a>

## Sprint 13.1 - Ledger Portal (Read-Only Client Link)

**Epic:** M13 - Collaboration & Multi-actor - **Horizon:** 4 - **Priority:** P2 - **Effort:** L - **Story points:** 13

**Sprint goal:** A small merchant can send a signed, time-boxed link that shows a client their own outstanding ledger, without an account.

### T-13.1.1 - Portal token schema

- **Task ID:** T-13.1.1
- **Sprint:** Sprint 13.1
- **Epic:** M13 - Collaboration
- **Feature:** Portal - Model
- **Description:** Migration `019_ledger_portal_tokens.sql` with `ledger_portal_tokens(id, ledgerId, tokenHash, expiresAt, createdBy)`; RLS enforced.
- **Business Value:** Foundation for shareable read-only URL.
- **Technical Value:** Token-based access.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `prisma/migrations/019_ledger_portal_tokens.sql` (new), [prisma/schema.prisma](../prisma/schema.prisma)
- **Acceptance Criteria:**
  - RLS smoke test covers table.
- **Status:** [ ] Pending

### T-13.1.2 - `POST /api/ledgers/[id]/portal`

- **Task ID:** T-13.1.2
- **Sprint:** Sprint 13.1
- **Epic:** M13 - Collaboration
- **Feature:** Portal - API
- **Description:** OWNER-only endpoint that mints a signed URL, audit `ledger.portal.create`.
- **Business Value:** Merchant shares in one click.
- **Technical Value:** Explicit sensitive-op surface.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-13.1.1
- **Affected Files:** `src/app/api/ledgers/[id]/portal/route.ts` (new)
- **Acceptance Criteria:**
  - Non-owner returns 403; audit emitted.
- **Status:** [ ] Pending

### T-13.1.3 - `/portal/[token]` public page

- **Task ID:** T-13.1.3
- **Sprint:** Sprint 13.1
- **Epic:** M13 - Collaboration
- **Feature:** Portal - UI
- **Description:** New public read-only page showing the ledger, its payments and outstanding total; localized; brand-neutral.
- **Business Value:** Clients get a clean summary.
- **Technical Value:** Reuses ledger components.
- **Priority:** P2
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-13.1.2
- **Affected Files:** `src/app/portal/[token]/page.tsx` (new)
- **Acceptance Criteria:**
  - Page loads without auth; only whitelisted fields visible.
- **Status:** [ ] Pending

### T-13.1.4 - Rate-limit portal endpoint

- **Task ID:** T-13.1.4
- **Sprint:** Sprint 13.1
- **Epic:** M13 - Collaboration
- **Feature:** Portal - Security
- **Description:** Aggressive per-IP rate limits on `/portal/[token]` via [src/lib/server/rateLimit.ts](../src/lib/server/rateLimit.ts) to prevent enumeration.
- **Business Value:** Protects against scraping.
- **Technical Value:** Explicit security posture.
- **Priority:** P2
- **Impact:** High
- **Effort:** XS
- **Dependencies:** T-13.1.3
- **Affected Files:** [src/middleware.ts](../src/middleware.ts), [src/lib/server/rateLimit.ts](../src/lib/server/rateLimit.ts)
- **Acceptance Criteria:**
  - Enumeration test rate-limited within threshold.
- **Status:** [ ] Pending

### T-13.1.5 - Expire + revoke UX

- **Task ID:** T-13.1.5
- **Sprint:** Sprint 13.1
- **Epic:** M13 - Collaboration
- **Feature:** Portal - UX
- **Description:** Merchant UI to see, expire, and revoke active portal tokens.
- **Business Value:** Merchants stay in control.
- **Technical Value:** Standard token lifecycle.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-13.1.2
- **Affected Files:** `src/components/business/PortalTokensCard.tsx` (new)
- **Acceptance Criteria:**
  - Revoked tokens 404 immediately.
- **Status:** [ ] Pending

### T-13.1.6 - Portal tests

- **Task ID:** T-13.1.6
- **Sprint:** Sprint 13.1
- **Epic:** M13 - Collaboration
- **Feature:** Portal - Tests
- **Description:** Add `src/__tests__/portal.access.test.ts` and `src/__tests__/portal.rateLimit.test.ts`.
- **Business Value:** Locks portal security.
- **Technical Value:** Regression net.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-13.1.4, T-13.1.5
- **Affected Files:** `src/__tests__/portal.access.test.ts` (new), `src/__tests__/portal.rateLimit.test.ts` (new)
- **Acceptance Criteria:**
  - Specs green.
- **Status:** [ ] Pending

---

<a id="sprint-132"></a>

## Sprint 13.2 - Activity Feed & Merge-Level Redaction

**Epic:** M13 - Collaboration & Multi-actor - **Horizon:** 4 - **Priority:** P2 - **Effort:** M - **Story points:** 8

**Sprint goal:** A workspace-scoped activity feed lets multi-user households/teams see who did what, without leaking money in strings.

### T-13.2.1 - `activity_events` schema

- **Task ID:** T-13.2.1
- **Sprint:** Sprint 13.2
- **Epic:** M13 - Collaboration
- **Feature:** Activity - Model
- **Description:** Migration `020_activity_events.sql` with `activity_events(id, workspaceId, actorUserId, kind, entityType, entityId, deltaJson, createdAt)`; RLS enforced.
- **Business Value:** Foundation for feed and audit UX.
- **Technical Value:** Central event surface.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** None
- **Affected Files:** `prisma/migrations/020_activity_events.sql` (new), [prisma/schema.prisma](../prisma/schema.prisma)
- **Acceptance Criteria:**
  - `deltaJson` schema forbids raw money strings (validated at write).
- **Status:** [ ] Pending

### T-13.2.2 - Emit activity events from repositories

- **Task ID:** T-13.2.2
- **Sprint:** Sprint 13.2
- **Epic:** M13 - Collaboration
- **Feature:** Activity - Emit
- **Description:** Repositories from Sprint 10.1 emit `activity_events` on create/update/delete.
- **Business Value:** Complete history without route-by-route work.
- **Technical Value:** Uniform emission point.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-13.2.1, T-10.1.1
- **Affected Files:** `src/lib/server/repositories/*.ts`
- **Acceptance Criteria:**
  - Every CRUD path covered.
- **Status:** [ ] Pending

### T-13.2.3 - Feed page `/activity`

- **Task ID:** T-13.2.3
- **Sprint:** Sprint 13.2
- **Epic:** M13 - Collaboration
- **Feature:** Activity - UI
- **Description:** New `src/app/activity/page.tsx` with reverse-chronological feed grouped by day; server component + suspense.
- **Business Value:** Household transparency.
- **Technical Value:** Reads directly from `activity_events` with RLS.
- **Priority:** P2
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-13.2.2
- **Affected Files:** `src/app/activity/page.tsx` (new)
- **Acceptance Criteria:**
  - Feed paginated; keyboard operable.
- **Status:** [ ] Pending

### T-13.2.4 - Redact money in delta strings

- **Task ID:** T-13.2.4
- **Sprint:** Sprint 13.2
- **Epic:** M13 - Collaboration
- **Feature:** Activity - Privacy
- **Description:** `src/lib/server/activityFormatter.ts` renders human strings like `Alice updated Rent` without embedded amounts.
- **Business Value:** Financial privacy inside multi-user households.
- **Technical Value:** Central formatter; reused by exports.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-13.2.3
- **Affected Files:** `src/lib/server/activityFormatter.ts` (new)
- **Acceptance Criteria:**
  - Snapshot test asserts no `Money`-typed values in output strings.
- **Status:** [ ] Pending

### T-13.2.5 - Activity feed tests

- **Task ID:** T-13.2.5
- **Sprint:** Sprint 13.2
- **Epic:** M13 - Collaboration
- **Feature:** Activity - Tests
- **Description:** Add `src/__tests__/activity.emit.test.ts` and `src/__tests__/activity.redact.test.ts`.
- **Business Value:** Locks M13 exit criteria.
- **Technical Value:** Regression net.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-13.2.4
- **Affected Files:** `src/__tests__/activity.emit.test.ts` (new), `src/__tests__/activity.redact.test.ts` (new)
- **Acceptance Criteria:**
  - Both specs green.
- **Status:** [ ] Pending

---

<a id="sprint-141"></a>

## Sprint 14.1 - On-Device Category Suggestion

**Epic:** M14 - AI-Native Insights (On-Device First) - **Horizon:** 4 - **Priority:** P2 - **Effort:** L - **Story points:** 13

**Sprint goal:** Users see a suggested category as they type, computed entirely on-device; nothing leaves the workspace.

### T-14.1.1 - `src/lib/ai/categorySuggestion.ts`

- **Task ID:** T-14.1.1
- **Sprint:** Sprint 14.1
- **Epic:** M14 - AI-Native
- **Feature:** AI - Category
- **Description:** New module using k-nearest-neighbors on TF-IDF vectors over user's own history; no network.
- **Business Value:** Faster entry.
- **Technical Value:** Simple, explainable model.
- **Priority:** P2
- **Impact:** High
- **Effort:** M
- **Dependencies:** None
- **Affected Files:** `src/lib/ai/categorySuggestion.ts` (new)
- **Acceptance Criteria:**
  - Top-1 accuracy >= 70% on user's last 100 expenses in fixture.
- **Status:** [ ] Pending

### T-14.1.2 - `useCategorySuggestion` hook

- **Task ID:** T-14.1.2
- **Sprint:** Sprint 14.1
- **Epic:** M14 - AI-Native
- **Feature:** AI - Hook
- **Description:** New `src/hooks/useCategorySuggestion.ts` returning `{ suggestion, confidence, source: 'ai' }` from the worker.
- **Business Value:** React-idiomatic consumption.
- **Technical Value:** Reuses worker pattern from M9.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-14.1.1, T-9.1.2
- **Affected Files:** `src/hooks/useCategorySuggestion.ts` (new)
- **Acceptance Criteria:**
  - Hook cancels on unmount.
- **Status:** [ ] Pending

### T-14.1.3 - Wire into `ExpenseForm`

- **Task ID:** T-14.1.3
- **Sprint:** Sprint 14.1
- **Epic:** M14 - AI-Native
- **Feature:** AI - UI
- **Description:** Show inline chip with suggestion + "accept" button in `ExpenseForm`; discovery visible only after 20+ expenses.
- **Business Value:** Users experience the assist naturally.
- **Technical Value:** Additive to existing form.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-14.1.2
- **Affected Files:** [src/components/expenses/ExpenseForm.tsx](../src/components/expenses/ExpenseForm.tsx)
- **Acceptance Criteria:**
  - Chip meets contrast + touch-target rules.
- **Status:** [ ] Pending

### T-14.1.4 - Opt-out toggle

- **Task ID:** T-14.1.4
- **Sprint:** Sprint 14.1
- **Epic:** M14 - AI-Native
- **Feature:** AI - Prefs
- **Description:** Settings toggle to disable AI features (default on), stored in `WorkspaceSettings.aiEnabled`.
- **Business Value:** Users stay in control.
- **Technical Value:** Central kill switch.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-14.1.3
- **Affected Files:** [src/lib/validators.ts](../src/lib/validators.ts), Settings UI
- **Acceptance Criteria:**
  - When off, no AI code paths execute.
- **Status:** [ ] Pending

### T-14.1.5 - Category suggestion tests

- **Task ID:** T-14.1.5
- **Sprint:** Sprint 14.1
- **Epic:** M14 - AI-Native
- **Feature:** AI - Tests
- **Description:** Add `src/__tests__/ai.categorySuggestion.test.ts` covering top-1 accuracy and privacy (no network).
- **Business Value:** Locks quality bar.
- **Technical Value:** Regression net.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-14.1.3
- **Affected Files:** `src/__tests__/ai.categorySuggestion.test.ts` (new)
- **Acceptance Criteria:**
  - Spec green; explicitly asserts zero fetch calls in test.
- **Status:** [ ] Pending

---

<a id="sprint-142"></a>

## Sprint 14.2 - Natural-Language Filter Bar

**Epic:** M14 - AI-Native Insights - **Horizon:** 4 - **Priority:** P2 - **Effort:** M - **Story points:** 8

**Sprint goal:** Users filter with plain-English queries mapped to structured filters via a small deterministic parser (no LLM).

### T-14.2.1 - `nlFilter.ts` parser

- **Task ID:** T-14.2.1
- **Sprint:** Sprint 14.2
- **Epic:** M14 - AI-Native
- **Feature:** AI - NL
- **Description:** New `src/lib/ai/nlFilter.ts` mapping tokens like `"under 100"`, `"last month"`, `"food"` to typed filter object.
- **Business Value:** Faster power-user filtering.
- **Technical Value:** Deterministic + testable; no external dependency.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** M
- **Dependencies:** None
- **Affected Files:** `src/lib/ai/nlFilter.ts` (new)
- **Acceptance Criteria:**
  - Parser covers >= 15 phrase patterns.
- **Status:** [ ] Pending

### T-14.2.2 - `NlFilterBar` component

- **Task ID:** T-14.2.2
- **Sprint:** Sprint 14.2
- **Epic:** M14 - AI-Native
- **Feature:** AI - UI
- **Description:** New `src/components/expenses/NlFilterBar.tsx` with chip-based preview of parsed filters.
- **Business Value:** Transparent power feature.
- **Technical Value:** Reuses existing filter store.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-14.2.1
- **Affected Files:** `src/components/expenses/NlFilterBar.tsx` (new)
- **Acceptance Criteria:**
  - Keyboard operable; contract test green.
- **Status:** [ ] Pending

### T-14.2.3 - Save NL filter as preset

- **Task ID:** T-14.2.3
- **Sprint:** Sprint 14.2
- **Epic:** M14 - AI-Native
- **Feature:** AI - Presets
- **Description:** Save NL query as a preset in `src/stores/filterStore.ts` (new).
- **Business Value:** Repeat queries in one tap.
- **Technical Value:** Standard preset extension.
- **Priority:** P2
- **Impact:** Low
- **Effort:** XS
- **Dependencies:** T-14.2.2
- **Affected Files:** `src/stores/filterStore.ts` (new)
- **Acceptance Criteria:**
  - Preset roundtrip test passes.
- **Status:** [ ] Pending

### T-14.2.4 - NL filter parser tests

- **Task ID:** T-14.2.4
- **Sprint:** Sprint 14.2
- **Epic:** M14 - AI-Native
- **Feature:** AI - Tests
- **Description:** Add `src/__tests__/ai.nlFilter.test.ts` with the 15 phrase patterns.
- **Business Value:** Locks parser quality.
- **Technical Value:** Regression net.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-14.2.1
- **Affected Files:** `src/__tests__/ai.nlFilter.test.ts` (new)
- **Acceptance Criteria:**
  - Spec green; parser cases documented.
- **Status:** [ ] Pending

### T-14.2.5 - Discoverability nudge

- **Task ID:** T-14.2.5
- **Sprint:** Sprint 14.2
- **Epic:** M14 - AI-Native
- **Feature:** AI - Onboarding
- **Description:** Small hint tooltip on expenses page once user reaches 50 expenses.
- **Business Value:** Users discover the feature naturally.
- **Technical Value:** Standard discovery pattern.
- **Priority:** P3
- **Impact:** Low
- **Effort:** XS
- **Dependencies:** T-14.2.2
- **Affected Files:** `src/components/expenses/NlFilterBar.tsx`, [src/hooks/useOnboardingHints](../src/hooks/)
- **Acceptance Criteria:**
  - Nudge dismissible; never re-shows.
- **Status:** [ ] Pending

---

<a id="sprint-143"></a>

## Sprint 14.3 - Anomaly Explanations & AI Session Wrap

**Epic:** M14 - AI-Native Insights - **Horizon:** 4 - **Priority:** P2 - **Effort:** M - **Story points:** 8

**Sprint goal:** Every anomaly has a human-readable reason; wrap Horizon 4 with a review pass and final KPIs.

### T-14.3.1 - Anomaly reason taxonomy

- **Task ID:** T-14.3.1
- **Sprint:** Sprint 14.3
- **Epic:** M14 - AI-Native
- **Feature:** AI - Anomaly
- **Description:** Enumerate reasons: `envelope-over`, `merchant-outlier`, `category-outlier`, `weekly-spike`, `recurring-drift`, `new-merchant`; stored in `src/lib/anomalyDetection.ts` (new).
- **Business Value:** Users understand every alert.
- **Technical Value:** Structured taxonomy for future ML.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-8.2.3
- **Affected Files:** `src/lib/anomalyDetection.ts` (new)
- **Acceptance Criteria:**
  - Taxonomy documented in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- **Status:** [ ] Pending

### T-14.3.2 - `AnomalyExplanation` component

- **Task ID:** T-14.3.2
- **Sprint:** Sprint 14.3
- **Epic:** M14 - AI-Native
- **Feature:** AI - UI
- **Description:** New `src/components/analytics/AnomalyExplanation.tsx` rendering reason + comparable historic value + dismiss action.
- **Business Value:** Actionable explanation.
- **Technical Value:** Reusable pattern for future insight cards.
- **Priority:** P2
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-14.3.1
- **Affected Files:** `src/components/analytics/AnomalyExplanation.tsx` (new)
- **Acceptance Criteria:**
  - Contract test asserts a11y; dismiss reversible.
- **Status:** [ ] Pending

### T-14.3.3 - Feedback loop

- **Task ID:** T-14.3.3
- **Sprint:** Sprint 14.3
- **Epic:** M14 - AI-Native
- **Feature:** AI - Feedback
- **Description:** Users can mark an anomaly as `useful` or `noise`; feedback stored locally to tune future detection thresholds.
- **Business Value:** Improves precision over time.
- **Technical Value:** Local learning loop; no network.
- **Priority:** P2
- **Impact:** Medium
- **Effort:** S
- **Dependencies:** T-14.3.2
- **Affected Files:** `src/lib/anomalyDetection.ts` (new), `src/stores/settingsStore.ts` (new)
- **Acceptance Criteria:**
  - Feedback persisted and honored on next run.
- **Status:** [ ] Pending

### T-14.3.4 - Final KPI review

- **Task ID:** T-14.3.4
- **Sprint:** Sprint 14.3
- **Epic:** M14 - AI-Native
- **Feature:** Ops - Review
- **Description:** Compile a final KPI report from [PROJECT_MASTER_PLAN section 15](PROJECT_MASTER_PLAN.md); log gaps as new items in this queue.
- **Business Value:** Explicit end-state accounting.
- **Technical Value:** Feeds next planning cycle.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** All prior sprints
- **Affected Files:** `sprint-reports/final-report.md` (new)
- **Acceptance Criteria:**
  - Report references every KPI with pass/fail.
- **Status:** [ ] Pending

---

<a id="sprint-151"></a>

## Sprint 15.1 - Author Product Experience Family & Extend Anchor Docs

**Epic:** M15 - UI Foundation (Product Experience Documentation) - **Horizon:** 1 - **Priority:** P1 - **Effort:** M - **Story points:** 8

**Sprint goal:** Land the three new Product Experience documents, the five approved in-place doc extensions, and the two prompt-layer updates from the [UI Foundation Audit](../sprint-reports/UI_FOUNDATION_AUDIT.md). Documentation-only sprint - **no `src/` file is modified**.

### T-15.1.1 - Create EXPERIENCE_VISION.md

- **Task ID:** T-15.1.1
- **Sprint:** Sprint 15.1
- **Epic:** M15 - UI Foundation (Product Experience Documentation)
- **Feature:** Docs - Product Experience family
- **Description:** Author [docs/EXPERIENCE_VISION.md](EXPERIENCE_VISION.md): the north-star product experience narrative, Six Qualities of a Premium Finance Surface, benchmark qualities (extracted, never copied), anti-patterns refused, and the mandatory Product-Experience 18-question set from the [UI Foundation Audit](../sprint-reports/UI_FOUNDATION_AUDIT.md) §11.
- **Business Value:** Gives every future designer + AI agent a single narrative to write toward. Prevents drift from the "premium finance" positioning.
- **Technical Value:** Closes the "Experience Vision" and "Premium Fintech UX" coverage gaps from the audit.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** UI Foundation Audit approval.
- **Affected Files:** [docs/EXPERIENCE_VISION.md](EXPERIENCE_VISION.md)
- **Acceptance Criteria:**
  - Answers all 18 Product-Experience questions (why, problem, business value, product value, user mindset, emotional goal, user journey, loading, empty, error, offline, accessibility, motion, information hierarchy, interaction philosophy, design rationale, future evolution, common implementation mistakes).
  - Cites [PRODUCT_PRINCIPLES §7.5](PRODUCT_PRINCIPLES.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); does not restate their content.
  - No visual designs, screenshots, or component code.
- **Status:** [x] Done (2026-07-24)

### T-15.1.2 - Create SCREEN_GUIDELINES.md

- **Task ID:** T-15.1.2
- **Sprint:** Sprint 15.1
- **Epic:** M15 - UI Foundation (Product Experience Documentation)
- **Feature:** Docs - Product Experience family
- **Description:** Author [docs/SCREEN_GUIDELINES.md](SCREEN_GUIDELINES.md): one entry per top-level screen (Dashboard, Expenses, Analytics, Business, Category, Settings, Login, Landing) with Purpose, Canonical composition, Five states (empty / loading / error / offline / success), and Owning UX-N.N + DS references. Includes the mandatory Product-Experience 18-question set.
- **Business Value:** Every screen decision is now traceable to a single specification instead of being reconstructed from three docs.
- **Technical Value:** Closes "Screen Guidelines" audit gap.
- **Priority:** P1
- **Impact:** High
- **Effort:** M
- **Dependencies:** T-15.1.1 (Experience Vision anchor).
- **Affected Files:** [docs/SCREEN_GUIDELINES.md](SCREEN_GUIDELINES.md)
- **Acceptance Criteria:**
  - Covers every screen listed above with all four sub-headings.
  - Cites [UX_DECISIONS.md](UX_DECISIONS.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) precedents rather than restating them.
  - Each screen carries an implementation-status marker (Aspirational / Partially implemented / Implemented).
- **Status:** [x] Done (2026-07-24)

### T-15.1.3 - Create FINANCIAL_PSYCHOLOGY.md

- **Task ID:** T-15.1.3
- **Sprint:** Sprint 15.1
- **Epic:** M15 - UI Foundation (Product Experience Documentation)
- **Feature:** Docs - Product Experience family
- **Description:** Author [docs/FINANCIAL_PSYCHOLOGY.md](FINANCIAL_PSYCHOLOGY.md): one entry per money-related cognitive bias with fields Bias / Where it appears in personal finance / How competitors typically exploit it / Our guardrail / Our anti-pattern. Includes the mandatory Product-Experience 18-question set and the explicit non-goal statement.
- **Business Value:** Prevents ExpenStream from ever shipping a dark-pattern nudge. Preserves the "premium, calm, honest" positioning.
- **Technical Value:** Closes "Financial Psychology" and "Behavioral Design" audit gaps.
- **Priority:** P1
- **Impact:** High
- **Effort:** S
- **Dependencies:** T-15.1.1.
- **Affected Files:** [docs/FINANCIAL_PSYCHOLOGY.md](FINANCIAL_PSYCHOLOGY.md)
- **Acceptance Criteria:**
  - Opens with the explicit non-goal: "This document exists so we design *against* these biases, not with them."
  - Covers anchoring, loss aversion, mental accounting, present bias, financial shame, notification anxiety, envelope bias at minimum.
  - Every entry lists the anti-pattern we refuse.
- **Status:** [x] Done (2026-07-24)

### T-15.1.4 - Extend PRODUCT_PRINCIPLES with §7.5 and §7.6

- **Task ID:** T-15.1.4
- **Sprint:** Sprint 15.1
- **Epic:** M15
- **Feature:** Docs - Doctrine anchors
- **Description:** Add §7.5 Emotional design commitments and §7.6 Financial-psychology guardrails to [docs/PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md). Both subsections cite the new Product Experience docs and do not duplicate them.
- **Business Value:** Doctrine now names the emotional + psychological posture the app must keep.
- **Technical Value:** Anchors the new docs so they never become the sole source of truth for principles.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** None (in-place extension).
- **Affected Files:** [docs/PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md)
- **Acceptance Criteria:**
  - §7.5 and §7.6 exist, are additive (no existing content removed), and reference `EXPERIENCE_VISION.md` and `FINANCIAL_PSYCHOLOGY.md` respectively.
- **Status:** [x] Done (2026-07-24)

### T-15.1.5 - Extend PROJECT_MASTER_PLAN §7 with emotional arcs

- **Task ID:** T-15.1.5
- **Sprint:** Sprint 15.1
- **Epic:** M15
- **Feature:** Docs - PRD journeys
- **Description:** Add one *primary emotion arc* sub-bullet (start → mid → end) to each of §7.1 - §7.6 in [docs/PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md). No new journeys, no restructure.
- **Business Value:** Journeys are now testable for feeling, not only for steps.
- **Technical Value:** Provides the acceptance surface for `SCREEN_GUIDELINES.md` per-screen feeling promises.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** None.
- **Affected Files:** [docs/PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md)
- **Acceptance Criteria:**
  - Every subsection under §7 carries exactly one emotion-arc bullet.
  - The arcs cross-link to `EXPERIENCE_VISION.md` and `SCREEN_GUIDELINES.md`.
- **Status:** [x] Done (2026-07-24)

### T-15.1.6 - Extend DESIGN_SYSTEM with §22 UI Evolution & Versioning

- **Task ID:** T-15.1.6
- **Sprint:** Sprint 15.1
- **Epic:** M15
- **Feature:** Docs - Design system
- **Description:** Append §22 UI Evolution & Versioning to [docs/DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) covering versioning model, propose / deprecate / remove flow, sensitivity rules for motion / elevation / typography, and cross-references. Absorbs the audit's "UI Evolution" gap without creating a separate doc.
- **Business Value:** Design system can evolve safely; drift becomes expensive.
- **Technical Value:** Anchors the deprecation contract that governs tokens and components.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** None.
- **Affected Files:** [docs/DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- **Acceptance Criteria:**
  - §22 exists with the six subsections defined in the audit (versioning, proposing, deprecating, sensitive families, cross-references, scope).
  - Existing §§0-21 unchanged apart from the `Last reviewed` footer.
- **Status:** [x] Done (2026-07-24)

### T-15.1.7 - Update AI_AGENT_HANDBOOK map + read order + prompts of record

- **Task ID:** T-15.1.7
- **Sprint:** Sprint 15.1
- **Epic:** M15
- **Feature:** Docs - Agent navigation
- **Description:** Update §1 Repository memory layout, §2 Canonical read order, §8 Prompts of record, and §9 Change history in [docs/AI_AGENT_HANDBOOK.md](AI_AGENT_HANDBOOK.md) so future agents load the new docs at the positions the audit §6 specifies.
- **Business Value:** Agent bootstraps land on the new docs by default.
- **Technical Value:** Prevents the new docs from being invisible to agents that follow the handbook literally.
- **Priority:** P1
- **Impact:** High
- **Effort:** XS
- **Dependencies:** T-15.1.1 - T-15.1.3.
- **Affected Files:** [docs/AI_AGENT_HANDBOOK.md](AI_AGENT_HANDBOOK.md)
- **Acceptance Criteria:**
  - Memory-layout tree lists the three new docs.
  - Canonical read order includes them at the audit-specified positions.
  - Conflict-resolution order is unchanged and restated.
  - `UI_FOUNDATION_AUDIT` prompt is listed as a prompt of record.
- **Status:** [x] Done (2026-07-24)

### T-15.1.8 - Extend STANDARD_HEADER STEP 1 doc list

- **Task ID:** T-15.1.8
- **Sprint:** Sprint 15.1
- **Epic:** M15
- **Feature:** Prompts - Standard header
- **Description:** Add `EXPERIENCE_VISION.md`, `SCREEN_GUIDELINES.md`, and `FINANCIAL_PSYCHOLOGY.md` to STEP 1 of [prompts/STANDARD_HEADER.md](../prompts/STANDARD_HEADER.md). Pre-existing bogus doc references (COMPONENT_LIBRARY.md, PERFORMANCE_GUIDELINES.md, SECURITY_GUIDELINES.md, API_SPECIFICATION.md, DATABASE_SCHEMA.md) are **out of scope** per audit §7.1 - they are tracked separately.
- **Business Value:** Sprint-executing agents load the Product Experience family by default.
- **Technical Value:** Prompt-layer consistency with `AI_AGENT_HANDBOOK.md §2`.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-15.1.1 - T-15.1.3.
- **Affected Files:** [prompts/STANDARD_HEADER.md](../prompts/STANDARD_HEADER.md)
- **Acceptance Criteria:**
  - STEP 1 lists the three new docs.
  - A caveat clarifies they sit in "remaining documentation" for conflict resolution.
  - Conflict-resolution priority order (§ IMPLEMENTATION_RULES → DESIGN_SYSTEM → UX_DECISIONS → PROJECT_MASTER_PLAN → remaining) is unchanged.
- **Status:** [x] Done (2026-07-24)

### T-15.1.9 - Extend IMPLEMENT_SPRINT Phase 2 bullets

- **Task ID:** T-15.1.9
- **Sprint:** Sprint 15.1
- **Epic:** M15
- **Feature:** Prompts - Sprint workflow
- **Description:** Add "Experience Vision" and "Screen Guidelines" bullets to the Phase 2 "Understand" list in [prompts/IMPLEMENT_SPRINT.md](../prompts/IMPLEMENT_SPRINT.md) so per-sprint executions consult them alongside the design system.
- **Business Value:** Ensures every sprint respects the target feeling and per-screen composition.
- **Technical Value:** Closes the audit §7.3 gap.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-15.1.1, T-15.1.2.
- **Affected Files:** [prompts/IMPLEMENT_SPRINT.md](../prompts/IMPLEMENT_SPRINT.md)
- **Acceptance Criteria:**
  - Both bullets present in Phase 2 with correct paths.
  - No other Phase 2 content removed.
- **Status:** [x] Done (2026-07-24)

### T-15.1.10 - Generate UI_FOUNDATION_IMPLEMENTATION.md report

- **Task ID:** T-15.1.10
- **Sprint:** Sprint 15.1
- **Epic:** M15
- **Feature:** Sprint reports
- **Description:** Produce [sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md](../sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md) covering Files created, Files updated, Cross references, Prompt changes, Reading order, Integration summary.
- **Business Value:** A closing artefact that reviewers and future agents can read to understand what shipped in the UI Foundation milestone.
- **Technical Value:** Companion to the audit report; preserves execution history.
- **Priority:** P1
- **Impact:** Medium
- **Effort:** XS
- **Dependencies:** T-15.1.1 - T-15.1.9.
- **Affected Files:** `sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md` (new)
- **Acceptance Criteria:**
  - Sections listed above are all present.
  - No `src/` file is listed.
  - Cross-links to `UI_FOUNDATION_AUDIT.md`.
- **Status:** [x] Done (2026-07-24)

---

<a id="roll-up--traceability"></a>

## Roll-Up & Traceability

### Master task index (by sprint)

| Sprint    | Title                                                | Tasks   | P0     | P1     | P2     | P3    |
| --------- | ---------------------------------------------------- | ------- | ------ | ------ | ------ | ----- |
| 1.1       | Documentation Foundation                             | 6       | 2      | 3      | 1      | 0     |
| 1.2       | Docs cross-linking + master plan freeze              | 5       | 0      | 4      | 1      | 0     |
| 2.1       | Sync Instrumentation & Conflict Reproduction         | 4       | 1      | 2      | 1      | 0     |
| 2.2       | Persistent Mutation Queue & Guaranteed-Once Delivery | 5       | 4      | 1      | 0      | 0     |
| 2.3       | Deterministic Conflict UX & Monetary Math Audit      | 7       | 7      | 0      | 0      | 0     |
| 3.1       | Server Scheduler, Retries & Dead-Letter              | 6       | 0      | 6      | 0      | 0     |
| 3.2       | Quiet Hours, Timezone Correctness & Ops Dashboard    | 6       | 0      | 6      | 0      | 0     |
| 4.1       | Contract Template & CI Enforcement                   | 4       | 4      | 0      | 0      | 0     |
| 4.2       | Chart Text Alternatives & A11y Audit Pass            | 5       | 5      | 0      | 0      | 0     |
| 5.1       | Dependency Automation & CVE SLA                      | 4       | 2      | 2      | 0      | 0     |
| 5.2       | Session Anomaly Surface & Audit Coverage Expansion   | 6       | 1      | 4      | 1      | 0     |
| 5.3       | CSP Tightening, `server-only`, RLS Smoke             | 5       | 5      | 0      | 0      | 0     |
| 5.4       | Encryption Key Rotation                              | 5       | 0      | 5      | 0      | 0     |
| 6.1       | Structured Logger & Health Endpoints                 | 4       | 0      | 4      | 0      | 0     |
| 6.2       | Rate-Limit Backend & Bundle Budgets                  | 4       | 0      | 4      | 0      | 0     |
| 7.1       | Reminders Schema & Overdue Tiers                     | 5       | 0      | 5      | 0      | 0     |
| 7.2       | Reminder UI, Metrics & Business Analytics            | 6       | 0      | 3      | 3      | 0     |
| 8.1       | Envelope Schema & Editor                             | 5       | 0      | 4      | 1      | 0     |
| 8.2       | Envelope Surfaces & Anomaly Integration              | 5       | 0      | 5      | 0      | 0     |
| 9.1       | Analytics Web Worker & Query Hook                    | 5       | 0      | 5      | 0      | 0     |
| 9.2       | Streaming Sync & Cache-Control                       | 5       | 0      | 5      | 0      | 0     |
| 10.1      | Repositories & API Types                             | 5       | 0      | 0      | 5      | 0     |
| 10.2      | Vertical Feature Slices                              | 4       | 0      | 0      | 4      | 0     |
| 11.1      | Automated Purge & Backup Verification                | 4       | 2      | 2      | 0      | 0     |
| 11.2      | Encrypted Archive Export/Import                      | 5       | 0      | 4      | 1      | 0     |
| 12.1      | iOS Install Sheet & Web Share Target                 | 4       | 0      | 0      | 4      | 0     |
| 12.2      | Offline Fallback & Maskable Icons                    | 4       | 0      | 0      | 4      | 0     |
| 13.1      | Ledger Portal (Read-Only Client Link)                | 6       | 0      | 0      | 6      | 0     |
| 13.2      | Activity Feed & Merge-Level Redaction                | 5       | 0      | 0      | 5      | 0     |
| 14.1      | On-Device Category Suggestion                        | 5       | 0      | 0      | 5      | 0     |
| 14.2      | Natural-Language Filter Bar                          | 5       | 0      | 0      | 4      | 1     |
| 14.3      | Anomaly Explanations & AI Session Wrap               | 4       | 0      | 1      | 3      | 0     |
| **Total** | 32 sprints across 14 milestones                      | **158** | **33** | **79** | **45** | **1** |

### Epic -> Sprint coverage

| Epic                             | Sprints            | Task IDs           |
| -------------------------------- | ------------------ | ------------------ |
| M1 Documentation Foundation      | 1.1, 1.2           | T-1.1.1..T-1.2.5   |
| M2 Sync Engine Reliability       | 2.1, 2.2, 2.3      | T-2.1.1..T-2.3.7   |
| M3 Notification UX Hardening     | 3.1, 3.2           | T-3.1.1..T-3.2.6   |
| M4 Accessibility Contracts       | 4.1, 4.2           | T-4.1.1..T-4.2.5   |
| M5 Security & Compliance         | 5.1, 5.2, 5.3, 5.4 | T-5.1.1..T-5.4.5   |
| M6 Observability & Ops           | 6.1, 6.2           | T-6.1.1..T-6.2.4   |
| M7 Business Ledger Enhancements  | 7.1, 7.2           | T-7.1.1..T-7.2.6   |
| M8 Envelope Budgeting            | 8.1, 8.2           | T-8.1.1..T-8.2.5   |
| M9 Performance & Sync Scale      | 9.1, 9.2           | T-9.1.1..T-9.2.5   |
| M10 Modularity & Extension       | 10.1, 10.2         | T-10.1.1..T-10.2.4 |
| M11 Data Lifecycle & Portability | 11.1, 11.2         | T-11.1.1..T-11.2.5 |
| M12 PWA Depth & Native Feel      | 12.1, 12.2         | T-12.1.1..T-12.2.4 |
| M13 Collaboration & Multi-actor  | 13.1, 13.2         | T-13.1.1..T-13.2.5 |
| M14 AI-Native Insights           | 14.1, 14.2, 14.3   | T-14.1.1..T-14.3.4 |

### PRD traceability (from [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md))

| PRD ref                | Description                         | Task IDs                  |
| ---------------------- | ----------------------------------- | ------------------------- |
| PRD M1 (Docs)          | Living documentation baseline       | T-1.1.1..T-1.2.5          |
| PRD M2 (Sync)          | Sync engine reliability             | T-2.1.1..T-2.3.7          |
| PRD M3 (Notifications) | Server-scheduled reminders          | T-3.1.1..T-3.2.6          |
| PRD M4 (A11y)          | WCAG 2.2 AA baseline                | T-4.1.1..T-4.2.5          |
| PRD M5 (Security)      | Continuous security posture         | T-5.1.1..T-5.4.5          |
| PRD M6 (Observability) | Central logger + health probes      | T-6.1.1..T-6.2.4          |
| PRD M7 (Business)      | Overdue tiers + reminders + exports | T-7.1.1..T-7.2.6          |
| PRD M8 (Envelopes)     | Envelope budgeting                  | T-8.1.1..T-8.2.5          |
| PRD FR-BUD-02          | Envelope caps + rollover            | T-8.1.1, T-8.1.3, T-8.2.4 |
| PRD FR-BL-04           | Per-ledger reminders                | T-7.2.1..T-7.2.2          |
| PRD FR-BL-05           | Overdue tier chip                   | T-7.1.1..T-7.1.2          |
| PRD FR-AN-03           | Business analytics                  | T-7.2.4..T-7.2.5          |
| PRD FR-DATA-04         | Data purge SLA                      | T-11.1.1..T-11.1.4        |
| PRD FR-DATA-05         | Portable encrypted archive          | T-11.2.1..T-11.2.5        |
| PRD section 17.1-17.4  | Horizon KPI framework               | T-14.3.4 (final review)   |

### Technical-debt traceability

| TD ref | Description                     | Resolved by      |
| ------ | ------------------------------- | ---------------- |
| TD-1   | Empty doc files                 | T-1.1.2..T-1.1.6 |
| TD-3   | Money field float drift         | T-2.3.4..T-2.3.7 |
| TD-4   | Client-only reminder scheduling | T-3.1.1..T-3.1.6 |
| TD-6   | Missing chart text alternatives | T-4.2.1..T-4.2.4 |
| TD-7   | Manual dependency updates       | T-5.1.1..T-5.1.4 |
| TD-8   | Sparse audit coverage           | T-5.2.1..T-5.2.6 |
| TD-9   | Raw arithmetic on money         | T-2.3.4..T-2.3.6 |
| TD-11  | Rate-limit backend hard-coded   | T-6.2.1..T-6.2.2 |

### Risk coverage

| Risk | Description                     | Mitigating tasks           |
| ---- | ------------------------------- | -------------------------- |
| R-1  | Silent mutation loss            | T-2.2.1..T-2.2.5           |
| R-2  | Cross-workspace RLS leak        | T-5.3.3..T-5.3.4, T-11.1.3 |
| R-3  | XSS via inline scripts          | T-5.3.2                    |
| R-4  | Unpatched CVEs                  | T-5.1.1..T-5.1.4           |
| R-5  | Float rounding across analytics | T-2.3.4..T-2.3.7           |
| R-6  | Missed push deliveries          | T-3.1.1..T-3.2.6           |
| R-7  | Money-field silent overwrites   | T-2.3.1..T-2.3.3           |
| R-8  | PII/money in logs               | T-6.1.1..T-6.1.4           |
| R-9  | A11y regressions                | T-4.1.1..T-4.2.5           |
| R-10 | Key compromise without rotation | T-5.4.1..T-5.4.5           |
| R-11 | Export inconsistency vs UI      | T-7.1.3                    |
| R-12 | PWA install friction            | T-12.1.1..T-12.1.3         |
| R-13 | Timezone mistakes               | T-3.2.4, T-3.2.3           |

### Architecture-section traceability (from [ARCHITECTURE.md](ARCHITECTURE.md))

| Section | Topic                            | Tasks              |
| ------- | -------------------------------- | ------------------ |
| 18.1    | Deterministic conflict semantics | T-2.3.1..T-2.3.3   |
| 18.3    | Guaranteed-once sync             | T-2.2.3            |
| 18.4    | Strict CSP                       | T-5.3.2            |
| 18.6    | Repository seam                  | T-10.1.1..T-10.1.5 |
| 18.7    | Streaming sync                   | T-9.2.1..T-9.2.2   |
| 18.8    | Persistent mutation queue        | T-2.2.1..T-2.2.2   |
| 18.10   | Cache-Control policy             | T-9.2.3..T-9.2.4   |
| 18.11   | Rate-limit backend abstraction   | T-6.2.1..T-6.2.2   |
| 18.13   | Analytics off main thread        | T-9.1.1..T-9.1.5   |
| 18.14   | Health/ready probes              | T-6.1.3            |
| 18.15   | Structured logger                | T-6.1.1..T-6.1.4   |
| 18.16   | `server-only` boundary           | T-5.3.1, T-5.3.5   |
| 18.17   | Bundle-size budgets              | T-6.2.3..T-6.2.4   |
| 18.20   | RLS smoke workflow               | T-5.3.3..T-5.3.4   |
| 18.21   | Key rotation                     | T-5.4.1..T-5.4.5   |

### Execution notes

- Task IDs are stable and never renumbered.
- Status transitions are single-writer: only the engineer executing a task updates its status.
- New tasks discovered mid-sprint are appended at `T-<sprint>.<n+1>` with justification in the commit message.
- Every merged PR must reference at least one Task ID.
- Roll-up counts must match reality; refresh this section at the end of each sprint.
- This queue is the source of truth: if [SPRINT_BOARD.md](SPRINT_BOARD.md), [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md), or [ARCHITECTURE.md](ARCHITECTURE.md) disagree, this file wins for execution ordering.

---


---

**Last reviewed:** 2026-07-23