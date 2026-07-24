<!--
  TESTING_CHECKLIST.md — Per-release QA gates for ExpenStream
  Owner: QA Lead + AI Engineering Team
  Audience: Engineers, release captains, PR reviewers.
  Companion docs: PRODUCTION_CHECKLIST.md, TESTING_CHECKLIST.md,
                  ARCHITECTURE.md, IMPLEMENTATION_QUEUE.md.
  Rule: This checklist runs on every merge to `main` and every release tag.
        Automated gates block the merge; manual gates block the release.
-->

# ExpenStream — Testing Checklist

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-23

This checklist maps every ExpenStream release gate — automated and manual — to the owning spec file under [`src/__tests__/`](../src/__tests__) or to the human review that owns it. It is the QA companion to [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md).

**Legend:** `[Auto]` runs in CI · `[Manual]` requires a human · `[P0]` blocking · `[P1]` strongly recommended · `[P2]` best-practice.

Run commands (documented in [`package.json`](../package.json)):

- `npm test` — Jest suite (all `src/__tests__/*.test.ts`).
- `npm run lint` — ESLint.
- `npm run build` — `prisma generate && next build` (also serves as a TypeScript gate).

---

## 1. Automated — Unit & pure logic `[Auto][P0]`

Owner spec files under [`src/__tests__/`](../src/__tests__):

- [ ] `calculations.test.ts` — budget math, EOM projection, MAD anomaly detection, savings-goal progress.
- [ ] `categories.test.ts` — category enum stability, remark-based auto-categorization.
- [ ] `filters.test.ts` — date-range / tag / amount filter reducers.
- [ ] `validators.test.ts` — Zod schemas at every API boundary; round-trip parse.
- [ ] `utils.test.ts` — misc helpers.
- [ ] `recurringDetection.test.ts` — recurring-cost detection heuristic.
- [ ] `accentColor.test.ts` — accent-color contrast + palette bounds.
- [ ] `achievements.test.ts` — achievement unlock rules (no gamification pressure — cosmetic only).

**Gate:** `npm test -- --selectProjects=unit` (or default `npm test`) green with **0 failures**.

## 2. Automated — Contract & design-system `[Auto][P0]`

- [ ] `accessibilityContracts.test.ts` — every listed component exposes accessible name, role, keyboard handler.
- [ ] `touchTargets.test.ts` — every interactive element ≥ 44 × 44 px.
- [ ] `componentContracts.test.ts` — component-prop contracts, forbidden prop names, required states.
- [ ] `designTokens.test.ts` — no hard-coded hex / rgb / raw spacing outside the token file.
- [ ] `colorTokenConsistency.test.ts` — color tokens map identically in light & dark.
- [ ] `motionTokens.test.ts` and `motionVariants.test.ts` — every animation has a `prefers-reduced-motion` branch.
- [ ] `tokenMigration.test.ts` — legacy tokens replaced everywhere.
- [ ] `zIndexScale.test.ts` — z-index values live in the token scale.
- [ ] `emptyStates.test.ts` / `loadingStates.test.ts` — every listed screen ships five-state coverage (empty / loading / error / offline / success).
- [ ] `phaseFContracts.test.ts` — regression barrier for the April 2026 UX overhaul.

**Gate:** all of the above green; a new component **cannot** merge without an entry in the appropriate contract test.

## 3. Automated — Integration `[Auto][P0]`

- [ ] `syncEngine.integration.test.ts` — delta pull, mutation-queue drain, workspace-scope enforcement, `onWorkspaceAccessDenied` propagation.
- [ ] `settingsSync.test.ts` — settings-store hydration, offline write → online reconciliation.
- [ ] `notifications.test.ts` / `notificationSettings.test.ts` — Web Push subscribe/unsubscribe contract, notification-preference storage, quiet-hours math.
- [ ] `dashboardComponents.test.ts` — dashboard tiles render deterministically from fixture ledgers.
- [ ] `bugFixes.test.ts` / `recentFeatures.test.ts` / `cleanupVerification.test.ts` — regression barriers for specific incidents.
- [ ] `quickTemplatesAndViewMode.test.ts` — expenses-page interaction regressions.

**Sprint 2.x will add:**

- [x] `syncEngine.repro.test.ts` — conflict reproduction ([Sprint 2.1](IMPLEMENTATION_QUEUE.md#sprint-21)).
- [ ] `syncEngine.reliability.test.ts` + `syncCommit.idempotency.test.ts` ([Sprint 2.2](IMPLEMENTATION_QUEUE.md#sprint-22)).
- [ ] `syncEngine.conflict.test.ts` + `money.helpers.test.ts` ([Sprint 2.3](IMPLEMENTATION_QUEUE.md#sprint-23)).

## 4. Automated — Lint, format, types `[Auto][P0]`

- [ ] `npm run lint` — ESLint, zero errors, zero new warnings vs. baseline.
- [ ] `npm run build` — Prisma generate + Next build must succeed on Node 20 (matches Vercel).
- [ ] No `TODO` or `FIXME` introduced in changed lines (grep in PR diff).
- [ ] No `console.log` introduced outside `errorReporting.ts` and `syncEngine.ts` (their `syncLog`/`syncWarn`/`syncErr` guards).

## 5. Manual — Accessibility gate `[Manual][P0]`

- [ ] Keyboard-only smoke: `Tab` through login → dashboard → add expense → analytics → settings; no focus trap; every action reachable.
- [ ] Screen reader smoke: VoiceOver (iOS Safari) **and** TalkBack (Android Chrome) — landmark regions announced, form labels correct, dialog focus returns to invoker on close.
- [ ] Reduced-motion smoke: OS-level "Reduce Motion" toggled — no non-essential animation runs.
- [ ] Contrast smoke: dark mode passes WCAG AA on the primary text against every surface used on the dashboard and analytics.
- [ ] Zoom smoke: 200 % browser zoom — no horizontal scroll on primary flows.

## 6. Manual — Performance smoke `[Manual][P1]`

- [ ] Lighthouse mobile (throttled 4G, Moto-G class): Performance ≥ 95, Accessibility ≥ 95, Best-Practices ≥ 95, PWA installable.
- [ ] Analytics page: 60 FPS during month-scrub interaction (Chrome DevTools Performance panel — no long tasks > 50 ms).
- [ ] Cold-start dashboard TTI < 2.0 s on a warm cache; < 3.5 s on a cold cache.
- [ ] Bundle size: no route JS chunk grows > 20 KB gzipped vs. previous release without an explicit budget waiver in the sprint report.

## 7. Manual — Sync & offline `[Manual][P0]`

Verified against the Sync & Offline acceptance criteria in [PROJECT_MASTER_PLAN §16.5](PROJECT_MASTER_PLAN.md):

- [ ] Add an expense while offline (DevTools → Offline). On reconnect, the entry appears on the server without user action.
- [ ] Two devices on the same workspace: create an expense on device A while device B is idle. Device B sees it within one pull cycle (currently 30 s).
- [ ] Force-close the tab mid-mutation. Reopen. The mutation replays automatically (once [Sprint 2.2](IMPLEMENTATION_QUEUE.md#sprint-22) lands the persistent queue).
- [ ] Delete an expense on device A while device B holds a stale copy. On device B's next pull, the row is soft-deleted, not resurrected.

## 8. Manual — Security scan `[Manual][P0]`

- [ ] `npm audit` — 0 high / critical vulns, or documented waiver with justification in the sprint report.
- [ ] Secret scan: `git log -p -- .env* | grep -Ei "JWT_SECRET|VAPID_PRIVATE|RESEND|DATABASE_URL"` returns nothing new since the previous release.
- [ ] Rate-limit smoke: burst 60 login attempts from a single IP → response transitions to `429` and audit log records the throttle.
- [ ] RLS smoke: with a raw `psql` session using an anonymous role, `SELECT * FROM expenses LIMIT 1;` returns 0 rows (planned automation in [Sprint 5.3](IMPLEMENTATION_QUEUE.md#sprint-53)).
- [ ] Session anomaly: log in from a second continent (VPN); confirm the future anomaly surface fires ([Sprint 5.2](IMPLEMENTATION_QUEUE.md#sprint-52) — currently manual watch).

## 9. Manual — PWA install & platform `[Manual][P1]`

- [ ] Android Chrome: "Install app" prompt appears, install succeeds, offline reload works.
- [ ] iOS Safari 17+: "Add to Home Screen" flow works. (In-product install education is planned in [Sprint 12.1](IMPLEMENTATION_QUEUE.md#sprint-121).)
- [ ] Installed PWA: PIN lock triggers on cold start (`src/components/lock/PinLock.tsx`), unlocks with correct PIN, respects timeout.
- [ ] Update path: bump SW version, reload once, verify old cache purged and new UI loads.

## 10. Manual — Business ledger `[Manual][P1]`

- [ ] Create a customer, invoice, and payment. Verify collections KPIs update on the ledger dashboard.
- [ ] Overdue detection tier (planned in [Sprint 7.1](IMPLEMENTATION_QUEUE.md#sprint-71)) — verify current export parity when it lands.
- [ ] Payment reminder — placeholder until [Sprint 7.2](IMPLEMENTATION_QUEUE.md#sprint-72).

## 11. Manual — Smoke script (release captain) `[Manual][P0]`

The pre-flight smoke that gates every production deploy. All steps run against **staging**, then re-run against **prod** within the T + 15 min window from [PRODUCTION_CHECKLIST §12](PRODUCTION_CHECKLIST.md).

1. [ ] Load `/login` — page renders, no console errors.
2. [ ] Log in with a seeded test account.
3. [ ] Dashboard loads with the seeded data; hero card shows a numeric summary.
4. [ ] Add expense → appears on the dashboard within 1 s and after a page reload.
5. [ ] Edit + delete the expense; changes persist across a reload.
6. [ ] Analytics page loads and renders charts; no missing tiles.
7. [ ] Settings → Data → export a CSV; re-import; row counts match.
8. [ ] Settings → Devices → sign out from the current session; app returns to `/login`.
9. [ ] Verify [Sentry](https://sentry.io) received zero **new** issues from the smoke run.

---

## Roles

| Gate                       | Owner            | Blocking? |
| -------------------------- | ---------------- | --------- |
| Automated Jest suite       | Author of the PR | Yes       |
| Lint / build / types       | Author of the PR | Yes       |
| Accessibility manual       | A11y reviewer    | Yes       |
| Performance smoke          | Perf reviewer    | Recommend |
| Sync / offline manual      | Release captain  | Yes       |
| Security manual            | Security review  | Yes       |
| PWA / platform manual      | Release captain  | Recommend |
| Business ledger manual     | Product          | Recommend |
| Release smoke (T + 15 min) | Release captain  | Yes       |

---

**Last reviewed:** 2026-07-23
