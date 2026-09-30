<!--
  SPRINT_1_SUMMARY.md — Sprint 1 execution report for ExpenStream
  Owner: AI Engineering Team
  Audience: Product + Engineering leadership, contributing engineers, AI agents.
  Companion docs: prompts/STANDARD_HEADER.md, docs/SPRINT_BOARD.md,
                  docs/IMPLEMENTATION_QUEUE.md, docs/CHANGELOG.md.
  Rule: Sprint 1 is documentation-only. No application source code was modified.
-->

# ExpenStream — Sprint 1 Summary

**Status:** Complete · **Version:** 1.0 · **Date:** 2026-07-23 · **Sprint:** 1 (both 1.1 and 1.2) · **Mode:** Documentation-only

Sprint 1 closes **Milestone M1 — Documentation Truth**. It covered Sprint 1.1 (populate empty living docs) and Sprint 1.2 (visual, structural, and repo-hygiene gaps) per the plan in [docs/SPRINT_BOARD.md](../docs/SPRINT_BOARD.md) and the task-level acceptance criteria in [docs/IMPLEMENTATION_QUEUE.md](../docs/IMPLEMENTATION_QUEUE.md). No application source code was modified during Sprint 1.

---

## 1. Executive Summary

Before Sprint 1, four living docs (`CHANGELOG.md`, `RELEASE_NOTES.md`, `PRODUCTION_CHECKLIST.md`, `TESTING_CHECKLIST.md`) were empty scaffolds; two structural artifacts (Mermaid sequence diagrams and an AI agent handbook) were missing; seven legacy Supabase SQL files sat at repo root shadowing Prisma's authority; and there was no Architecture Decision Record framework. Sprint 1 closes all of these.

**Outcome:** any engineer or AI agent can now bootstrap from `docs/` alone. All eleven Sprint 1 tasks (T-1.1.1 – T-1.1.6 and T-1.2.1 – T-1.2.5) are `[x] Done` in [docs/IMPLEMENTATION_QUEUE.md](../docs/IMPLEMENTATION_QUEUE.md). Milestone M1 is marked `Done` on [docs/SPRINT_BOARD.md](../docs/SPRINT_BOARD.md).

Sprint 0's four documented drifts:

- **DRIFT-1** (spec-file count in AI_CONTEXT §15) — untouched; deferred to a follow-up in [Sprint 4.2](../docs/IMPLEMENTATION_QUEUE.md#sprint-42) alongside the accessibility audit pass.
- **DRIFT-2** (missing modules in ARCHITECTURE §11) — untouched; will land with M10 verticalization or a targeted ARCHITECTURE refresh.
- **DRIFT-3** (stray root `.sql`) — **closed** by T-1.2.2 (moved to [`prisma/legacy/`](../prisma/legacy)).
- **DRIFT-4** (empty scaffolds) — **closed** by T-1.1.2 / T-1.1.3 / T-1.1.4 / T-1.1.5.

---

## 2. Features Implemented

No user-visible features. Sprint 1 was documentation-only. Internal deliverables:

- Full CHANGELOG backfilled from `git log` + [`prisma/migrations/`](../prisma/migrations).
- Full user-facing Release Notes reconstructed in the calm editorial voice defined in [AI_CONTEXT.md](../docs/AI_CONTEXT.md).
- Full Production Checklist covering env, DB, auth, third-party, DNS, PWA, perf, a11y, ops, rollback, release artifacts, post-deploy verification.
- Full Testing Checklist mapping every gate to its owning spec file under [`src/__tests__/`](../src/__tests__).
- New Mermaid sequence diagrams in [docs/ARCHITECTURE_DIAGRAMS.md](../docs/ARCHITECTURE_DIAGRAMS.md) for six critical flows.
- New [docs/AI_AGENT_HANDBOOK.md](../docs/AI_AGENT_HANDBOOK.md) — repo memory layout, boot sequence, boundary rules, and standard tool usage for AI agents.
- New ADR framework at [docs/adr/](../docs/adr/) with `0000-template.md` and `0001-postgres-over-firestore.md` retroactively recording the historical decision.
- Root SQL migrations consolidated under [`prisma/legacy/`](../prisma/legacy) with a scoped README.

---

## 3. Files Modified

**Created (new):**

- `docs/ARCHITECTURE_DIAGRAMS.md`
- `docs/AI_AGENT_HANDBOOK.md`
- `docs/adr/0000-template.md`
- `docs/adr/0001-postgres-over-firestore.md`
- `prisma/legacy/README.md`
- `sprint-reports/SPRINT_1_SUMMARY.md` (this file)

**Rewritten (previous content was a scaffold):**

- `docs/CHANGELOG.md`
- `docs/RELEASE_NOTES.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/TESTING_CHECKLIST.md`

**Edited (surgical):**

- `docs/ARCHITECTURE.md` — §8.3 clarified `prisma/migrations/` authority; added footer.
- `docs/PROJECT_MASTER_PLAN.md` — Appendix cross-links updated (removed _pending_ markers, added ADR + Handbook + Queue + Rules + Principles + UX + Diagrams).
- `docs/SPRINT_BOARD.md` — Sprint 1.1 and 1.2 marked `Done`; milestone M1 marked `Done`. Footer added.
- `docs/IMPLEMENTATION_QUEUE.md` — Sprint 1 tasks T-1.1.1 … T-1.2.5 marked `[x] Done (2026-07-23)`. Four aspirational file links converted to backticks. Footer added.
- `docs/IMPLEMENTATION_RULES.md` — relative-link paths corrected (added `../` prefix where the source path was relative to repo root instead of `docs/`). Footer added.
- `docs/PRODUCT_PRINCIPLES.md` — broken external memory link redirected to in-repo references. Footer added.
- `docs/AI_CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_DECISIONS.md` — footers added.

**Relocated (via `git mv`, no content change):**

- `supabase-migration.sql` → `prisma/legacy/supabase-migration.sql`
- `supabase-migration-business.sql` → `prisma/legacy/supabase-migration-business.sql`
- `supabase-migration-device-id.sql` → `prisma/legacy/supabase-migration-device-id.sql`
- `supabase-migration-goals.sql` → `prisma/legacy/supabase-migration-goals.sql`
- `supabase-migration-settings.sql` → `prisma/legacy/supabase-migration-settings.sql`
- `supabase-migration-workspace.sql` → `prisma/legacy/supabase-migration-workspace.sql`
- `supabase-setup.sql` → `prisma/legacy/supabase-setup.sql`

**Untouched:** all of `src/`, `prisma/schema.prisma`, `prisma/migrations/*`, `package.json`, `next.config.ts`, `sentry.*.config.ts`, `firestore.rules` (retained as legacy per [ADR-0001](../docs/adr/0001-postgres-over-firestore.md)), and all runtime config.

---

## 4. Design Improvements

None (documentation-only sprint). No design tokens, motion variants, or components were added or removed. The design system is captured verbatim in [DESIGN_SYSTEM.md](../docs/DESIGN_SYSTEM.md), which was only footer-touched.

---

## 5. UX Improvements

None user-visible. However, the new documentation:

- Encodes the "calm editorial voice" rule for release notes so future contributors don't accidentally introduce guilt-tripping or gamified copy.
- Formalizes the "five states" (empty / loading / error / offline / success) requirement in [TESTING_CHECKLIST §2](../docs/TESTING_CHECKLIST.md), enforceable per PR.

---

## 6. Backend Improvements

None runtime. Migration authority is now explicit and enforceable:

- [`prisma/migrations/001…013`](../prisma/migrations) is the sole authoritative history.
- [`prisma/legacy/`](../prisma/legacy) is provenance-only, called out in [ARCHITECTURE §8.3](../docs/ARCHITECTURE.md), [ADR-0001](../docs/adr/0001-postgres-over-firestore.md), and [PRODUCTION_CHECKLIST §2](../docs/PRODUCTION_CHECKLIST.md).
- Sprint 2+ migration authors now have a canonical "start at `014_*.sql`" rule.

---

## 7. Performance Improvements

None. Performance targets remain those in [PROJECT_MASTER_PLAN §16.2](../docs/PROJECT_MASTER_PLAN.md) and are gated by [PRODUCTION_CHECKLIST §7](../docs/PRODUCTION_CHECKLIST.md) and [TESTING_CHECKLIST §6](../docs/TESTING_CHECKLIST.md).

---

## 8. Accessibility Improvements

None runtime. The accessibility gate is now explicit in [TESTING_CHECKLIST §2 & §5](../docs/TESTING_CHECKLIST.md), pointing at the specific enforcing spec files:

- [`src/__tests__/accessibilityContracts.test.ts`](../src/__tests__/accessibilityContracts.test.ts)
- [`src/__tests__/touchTargets.test.ts`](../src/__tests__/touchTargets.test.ts)
- [`src/__tests__/motionTokens.test.ts`](../src/__tests__/motionTokens.test.ts)
- [`src/__tests__/motionVariants.test.ts`](../src/__tests__/motionVariants.test.ts)

---

## 9. Security Improvements

- **Rollback strategy is now written down** in [PRODUCTION_CHECKLIST §10](../docs/PRODUCTION_CHECKLIST.md) — migration, deploy, and feature-flag rollback paths are explicit.
- **Secret-scan gate** listed in [TESTING_CHECKLIST §8](../docs/TESTING_CHECKLIST.md).
- **RLS smoke** and rate-limit smoke listed in the same section (automation planned in [Sprint 5.3](../docs/IMPLEMENTATION_QUEUE.md#sprint-53)).
- **Firestore legacy artifact** clarified: [ADR-0001](../docs/adr/0001-postgres-over-firestore.md) records why [`firestore.rules`](../firestore.rules) remains at repo root and how RLS via migration [`012`](../prisma/migrations/012_enable_rls_all_tables.sql) replaces it.

---

## 10. Risks

- **DRIFT-1** (spec-file count) and **DRIFT-2** (missing modules in `ARCHITECTURE §11`) remain open. Neither is user-facing nor blocking, but both can mislead an AI agent bootstrapping from the doc. Owner: [Sprint 4.2](../docs/IMPLEMENTATION_QUEUE.md#sprint-42) will re-verify accessibility and architecture surfaces together.
- **Doc-drift risk on this very sprint:** the CHANGELOG and RELEASE_NOTES backfill is retrospective and best-effort. Individual commits remain the ground truth; the historical `[Pre-Sprint 0]` block in CHANGELOG explicitly says so.

---

## 11. Remaining Work

Sprint 1 is complete. Next active sprints per [SPRINT_BOARD.md](../docs/SPRINT_BOARD.md):

- **Sprint 2.1 — Sync Instrumentation & Conflict Reproduction** (Epic M2). First code-touching sprint.
- **Sprint 2.2 — Persistent Mutation Queue & Guaranteed-Once Delivery**.
- **Sprint 2.3 — Deterministic Conflict UX & Monetary Math Audit**.

Per [prompts/STANDARD_HEADER.md §10](../prompts/STANDARD_HEADER.md), Sprint 2 is **not** to be started until the next explicit implementation request.

---

## 12. Known Issues

- **Doc link audit** (T-1.2.5) passes for every doc in `docs/` and every relative link in the ADR folder. The only remaining "planned but not yet existing" references in [IMPLEMENTATION_QUEUE.md](../docs/IMPLEMENTATION_QUEUE.md) are for future sprint deliverables and have been converted to backtick paths (no broken hyperlinks).
- The `Sprint 2 … Sprint 10` scaffolds previously in `docs/CHANGELOG.md` have been removed. Future sprints will append into `[Unreleased]` and get versioned on merge — see the section guide at the bottom of that file.

---

## 13. Testing Recommendations

Sprint 1 shipped no code; no automated test changes are needed. However, the newly-authored [TESTING_CHECKLIST.md](../docs/TESTING_CHECKLIST.md) should be **rehearsed** by the next release captain on a staging build to confirm every gate maps to a real, runnable step. Any gap found becomes a bugfix in Sprint 2.

---

## 14. Suggested Commit Message

```text
docs(m1): complete Sprint 1 — documentation truth + repo hygiene

Sprint 1 closes Milestone M1 by populating every empty living doc,
adding sequence diagrams, introducing the ADR framework, publishing
the AI Agent Handbook, and consolidating stray root SQL under
prisma/legacy/. No application source code was modified.

Sprint 1.1 (T-1.1.1 – T-1.1.6):
- CHANGELOG.md: backfilled from git + migrations, Keep a Changelog format.
- RELEASE_NOTES.md: user-facing highlights per shipped era, calm voice.
- PRODUCTION_CHECKLIST.md: env, DB, RLS, VAPID, Sentry, backups, rollback.
- TESTING_CHECKLIST.md: unit/contract/integration/a11y/perf/security gates.
- PROJECT_MASTER_PLAN.md: Appendix cross-links refreshed; pending markers removed.
- Every docs/*.md now carries a Last reviewed: 2026-07-23 footer.

Sprint 1.2 (T-1.2.1 – T-1.2.5):
- docs/ARCHITECTURE_DIAGRAMS.md: Mermaid sequence diagrams for login+TOTP,
  device-link accept, sync pull, mutation commit, invite accept, push send.
  Every flow labels the guard chain requireAuth → requireWorkspaceMember → checkRateLimit.
- prisma/legacy/: seven root-level supabase-*.sql files relocated (git mv).
- prisma/legacy/README.md: scope + rules.
- docs/AI_AGENT_HANDBOOK.md: repo memory layout, boot sequence, boundary rules.
- docs/adr/0000-template.md: ADR skeleton.
- docs/adr/0001-postgres-over-firestore.md: retroactive record of the
  Postgres-over-Firestore decision; firestore.rules retained as legacy.
- Doc link audit: every relative link across docs/ now resolves.

Closes DRIFT-3, DRIFT-4 (Sprint 0 findings). Milestone M1 marked Done.
No application source modified.
```

---

**Last reviewed:** 2026-07-23
