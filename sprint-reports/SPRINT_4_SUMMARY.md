# Sprint 4 (M4) Summary — Accessibility Contracts Coverage (Sprints 4.1 + 4.2)

**Milestone:** M4 — Accessibility Contracts Coverage · **Horizon:** 1 · **Priority:** P0 · **Debt closed:** TD-6 · **Risk mitigated:** R-9 · **Completed:** 2026-10-01

---

# Executive Summary

M4 makes accessibility a non-optional, machine-checked property of the codebase and of every chart. Sprint 4.1 delivered a contract-test guide, a scaffolder, a CI gate with a justified allowlist, and a backfill that lifted contract coverage from **39 % to 100 %** of non-allowlisted components. Sprint 4.2 delivered `DataTableView` — a keyboard-operable, announced "Table" alternative built from the chart's own rows — on all eight listed charts (plus Month Ridge, Spending Velocity and the spending fingerprint), an audit of the five top pages with **22 P0 findings closed**, and a repository-wide rule that any non-decorative SVG must expose a `role="table"` alternative.

The six reported app issues were fixed inside that scope: the Home money-spent bar now reveals smoothly with no layout jump (and honours reduced motion); the Analytics header no longer squeezes the month controls on mobile; the Month Ridge follows 3M/6M/12M; Spending Velocity bars can no longer draw over text; Rolling Average responds to 30/60/90 days; and the Analytics page was reorganised around its most actionable information (UX-9.6).

# Sprint Goal

- **4.1:** Formalise the accessibility contract-test pattern and make its presence non-optional in CI.
- **4.2:** Every chart has a text/data-table alternative; complete an accessibility audit of top pages; close all P0 findings; meet M4 exit criteria ([PROJECT_MASTER_PLAN §14](../docs/PROJECT_MASTER_PLAN.md)).

# Completed Tasks

| Task | Status | Delivered |
| --- | --- | --- |
| T-4.1.1 | ✅ | [docs/CONTRACT_TESTS.md](../docs/CONTRACT_TESTS.md); shared assertions `src/__tests__/helpers/contractAssertions.ts`; cross-links from DESIGN_SYSTEM §17.4a and AI_CONTEXT §12. |
| T-4.1.2 | ✅ | `scripts/gen-contract-test.js` (`npm run contracts:new`) — baseline + detected ARIA names/roles/states; skeleton passes first run. |
| T-4.1.3 | ✅ | `scripts/check-contract-tests.js` (`contracts:check` / `contracts:report`), `contract-tests.allowlist.json`, `.github/workflows/ci.yml`. |
| T-4.1.4 | ✅ | 20 dedicated specs + inventory in `accessibilityContracts.test.ts`; coverage 100 %. |
| T-4.2.1 | ✅ | `src/components/ui/DataTableView.tsx` on RollingAverageChart, YearOverYearChart, RidgeLine, CollectionChart, LedgerProgressRing, MerchantBreakdown, CategoryVelocity, CategorySeasons (+ MonthRidge, SpendingVelocity, FingerprintBlob). |
| T-4.2.2 | ✅ | [docs/a11y/2026-audit.md](../docs/a11y/2026-audit.md) — five pages, findings triaged P0/P1/P2. |
| T-4.2.3 | ✅ | 22 P0 closed; 5 P1 + 4 P2 logged as follow-ups. |
| T-4.2.4 | ✅ | `phaseFContracts.test.ts` SVG → `role="table"` rule; suite green (two stale assertions realigned). |
| T-4.2.5 | ✅ | M4 flipped to Done in SPRINT_BOARD and IMPLEMENTATION_QUEUE. |

**Reported issues addressed:** Home sticky bar (A11Y-04), Analytics mobile header (A11Y-06), Month Ridge period (A11Y-12), Spending Velocity overlap (A11Y-11), Rolling Average period (A11Y-10), Analytics information hierarchy (UX-9.6).

# Acceptance Criteria Status

| Criterion | Status | Evidence |
| --- | --- | --- |
| Doc explains how to add a contract test in ≤ 5 min | ✅ | CONTRACT_TESTS.md §1 (scaffold → add intent → run → commit). |
| Cross-linked from DESIGN_SYSTEM and AI_CONTEXT | ✅ | DESIGN_SYSTEM §8.6, §15.4, §17.4a; AI_CONTEXT §12, §16. |
| Script generates a passing skeleton for a sample component | ✅ | 22 generated specs passed on first run (one surfaced a real focus-indicator bug, fixed); `contractTooling.test.ts` verifies every generated assertion holds for `DataTableView`. |
| Synthetic PR adding a component without a spec fails CI | ✅ | `contractTooling.test.ts` › "a synthetic PR adding a component without a spec fails the gate"; CI runs `contracts:check`. |
| All 20 backfilled specs green; coverage ≥ 90 % | ✅ | 20 specs green; `contracts:check` → 100.0 %. |
| Toggle keyboard-reachable; state announced via `aria-live` | ✅ | `<button aria-pressed aria-controls>` + `role="status" aria-live="polite"`; verified in the browser accessibility tree. |
| Data table matches chart values exactly | ✅ | Chart and table render from the same model (`analyticsCharts.ts`); table uses the exact currency formatter; `chartTextAlternatives.contract.test.ts` + `analyticsCharts.test.ts`. |
| Every top page audited; findings triaged P0/P1/P2 | ✅ | `docs/a11y/2026-audit.md` §2–4. |
| Zero open P0 items | ✅ | Audit header: **Open P0: 0**. |
| Extended phaseF spec green | ✅ | 84/84. |
| M4 status flipped to Done | ✅ | SPRINT_BOARD (milestone, both sprints, summary table) and IMPLEMENTATION_QUEUE (9 tasks `[x] Done`). |

# Files Created

- `.github/workflows/ci.yml`, `contract-tests.allowlist.json`
- `docs/CONTRACT_TESTS.md`, `docs/a11y/2026-audit.md`
- `scripts/gen-contract-test.js`, `scripts/check-contract-tests.js`
- `src/components/ui/DataTableView.tsx`, `src/components/motion/StickyReveal.tsx`
- `src/components/analytics/{AnalyticsHeader,AnalyticsPeriodSelector,AnalyticsSection,ThisMonthOverview,MonthRidge,SpendingVelocity,BiggestExpenses,AnalyticsDeepDive}.tsx`
- `src/hooks/{useAnalyticsPeriod,useAnalyticsShare,useExpenseRange}.ts`
- `src/lib/{analyticsCharts,analyticsSummary,analyticsShareImage}.ts`
- Tests: `helpers/contractAssertions.ts`, `contractTooling.test.ts`, `analyticsCharts.test.ts`, `analyticsLayout.contract.test.ts`, `chartTextAlternatives.contract.test.ts`, `dataTableView.contract.test.ts`, `stickyReveal.contract.test.ts`, and 20 backfilled specs (`expenseForm`, `spendingStream`, `syncDiagnosticsCard`, `monthlyPostcard`, `csvImportWizard`, `watcherConstellation`, `timeMachine`, `categorySelector`, `spendingForecastCalendar`, `ledgerForm`, `categoryChart`, `appShell`, `quickHelpButton`, `spendingChallenges`, `quickAddSheet`, `confirmDialog`, `sidebar`, `goalFundingSheet`, `installBanner`, `monthSwitcher` — each `*.contract.test.ts`).

# Files Modified

- **App:** `src/app/analytics/page.tsx` (832 → 216 lines), `src/app/analytics/loading.tsx`, `src/app/page.tsx`, `src/app/providers.tsx`, `src/app/business/[ledgerId]/page.tsx`, `src/app/category/[slug]/page.tsx`.
- **Components:** analytics `AnomalyCallout`, `CategorySeasons`, `CategoryVelocity`, `ComparisonView`, `MerchantBreakdown`, `PredictiveBurnBar`, `RollingAverageChart`, `TimeMachine`, `YearOverYearChart`; business `CollectionChart`, `LedgerForm`, `LedgerProgressRing`; dashboard `FingerprintBlob`, `MoneyDnaCard`, `MonthSummaryHero`; `expenses/CategorySelector`, `motion/Confetti`, `onboarding/AuthModal`, `settings/PinLockSettings`; ui `AnimatedNumber`, `ConfirmDialog`, `QuickHelpButton`, `RidgeLine`.
- **Lib/config:** `src/lib/motion/variants.ts` (`stickyReveal`), `package.json` (scripts only — no dependencies).
- **Tests:** `accessibilityContracts.test.ts`, `motionVariants.test.ts`, `phaseFContracts.test.ts`.
- **Docs:** AI_CONTEXT, ARCHITECTURE, CHANGELOG, DESIGN_SYSTEM, IMPLEMENTATION_QUEUE, PRODUCTION_CHECKLIST, RELEASE_NOTES, SCREEN_GUIDELINES, SPRINT_BOARD, TESTING_CHECKLIST, UX_DECISIONS.

**Deleted:** `src/components/analytics/InsightCard.tsx` (only consumer removed per UX-9.6), `src/components/dashboard/{BudgetRing,PaceGauge,SpendingDonut}.tsx` (orphaned — imported nowhere, carried unlabelled SVG charts; IMPLEMENTATION_RULES §0 dead-code ban).

# Architecture Changes

- **Shared chart models** (`src/lib/analyticsCharts.ts`): every analytics chart and its table consume one pure model; scales include reference values (budget, pace) so marks cannot overflow.
- **Raw-expense range hook** (`useExpenseRange`): day-level charts no longer read `useHistoricalData`'s cached month summaries, which drop line items for completed months — this was why Rolling Average/Category Velocity lost data for earlier months.
- **Anchor date** (`periodAnchor`): day-level analytics end at today for the current month, otherwise at the selected month's last day (previously Category Velocity always used "today").
- **URL state** for the Analytics period (`?period=`, Zod-validated) per IMPLEMENTATION_RULES §11.
- **App-wide reduced motion:** `<MotionConfig reducedMotion="user">`.
- **CI:** first GitHub Actions workflow in the repo (contract gate + contract specs).

# UI / UX Changes

- Analytics hierarchy (UX-9.6): "Spent in {month}" hero (budget context, plain-language read, labelled projection, anomalies) → Month vs Month → {period}-Month Ridge (average + top-category link) → Spending Velocity + Biggest This Month → collapsed Deep Dive. Removed the redundant insight-card row (its "all-time" label was also wrong).
- Responsive Analytics header (stacked on `< md`, 44 px period toggles).
- "Table" toggle on every chart (UX-9.5).
- Home compact bar: smooth zero-shift reveal.
- Copy: anomaly section renamed "Worth a look"; "nice work" praise removed from summary (non-judgemental tone, FINANCIAL_PSYCHOLOGY).

# Backend Changes

None.

# Database Changes

None (no migrations, no Dexie schema change).

# API Changes

None.

# Performance Improvements

- Deep Dive charts and their 5-month range query mount only when the disclosure is opened.
- Year over Year: one range query replaces 24 per-month live queries.
- Analytics page bundle trimmed (canvas share code moved to a lib module; page 832 → 216 lines).
- Sticky bar no longer causes layout shift (CLS) on Home.

# Accessibility Improvements

See [docs/a11y/2026-audit.md](../docs/a11y/2026-audit.md) — 22 P0s closed: chart text alternatives, reduced motion (global + JS loops), label associations (LedgerForm, TimeMachine, PinLockSettings, ConfirmDialog), named icon buttons, disclosure states, Escape handling, 44 px targets, focus indicators, heading structure, content overlap and reflow at 360 px. axe-core 4.10: **0 violations** across the rendered analytics components (360 px / 1280 px, light/dark, tables open/closed).

# Security Improvements

- Analytics share errors go to `reportError` (Sentry, no PII/money) instead of `console.error`.
- `?period=` parsed with Zod; invalid input falls back to the default.
- CI workflow uses `permissions: contents: read`.

# Tests Added

- `contractTooling.test.ts` (gate + scaffolder), `analyticsCharts.test.ts` (33 model/summary tests incl. regressions for ridge period, velocity overflow, rolling period, category anchor), `analyticsLayout.contract.test.ts`, `chartTextAlternatives.contract.test.ts`, `dataTableView.contract.test.ts`, `stickyReveal.contract.test.ts`, 20 backfilled component specs, inventory block (34 components) in `accessibilityContracts.test.ts`, SVG rule in `phaseFContracts.test.ts`, `stickyReveal` variant tests.
- Net: **+283 tests** (1,626 → 1,909).

# Documentation Updated

CONTRACT_TESTS (new), a11y/2026-audit (new), AI_CONTEXT, ARCHITECTURE, CHANGELOG, DESIGN_SYSTEM, IMPLEMENTATION_QUEUE, PRODUCTION_CHECKLIST, RELEASE_NOTES, SCREEN_GUIDELINES (§6 composition), SPRINT_BOARD, TESTING_CHECKLIST, UX_DECISIONS (UX-9.5, UX-9.6).

# Risks

- **Source-level contracts** catch attribute/structure regressions, not runtime behaviour; the authenticated axe sweep (A11Y-P1-01) closes that gap.
- **CI scope:** the workflow gates contracts and contract specs only. Full `jest`, `tsc` and `eslint` are not yet gated because each has pre-existing failures (below); adding them now would make CI permanently red.
- **Behaviour change:** a 3M/6M/12M period now shows exactly 3/6/12 months (previously 4/7/13); "Avg of earlier months" therefore averages one fewer month.

# Known Issues

Pre-existing and unchanged by M4 (verified identical before/after):

- `jest`: 22 failures in 5 suites (`accentColor`, `bugFixes`, `colorTokenConsistency`, `quickTemplatesAndViewMode`, `zIndexScale`). M4 fixed the 2 previously failing `phaseFContracts` assertions.
- `tsc --noEmit`: 28 errors, all in pre-existing test files (`achievements`, `bugFixes`, `notifications`, `recentFeatures`, `settingsSync`).
- `eslint` (repo-wide): pre-existing errors outside M4's files; changed files have 0 errors and 6 pre-existing unused-variable warnings on untouched lines.
- `CategorySeasons.tsx` remains above the 250-line component budget (pre-existing; grew slightly with its table).

# Future Recommendations

1. Seeded-account Playwright + axe job for all authenticated routes (A11Y-P1-01).
2. Arrow-key data-point traversal for charts (A11Y-P1-02, DESIGN_SYSTEM §15.4).
3. Fix the 22 pre-existing jest failures and 28 tsc errors, then add `npm test`, `tsc --noEmit` and `eslint` to `ci.yml`.
4. Standardise focus indicators on the accent outline token (A11Y-P1-04); move MonthSwitcher's first-run hint into the header flow (A11Y-P1-05).
5. Analytics export footer and per-anomaly "See the transactions" link (SCREEN_GUIDELINES §6 pending items).
6. Split `CategorySeasons.tsx` and `app/page.tsx` below the 250-line budget.

# Validation Results

| Check | Result |
| --- | --- |
| Build (`npm run build`) | ✅ Compiled successfully; 46 static pages generated. |
| Contract gate (`npm run contracts:check`) | ✅ 135 components · 22 allowlisted · 113 covered · 0 uncovered · **100.0 %**. |
| Tests (`npx jest`) | 1,909 total · 1,887 passed · 22 failed — all 22 pre-existing (listed above); every M4 suite green. |
| Lint (changed files) | ✅ 0 errors; 6 pre-existing warnings on untouched lines. |
| TypeScript (`tsc --noEmit`) | 28 errors — identical pre-existing set; 0 new. |
| Accessibility | axe-core 4.10: 0 violations (360/1280 px, light/dark, tables open/closed); browser a11y tree confirms table semantics and announcements; reduced motion emulated (transform removed, opacity kept, rail height 0). |
| Behaviour (browser, fixture data) | 360 px: month arrows fully visible, no horizontal scroll; 3M/12M → "3-/12-Month Ridge" with 3/12 rows; Rolling Average 30/60/90 → 30/60/90 rows (Sep 1 / Aug 2 / Jul 3 start); a ₹95K week stays below the heading (heading bottom 400 px, plot top 459 px). |
| Performance | No new dependencies; Deep Dive lazy; YoY 24 queries → 1. |

# Remaining Work

M4 is complete. Next in queue: **Sprint 5.1 — Dependency Automation & CVE SLA (M5)**. M4 follow-ups (P1/P2) are tracked in the audit document.

## Suggested Commit Message

```
feat(a11y): complete M4 - contract-test CI gate, chart data tables, analytics hierarchy

Sprint 4.1: CONTRACT_TESTS.md, contract scaffolder, CI presence gate with
allowlist, 20 backfilled specs (coverage 39% -> 100%).
Sprint 4.2: DataTableView text alternative on all core charts, top-page
a11y audit with 22 P0 fixes, SVG -> role="table" contract rule.
Fixes Home sticky-bar reveal, Analytics mobile header, Month Ridge period,
Spending Velocity overlap and Rolling Average period; reorganises
Analytics around the month's number (UX-9.6).
```
