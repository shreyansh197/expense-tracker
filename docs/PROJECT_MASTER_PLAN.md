<!--
  PROJECT_MASTER_PLAN.md — Product Requirements Document (PRD) for ExpenStream
  Owner: Product + AI Engineering
  Audience: PMs, engineers, designers, QA, and AI agents.
  Companion docs: AI_CONTEXT.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, SPRINT_BOARD.md,
                  PRODUCTION_CHECKLIST.md, RELEASE_NOTES.md, TESTING_CHECKLIST.md, CHANGELOG.md.
  Rule: This is the single source of truth for scope, priorities, and milestones.
        Update in place. Never fork. Link, don't duplicate, when possible.
-->

# ExpenStream — Product Master Plan (PRD)

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-21

---

## 1. Vision

Give individuals and small businesses a calm, private, offline-first way to see, understand, and shape their money — daily expenses, recurring costs, budgets, and business collections — without spreadsheets, bank scraping, or ad-driven surveillance.

ExpenStream aspires to be the **default personal finance surface** for privacy-conscious mobile-first users in India, SEA, and EMEA, and the **lightest possible collections ledger** for freelancers and micro-businesses. The product wins by being fast, honest, and quiet: a skilled accountant that never lectures, never guilt-trips, and never sells the user out.

**North star:** _A user who opens ExpenStream in the morning knows, in one glance, whether their month is on track — and trusts the answer._

---

## 2. Success Metrics

Metrics are tracked internally without exposing monetary values to third-party analytics (per fintech principles in [AI_CONTEXT.md](AI_CONTEXT.md)).

### 2.1 Product KPIs

| Metric                                         | Target                       | Measurement                   |
| ---------------------------------------------- | ---------------------------- | ----------------------------- |
| **Time-to-first-expense (TTFE)**               | ≤ 30 s from cold PWA install | Client event, aggregated only |
| **D1 / D7 / D30 retention**                    | 55% / 35% / 22%              | Anonymous cohort              |
| **Weekly Active Users / Monthly Active Users** | ≥ 0.55 stickiness ratio      | Anonymous cohort              |
| **Expenses logged per active week**            | ≥ 6 median                   | Anonymous count only          |
| **Budget-set rate**                            | ≥ 70% of D7 retained users   | Settings event                |
| **Multi-device link rate**                     | ≥ 25% of retained users      | Device-link events            |
| **PWA install rate**                           | ≥ 30% of returning web users | `beforeinstallprompt` outcome |
| **Business mode adoption**                     | ≥ 8% of retained users       | App-mode toggle               |

### 2.2 Quality KPIs

| Metric                                 | Target                        |
| -------------------------------------- | ----------------------------- |
| Lighthouse Performance (mobile)        | ≥ 90                          |
| Lighthouse PWA                         | 100                           |
| LCP / INP / CLS (P75 mid-tier Android) | ≤ 2.5 s / ≤ 200 ms / ≤ 0.1    |
| Dashboard initial JS (gz)              | ≤ 180 KB                      |
| Sync success rate                      | ≥ 99.5% of enqueued mutations |
| Sync conflict rate                     | ≤ 0.5% of mutations           |
| Crash-free sessions (Sentry)           | ≥ 99.9%                       |
| WCAG 2.2 AA conformance                | 100% audited screens          |
| Test suite green on `main`             | 100%                          |

### 2.3 Trust KPIs

- Zero incidents involving PII or monetary values sent to third-party analytics.
- Zero unauthorized cross-workspace reads or writes (verified by RLS + guard tests).
- 100% of privileged actions covered by audit log entries.
- ≤ 24 h mean time to patch a Critical or High CVE in a dependency.

---

## 3. Product Goals

Goals are the "why" behind the roadmap. Each maps to at least one KPI and one persona.

1. **G1 — Radical clarity.** The dashboard answers "how am I doing this month?" in under a second, with numbers a user can trust.
2. **G2 — Effortless capture.** Adding an expense is one thumb, one screen, one second. Recurring items self-detect.
3. **G3 — Private by construction.** Data lives in the user's workspace, encrypted at rest where sensitive, never shared with third parties.
4. **G4 — Offline-perfect.** Every action works with no network. Sync is invisible when it succeeds and honest when it fails.
5. **G5 — Multi-device continuity.** Switching phones, adding a tablet, or sharing with a partner is a two-tap flow, not a data migration.
6. **G6 — Small-business viable.** Ledgers, collections, overdue signals, and export make ExpenStream a real replacement for a "who owes me what" spreadsheet.
7. **G7 — Inclusive & accessible.** Keyboard, screen reader, reduced motion, and high-contrast users are first-class from day one.
8. **G8 — Editorial calm.** Editorial typography, restrained color, and meaningful motion — the app _feels_ different from every other finance product.

---

## 4. Features

Features are grouped by domain. Legend: **✅ Live** · **🚧 In progress** · **🔭 Planned** · **💡 Explored**.

### 4.1 Core capture & tracking

- ✅ Expense entry (amount, category, remark, date) with one-thumb sheet UI.
- ✅ Recurring expense detection and management (monthly, weekly, bi-weekly, quarterly, annual).
- ✅ Categories: default set + user-defined with color, icon, and visibility.
- ✅ Auto-categorization rules (`AutoRulesManager`) with conditions (remark contains, amount threshold, day-of-month, recurring flag) and actions (set category, add tag, flag).
- ✅ Quick templates and view-mode toggles for repeat entries.
- 🚧 Split expenses and per-item receipts (design in progress).

### 4.2 Budgets & goals

- ✅ Monthly salary/budget + per-month overrides keyed `YYYY-MM`.
- ✅ Multi-currency support with locale-correct formatting and rate-source disclosure.
- ✅ Budget rollover with configurable cap.
- ✅ Goals (savings targets) with progress.
- 🚧 Envelope-style category budgets (planned for Sprint 4).

### 4.3 Analytics & insights

- ✅ Rolling average chart (30/60/90 d) with ±1σ confidence band.
- ✅ Year-over-year monthly comparison bars.
- ✅ Merchant/vendor breakdown.
- ✅ Category velocity, category seasonality, anomaly callouts.
- ✅ Predictive month-end burn forecast.
- ✅ Time-machine historical explorer.
- ✅ Insight cards (avg monthly, MoM %, recurring vs one-time, top category, streaks).
- ✅ Branded shareable analytics image export (1080×1350 PNG).
- 🔭 Natural-language "ask a question of your money" (AI-native surface, opt-in).

### 4.4 Business ledgers (collections)

- ✅ Ledger CRUD with expected amount, currency, due date, tags, notes, status.
- ✅ Payments against ledgers with progress rings and collection charts.
- ✅ Overdue detection (active + past due + incomplete).
- ✅ KPI cards: total expected, received, collection %, overdue count.
- ✅ Tag breakdown and per-ledger progress bars.
- ✅ Collections export.
- 🚧 Payment reminders (push + email) — depends on notifications hardening.
- 🔭 Client portal (read-only link to a single ledger) — design exploration.

### 4.5 Sync, storage, and offline

- ✅ Offline-first via Dexie/IndexedDB.
- ✅ Delta sync with cursor pagination (`/api/sync/changes`).
- ✅ Idempotent mutation queue, workspace-scoped.
- ✅ Sync phase observable (idle / syncing / error) with UI indicator.
- ✅ Conflict toast surface (`useSyncConflictToast`).
- 🚧 Deterministic conflict resolution with per-field last-writer-wins + user prompt for money fields.

### 4.6 Identity, auth, and multi-device

- ✅ Email/password, Google OAuth, phone OTP.
- ✅ TOTP 2FA (QR provisioning + recovery codes).
- ✅ Passkeys (WebAuthn).
- ✅ Device linking via time-bound token URL.
- ✅ Device list with revoke and current-device indicator.
- ✅ Session table (device name, platform, last active, IP hash).
- ✅ PIN lock for the installed PWA.
- 🚧 Session timeline / anomalous-login alerts.

### 4.7 Workspaces & collaboration

- ✅ Multi-workspace membership (OWNER / ADMIN / MEMBER).
- ✅ Invite tokens with role and expiry (15 min – 7 d).
- ✅ Workspace switching in-app.
- ✅ Workspace-scoped queries via `requireWorkspaceMember` guard.
- 🚧 Per-member activity feed (read-only) for shared households.

### 4.8 Notifications

- ✅ Evening reminder (Web Push, timezone-aware).
- ✅ Budget milestone alerts (50 / 75 / over) — client-side in-tab.
- ✅ Smart nudges (context-aware) and weekly digest — behind prefs.
- 🚧 Server-scheduled digests + reliable push retries.

### 4.9 PWA, install, and platform

- ✅ Installable PWA (`manifest.json`, `sw.js`).
- ✅ Custom install button with `beforeinstallprompt` fallback.
- ✅ Background sync for the mutation queue.
- 🚧 iOS PWA install education flow.

### 4.10 Data ownership

- ✅ CSV / JSON export (per month or full backup, version 2 format).
- ✅ CSV / JSON import with preview.
- ✅ Account deletion + full data wipe.
- ✅ Per-workspace AES-256-GCM encryption of sensitive fields, key held in `sessionStorage`.
- 🔭 End-to-end encrypted export archive (passphrase-protected).

### 4.11 Appearance & personalization

- ✅ Light / Dark / Sunset themes.
- ✅ User-owned accent color with token inheritance.
- ✅ Editorial typography via `next/font`.
- ✅ Personal / Business app-mode toggle.
- ✅ Reduced-motion honored in every Framer variant.

### 4.12 Security & compliance

- ✅ Rate limiting on auth and sync endpoints (Postgres-backed, in-memory fallback).
- ✅ RLS on every Postgres table (migration 012).
- ✅ Audit log for device links, invites, member removal, password change.
- ✅ Sentry error tracking (no PII, no monetary values).
- 🚧 Dependency-update automation with Critical/High CVE SLA.

---

## 5. Roadmap

Horizons, not calendar promises. Each horizon spans multiple sprints; details live in [SPRINT_BOARD.md](SPRINT_BOARD.md).

### Horizon 1 — Harden (current)

Focus: reliability, accessibility contracts, sync correctness, notification UX, security posture.

- Sync engine: guaranteed-once mutation delivery, conflict UX for money fields.
- Accessibility contracts: every new component ships a contract test.
- Notifications: server-scheduled digests, reliable push retries, quiet-hours.
- Security: dependency auto-updates, session-anomaly alerts, audit coverage expansion.

### Horizon 2 — Deepen

Focus: analytics narrative, business ledger polish, envelope budgets.

- Envelope-style category budgets.
- Payment reminders (push + email) for business ledgers.
- Session timeline with device-map view.
- Natural-language filter bar on the analytics page.

### Horizon 3 — Expand

Focus: platform reach and shared use-cases.

- iOS PWA install education flow.
- Read-only client portal for a single ledger.
- Household activity feed (shared workspace, opt-in).
- End-to-end encrypted export archive.

### Horizon 4 — AI-native (exploratory)

Focus: quiet, opt-in AI surfaces that never leak monetary values externally.

- On-device categorization suggestions.
- Natural-language "ask your money" query bar.
- Anomaly explanations rendered inline as calm suggestions, not alerts.

---

## 6. User Personas

Personas drive prioritization. Each has a jobs-to-be-done (JTBD) statement, a top pain, and a success moment.

### Persona A — **Priya, 29, Salaried Professional (Bengaluru, India)**

- **JTBD:** _When I get paid, I want to know how much is truly mine to spend, so I don't reach month-end guessing._
- **Top pain:** Bank apps show balance, not behavior. Spreadsheets don't stick.
- **Success moment:** Opens ExpenStream on payday; the ridge chart shows last month's shape and this month's budget.
- **Devices:** Android phone (primary), work laptop (secondary).
- **Primary features:** Dashboard, expense entry, budget, monthly analytics.

### Persona B — **Marco, 41, Freelance Designer (Lisbon, Portugal)**

- **JTBD:** _When a client is late, I want to see it in one glance, so I can chase without becoming a spreadsheet clerk._
- **Top pain:** Invoices tracked across email, notes, and memory. Overdue slips through.
- **Success moment:** Business KPI card shows collection %, overdue count, and a one-tap tag filter.
- **Devices:** iPhone PWA, MacBook browser.
- **Primary features:** Business ledgers, payments, overdue signals, export.

### Persona C — **Anjali & Rohan, 35, Shared Household (Mumbai, India)**

- **JTBD:** _When either of us pays for something, the other should see it without asking._
- **Top pain:** Two apps, two lists, no truth.
- **Success moment:** Rohan links his phone via a shared workspace invite; his expense appears on Anjali's dashboard within seconds.
- **Devices:** Two Android phones, occasional tablet.
- **Primary features:** Multi-workspace, invites, sync, notifications.

### Persona D — **Wale, 24, Privacy-Conscious Student (Lagos, Nigeria)**

- **JTBD:** _I want to track my money without any bank ever knowing._
- **Top pain:** Every finance app wants to link accounts and show ads.
- **Success moment:** Installs the PWA offline on a bad connection; encryption badge and "no bank connections" copy is visible in Settings.
- **Devices:** Mid-tier Android, spotty 3G.
- **Primary features:** Offline entry, PWA install, privacy surfaces, export.

### Persona E — **Meera, 52, Small Business Owner (Ahmedabad, India)**

- **JTBD:** _I need one place to see who owes me, when, and how much — that I can hand to my accountant._
- **Top pain:** WhatsApp screenshots as accounting.
- **Success moment:** Exports the month's collections as a clean CSV for her CA.
- **Devices:** Android phone, occasional desktop.
- **Primary features:** Business ledgers, tags, export, currency handling.

---

## 7. User Journey

Journeys are described end-to-end. Each step names the surface, the state contract, and the success signal.

### 7.1 First-run (personal user)

1. **Landing → Sign up** — Email/password, Google OAuth, or phone OTP.
2. **Workspace bootstrapped** — Default workspace created with encryption key.
3. **Onboarding sheet** — Currency + monthly budget prompt (skippable, revisitable via Settings > Finances).
4. **Empty dashboard** — Illustrated empty state, primary CTA "Add your first expense."
5. **First expense** — Bottom sheet, amount pad first, category grid, one-tap save.
6. **Success signal** — Dashboard renders total, remaining budget, and a friendly "You're on track" microcopy.
7. **Install prompt** — After 2 sessions, subtle "Install ExpenStream" banner appears once.

### 7.2 Daily use

1. Open PWA → dashboard first paint < 1 s.
2. Add expense via floating action → save → sheet dismisses → optimistic update.
3. Evening reminder push (if enabled) at user-local time.
4. Weekly digest surfaces trends and any anomaly.

### 7.3 Multi-device linking

1. On device A: Settings > Security > "Link a device" → 10-min token URL.
2. Share URL to device B (QR, message, or paste).
3. Device B visits `/device-link/{token}` → auto-accepts if signed in, else login flow preserves the link.
4. Device B appears in Devices list on device A. Sync begins immediately.

### 7.4 Business ledger flow

1. Toggle Personal → Business (Settings > Appearance or in-app switcher).
2. Business dashboard shows KPI cards (expected, received, collection %, overdue).
3. Create ledger → set expected amount, due date, tags.
4. Record payments as they arrive → progress ring updates → optional reminder scheduled.
5. Export collections as CSV/JSON at month end.

### 7.5 Collaborative household

1. Owner creates invite (MEMBER role, 24 h expiry) in Settings > Members.
2. Shares link.
3. Invitee opens link → previews workspace name, role, inviter → accepts.
4. Both dashboards now reflect a shared source of truth. Audit log records the join.

### 7.6 Recovery / continuity

1. New device: sign in → 2FA (if enabled) → optional device-link via token from an existing device.
2. Data pulled via delta sync, cursor-based.
3. Full backup restore from Settings > Data if needed (JSON v2 format).

---

## 8. Competitive Analysis

Positioning: ExpenStream is not competing on features against bank-linked super-apps. It competes on **trust, calm, and offline-first quality**.

| Competitor                                | Category             | Strength                    | Weakness ExpenStream exploits                                      |
| ----------------------------------------- | -------------------- | --------------------------- | ------------------------------------------------------------------ |
| **Mint / Monarch**                        | Bank-linked PFM      | Auto-import                 | Requires bank credentials; US-centric; ad-supported (Mint legacy). |
| **YNAB**                                  | Envelope budgeting   | Cult community, methodology | Steep learning curve, desktop-first, paid subscription only.       |
| **Wallet by BudgetBakers**                | Cross-region PFM     | Wide bank coverage          | Ads on free tier; monetary data in analytics.                      |
| **Money Manager (Realbyte)**              | Manual entry, mobile | Simple entry                | Dated UI, weak web/PWA, no collaboration.                          |
| **Notion / Sheets templates**             | DIY                  | Total flexibility           | High friction; no offline mobile UX; no push.                      |
| **Splitwise**                             | Group expense splits | Social sharing              | Not a full PFM; no analytics; no business ledger.                  |
| **Zoho Books / QuickBooks Self-Employed** | SMB accounting       | Full accounting             | Overkill; expensive; not privacy-forward.                          |
| **Excel/WhatsApp screenshots (SMB)**      | Informal ledger      | Zero cost, familiar         | No search, no export, no reminders, error-prone.                   |

### 8.1 ExpenStream differentiators

1. **Offline-first PWA** with real background sync — most competitors are online-first native apps.
2. **No bank linking, ever** — an explicit trust promise, surfaced in-app.
3. **One product for personal + micro-business** — Business mode is a first-class toggle, not a separate app.
4. **Editorial, calm design** — restrained color, serif display, ambient motion; a distinct visual identity.
5. **Per-workspace AES-256-GCM encryption** with keys held only in `sessionStorage`.
6. **Ownership by default** — export is a right; account deletion is one flow.

---

## 9. Audit Findings

Snapshot of the current codebase and product state, drawn from repo memory and [AI_CONTEXT.md](AI_CONTEXT.md). Items here feed [Technical Debt](#11-technical-debt) and [Risks](#12-risks).

### 9.1 Strengths verified

- Auth surface breadth (password, Google, OTP, TOTP, Passkeys, device linking) is production-grade.
- RLS enabled across all Postgres tables (migration 012).
- Rate limiting with Postgres-backed sliding window and in-memory fallback.
- Sync engine present with delta cursors, phase observable, and conflict toast surface.
- Analytics surface is unusually deep for a manual-entry PFM (rolling avg, YoY, anomalies, forecast, seasonality, merchant breakdown, time machine).
- Workspace encryption implemented with graceful fallback.
- Test coverage exists across ~40 spec files including accessibility, motion, tokens, sync integration.

### 9.2 Gaps observed

- **`docs/ARCHITECTURE.md` and `docs/SPRINT_BOARD.md` are empty.** They are referenced as sources of truth but currently provide none.
- **Conflict UX** for concurrent edits on the same expense/ledger is not deterministic for money fields — needs an explicit strategy.
- **Push notification reliability** depends on server scheduling; needs retry + dead-letter surface.
- **iOS PWA install** lacks an educational fallback (Safari has no `beforeinstallprompt`).
- **Anomaly text alternatives** for charts (data table view) not yet available on every chart.
- **Dependency update cadence** is manual; no automated PRs or CVE SLA enforcement.
- **Session anomaly detection** (unusual IP / new country) is not surfaced to the user beyond the audit log.
- **Client-side monetary math** must be re-audited to guarantee integer minor units or decimal-safe helpers across every path.

### 9.3 Documentation debt

- ARCHITECTURE.md (empty) — must describe layers, boundaries, data flow, sync contract.
- SPRINT_BOARD.md (empty) — must reflect the current sprint from Horizon 1.
- CHANGELOG.md, RELEASE_NOTES.md, PRODUCTION_CHECKLIST.md, TESTING_CHECKLIST.md — verify freshness at each release.

---

## 10. UX Principles

Derived from and consistent with the UX Philosophy in [AI_CONTEXT.md](AI_CONTEXT.md). Every screen review uses this checklist.

1. **Calm over clever.** The default state is quiet. Alerts earn their place.
2. **Offline-first.** No action requires a network to feel complete. Sync status is honest, not intrusive.
3. **One-thumb reachable.** Primary actions live in the bottom half on mobile.
4. **Progressive disclosure.** Dashboard is calm; power is one tap deeper.
5. **Reversible by default.** Undo, soft-delete, and confirmation only for destructive ops.
6. **Every screen has five states.** Empty, loading, error, offline, success — no exceptions.
7. **Respect attention.** No modals the user didn't ask for. No red unless truly wrong.
8. **Motion is meaning.** Framer transitions communicate state; decoration is banned.
9. **Design tokens are law.** No hard-coded colors, spacing, radii, or motion durations.
10. **Accent is user-owned.** Components inherit; they never hard-code accent hues.
11. **Accessibility is not optional.** WCAG 2.2 AA on every screen; keyboard and screen-reader parity.
12. **Fintech honesty.** Money is displayed with correct locale currency; never truncated silently; never floated.
13. **Copy is human.** "You're on track." "Rent is due Friday." "Worth a check?" — never gamified, never guilt-tripping.

---

## 11. Technical Debt

Tracked as an explicit backlog; each item has an owner in [SPRINT_BOARD.md](SPRINT_BOARD.md) when scheduled.

| #     | Debt                                               | Impact                                   | Proposed remediation                           |
| ----- | -------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| TD-1  | `docs/ARCHITECTURE.md` empty                       | Onboarding + AI-agent context weakened   | Write architecture reference in Sprint 1       |
| TD-2  | `docs/SPRINT_BOARD.md` empty                       | No visible sprint truth                  | Populate from Horizon 1 during Sprint 1        |
| TD-3  | Deterministic conflict resolution for money fields | Risk of silent overwrite                 | Design per-field LWW + user prompt in Sprint 2 |
| TD-4  | Push retry + dead-letter                           | Missed reminders erode trust             | Add server retry + observability in Sprint 2   |
| TD-5  | iOS PWA install education                          | Lower iOS install rate                   | Add Safari-detection educational sheet         |
| TD-6  | Chart text alternatives                            | A11y gap on data-viz screens             | Add data-table view toggle per chart           |
| TD-7  | Dependency update automation                       | Security & maintenance risk              | Introduce Renovate/Dependabot with CVE SLA     |
| TD-8  | Session anomaly UX                                 | Users can't act on odd logins            | Surface anomalies in Security card             |
| TD-9  | Monetary math audit                                | Precision risk                           | Add lint rule + audit pass for float use       |
| TD-10 | Feature-code boundary enforcement                  | `src/lib` vs `src/app/api` drift         | Add ESLint rule forbidding cross-imports       |
| TD-11 | Bundle budget checks in CI                         | Perf regression risk                     | Add size-limit / next-bundle-analyzer gate     |
| TD-12 | Consolidate migration bookkeeping                  | Multiple loose `.sql` files at repo root | Move all migrations under `prisma/migrations`  |

---

## 12. Risks

Risks are scored **Likelihood × Impact** on a 1–5 scale. Mitigations are concrete and owner-assignable.

| ID   | Risk                                                        | L   | I   | Score | Mitigation                                                                |
| ---- | ----------------------------------------------------------- | --- | --- | ----- | ------------------------------------------------------------------------- |
| R-1  | Sync mutation loss under bad network + tab close            | 3   | 5   | 15    | Persistent mutation queue in IndexedDB; retry on `visibilitychange`; TD-3 |
| R-2  | Cross-workspace data leak via a missing guard               | 2   | 5   | 10    | RLS + `requireWorkspaceMember` in every route; guard-coverage test        |
| R-3  | Secret leak in client bundle                                | 2   | 5   | 10    | CI scan for env-var patterns; forbid `NEXT_PUBLIC_` for secrets           |
| R-4  | Dependency CVE unpatched                                    | 3   | 4   | 12    | TD-7 dependency automation + SLA                                          |
| R-5  | Monetary precision bug (float rounding)                     | 3   | 5   | 15    | TD-9 audit + integer minor units helper                                   |
| R-6  | Push service unreliable on iOS                              | 4   | 3   | 12    | Server retries + in-app fallback reminders                                |
| R-7  | Offline conflict silently drops user edits                  | 3   | 5   | 15    | Deterministic conflict UX (TD-3); conflict toast + review sheet           |
| R-8  | Third-party analytics accidentally receives monetary values | 2   | 5   | 10    | Sentry beforeSend scrubber; lint rule for logger usage; audit tests       |
| R-9  | Accessibility regression on a new component                 | 3   | 3   | 9     | Contract test requirement in DoD                                          |
| R-10 | Encryption key lost mid-session (sessionStorage cleared)    | 3   | 3   | 9     | Graceful fallback + one-tap re-fetch flow                                 |
| R-11 | User account lockout without recovery                       | 2   | 4   | 8     | Recovery codes + passkey fallback + email reset                           |
| R-12 | PWA install rate low on iOS                                 | 4   | 2   | 8     | TD-5 educational flow                                                     |
| R-13 | Business ledger overdue signal missed                       | 2   | 4   | 8     | Server-scheduled reminders + weekly digest                                |

---

## 13. Priorities

Priorities are the ranked "what next" filter. When two items compete, the higher-priority theme wins.

**P0 — Non-negotiable, always on:**

1. Data safety: no lost mutations, no silent overwrites of money fields.
2. Security posture: auth, RLS, rate limits, encryption, audit coverage.
3. Privacy: no monetary values or PII to third parties.
4. Accessibility contracts on every new component.

**P1 — Current sprint theme (Horizon 1: Harden):**

1. Sync engine reliability + conflict UX.
2. Notification UX (server retries, quiet-hours, digest correctness).
3. Documentation debt (ARCHITECTURE, SPRINT_BOARD).
4. Business ledger polish (overdue signals, export parity).

**P2 — Next up (Horizon 2: Deepen):**

1. Envelope budgets.
2. Payment reminders (push + email) for ledgers.
3. Session timeline / anomaly surface.
4. Natural-language filter bar for analytics.

**P3 — Later (Horizon 3+):**

1. iOS PWA install education.
2. Client portal for a single ledger.
3. Household activity feed.
4. E2E-encrypted export archive.
5. AI-native surfaces (opt-in).

---

## 14. Milestones

Milestones are outcome-defined, not date-defined. Each closes when its exit criteria are met.

### M1 — Documentation Truth (exit Horizon 1, week 1)

- ARCHITECTURE.md populated with layer diagram, data flow, sync contract, boundary rules.
- SPRINT_BOARD.md reflects live Sprint 1 tasks.
- CHANGELOG and RELEASE_NOTES verified fresh.
- **Exit criteria:** All docs cross-linked from PROJECT_MASTER_PLAN.md; AI agent can bootstrap without asking clarifying questions.

### M2 — Sync Reliability (Horizon 1)

- Mutation queue survives tab close, network loss, and re-auth.
- Deterministic conflict UX for money fields with a user-visible review sheet.
- Sync success ≥ 99.5%, conflict ≤ 0.5% in dogfood telemetry.
- **Exit criteria:** New `syncEngine.reliability.test.ts` suite green; SPRINT_BOARD ticket closed.

### M3 — Notification UX (Horizon 1)

- Server-scheduled evening reminders with retries.
- Weekly digest respects timezone + quiet-hours.
- Failed push observable in ops dashboard.
- **Exit criteria:** ≥ 95% push delivery rate over 7 days; user setting for quiet-hours shipped.

### M4 — A11y Contracts (Horizon 1)

- Contract test template documented.
- Every component under `src/components/` covered by a contract test.
- **Exit criteria:** CI enforces contract-test presence for new components; audit clean.

### M5 — Envelope Budgets (Horizon 2)

- Per-category budgets, per-month overrides, rollover cap respected.
- Analytics surfaces envelope status.
- **Exit criteria:** Full flow tested; DoD met; docs updated.

### M6 — Payment Reminders (Horizon 2)

- Push + email reminders scheduled per ledger due date.
- Snooze + cancel flows.
- **Exit criteria:** Reminder delivery ≥ 95%; opt-out honored.

### M7 — Session Anomaly Surface (Horizon 2)

- New sessions from unusual IPs shown in Security card with revoke.
- **Exit criteria:** Detection false-positive rate ≤ 5% in dogfood.

### M8 — iOS PWA Education (Horizon 3)

- Safari-detected educational sheet with install steps.
- **Exit criteria:** iOS install rate lift measurable in cohort.

---

## 15. Sprint Breakdown

Sprints are 2 weeks. This section defines the first four sprints of Horizon 1. Live task-level state stays in [SPRINT_BOARD.md](SPRINT_BOARD.md).

### Sprint 1 — Docs Truth + Sync Diagnosis

- Populate `docs/ARCHITECTURE.md`.
- Populate `docs/SPRINT_BOARD.md`.
- Instrument sync engine with pull/push counters and conflict counters.
- Reproduce and log a conflict case for a money field.
- **DoD:** Docs cross-linked; telemetry visible; conflict case captured with steps.

### Sprint 2 — Sync Reliability

- Persist mutation queue in IndexedDB across tab close.
- Retry on `online` / `visibilitychange`.
- Deterministic per-field LWW + user prompt for money fields.
- New tests: `syncEngine.reliability.test.ts`, `syncEngine.conflict.test.ts`.
- **DoD:** Milestone M2 exit criteria met.

### Sprint 3 — Notification UX

- Server scheduler with retry + dead-letter.
- Quiet-hours setting in `NotificationSettings`.
- Weekly digest correctness across timezones.
- Ops dashboard for push delivery.
- **DoD:** Milestone M3 exit criteria met.

### Sprint 4 — A11y Contracts + Business Polish

- Contract test template + CI enforcement.
- Coverage of remaining components in `src/components/`.
- Overdue signal refinement in `BusinessKpiCards`.
- Collections export parity with in-app view.
- **DoD:** Milestone M4 exit criteria met; business KPI cards audit passes.

---

## 16. Acceptance Criteria

Global acceptance criteria that any feature or fix must meet before merge. Feature-specific criteria live on the ticket.

### 16.1 Definition of Done (DoD)

- TypeScript strict: no `any`, no `@ts-ignore` without a linked issue.
- ESLint + Prettier clean.
- Unit + integration tests co-located under `src/__tests__/`, all green.
- Zod validation at every API boundary (in and out).
- `requireAuth` + workspace scope guard on every mutating API route.
- Rate limit applied on every auth or sync endpoint.
- New mutations are idempotent and enqueueable by the sync engine.
- No new dependency, migration, or env var without explicit approval.
- No hard-coded colors, spacing, radii, or motion durations — tokens only.
- Every new interactive element ≥ 44×44 px, keyboard operable, screen-reader labeled.
- `prefers-reduced-motion` honored in every Framer variant.
- Empty, loading, error, and offline states designed and implemented.
- Docs updated: relevant `docs/*.md` reflect the change; CHANGELOG entry added.
- No monetary values or PII in logs, analytics, or third-party payloads.

### 16.2 Performance acceptance

- Route-level JS gz within bundle budget (Dashboard ≤ 180 KB gz).
- LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on mid-tier Android over 3G.
- No layout shift from font loading (`next/font`, `display: swap`).

### 16.3 Security acceptance

- OWASP Top 10 review pass.
- New tables have RLS enabled and covered by a guard test.
- Sentry captures do not include monetary values or PII.
- Audit log entry emitted for any privileged action.

### 16.4 Accessibility acceptance

- WCAG 2.2 AA verified with automated + manual pass on the affected screen.
- Focus rings visible via accent token.
- Color never the sole channel — pair with icon, label, or shape.
- Charts have a text-alternative view.

### 16.5 Sync & offline acceptance

- Feature works with no network from first render.
- Mutations survive tab close and reappear on next open.
- Conflict scenarios have a user-visible resolution path.

---

## 17. Future Features

Explicitly out of current scope, tracked to inform architecture but not prioritized until a horizon owner claims them.

1. **AI-native surfaces (opt-in).**
   - On-device categorization suggestions (no server-side monetary values).
   - Natural-language "ask your money" query bar with local-only tokenization.
   - Anomaly explanations rendered as calm inline suggestions.
2. **End-to-end encrypted export archive.** Passphrase-protected, decryptable outside the app.
3. **Read-only client portal.** A signed, expiring URL that shows a single ledger to a customer.
4. **Household activity feed.** Opt-in, workspace-scoped, redactable.
5. **Recurring income tracking.** Symmetric to recurring expenses; feeds forecasting.
6. **Tax-aware category tags.** GST/VAT tagging for SMB export.
7. **Widgets and complications.** iOS/Android home-screen widgets via PWA widget spec once broadly supported.
8. **Smart split (personal ↔ shared workspace).** Route an expense to a shared workspace with one tap.
9. **Watch face / wearable capture.** Voice-to-expense on wearable devices, offline queued.
10. **Rules marketplace.** Shareable, importable auto-categorization rule packs (no data leaves the workspace).
11. **Multi-account within a workspace.** Separate cash/card/UPI ledgers under one workspace.
12. **Investment ledger (view-only).** Manual entry of holdings, no bank scraping.
13. **Team-of-1 accountant handoff.** One-tap encrypted package for an accountant, with revocation.

---

## Appendix — Cross-references

- Product mission, principles, and standards: [AI_CONTEXT.md](AI_CONTEXT.md).
- Architecture, layers, and boundaries: [ARCHITECTURE.md](ARCHITECTURE.md) _(pending — TD-1)_.
- Design tokens and components: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- Live sprint state: [SPRINT_BOARD.md](SPRINT_BOARD.md) _(pending — TD-2)_.
- Release readiness: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md).
- QA gates: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md).
- History: [CHANGELOG.md](CHANGELOG.md), [RELEASE_NOTES.md](RELEASE_NOTES.md).
