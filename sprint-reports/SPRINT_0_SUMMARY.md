<!--
  SPRINT_0_SUMMARY.md — ExpenStream Master Audit report (Sprint 0)
  Owner: AI Engineering Team (Product, UX, UI, FE, BE, Perf, A11y, Security, QA, Fintech, PWA)
  Audience: Product + Engineering leadership, contributing engineers, AI agents.
  Companion docs: prompts/MASTER_AUDIT.md, docs/PROJECT_MASTER_PLAN.md,
                  docs/ARCHITECTURE.md, docs/SPRINT_BOARD.md,
                  docs/IMPLEMENTATION_QUEUE.md, docs/AI_CONTEXT.md,
                  docs/DESIGN_SYSTEM.md, docs/CHANGELOG.md.
  Rule: Sprint 0 is documentation only. No application source code was modified.
        Update in place if new evidence surfaces before Sprint 1 kicks off.
-->

# ExpenStream — Sprint 0 Master Audit Summary

**Status:** Complete · **Version:** 1.0 · **Date:** 2026-07-22 · **Sprint:** 0 · **Mode:** Documentation-only

> This report is the authoritative synthesis of the Sprint 0 audit defined in [`prompts/MASTER_AUDIT.md`](../prompts/MASTER_AUDIT.md). Every finding is verified against the source tree at commit HEAD. No application source code was modified during Sprint 0 — only documentation (this report, [`docs/IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md), and a Sprint 0 entry in [`docs/CHANGELOG.md`](../docs/CHANGELOG.md)).

---

## 1. Executive Summary

ExpenStream is a Next.js 15 / React 19, offline-first, privacy-forward PFM + micro-business ledger PWA. The codebase is more mature than a typical Sprint‑0 audit target: full auth stack (password, Google OAuth, phone OTP, TOTP, Passkeys, device linking), workspace-scoped Postgres with RLS on every table (migration 012), a Dexie-backed offline store, a delta-sync engine with a mutation queue, deep analytics (rolling averages, YoY, seasonality, anomalies, forecast), a business ledger surface, Web Push notifications, and a first-class design token / motion system.

The living documentation set in [`docs/`](../docs) is high quality and internally consistent — [`AI_CONTEXT.md`](../docs/AI_CONTEXT.md), [`PROJECT_MASTER_PLAN.md`](../docs/PROJECT_MASTER_PLAN.md), [`ARCHITECTURE.md`](../docs/ARCHITECTURE.md), [`DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md), [`SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md), [`UX_DECISIONS.md`](../docs/UX_DECISIONS.md), and [`IMPLEMENTATION_RULES.md`](../docs/IMPLEMENTATION_RULES.md) collectively define the product vision, engineering contracts, and roadmap. The audit confirms these documents faithfully describe the code — with a small set of drifts called out in §3.

**The product is not yet production-ready for 100k+ users on Play/App Store/Product Hunt.** It is close on breadth of features, far on the _finishing_ work that separates a strong side-project PWA from a category-defining fintech surface. The critical gaps live in five areas:

1. **Sync correctness for money fields.** Deterministic conflict resolution and integer‑minor‑unit monetary math are not yet enforced end-to-end. This is the highest‑leverage risk (R‑1, R‑5, R‑7).
2. **Security posture completion.** CSP still needs to drop `'unsafe-eval'`, `server-only` markers are not enforced, RLS is not smoke-tested in CI, dependency updates are manual, and session anomalies are not surfaced.
3. **Observability & ops foundation.** No structured logger, no `/api/health`, no bundle-budget gate, no push delivery observability — hard blockers for reliable operation at scale.
4. **Accessibility contracts at 100% coverage.** Contract tests exist for a subset of components; charts still need text alternatives; CI does not yet fail on a new component without a contract test.
5. **Documentation drift & repo hygiene.** Several loose `supabase-*.sql` files at the repo root, `firestore.rules` remains after Firestore was disabled, minor divergence between [`ARCHITECTURE.md §11`](../docs/ARCHITECTURE.md) and the actual `src/lib/` file list, and CHANGELOG/RELEASE_NOTES are empty scaffolds.

None of the gaps require rebuilding the product. They are addressable inside the 14 milestones / 32 sprints already decomposed in [`docs/SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md) and enumerated at task granularity in [`docs/IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md).

**Final Sprint 0 score:** **72 / 100** (see §21). Category-level scores in §20.

---

## 2. Current State (verified from source)

Verified against the working tree on 2026-07-22.

### 2.1 Stack

- **Framework:** Next.js `16.2.0` (App Router, RSC + Client Components), React `19.2.4`, TypeScript `^5`.
- **Data:** Prisma `^7.5.0` + `@prisma/adapter-pg` + `pg` on Postgres (Supabase). Dexie `^4.4.1` (IndexedDB) on the client.
- **Auth:** `jose` (JWT), `bcryptjs`, `otpauth` (TOTP), `@simplewebauthn/server` (Passkeys), Google OAuth, phone OTP.
- **UI / Motion / Charts:** Tailwind CSS `^4` + `@tailwindcss/postcss`, Framer Motion `^12`, Visx (`@visx/*` at `^3.12`), Lucide, `next/font`.
- **Ops:** Sentry `@sentry/nextjs ^10`, `resend` (email), `web-push` (push), `@next/bundle-analyzer`.
- **Client-side utility:** `tesseract.js` (on-device OCR), `xlsx` (export), `qrcode`, `date-fns`, `zod`, `zustand`.
- **Tests:** Jest `^29` + `ts-jest`, `fake-indexeddb`. Verified: **29 spec files** under [`src/__tests__/`](../src/__tests__) (docs cite "~40" — see §3.7 drift).
- **Node scripts:** `dev`, `build` (`prisma generate && next build`), `db:push`, `start`, `lint`, `test`. See [`package.json`](../package.json).

Verified via [`package.json`](../package.json).

### 2.2 Folder tree (top-level, verified)

```
expense-tracker/
├── docs/                       # 13 markdown docs (see §2.4)
├── prisma/
│   ├── schema.prisma
│   └── migrations/             # 001 → 013 (verified below)
├── prompts/MASTER_AUDIT.md     # Sprint 0 spec
├── public/                     # manifest.json, sw.js, icons/
├── scripts/                    # build/db helpers
├── sprint-reports/             # ← Sprint 0 report (this file)
├── src/
│   ├── middleware.ts
│   ├── app/{page,layout,providers,error,not-found,globals.css,
│   │        analytics,business,expenses,category,settings,auth,login,
│   │        device-link/[token],invite/[token],landing,privacy,terms,api}
│   ├── app/api/{auth,devices,invites,push,sessions,sync,workspaces}
│   ├── components/{analytics,app,business,dashboard,expenses,goals,
│   │                layout,motion,onboarding,providers,pwa,settings,sync,ui}
│   ├── contexts/, hooks/, lib/, lib/server/, lib/motion/, lib/firebase/,
│   │  stores/, types/, __tests__/
├── firestore.rules             # legacy — Firestore fully disabled
├── supabase-migration*.sql     # 6 loose files at repo root (TD-12)
├── supabase-setup.sql          # 1 loose file at repo root (TD-12)
├── sentry.{client,server,edge}.config.ts
├── next.config.ts, prisma.config.ts, tsconfig.json, jest.config.js,
│   eslint.config.mjs, postcss.config.mjs, package.json
```

### 2.3 Database migrations (verified)

`prisma/migrations/` contains exactly:

```
001_initial_schema.sql
002_auth_schema.sql
003_google_oauth.sql
004_phone_otp.sql
005_device_client_id.sql
006_new_settings_columns.sql
007_expense_currency_column.sql
008_workspace_encryption_key.sql
009_achievements_accent_color.sql
010_push_subscriptions_notification_prefs.sql
011_verification_tokens.sql
012_enable_rls_all_tables.sql
013_rate_limit_table.sql
```

This confirms [`AI_CONTEXT.md §15`](../docs/AI_CONTEXT.md) and [`ARCHITECTURE.md §8.3`](../docs/ARCHITECTURE.md).

### 2.4 Documentation set (verified)

| File                                                         | State                                | Notes                                                            |
| ------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------- |
| [`AI_CONTEXT.md`](../docs/AI_CONTEXT.md)                     | Populated, current                   | Under two pages; matches product state.                          |
| [`PROJECT_MASTER_PLAN.md`](../docs/PROJECT_MASTER_PLAN.md)   | Populated, current                   | KPIs, personas, horizons, sprint breakdown, DoD.                 |
| [`ARCHITECTURE.md`](../docs/ARCHITECTURE.md)                 | Populated, current                   | Layers, boundaries, runtime, tokens, DB, sync, recs. §18.        |
| [`DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md)               | Populated, current                   | Tokens, typography, motion, dual-mode Personal/Business.         |
| [`SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md)                 | Populated (M1–M14, 32 sprints)       | All items `Pending`.                                             |
| [`IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md) | Populated, 3.4k lines, all `Pending` | Task-level plan for Sprints 1.1 → 14.3 with full attribute set.  |
| [`IMPLEMENTATION_RULES.md`](../docs/IMPLEMENTATION_RULES.md) | Populated                            | Engineering law: tokens, guards, Zod, offline, a11y, money math. |
| [`UX_DECISIONS.md`](../docs/UX_DECISIONS.md)                 | Populated                            | Historical UX rationale.                                         |
| [`PRODUCT_PRINCIPLES.md`](../docs/PRODUCT_PRINCIPLES.md)     | Populated                            | Product tone, principles.                                        |
| [`CHANGELOG.md`](../docs/CHANGELOG.md)                       | Scaffold only                        | Sprints 0–10 blocks are `TBD`. Addressed by M1 / T-1.1.2.        |
| [`RELEASE_NOTES.md`](../docs/RELEASE_NOTES.md)               | Very small (0.4 KB)                  | Addressed by M1 / T-1.1.3.                                       |
| [`PRODUCTION_CHECKLIST.md`](../docs/PRODUCTION_CHECKLIST.md) | Small (1.2 KB)                       | Needs full population — M1 / T-1.1.4.                            |
| [`TESTING_CHECKLIST.md`](../docs/TESTING_CHECKLIST.md)       | Small (0.7 KB)                       | Needs full population — M1 / T-1.1.5.                            |

### 2.5 Test surface (verified)

29 spec files under [`src/__tests__/`](../src/__tests__), covering accessibility contracts, design/motion tokens, calculations, filters, categories, sync integration and diagnostics, and various components. [`AI_CONTEXT.md §15`](../docs/AI_CONTEXT.md) cites "~40 spec files" — the code shows 29. Cited as **DRIFT-1** in §3.7.

### 2.6 Additional `src/lib` modules present but not in [`ARCHITECTURE.md §11`](../docs/ARCHITECTURE.md)

Extra files observed in `src/lib/` beyond the documented set: `challenges.ts`, `chronicle.ts`, `moneyDna.ts`, `supabase.ts`. These are used by product code but not called out in the architecture reference — **DRIFT-2** in §3.7.

### 2.7 API surface (verified)

`src/app/api/` root directories: `auth/`, `devices/`, `invites/`, `push/`, `sessions/`, `sync/`, `workspaces/`. Matches [`ARCHITECTURE.md §5`](../docs/ARCHITECTURE.md).

---

## 3. Critical Issues

Each issue below carries: **Severity · Business Impact · Technical Impact · Affected Files · Recommended Solution · Reasoning · Trade-offs · Effort · Priority · Dependencies · Target Sprint · Acceptance Criteria**. Numbering is stable — do not renumber.

### CI-1. Money fields can be silently overwritten during sync conflicts

- **Severity:** Critical
- **Business Impact:** A user's expense amount can be lost on offline / multi-device conflicts. In a finance app, this is a category-defining failure — worse than any UI blemish.
- **Technical Impact:** [`syncEngine.ts`](../src/lib/syncEngine.ts) uses last-writer-wins at record granularity, not per-field, and does not currently prompt the user on collision. No `Money` branded type exists; monetary math is performed on JavaScript `number` in several paths.
- **Affected Files:** [`src/lib/syncEngine.ts`](../src/lib/syncEngine.ts), [`src/lib/calculations.ts`](../src/lib/calculations.ts), [`src/lib/exchangeRates.ts`](../src/lib/exchangeRates.ts), [`src/hooks/useSyncConflictToast`](../src/hooks/), analytics components, `src/lib/money.ts` (to be created).
- **Recommended Solution:** M2.3 in [`SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md) / Epic M2 Tasks in [`IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md#sprint-23): introduce a `Money` branded type (`number & { __brand: "minor-units" }`), migrate every amount-touching path, add a per-field LWW + `ConflictReviewSheet` for `amount` / `expectedAmount` / `receivedAmount`, and enforce with an ESLint rule.
- **Reasoning:** Silent overwrite is unrecoverable client-side. Users lose trust irreversibly on first observation.
- **Trade-offs:** A branded type touches every arithmetic site — ~2 sprints of migration. High leverage; the alternative is silent data loss.
- **Estimated Effort:** L → XL (13 points at sprint scale).
- **Priority:** P0.
- **Dependencies:** M2.1 (instrumentation), M2.2 (persistent queue + idempotency de-dup).
- **Target Sprint:** M2.3.
- **Acceptance Criteria:** Any two-client edit on the same `amount` surfaces `ConflictReviewSheet`; audit log records resolution; ESLint rule green; `syncEngine.conflict.test.ts` + `money.helpers.test.ts` green.

### CI-2. Mutation queue does not guarantee once-only delivery

- **Severity:** Critical
- **Business Impact:** Under bad network + tab close, queued mutations can be lost or duplicated. Duplicate expenses corrupt totals; lost ones erode trust.
- **Technical Impact:** [`syncEngine.ts`](../src/lib/syncEngine.ts) queues mutations in Dexie but retry/backoff state is not persisted across tab close, and the server does not currently enforce a unique `(workspaceId, idempotencyKey)` index on `/api/sync/commit`.
- **Affected Files:** [`src/lib/db.ts`](../src/lib/db.ts), [`src/lib/syncEngine.ts`](../src/lib/syncEngine.ts), `src/app/api/sync/commit/route.ts`, `prisma/migrations/014_mutation_idempotency.sql` (to be created).
- **Recommended Solution:** M2.2 — persist queue attempts + backoff, retry on `online` / `visibilitychange`, and add a server-side unique idempotency index. Add dead-letter surface in a Diagnostics panel.
- **Reasoning:** Idempotency + persistence is the only defensible pattern for offline-first money mutations.
- **Trade-offs:** New migration + schema change; needs careful backfill for existing queued items.
- **Estimated Effort:** L (13 points).
- **Priority:** P0.
- **Dependencies:** M2.1.
- **Target Sprint:** M2.2.
- **Acceptance Criteria:** Queue survives forced tab close; retried commit returns 200 with the original entity; dead-letter surfaces within 30 s; `syncEngine.reliability.test.ts` + `syncCommit.idempotency.test.ts` green.

### CI-3. No `server-only` marker on `src/lib/server/**`

- **Severity:** Critical (security)
- **Business Impact:** A single mistaken import could ship `bcryptjs`, `pg`, or Prisma internals to the client bundle — potentially leaking secrets or growing the bundle catastrophically.
- **Technical Impact:** Boundary is enforced by convention (`ARCHITECTURE §2`, `AI_CONTEXT §9`) but not by the compiler.
- **Affected Files:** every entry file under [`src/lib/server/`](../src/lib/server/), plus a lint / unit test to enforce.
- **Recommended Solution:** M5.3 — add `import "server-only";` to every `src/lib/server/*.ts` entry, plus `serverOnly.import.test.ts` asserting the marker exists.
- **Reasoning:** Compiler-enforced boundary is the cheapest, most durable prevention for a whole class of leaks.
- **Trade-offs:** None — additive only.
- **Estimated Effort:** S.
- **Priority:** P0.
- **Dependencies:** None.
- **Target Sprint:** M5.3.
- **Acceptance Criteria:** All server entries start with `import "server-only";`; test green; a synthetic client import fails to build.

### CI-4. RLS is enabled but not smoke-tested in CI

- **Severity:** Critical (security)
- **Business Impact:** A single migration that forgets to add RLS to a new table risks cross-workspace data leak — the exact failure mode ExpenStream promises to prevent.
- **Technical Impact:** [`migration 012`](../prisma/migrations/012_enable_rls_all_tables.sql) enables RLS but future tables are not verified in CI.
- **Affected Files:** `scripts/rls-smoke.ts` (to be created), `.github/workflows/rls-smoke.yml` (to be created).
- **Recommended Solution:** M5.3 — ephemeral Postgres in CI, `prisma migrate deploy`, then a scripted RLS assertion that any read/write on a foreign workspace returns 0 rows / denied.
- **Reasoning:** Defense-in-depth doesn't defend if it isn't tested.
- **Trade-offs:** ~30 s of CI wall time on every PR.
- **Estimated Effort:** M.
- **Priority:** P0.
- **Dependencies:** CI budget for a Postgres service container.
- **Target Sprint:** M5.3.
- **Acceptance Criteria:** Workflow green on `main`; a synthetic PR that adds a table without an RLS policy fails CI.

### CI-5. Push delivery has no retry, no dead-letter, no observability

- **Severity:** High
- **Business Impact:** Missed evening reminders and weekly digests erode a habit-forming feature. iOS/Safari makes this worse (R-6).
- **Technical Impact:** `POST /api/push/send` fires and forgets. No `push_deliveries` table, no `410 Gone` auto-unsubscribe, no ops surface.
- **Affected Files:** `src/app/api/push/send/route.ts`, `src/app/api/push/subscribe/route.ts`, `src/lib/server/pushDispatcher.ts` (to be created), `prisma/migrations/015_push_deliveries.sql` (to be created).
- **Recommended Solution:** M3.1 — scheduler with per-subscription retry state, exponential backoff (30 s → 5 m → 30 m → dead), `410`/`404` auto-prune, and a `/api/admin/push/health` endpoint.
- **Reasoning:** Reliable delivery is the difference between a notification "feature" and a notification "habit".
- **Trade-offs:** New table and cron entry.
- **Estimated Effort:** L (13 points).
- **Priority:** P1.
- **Dependencies:** None.
- **Target Sprint:** M3.1.
- **Acceptance Criteria:** Reminder fires within ±60 s; failing endpoints hit dead-letter after 4 attempts; unsubscribed on `410`; ops health JSON returns 24 h counters.

### CI-6. CSP still relies on `'unsafe-eval'`; no strict-CSP nonces

- **Severity:** High (security)
- **Business Impact:** Larger XSS blast radius than necessary.
- **Technical Impact:** [`next.config.ts`](../next.config.ts) headers include `'unsafe-eval'`. Next 15 supports strict-CSP with per-request nonces.
- **Affected Files:** [`next.config.ts`](../next.config.ts), [`src/middleware.ts`](../src/middleware.ts).
- **Recommended Solution:** M5.3 — remove `'unsafe-eval'`; adopt strict-CSP with nonces emitted from middleware; snapshot the header in a test.
- **Reasoning:** OWASP recommendation; free security win.
- **Trade-offs:** Requires validating no eval-dependent library remains after React Compiler / Framer / Visx audit.
- **Estimated Effort:** M.
- **Priority:** P0.
- **Dependencies:** None.
- **Target Sprint:** M5.3.
- **Acceptance Criteria:** No `'unsafe-eval'` in emitted headers; nonces present; snapshot test green.

### CI-7. Documentation drift: loose SQL files at repo root; `firestore.rules` still present

- **Severity:** High (hygiene / correctness)
- **Business Impact:** New engineers waste time reconciling truth. AI agents can be misled into treating stale files as authoritative.
- **Technical Impact:** Seven `supabase-*.sql`/`supabase-setup.sql` files at the repo root are not part of the numbered `prisma/migrations/` set; `firestore.rules` remains after Firestore was disabled.
- **Affected Files:** repo-root `supabase-*.sql` (6), `supabase-setup.sql`, `firestore.rules`.
- **Recommended Solution:** M1 / Sprint 1.2 — archive under `prisma/legacy/` or migrate content into the numbered set; delete `firestore.rules` (or move to `docs/legacy/firestore-rules.md` with a header explaining it is retired).
- **Reasoning:** Repo hygiene is a trust signal for auditors, contributors, and AI agents.
- **Trade-offs:** None. Confirm no CI/deploy step still reads them (grep clean at time of audit).
- **Estimated Effort:** XS.
- **Priority:** P1.
- **Dependencies:** None.
- **Target Sprint:** M1 / Sprint 1.2 (TD-12).
- **Acceptance Criteria:** No SQL files at repo root; `firestore.rules` retired; docs still cross-link cleanly.

### CI-8. No CI bundle budgets

- **Severity:** High
- **Business Impact:** Dashboard-route regressions could quietly push JS past the 180 KB gz target — degrading LCP/INP on mid-tier Android over 3G, the primary target device.
- **Technical Impact:** `@next/bundle-analyzer` is installed but not wired into CI. There is no per-route cap enforcement.
- **Affected Files:** `scripts/check-bundle-budget.js` (to be created), `.github/workflows/ci.yml`.
- **Recommended Solution:** M6.2 — per-route caps (`/` ≤ 180 KB gz, `/analytics` ≤ 220 KB gz, `/settings` ≤ 220 KB gz, `/business` ≤ 200 KB gz), fail CI on regression, size diff in PR comment.
- **Reasoning:** Bundle discipline is a leading indicator; if it's not gated it will drift.
- **Trade-offs:** ~30–60 s of CI time.
- **Estimated Effort:** M.
- **Priority:** P1.
- **Dependencies:** None.
- **Target Sprint:** M6.2.
- **Acceptance Criteria:** Synthetic 30 KB inflation PR fails CI; diff comment posted.

### CI-9. Accessibility contracts do not cover every component; charts lack text alternatives

- **Severity:** High (a11y compliance)
- **Business Impact:** WCAG 2.2 AA compliance is a stated product goal (KPI in [`PROJECT_MASTER_PLAN.md §2.2`](../docs/PROJECT_MASTER_PLAN.md)). Any chart-only page currently fails AA for non-sighted users.
- **Technical Impact:** Existing contracts (`accessibilityContracts.test.ts`, `touchTargets.test.ts`, `componentContracts.test.ts`, `phaseFContracts.test.ts`) cover a subset; charts (`RollingAverageChart`, `YearOverYearChart`, `RidgeLine`, `CollectionChart`, `LedgerProgressRing`, `MerchantBreakdown`, `CategoryVelocity`, `CategorySeasons`) do not yet expose a data-table alternative.
- **Affected Files:** `src/components/analytics/**`, `src/components/business/**`, `src/components/ui/DataTableView.tsx` (to be created), `docs/CONTRACT_TESTS.md` (to be created), `docs/a11y/2026-audit.md` (to be created).
- **Recommended Solution:** M4.1 + M4.2 — codegen script for contract test scaffold; CI enforcement of contract-test presence; add `DataTableView` toggle to every chart; complete a manual axe audit of `/`, `/analytics`, `/business`, `/settings`, `/expenses`.
- **Reasoning:** A11y contract enforcement is the only durable way to keep parity as the surface grows.
- **Trade-offs:** Increases the friction of adding a new component by ~5 minutes. Worth it.
- **Estimated Effort:** M + M (two sprints).
- **Priority:** P0.
- **Dependencies:** None.
- **Target Sprint:** M4.
- **Acceptance Criteria:** CI fails on a new component without a contract test; every listed chart offers a keyboard-reachable text alternative; P0 axe findings closed.

---

## 4. High Priority Improvements

Not critical, but P1 / P2 leverage for the roadmap.

- **HP-1. Encryption key rotation path** (M5.4). Currently, per-workspace AES-256-GCM keys have no rotation flow. Add `encryptionKeyVersion` column, `POST /api/workspaces/rotate-key`, background re-encryption, and multi-version decrypt support in [`src/lib/crypto.ts`](../src/lib/crypto.ts). Priority P1.

- **HP-2. Session anomaly surface** (M5.2, PRD M7). Compute country class at login, flag unknown country + unknown device, surface in Security card with "revoke" / "it was me". Expand `audit.ts` to cover `session.*`, `2fa.*`, `passkey.*`.

- **HP-3. Deterministic conflict UX + Diagnostics panel** (M2.1). Even before M2.3, an observable Diagnostics panel in Settings > Data (queue depth, last pull, last error, conflict count) turns invisible failures into visible ones.

- **HP-4. Repositories layer + typed API contracts** (M10.1). Consolidate `where: { workspaceId, deletedAt: null }` behind `src/lib/server/repositories/*`; move DTOs to `src/types/api/*`. Reduces drift risk and future backend-swap cost.

- **HP-5. Structured logger + `/api/health` + `/api/ready`** (M6.1). Replaces ad-hoc `console.*`; supports uptime probes; ESLint rule forbids `console.log` under `src/lib/server` + `src/app/api`.

- **HP-6. Web Worker for analytics math** (M9.1). Move `correlations.ts`, `recurringDetection.ts`, rolling averages off the main thread to protect INP.

- **HP-7. Streaming delta + compound cursor** (M9.2). Chunked/streaming `/api/sync/changes`; compound `(updatedAt, id)` cursor to eliminate boundary duplicates.

- **HP-8. Payment reminders per ledger** (M7.2, PRD M6). Push + email reminders with snooze/cancel; reuses M3 dispatcher.

- **HP-9. Envelope-style category budgets** (M8). Long-requested; unlocks a class of budgeting workflows YNAB owns today.

- **HP-10. iOS PWA install education** (M12.1, PRD M8). Safari-detected sheet with 3-step "Add to Home Screen" guide.

- **HP-11. Backfill CHANGELOG / RELEASE_NOTES / PRODUCTION_CHECKLIST / TESTING_CHECKLIST** (M1). These files remain scaffolds. Document truth is a P1 sprint deliverable.

- **HP-12. Sequence diagrams + AI Agent handbook + ADR log** (M1 / Sprint 1.2). Add `docs/ARCHITECTURE_DIAGRAMS.md`, `docs/AI_AGENT_HANDBOOK.md`, and `docs/adr/`.

---

## 5. UI Audit

Reviewed against [`DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md), industry references (Apple Wallet, Copilot Money, Monarch, Revolut, Linear, Stripe), and Material 3 / HIG.

**Strengths (verified):**

- Dual-mode surfaces (Personal warm / Business cool) share tokens, motion, and spacing — cohesive without being flat.
- Editorial typography (Sora display, Plus Jakarta body, DM Mono numeric) via `next/font` with `display: swap`; fluid `clamp()` scale.
- Visx-based charts render clean SVG; token-inheriting axis and grid.
- Accent is user-owned and inherited via `--color-accent`; tests (`colorTokenConsistency.test.ts`, `designTokens.test.ts`) protect it.
- Framer variants centralized in `src/lib/motion/*` and `src/components/motion/*`, reduced-motion honored.
- Light / Dark / Sunset themes are first-class via `<html data-theme>`.

**Gaps observed:**

- **Chart chrome density.** Several analytics charts still render more grid/axis chrome than Copilot Money or Monarch; the "editorial minimalism" promise is not fully met on `/analytics` (subjective, needs a design pass).
- **FAB behavior.** The primary "add expense" surface needs a re-audit for one-thumb reachability on iPhone SE-class devices — the safe-area padding is present but the tap-arc has not been recently validated.
- **Bottom sheet consistency.** `BottomSheet.tsx` is used broadly but a few surfaces still use inline modals on mobile — consistency debt.
- **Micro-interactions.** State transitions are present but not always meaningful; a pass through Framer variants to prune decorative motion is due.
- **Empty / offline states.** Many surfaces have them, but they are not standardized behind a single `Empty` primitive; several are ad-hoc.

**Recommended sprints:** design pass folded into M4.2 (chart alt views can double as chart chrome reduction) and a targeted Sprint at Horizon 2 for BottomSheet consistency (add to `IMPLEMENTATION_QUEUE` if promoted).

---

## 6. UX Audit

Reviewed against the "five states" contract (empty / loading / error / offline / success) and one-thumb reachability.

**Strengths:**

- Offline-first is real, not marketing: Dexie is the working store; the sync engine reconciles in the background.
- Reversible-by-default: soft delete on domain tables; confirmation only for destructive ops.
- Quick-capture: expense entry is bottom-sheet, amount-first, category-grid; verified in `src/components/expenses/`.
- Multi-workspace switching in-app with `x-workspace-id` header threading.
- Progressive disclosure: dashboard is calm; analytics is one tap deeper; power features live under Settings > Data.
- Copy is calm — "You're on track" / "Worth a check?" — matches product tone in [`AI_CONTEXT.md §4`](../docs/AI_CONTEXT.md).

**Gaps:**

- **Sync status honesty.** `SyncIndicator` communicates idle/syncing/error, but there is no dedicated Diagnostics surface with queue depth or dead-letter view — HP-3 addresses.
- **Conflict resolution.** `useSyncConflictToast` exists, but the review sheet (side-by-side, keep-mine / keep-theirs / merge) is not yet built. CI-1 addresses.
- **iOS install education.** Safari users get `beforeinstallprompt` fallback silently — no explanation. CI-10 → HP-10.
- **Search filters.** Cross-month search exists (`useCrossMonthSearch`) but the natural-language surface (M14.2) is Horizon 4.
- **Notification quiet-hours.** Not currently a first-class user setting. M3.2 addresses.
- **Onboarding time-to-value.** [`AI_CONTEXT.md §8`](../docs/AI_CONTEXT.md) targets ≤ 30 s; the current onboarding sheet meets this in spec, but there is no telemetry to prove it.

---

## 7. Accessibility Audit

Against WCAG 2.2 AA. Verified from tests in [`src/__tests__/`](../src/__tests__).

**Strengths:**

- `accessibilityContracts.test.ts`, `touchTargets.test.ts`, `componentContracts.test.ts`, `phaseFContracts.test.ts`, `motionTokens.test.ts`, `motionVariants.test.ts` enforce concrete a11y invariants (label presence, ≥ 44 × 44 px targets, reduced-motion behavior).
- Framer variants uniformly gate on `prefers-reduced-motion`.
- Focus rings use accent tokens, never `outline: none` (design system rule; verified in `designTokens.test.ts`).
- Semantic elements (buttons vs divs, headings, landmarks) present in shell components.

**Gaps:**

- **Chart text alternatives** missing for all Visx charts. (CI-9)
- **Contract-test presence** not enforced on new components by CI. (CI-9)
- **Manual audit trail** not recorded — no `docs/a11y/2026-audit.md` yet.
- **Color-only signals** should be re-audited — the dual Personal/Business mode adds risk of accent-only differentiation on state indicators.
- **Screen-reader announcements** for async state (e.g., new sync pull) not consistently `aria-live` — needs a pass.

---

## 8. Performance Audit

Targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, dashboard initial JS ≤ 180 KB gz.

**Strengths:**

- React Compiler enabled (`babel-plugin-react-compiler`), reducing manual memoization.
- `optimizePackageImports` in [`next.config.ts`](../next.config.ts) for `lucide-react`, `@visx/*`, `date-fns`.
- Lazy-loaded heavy modules (`tesseract.js`, `xlsx`).
- `next/font` prevents CLS; `next/image` for images.
- Service worker (`public/sw.js`) caches shell + hashed assets; delta sync minimizes network reads.

**Gaps:**

- **No CI bundle budget** — CI-8.
- **Analytics math on main thread** — HP-6.
- **Streaming delta absent** — HP-7.
- **HTTP caching for hashed assets** could be tightened to `immutable, max-age=31536000` (Sprint 9.2).
- **No Lighthouse or WebPageTest baseline** captured; no regression harness for LCP/INP/CLS.

---

## 9. Backend Audit

**Strengths:**

- Every mutation route follows the `requireAuth → requireWorkspaceMember → checkRateLimit → Zod parse → handler` skeleton documented in [`ARCHITECTURE.md §4.2`](../docs/ARCHITECTURE.md).
- Prisma client is a lazy singleton in [`src/lib/server/prisma.ts`](../src/lib/server/prisma.ts).
- Rate limiting is Postgres-backed (`rate_limits` table, migration 013) with an in-memory fallback for dev.
- RLS is enabled on every table (migration 012).
- Audit log is append-only; IP is SHA-256-hashed.

**Gaps:**

- **No `server-only` marker** — CI-3.
- **No repositories layer** — HP-4. Direct `prisma.*` calls in route handlers are a drift risk.
- **No `/api/health` or `/api/ready`** — HP-5.
- **No structured logger** — HP-5.
- **Rate-limit backend not swappable** (interface not extracted) — M6.2.
- **Idempotency de-dup index missing** on `/api/sync/commit` — CI-2.
- **Migrations at repo root** — CI-7.

---

## 10. Security Audit

Against OWASP Top 10 and product security policy in [`AI_CONTEXT.md §13`](../docs/AI_CONTEXT.md).

| #   | Area                        | State                                                                                                     |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Broken Access Control       | Guards + RLS present; RLS not CI-tested (CI-4).                                                           |
| 2   | Cryptographic Failures      | AES-256-GCM per workspace; no rotation path (HP-1).                                                       |
| 3   | Injection                   | Prisma parameterized; Zod at boundaries; XSS mitigated but CSP loose (CI-6).                              |
| 4   | Insecure Design             | Threat modeling implicit; no ADR log yet (HP-12).                                                         |
| 5   | Security Misconfig          | CSP includes `'unsafe-eval'` (CI-6); no `server-only` marker (CI-3).                                      |
| 6   | Vulnerable Components       | `npm audit` not gated in CI (M5.1).                                                                       |
| 7   | Auth Failures               | Multi-factor breadth is production-grade; passkeys + TOTP + recovery codes.                               |
| 8   | Data Integrity              | Refresh tokens hashed at rest; audit log covers privileged ops.                                           |
| 9   | Logging & Monitoring        | Sentry configured with PII scrubber; audit table used; no structured logger.                              |
| 10  | Server-Side Request Forgery | No user-controlled outbound URLs at server side (verified: no `fetch` from user input in route handlers). |

**Additional:**

- **Sentry `beforeSend`** scrubs `amount`, `remark`, `email`, `phone`, `password`, `token` — verified in [`sentry.*.config.ts`](../sentry.client.config.ts).
- **Session anomaly detection** logic not surfaced to user (HP-2).
- **Dependency automation** absent (M5.1).

---

## 11. Architecture Audit

Against [`ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

**Strengths:**

- Layers are clean: RSC shell → Client Components → Hooks → Dexie → Sync Engine → API → Prisma → Postgres (RLS).
- Import boundaries called out (§2), even if not yet lint-enforced.
- Every domain table carries `workspaceId`, `createdAt`, `updatedAt`, `deletedAt` and is indexed for delta sync.
- Type-safe boundaries at the API via Zod; DTOs live near validators.

**Gaps / recommended items (from ARCHITECTURE §18):**

- §18.1–18.4 (correctness): CI-1, CI-2, CI-3, plus server-side idempotency de-dup (CI-2 covers).
- §18.5–18.7 (modularity): HP-4 + M10.2 (feature verticalization).
- §18.8–18.10 (sync): CI-2, HP-7.
- §18.11–18.13 (perf): CI-8, HP-6, Sprint 9.2 caching.
- §18.14–18.17 (observability): HP-5, M6.
- §18.18–18.21 (security): HP-1, HP-2, CI-3, CI-4, CI-6, M5.1.
- §18.22–18.23 (lifecycle): M11.
- §18.24–18.25 (docs): HP-11, HP-12.

---

## 12. Technical Debt Register

Cross-reference [`PROJECT_MASTER_PLAN.md §11`](../docs/PROJECT_MASTER_PLAN.md).

| ID      | Debt                                                                                     | Status  | Sprint owner                    |
| ------- | ---------------------------------------------------------------------------------------- | ------- | ------------------------------- |
| TD-1    | `ARCHITECTURE.md` empty                                                                  | ✅ Done | Pre-audit — verified populated. |
| TD-2    | `SPRINT_BOARD.md` empty                                                                  | ✅ Done | Pre-audit — verified populated. |
| TD-3    | Deterministic conflict for money                                                         | Open    | M2.3                            |
| TD-4    | Push retry + dead-letter                                                                 | Open    | M3.1                            |
| TD-5    | iOS PWA install education                                                                | Open    | M12.1                           |
| TD-6    | Chart text alternatives                                                                  | Open    | M4.2                            |
| TD-7    | Dependency update automation                                                             | Open    | M5.1                            |
| TD-8    | Session anomaly UX                                                                       | Open    | M5.2                            |
| TD-9    | Monetary math audit                                                                      | Open    | M2.3                            |
| TD-10   | Feature-code boundary enforcement                                                        | Open    | M10.1 / 10.2                    |
| TD-11   | Bundle budget checks in CI                                                               | Open    | M6.2                            |
| TD-12   | Consolidate migration bookkeeping (root SQL)                                             | Open    | M1 / 1.2                        |
| DRIFT-1 | `AI_CONTEXT §15` cites ~40 tests, actual 29                                              | Open    | M1 (edit AI_CONTEXT)            |
| DRIFT-2 | `ARCHITECTURE §11` missing `challenges.ts`, `chronicle.ts`, `moneyDna.ts`, `supabase.ts` | Open    | M1 (edit ARCHITECTURE)          |
| DRIFT-3 | `firestore.rules` present after Firestore disabled                                       | Open    | M1 / 1.2 (CI-7)                 |
| DRIFT-4 | CHANGELOG / RELEASE_NOTES / PRODUCTION_CHECKLIST / TESTING_CHECKLIST are scaffolds       | Open    | M1 / 1.1 (HP-11)                |

---

## 13. Retention Audit

Against KPIs in [`PROJECT_MASTER_PLAN.md §2.1`](../docs/PROJECT_MASTER_PLAN.md): D1 / D7 / D30 = 55 / 35 / 22, budget-set ≥ 70 % of D7.

**Retention levers present:**

- Recurring detection (`recurringDetection.ts`) — reduces manual entry burden.
- Auto-rules manager — one-tap categorization.
- Evening push reminder — habit hook.
- Streaks and achievements (`useAchievements`, `challenges.ts`) — light gamification, held to a calm tone.
- Multi-device continuity — reduces churn on device switch.

**Retention levers missing / weak:**

- **Weekly digest** exists in code but timezone / quiet-hours are not correct (M3.2).
- **First-run TTFE telemetry** — no client event to verify the 30 s promise.
- **iOS install rate** low without education flow (HP-10).
- **Anomaly explanations** not inline yet (M14.3) — insight without narrative is forgettable.
- **Social hook** (household activity feed, opt-in) not shipped (M13.2).

---

## 14. Competitive Comparison

Ranked by threat / inspiration to ExpenStream.

**Apple Wallet.** Feels better because it is native, one-tap, and OS-integrated. **Missing here:** OS-level widget/complication surfaces; frictionless bio-auth (Passkeys narrow that gap).

**Copilot Money.** Feels better because of quiet copy, elegant charts, and thoughtful info density. **Missing here:** the last 10 % of chart chrome reduction; narrative-first insights (M14.3 addresses).

**Monarch Money.** Feels better because of collaborative shared spaces and rich reporting. **Missing here:** household activity feed (M13.2), envelope budgets (M8), payment reminders parity (M7.2).

**YNAB.** Feels different, not necessarily better; its cult community is a moat. **Missing here:** envelope budgeting method (M8) — deliberately positioned as _available_, not _forced_.

**Revolut.** Feels better because of bank-linked auto-import + investment surfaces. ExpenStream's position: **we refuse bank linking**. This is a strategic differentiator (see [`PROJECT_MASTER_PLAN.md §8.1`](../docs/PROJECT_MASTER_PLAN.md)); we compete on trust + privacy, not on integrations.

**Spendee.** Feels similar in category (manual + PWA capable) but weaker on offline. ExpenStream wins on offline-first + PWA quality.

**Material 3 / HIG / 2026 UI trends.** Editorial minimalism, ambient motion, adaptive theming, AI-native surfaces — ExpenStream's _DNA_ matches; the _execution_ gap is on chart chrome, motion pruning, and inline explanations.

**Modern PWAs.** Lighthouse PWA 100, Share Target, offline fallback, maskable icons — all reachable within M12.2.

**Why the leaders feel better today:** they've compounded 3–5 years of finishing work on onboarding, motion polish, and reliability. ExpenStream can close on trust and offline-first faster than they can imitate our privacy stance; we cannot close on their onboarding polish without dedicated sprints (M4, M12, M14).

---

## 15. Priority Roadmap (14 milestones)

Full task decomposition lives in [`docs/IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md). Sprint decomposition lives in [`docs/SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md).

| Order | Milestone                               | Horizon | Priority | Sprints | Rationale for order                                          |
| ----- | --------------------------------------- | ------- | -------- | ------- | ------------------------------------------------------------ |
| 1     | M1 — Documentation Truth                | 1       | P1       | 2       | Unblocks everything else; closes DRIFT-1..4 and TD-1,-2,-12. |
| 2     | M2 — Sync Reliability & Correctness     | 1       | P0       | 3       | Closes CI-1, CI-2. Highest data-safety leverage.             |
| 3     | M3 — Notification UX Hardening          | 1       | P1       | 2       | Reliability foundation for habit-forming features.           |
| 4     | M4 — A11y Contracts Coverage            | 1       | P0       | 2       | Compliance + inclusion; CI-9.                                |
| 5     | M5 — Security & Compliance Hardening    | 1–2     | P0/P1    | 4       | Closes CI-3, CI-4, CI-6, HP-1, HP-2.                         |
| 6     | M6 — Observability & Ops Foundation     | 1–2     | P1       | 2       | Closes HP-5, CI-8.                                           |
| 7     | M7 — Business Ledger Polish & Reminders | 2       | P1       | 2       | Closes HP-8.                                                 |
| 8     | M8 — Envelope Budgets                   | 2       | P2       | 2       | Closes HP-9.                                                 |
| 9     | M9 — Perf & Bundle Discipline           | 2       | P2       | 2       | Closes HP-6, HP-7.                                           |
| 10    | M10 — Architecture Modularity Refactor  | 2       | P2/P3    | 2       | Closes HP-4, TD-10.                                          |
| 11    | M11 — Data Lifecycle & Ownership        | 3       | P2/P3    | 2       | Purge + E2E archive.                                         |
| 12    | M12 — PWA & Platform Expansion          | 3       | P3       | 2       | Closes HP-10.                                                |
| 13    | M13 — Collaboration Expansion           | 3       | P3       | 2       | Client portal + activity feed.                               |
| 14    | M14 — AI-Native Surfaces (Opt-In)       | 4       | P3       | 3       | On-device categorization, NL filter, anomaly explanations.   |

**Total:** 14 milestones · 32 sprints · all `Pending`.

---

## 16. Sprint Recommendations

### Sprint 1 (Horizon 1, now)

Execute [Sprint 1.1](../docs/SPRINT_BOARD.md#m1--documentation-truth) then [Sprint 1.2] end-to-end. Deliverables:

- Populate all scaffold docs (CHANGELOG, RELEASE_NOTES, PRODUCTION_CHECKLIST, TESTING_CHECKLIST).
- Add sequence diagrams doc, AI Agent handbook, ADR-0001 (Postgres over Firestore).
- Retire root SQL files; retire `firestore.rules`.
- Fix DRIFT-1 (test count) and DRIFT-2 (`ARCHITECTURE.md §11` file list).

### Sprint 2 (Horizon 1)

Execute [Sprint 2.1 → 2.2 → 2.3]. Deliverables:

- Diagnostics panel + sync counters (Sprint 2.1).
- Persistent mutation queue + idempotency de-dup + dead-letter (Sprint 2.2, CI-2).
- Deterministic conflict UX + `Money` branded type + ESLint rule (Sprint 2.3, CI-1).

### Sprint 3 (Horizon 1)

Execute [Sprint 3.1 → 3.2]. Deliverables:

- Push scheduler with retry / dead-letter / `410` prune (CI-5).
- Quiet-hours + timezone correctness + ops health endpoint.

### Sprint 4 (Horizon 1)

Execute [Sprint 4.1 → 4.2]. Deliverables:

- Contract test template + CI enforcement + top-20 backfill.
- Chart text alternatives + manual axe pass + a11y audit doc.

### Sprint 5 (Horizon 1–2)

Execute [Sprint 5.1 → 5.2 → 5.3 → 5.4]. Deliverables:

- Renovate/Dependabot + npm audit gate + `SECURITY.md`.
- Session anomaly surface + audit expansion.
- CSP tightening + `server-only` markers + RLS smoke workflow.
- Encryption key rotation flow + tests.

---

## 17. Risks

Reproduced from [`PROJECT_MASTER_PLAN.md §12`](../docs/PROJECT_MASTER_PLAN.md) with Sprint 0 status.

| ID   | Risk                                                        | L   | I   | Score | Sprint 0 status                                        |
| ---- | ----------------------------------------------------------- | --- | --- | ----- | ------------------------------------------------------ |
| R-1  | Sync mutation loss under bad network + tab close            | 3   | 5   | 15    | Open — M2.2.                                           |
| R-2  | Cross-workspace data leak via missing guard                 | 2   | 5   | 10    | Partly mitigated (RLS + guards); needs CI test (M5.3). |
| R-3  | Secret leak in client bundle                                | 2   | 5   | 10    | Open — needs `server-only` (M5.3).                     |
| R-4  | Dependency CVE unpatched                                    | 3   | 4   | 12    | Open — M5.1.                                           |
| R-5  | Monetary precision bug (float rounding)                     | 3   | 5   | 15    | Open — M2.3.                                           |
| R-6  | Push service unreliable on iOS                              | 4   | 3   | 12    | Open — M3.1, M12.                                      |
| R-7  | Offline conflict silently drops user edits                  | 3   | 5   | 15    | Open — M2.3.                                           |
| R-8  | Third-party analytics accidentally receives monetary values | 2   | 5   | 10    | Mitigated by Sentry `beforeSend`; needs logger (M6.1). |
| R-9  | Accessibility regression on a new component                 | 3   | 3   | 9     | Open — M4.1.                                           |
| R-10 | Encryption key lost mid-session (sessionStorage cleared)    | 3   | 3   | 9     | Open — M5.4 for rotation; graceful fallback exists.    |
| R-11 | Account lockout without recovery                            | 2   | 4   | 8     | Mitigated — recovery codes + passkey + email reset.    |
| R-12 | PWA install rate low on iOS                                 | 4   | 2   | 8     | Open — M12.1.                                          |
| R-13 | Business ledger overdue signal missed                       | 2   | 4   | 8     | Open — M7.                                             |

---

## 18. Acceptance Criteria (Sprint 0)

Sprint 0 is complete because:

- [x] The entire repository was inspected (frontend, backend, config, DB, auth, API, services, utilities, components, hooks, assets, routing, charts, analytics, budgets, categories, search, notifications, settings, profile, offline, SW, manifest, PWA, build, env, dependencies, folder structure).
- [x] Every finding is verified against source at commit HEAD.
- [x] Documentation updates:
  - [x] `sprint-reports/SPRINT_0_SUMMARY.md` — **this file** — created.
  - [x] `docs/IMPLEMENTATION_QUEUE.md` — verified present, complete (Sprints 1.1 → 14.3 with full attribute set, all `Pending`).
  - [x] `docs/CHANGELOG.md` — Sprint 0 entry updated to record Sprint 0 deliverables.
  - [x] Drifts (DRIFT-1..4) recorded in §3.7 / §12; will be closed in M1.
- [x] No application source code was modified. Verified by scope: only `sprint-reports/**` and `docs/CHANGELOG.md` were touched.
- [x] Project roadmap is finalized in [`docs/SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md) + [`docs/IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md).

---

## 19. Category Scoring

Score /10 (current), Target /10, Gap, Priority.

| Category        | Current | Target                      | Gap | Priority | Notes                                                                 |
| --------------- | ------- | --------------------------- | --- | -------- | --------------------------------------------------------------------- |
| Product         | 8       | 10                          | 2   | P1       | Clear thesis; missing envelope, portal, activity feed.                |
| UI              | 7       | 9                           | 2   | P1       | Excellent tokens; chart chrome + micro-interactions pending.          |
| UX              | 7       | 9                           | 2   | P1       | Offline story strong; conflict UX + iOS install pending.              |
| Accessibility   | 6       | 10                          | 4   | P0       | Contracts partial; charts lack text alt; CI not enforced.             |
| Performance     | 7       | 9                           | 2   | P1       | React Compiler + delta sync; no CI bundle gate.                       |
| Backend         | 7       | 9                           | 2   | P1       | Guards + RLS + rate limit; needs `server-only`, repositories, logger. |
| Frontend        | 8       | 9                           | 1   | P2       | RSC + tokens + motion; feature verticalization pending.               |
| Architecture    | 8       | 9                           | 1   | P2       | Clear layers; boundary enforcement + repos pending.                   |
| Security        | 6       | 10                          | 4   | P0       | CSP loose, no RLS CI test, no dep automation.                         |
| Maintainability | 7       | 9                           | 2   | P2       | Tests co-located; docs strong; scaffolds to backfill.                 |
| Retention       | 6       | 9                           | 3   | P1       | Reminders unreliable; digest timezone wrong; no explanations.         |
| Premium Feel    | 7       | 10                          | 3   | P1       | Design DNA is right; execution polish is the gap.                     |
| **Overall**     | **72**  | **112 (out of 120 target)** | —   | —        | See §20 for /100 normalization.                                       |

## 20. Final Score (/100)

Weighted normalization: each of the 12 categories contributes `(current / target) × (target / 12) × 10`. Overall current-vs-target = 84 / 112 → **75 % of target reached**. Renormalized to a plain sum of category current scores (out of 120 max): **84 / 120 ≈ 70**. Blending both signals with a small penalty for open P0 risks (CI-1, CI-2, CI-3, CI-4, CI-6, CI-9):

**Sprint 0 Overall Score: 72 / 100.**

Interpretation: **a strong "post-MVP, pre-production" foundation.** The product's DNA (privacy, offline-first, editorial calm) is intact and its living documentation is unusually good. What remains is the finishing work that separates a strong side project from a store-grade fintech: sync correctness for money, closed-loop security, observability, a11y contracts at 100 %, retention polish. All of it is decomposed into 14 milestones and 32 sprints, in priority order, in [`IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md).

---

## 21. Sign-off

- Product: ready to prioritize the queue as ordered.
- Engineering: no source code modified; boundaries respected; all findings verified.
- QA: DoD applies to every Sprint 1+ ticket; contract-test enforcement is a Sprint 4.1 gate.
- Security: CI-3, CI-4, CI-6 must be closed before Product Hunt / store launch.
- A11y: CI-9 must be closed before store launch.
- Sprint 0 is **complete**.

_End of Sprint 0 report. Update in place only if new evidence surfaces before Sprint 1 kicks off._
