<!--
  AI_CONTEXT.md — Permanent Project Memory for ExpenStream
  Owner: AI Engineering Team
  Audience: AI agents (Copilot, Claude, GPT). Human-readable, AI-optimized.
  Rule: Keep under two printed pages. Update in place; never fork.
-->

# ExpenStream — AI_CONTEXT

## 1. Product Mission

Give individuals and small businesses a calm, private, offline-first way to see, understand, and shape their money — daily expenses, recurring costs, budgets, and business collections — without spreadsheets or bank connections.

## 2. Target Audience

- Salaried professionals tracking monthly cash flow.
- Freelancers / SMB owners managing client collections (business ledgers).
- Privacy-conscious users who reject bank scraping and ad-driven finance apps.
- Multi-device households sharing a workspace.
- Primary geographies: India, SEA, EMEA. Mobile-first, PWA-first.

## 3. User Problems

- "Where did my money go this month?" — no fast, honest answer.
- Manual entry apps feel like data-entry punishment, not insight.
- Bank-linked apps leak data or miss cash / UPI / split payments.
- Recurring subscriptions and rent silently eat the budget.
- Small businesses lose track of who owes what and when.
- Users switch phones/browsers and lose history.

## 4. Product Personality

Quiet, precise, respectful. A skilled accountant who never lectures.
Tone: confident, minimal, human. Never gamified, never guilt-tripping, never "hustle."
Voice examples: "You're on track." / "Rent is due Friday." / "This looks unusual — worth a check?"

## 5. UX Philosophy

- Offline-first: every action works without a network; sync is invisible.
- One-thumb reachable: primary actions live in the bottom half on mobile.
- Progressive disclosure: dashboard is calm; power lives one tap deeper.
- Zero-configuration first run: user sees value in under 30 seconds.
- Reversible by default: undo, soft-delete, confirm only for destructive ops.
- Respect attention: no modals unless the user asked; no red unless truly wrong.

## 6. UI Philosophy

- Design tokens over hard-coded values (see `docs/DESIGN_SYSTEM.md`).
- Editorial typography, generous whitespace, restrained color.
- Motion is meaning: Framer Motion for state transitions, never decoration.
- Charts are Visx, minimal chrome, currency-aware axes.
- Dark, light, and sunset themes are first-class, not afterthoughts.
- Accent color is user-owned; components must inherit, never hard-code.

## 7. Fintech Principles

- The user's data belongs to the user. Export is a right, not a feature.
- No third-party analytics on financial values. Ever.
- Money is displayed with locale-correct currency and never truncated silently.
- All monetary math uses integer minor units or decimal-safe helpers — never binary float.
- Idempotent writes for every mutation that touches money.
- Audit every privileged action server-side.

## 8. Design Goals

- Time-to-first-expense < 30s on a cold PWA install.
- Dashboard first paint < 1s on mid-tier Android over 3G.
- Every screen has: empty state, loading state, error state, offline state.
- 100% keyboard operable, 100% screen-reader labeled.
- Feels native on iOS, Android, and desktop — one codebase.

## 9. Engineering Principles

- Next.js App Router, React Server Components where safe, Client Components where interactive.
- Server is the source of truth; client (IndexedDB via Dexie) is a cache with a mutation queue.
- Strict workspace isolation: every query scoped by `workspaceId`, enforced in guards.
- Zod at every boundary (API in, API out, storage in).
- Prisma is the only path to Postgres; no raw SQL in feature code.
- Feature code never imports from `src/app/api/**`; shared logic lives in `src/lib`.
- Tests co-located under `src/__tests__/`; new logic ships with tests.

## 10. Coding Standards

- TypeScript strict, `noImplicitAny`, no `// @ts-ignore` without a linked issue.
- ESLint + Prettier are law; do not disable rules locally without justification.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities.
- One default export per component file; named exports for utilities.
- No new dependencies without checking bundle impact and license.
- Comments explain _why_, not _what_. Delete dead code; do not comment it out.
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## 11. Performance Standards

- Lighthouse (mobile): Performance ≥ 90, PWA ≥ 100, Best Practices ≥ 95.
- LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 on mid-tier Android.
- Initial JS ≤ 180KB gz for the dashboard route; lazy-load charts and settings.
- No layout shift from font loading — use `next/font` with `display: swap`.
- Images via `next/image`; icons via inline SVG or Lucide.
- Sync engine must never block the main thread; heavy math off-main where possible.

## 12. Accessibility Standards

- WCAG 2.2 AA minimum; AAA for text on primary surfaces.
- Every interactive element ≥ 44×44px hit target.
- Focus rings are visible and use the accent token, not `outline: none`.
- All charts have text alternatives / data tables for screen readers.
- Color is never the sole channel — pair with icon, label, or shape.
- Respect `prefers-reduced-motion` in every Framer variant.

## 13. Security Standards

- OWASP Top 10 is the baseline; treat every input as hostile.
- Auth: JWT access (15m) + opaque refresh (30d, SHA-256 at rest) + optional TOTP 2FA + Passkeys.
- Rate limiting on every auth and sync endpoint (Postgres-backed, in-memory fallback).
- AES-256-GCM workspace encryption for sensitive fields; key held in sessionStorage only.
- Secrets only in env vars; never in the client bundle, never committed.
- RLS enabled on every Postgres table (see migration 012).
- Audit log for privileged actions: device links, invites, member removal, password change.
- Sentry captures errors, never PII or monetary values.

## 14. Modern 2026 UI Trends

- Editorial minimalism: serif display type paired with geometric sans body.
- Ambient motion: micro-parallax, subtle depth, no bounce.
- AI-native surfaces: inline explanations, natural-language filters, quiet suggestions.
- Adaptive theming: sunset/dawn palettes shift with local time.
- Spatial layouts: card stacks and sheets over deep nav trees.
- Data as story: ridge lines, sparklines, and typographic numbers over dashboards.
- Privacy badges are a design element, not fine print.

## 15. Current Project Status

- Stack: Next.js 15 (App Router) + React 19 + TypeScript + Prisma + Postgres (Supabase) + Dexie + Tailwind + Framer Motion + Visx + Sentry.
- Auth: email/password, Google OAuth, phone OTP, TOTP 2FA, Passkeys, device linking.
- Features live: expenses, recurring, budgets, goals, analytics (rolling avg, YoY, anomalies, forecast), business ledgers, multi-workspace, invites, push notifications, PWA install, offline sync, export/import.
- Migrations through `013_rate_limit_table.sql` applied.
- Test suite: Jest, ~40 spec files under `src/__tests__/`.
- Known state: production checklist in `docs/PRODUCTION_CHECKLIST.md`; release notes in `docs/RELEASE_NOTES.md`.

## 16. Current Sprint

- Sprint board: `docs/SPRINT_BOARD.md` (source of truth once populated).
- Focus theme: hardening — accessibility contracts, sync reliability, notification UX.
- Definition of done: typed, tested, a11y-checked, offline-verified, docs updated.

### 16.1 Sync-engine debug toggle — `NEXT_PUBLIC_SYNC_LOG`

- `src/lib/syncEngine.ts` gates verbose console output behind `SYNC_LOG = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SYNC_LOG === "true"`.
- **Enable in a build:** add `NEXT_PUBLIC_SYNC_LOG=true` to `.env.local` (dev) or Vercel's production env vars, then rebuild. `NEXT_PUBLIC_*` values are baked in at build time.
- **Disable:** unset or set to any other value and rebuild.
- **Runtime overrides:** none — this flag is compile-time only. Do not read it from `localStorage`.
- **Sample output (tags prefixed with `[sync:…]`):**
  ```
  [sync:init] Starting sync engine…
  [sync:pull] Fetching changes for workspace=abcd1234… since=cursor-9f2
  [sync:pull] Received: 3 expenses, 0 settings, 0 ledgers, 0 payments, cursor=cursor-a01, hasMore=false
  [sync:push] Pushing 2 mutations for workspace=abcd1234…
  [sync:push] Server response: applied,applied
  ```
- **Privacy caveats — read before enabling in production:**
  - The helpers never log request/response bodies or `data` payloads, so monetary values, categories, and remarks stay out of the console. Do **not** add ad-hoc `console.log(mutation.data)` — it would leak PII/money.
  - Workspace IDs are truncated to the first 8 chars.
  - `syncErr` also captures to Sentry; leaving the flag on will not create duplicate Sentry events (only console verbosity changes).
  - In-memory session counters exposed via `getSyncCounters()` and the Settings › Sync Diagnostics panel are safe to share (no PII/money) and reset on tab close.

## 17. Current Priorities

1. Keep the dashboard and expense-entry flow fast, calm, and offline-perfect.
2. Sync engine reliability: no lost mutations, no duplicate writes, clear conflict UX.
3. Security posture: rate limits, RLS, audit coverage, dependency updates.
4. Business ledger polish: collections KPIs, overdue signals, export parity.
5. Accessibility contracts: every new component ships with a contract test.
6. Documentation: keep `docs/*.md` truthful; update alongside code.

## 18. AI Rules

- Read this file first. Then read `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, and any repo memory under `/memories/repo/` before large changes.
- Do not modify application code unless the user explicitly asks.
- Prefer editing existing files over creating new ones; never create docs to describe your own changes.
- Never introduce new dependencies, migrations, or env vars without asking.
- Never weaken security (auth, RLS, rate limits, encryption) to make a task easier.
- Never log, display, or send monetary values or PII to third parties.
- Use design tokens; never hard-code colors, spacing, radii, or motion durations.
- Every new interactive element must be keyboard- and screen-reader-accessible.
- Every new API route must: validate with Zod, enforce `requireAuth` + workspace scope, rate-limit, and return typed errors.
- Every new mutation must be idempotent and enqueueable by the sync engine.
- When in doubt, ask one clarifying question; otherwise pick the smallest reversible change and proceed.
- Keep this file under two pages. If you must add, remove something staler first.


---

**Last reviewed:** 2026-07-23
