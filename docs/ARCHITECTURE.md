<!--
  ARCHITECTURE.md — Technical architecture reference for ExpenStream
  Owner: AI Engineering
  Audience: Engineers, AI agents, security reviewers, new contributors.
  Companion docs: AI_CONTEXT.md, PROJECT_MASTER_PLAN.md, DESIGN_SYSTEM.md,
                  PRODUCTION_CHECKLIST.md, TESTING_CHECKLIST.md.
  Rule: This document describes what exists today. Update in place when the
        architecture changes; do not fork. Link, don't duplicate.
-->

# ExpenStream — Architecture

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-21

This document describes the runtime shape of ExpenStream: how the code is organized, how requests flow from the browser to Postgres, how state and cache layers interact, and which primitives every feature is expected to reuse. It is deliberately concrete — every layer names the files, folders, and libraries that implement it.

For **why** we build this way, see [AI_CONTEXT.md](AI_CONTEXT.md) (engineering principles) and [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md) (product goals). For **how it looks**, see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

---

## 1. High-Level Overview

ExpenStream is a **Next.js 15 App Router** application deployed as a **PWA**. It is **offline-first**: the browser (IndexedDB via Dexie) is the working store, and the server (Postgres via Prisma + Supabase) is the source of truth. A mutation queue and a delta-sync engine reconcile the two.

```
┌───────────────────────────── Browser (React 19 / PWA) ─────────────────────────────┐
│                                                                                    │
│  ┌────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐  │
│  │  App Shell │──▶│  React tree  │──▶│   Hooks      │──▶│  Dexie (IndexedDB)    │  │
│  │  (RSC+CC)  │   │  (contexts,  │   │  (queries,   │   │  expenses / settings  │  │
│  │            │   │   stores)    │   │   mutations) │   │  ledgers / payments   │  │
│  └────────────┘   └──────────────┘   └──────┬───────┘   │  + mutation queue     │  │
│                                             │           └──────────┬────────────┘  │
│                                             ▼                      │               │
│                                      ┌──────────────┐               │               │
│                                      │ syncEngine   │◀──────────────┘               │
│                                      │ (delta pull, │                               │
│                                      │  queue push) │                               │
│                                      └──────┬───────┘                               │
│                                             │ authFetch (JWT Bearer)                │
│                                             │  + workspaceId header                 │
└─────────────────────────────────────────────┼───────────────────────────────────────┘
                                              ▼
┌─────────────────────────────────── Edge / Node runtime ────────────────────────────┐
│  middleware.ts  ── fast-fail for missing Bearer on protected /api/*                │
│  /api/**        ── Route Handlers (App Router)                                     │
│  requireAuth ─▶ requireWorkspaceMember ─▶ rateLimit ─▶ Zod ─▶ handler ─▶ Prisma    │
└─────────────────────────────────────────────┬──────────────────────────────────────┘
                                              ▼
┌────────────────────────────────── Postgres (Supabase) ─────────────────────────────┐
│  RLS enabled on every table (migration 012)                                        │
│  Users · Workspaces · Memberships · Devices · Sessions · Invites · DeviceLinks     │
│  Expenses · WorkspaceSettings · BusinessLedgers · BusinessPayments                 │
│  PushSubscriptions · AuditLog · RateLimit · VerificationTokens · SyncCursor        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

External services: **Sentry** (errors), **Resend** (transactional email), **Frankfurter / currency-api** (FX rates, no financial values sent), **web-push + VAPID** (notifications), **Google OAuth**.

---

## 2. Folder Structure

Top-level layout of the repository. Application code lives under [src/](../src).

```
expense-tracker/
├── docs/                           # Product + engineering docs (this file, PRD, design system, …)
├── prisma/
│   ├── schema.prisma               # Postgres schema — the single DB source of truth
│   └── migrations/                 # 013 numbered SQL migrations (RLS, rate limit, etc.)
├── prompts/                        # Reusable AI prompts
├── public/                         # Static PWA assets
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker (cache + push + background sync)
│   └── icons/                      # App icons + version.json
├── scripts/                        # Build / DB helpers (db-push.js, gen-icons.js)
├── sprint-reports/                 # Sprint retros
├── src/
│   ├── middleware.ts               # Edge middleware — Bearer gate for /api/*
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx, providers.tsx, globals.css
│   │   ├── page.tsx                # Dashboard entry
│   │   ├── error.tsx, not-found.tsx
│   │   ├── analytics/              # Analytics page + child routes
│   │   ├── business/               # Business ledger surfaces
│   │   ├── expenses/, category/    # Expense list + category detail
│   │   ├── settings/               # Zoned settings surface
│   │   ├── auth/, login/           # Auth flows (magic link, callbacks)
│   │   ├── device-link/[token]/    # Device linking landing
│   │   ├── invite/[token]/         # Invite acceptance landing
│   │   ├── landing/, privacy/, terms/
│   │   └── api/                    # Route Handlers (see §4)
│   │       ├── auth/               # register, login, refresh, 2fa, passkey, google, …
│   │       ├── devices/            # link / list / revoke
│   │       ├── invites/            # preview / accept
│   │       ├── push/               # vapid-key, subscribe, send
│   │       ├── sessions/           # session list / revoke
│   │       ├── sync/               # changes (delta pull), commit (queue push)
│   │       └── workspaces/         # settings, members, encryption-key
│   ├── components/                 # React components (see §3)
│   │   ├── ui/                     # Primitives: Toast, BottomSheet, EmptyState, Skeleton, …
│   │   ├── app/, layout/           # AppShell + navigation
│   │   ├── dashboard/, expenses/   # Feature surfaces
│   │   ├── analytics/, business/   # Feature surfaces
│   │   ├── settings/, goals/       # Feature surfaces
│   │   ├── motion/, onboarding/    # Cross-cutting
│   │   ├── providers/              # Client-side providers (Auth, Theme, Calculations)
│   │   ├── pwa/                    # InstallButton, service-worker glue
│   │   └── sync/                   # SyncIndicator, conflict UI
│   ├── contexts/                   # React contexts (CalculationsContext)
│   ├── hooks/                      # 30+ custom hooks (see §11)
│   ├── lib/                        # Client-safe libs + server-only under lib/server
│   │   ├── server/                 # Node-only: prisma, guards, rateLimit, tokens, email, …
│   │   ├── motion/, firebase/      # Namespaced helpers
│   │   ├── db.ts                   # Dexie schema
│   │   ├── syncEngine.ts           # Delta pull + mutation queue
│   │   ├── authClient.ts           # Token storage, authFetch wrapper
│   │   ├── crypto.ts               # AES-256-GCM helpers
│   │   ├── validators.ts           # Zod schemas
│   │   ├── calculations.ts         # Budget / analytics math
│   │   └── …                       # constants, mappers, filters, currency, OCR, …
│   ├── stores/                     # Zustand stores (uiStore.ts)
│   ├── types/                      # Shared TS types
│   └── __tests__/                  # Jest specs (co-located domain)
├── firestore.rules                 # Legacy — Firestore fully disabled
├── supabase-*.sql                  # Legacy setup scripts (kept for reference)
├── sentry.{client,server,edge}.config.ts
├── next.config.ts                  # CSP, headers, Sentry, bundle analyzer
├── prisma.config.ts, tsconfig.json, jest.config.js
└── package.json
```

Import boundaries (enforced by convention, checked in review):

- Feature code (`src/components/**`, `src/hooks/**`) **never** imports from `src/app/api/**`. Shared logic lives in `src/lib/**`.
- `src/lib/server/**` is Node-only and **never** imported into client bundles.
- Direct `@prisma/client` and `pg` imports are confined to `src/lib/server/prisma.ts`.

---

## 3. Frontend Architecture

Next.js App Router with **React Server Components** for shell/layout and **Client Components** for anything interactive. React 19 with the React Compiler (`babel-plugin-react-compiler`) is enabled.

### 3.1 Rendering model

- `src/app/layout.tsx` — root RSC layout: fonts (`next/font`), CSP-safe globals, `providers.tsx`.
- `src/app/providers.tsx` — client boundary: `AuthProvider`, `ThemeProvider`, `CalculationsProvider`, `ToastProvider`, error boundary.
- Feature pages (`analytics`, `business`, `settings`, `expenses`, dashboard) are Client Components because they read Dexie via hooks (`useDexieQuery`) and subscribe to sync events.
- Route segments use `error.tsx`, `not-found.tsx`, and Suspense boundaries for empty/loading states.

### 3.2 Layout system

- `AppShell` (`src/components/layout/`) provides top bar, bottom nav, sync indicator, and safe-area padding for iOS PWA.
- Mobile-first, one-thumb reachability: primary actions live in the bottom half; nav in a fixed bottom tab bar.
- `BottomSheet` (`src/components/ui/BottomSheet.tsx`) is the standard modal on mobile; desktop uses inline panels.

### 3.3 Styling and design tokens

- **Tailwind CSS v4** with PostCSS (`postcss.config.mjs`, `@tailwindcss/postcss`).
- All colors, spacing, radii, and motion durations flow through CSS custom properties defined in `src/app/globals.css` and consumed by Tailwind utilities.
- Accent color is user-owned; components inherit via `--color-accent` and must never hard-code hex values (enforced by `colorTokenConsistency.test.ts` and `designTokens.test.ts`).
- Themes: light, dark, sunset — all first-class, set via a data attribute on `<html>`.

### 3.4 Motion

- **Framer Motion v12** with shared variants in `src/lib/motion/` and `src/components/motion/`.
- `prefers-reduced-motion` is honored by every variant (contract tested in `motionTokens.test.ts` and `motionVariants.test.ts`).

### 3.5 Charts

- **Visx** (Airbnb) — `@visx/curve`, `@visx/gradient`, `@visx/group`, `@visx/responsive`, `@visx/scale`, `@visx/shape`.
- Custom SVG components (`RollingAverageChart`, `YearOverYearChart`, `RidgeLine`, `LedgerProgressRing`, `CollectionChart`) render server-safe SVG with currency-aware axes.

### 3.6 Accessibility contracts

- Every interactive element ≥ 44×44 px, visible focus ring using the accent token.
- Screen-reader labels asserted by `accessibilityContracts.test.ts`, `touchTargets.test.ts`, `componentContracts.test.ts`, `phaseFContracts.test.ts`.

---

## 4. Backend Architecture

The backend is a set of **Next.js Route Handlers** running on the Node runtime, backed by Postgres via Prisma. There is no separate server process.

### 4.1 Request lifecycle

1. Browser calls a `/api/*` route through `authFetch` (attaches Bearer + optional `x-workspace-id`).
2. **Edge middleware** (`src/middleware.ts`) fast-fails any protected route missing the `Authorization: Bearer …` header. Publicly-listed routes (login, register, invite preview, VAPID key, cron push) pass through.
3. The Route Handler runs on Node: `requireAuth()` → `requireWorkspaceMember()` → `checkRateLimit()` → Zod `parse()` → business logic → Prisma → typed JSON response.
4. Errors return via `jsonError()` with a consistent shape; unexpected errors bubble to Sentry with PII/money stripped.

### 4.2 Route Handler skeleton

Every mutation route follows the same skeleton (see any file under `src/app/api/**`):

```ts
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const ws = await requireWorkspaceMember(auth.userId, req);
  if (!ws.ok) return ws.response;

  const rl = await checkRateLimit({
    bucket: "route-name",
    key: `${auth.userId}:${getClientIp(req)}`,
    limit: N,
    windowSeconds: 60,
  });
  if (!rl.ok)
    return jsonError(429, "Too many requests", {
      headers: { "Retry-After": String(rl.retryAfter) },
    });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return jsonError(400, "Invalid input", { details: parsed.error.flatten() });

  // …handler logic — Prisma calls scoped by workspaceId…
}
```

### 4.3 Runtime concerns

- **Prisma client** is a lazily-initialized singleton in `src/lib/server/prisma.ts` using `@prisma/adapter-pg` on top of `pg`.
- **Server-only modules** live under `src/lib/server/**` and use `"server-only"` imports where needed.
- **Cron / scheduled jobs** call `/api/push/send` guarded by a `CRON_SECRET` (whitelisted in middleware).
- **Bundle analyzer** available via `ANALYZE=true npm run build` (`@next/bundle-analyzer`).

---

## 5. API Layer

All server capabilities are exposed as HTTP JSON endpoints under `/api/**`. Grouped by domain:

| Group          | Route (verb)                                                                                              | Purpose                                               |
| -------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Auth**       | `POST /api/auth/register`                                                                                 | Create user + default workspace                       |
|                | `POST /api/auth/login`                                                                                    | Password login, may return `requires2FA` challenge    |
|                | `POST /api/auth/login/verify-2fa`                                                                         | Complete 2FA with TOTP or recovery code               |
|                | `POST /api/auth/refresh`                                                                                  | Exchange refresh cookie for new access token          |
|                | `POST /api/auth/logout`                                                                                   | Revoke session                                        |
|                | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`                                         | Password recovery via emailed token                   |
|                | `POST /api/auth/verify-email`, `POST /api/auth/magic-link`                                                | Email verification and magic-link login               |
|                | `GET  /api/auth/google`, `GET /api/auth/google/callback`, `POST /api/auth/google/exchange`                | Google OAuth flow                                     |
|                | `POST /api/auth/passkey/register-options`, `.../register-verify`, `.../login-options`, `.../login-verify` | WebAuthn/Passkey flow                                 |
|                | `POST /api/auth/2fa/setup`, `.../verify`, `.../disable`, `.../recovery-codes`                             | TOTP lifecycle                                        |
|                | `POST /api/auth/change-password`, `POST /api/auth/delete-account`                                         | Account maintenance                                   |
|                | `GET  /api/auth/encryption-key`                                                                           | Fetch workspace encryption key for the session        |
|                | `GET  /api/auth/check`, `GET /api/auth/profile`                                                           | Session probe + profile                               |
| **Devices**    | `GET /api/devices`, `POST /api/devices`, `DELETE /api/devices/[id]`                                       | List, generate device-link token, revoke              |
| **Sessions**   | `GET /api/sessions`, `DELETE /api/sessions/[id]`                                                          | List active sessions, revoke                          |
| **Invites**    | `GET /api/invites/preview`, `POST /api/invites`, `POST /api/invites/[token]`, `DELETE /api/invites/[id]`  | Public preview, create, accept, revoke                |
| **Workspaces** | `GET/PATCH /api/workspaces/settings`, `GET/POST/DELETE /api/workspaces/members`                           | Settings blob + member management                     |
| **Sync**       | `GET /api/sync/changes?since=…`                                                                           | Delta pull for expenses/settings/ledgers/payments     |
|                | `POST /api/sync/commit`                                                                                   | Server-side idempotent write of queued mutations      |
| **Push**       | `GET /api/push/vapid-key`, `POST/DELETE /api/push/subscribe`, `POST /api/push/send`                       | VAPID key, subscription CRUD, cron-triggered dispatch |

Conventions enforced across every route:

- **Zod on both boundaries** — input parsed with `safeParse`, output typed and stable.
- **Rate limits** — every auth/sync/push endpoint gets a sliding-window bucket in `rate_limits` (Postgres) with an in-memory fallback for local dev.
- **Standard error shape** — `{ error: string, details?: unknown }` with correct HTTP status (400/401/403/404/409/410/429/500).
- **No monetary values in error strings**, ever. Sentry breadcrumbs are scrubbed for PII.

---

## 6. Authentication

Full flow lives under `src/lib/server/{tokens,guards,password,totp,webauthn}.ts` and `src/lib/authClient.ts`. See §4 of `AI_CONTEXT.md` for policy; the runtime detail is here.

### 6.1 Tokens

| Token                  | Lifetime | Storage                         | Purpose                                             |
| ---------------------- | -------- | ------------------------------- | --------------------------------------------------- |
| **Access JWT (HS256)** | 15 min   | Memory (client)                 | Bearer for `/api/*`. Payload: `sub, sid, did, wid`. |
| **Refresh token**      | 30 d     | HttpOnly Secure SameSite cookie | Opaque 32-byte, SHA-256 hash stored in `sessions`.  |
| **2FA challenge JWT**  | 5 min    | Memory (client)                 | Bridges password → TOTP step.                       |
| **Password reset**     | 15 min   | Server (`verification_tokens`)  | One-time; single use.                               |
| **Device-link token**  | 10 min   | Server (`device_links`)         | SHA-256 hash + workspace scope.                     |
| **Invite token**       | 15 m–7 d | Server (`invites`)              | Role-bound, single-use, revocable.                  |

### 6.2 Login modes

- Email + password (bcryptjs).
- **Google OAuth** (`/api/auth/google/*`).
- **Phone OTP** (via email/sms channel per migration 004).
- **Passkeys / WebAuthn** using `@simplewebauthn/server` (`passkeys` table).
- **TOTP 2FA** using `otpauth`, provisioned with a QR code and 10 recovery codes.
- **Magic links** via Resend.

### 6.3 Guards

`src/lib/server/guards.ts`:

- `requireAuth(req)` — parses `Authorization: Bearer`, verifies JWT with `jose`, confirms the session row exists and is not revoked/expired, returns `{ userId, sessionId, deviceId, workspaceId }`.
- `requireWorkspaceMember(userId, req)` — resolves the target workspace (JWT `wid` or `x-workspace-id` header), confirms membership, returns role.
- `requireWorkspaceAdmin(...)` — same, restricted to `OWNER | ADMIN`.
- `getClientIp(req)` — trusted-proxy-aware extraction for rate limits and audit hashing.
- `jsonError(status, message, opts?)` — canonical error response.

### 6.4 Device linking and multi-device continuity

- Device A creates a token at `POST /api/devices`; a 10-min URL is shared to device B.
- Device B visits `/device-link/[token]`; if signed in, the token is consumed and a `Device` row is bound to device B's session. Otherwise the token is preserved through the login flow.
- Sessions carry `deviceId`, so `revoke` cleanly logs a single device out.

### 6.5 PIN lock (installed PWA)

`usePinLock` gates access on a hashed PIN stored in IndexedDB (`src/hooks/usePinLock.ts`). It is a **client-side lock**, not an auth factor — the server still requires a valid session.

---

## 7. State Management

Multiple orthogonal stores; each has a narrow job. The **golden rule**: server state → Dexie (via query hooks); ephemeral UI state → Zustand; cross-cutting derived state → React Context.

### 7.1 Zustand — `src/stores/uiStore.ts`

Ephemeral UI state only. Persisted subsets go to `localStorage` (app mode) or the URL (month/year via `useMonthUrlSync`).

Fields include: current month/year, active category filter, search query, theme, expense form visibility + prefill, ledger form state, active ledger id, postcard visibility, app mode (`personal | business`).

### 7.2 React Context — `src/contexts/CalculationsContext.tsx`

Provides derived monthly aggregates (budget usage, forecast, anomalies, daily totals) so that dashboard, analytics, and notifications share **one** computation per month/year. Reads from Dexie query hooks and the settings store.

### 7.3 Hook-level query cache — `src/hooks/useDexieQuery.ts`

Custom subscribable primitive that binds a component to a live Dexie query. Recomputes on Dexie writes and on `onSyncPull` events, so an incoming server change re-renders the tree without full page reloads.

### 7.4 Settings store — `src/hooks/settingsStore.ts` + `settingsSync.ts`

A dedicated observable for the per-workspace settings blob (`WorkspaceSettings`). Wraps optimistic updates, debounced writes, and delta-merge with the last server snapshot.

### 7.5 Auth store — `src/lib/authClient.ts`

Holds the access token in memory, exposes `authFetch`, `subscribeAuth`, `getActiveWorkspaceId`, and refresh-on-401 logic. Never touches `localStorage` for the access token.

---

## 8. Database

**Postgres (Supabase)** managed with **Prisma 7**. Schema in `prisma/schema.prisma`; migrations under `prisma/migrations/`.

### 8.1 Core tables

Auth + identity: `users`, `passkeys`, `sessions`, `verification_tokens`, `audit_logs`.

Workspace + collaboration: `workspaces`, `memberships`, `devices`, `device_links`, `invites`.

Domain: `expenses`, `workspace_settings` (JSONB blob), `business_ledgers`, `business_payments`.

Infrastructure: `push_subscriptions`, `rate_limits`, `sync_cursors`.

Every domain table carries `workspaceId`, `createdAt`, `updatedAt`, `deletedAt` (soft-delete) and is indexed on `(workspaceId, updatedAt)` for cursor-based delta sync.

### 8.2 Row-Level Security

Migration `012_enable_rls_all_tables.sql` enables **RLS on every table**. Policies constrain reads/writes to rows whose `workspaceId` matches the caller's active membership. This is defense-in-depth on top of `requireWorkspaceMember` — a bug in the guard cannot leak cross-workspace data.

### 8.3 Migration history

`001`→`013` covers: initial schema, auth, Google OAuth, phone OTP, device client id, new settings columns, expense currency, workspace encryption key, achievements/accent color, push + notification prefs, verification tokens, RLS-all-tables, rate-limit table.

[`prisma/migrations/`](../prisma/migrations) is the **sole authoritative** history. [`prisma/legacy/`](../prisma/legacy) archives the pre-Prisma Supabase SQL files (`supabase-setup.sql`, `supabase-migration*.sql`) for provenance only — see [`prisma/legacy/README.md`](../prisma/legacy/README.md) and [ADR-0001](adr/0001-postgres-over-firestore.md). Nothing under `prisma/legacy/` is applied by `prisma migrate`.

### 8.4 Client-side (IndexedDB via Dexie)

`src/lib/db.ts` defines four Dexie tables — `expenses`, `settings`, `ledgers`, `payments` — plus a `mutations` queue table. Records mirror server shape, with numeric timestamps and workspace scoping. Types `IDBExpense`, `IDBSettings`, `IDBLedger`, `IDBPayment`, `IDBMutation` are the client contract.

---

## 9. Caching

There is no separate cache tier (no Redis). Caching is layered:

- **HTTP** — `next.config.ts` sets `Cache-Control: public, max-age=0, must-revalidate` for icons/favicon; App Router uses `dynamic = "force-dynamic"` for authed routes. CDN edges are safe because `/api/*` bodies vary by Authorization.
- **Client browser cache** — `sw.js` caches the app shell (network-first for HTML, cache-first for hashed assets).
- **Dexie (IndexedDB)** — the durable client cache of the domain. Query hooks (`useExpenses`, `useLedgers`, `usePayments`, `useDexieQuery`) subscribe and re-render on writes.
- **In-memory** — `settingsStore` and `CalculationsContext` memoize derived values per render pass.
- **Prisma** — connection pooling via `@prisma/adapter-pg` + `pg` pool. Reads are not aggressively cached; RLS + workspace scoping make a shared cache tricky, and the sync engine already reduces read traffic to deltas.
- **Rate-limit counters** — Postgres `rate_limits` (durable) with an in-memory fallback (per-instance, best-effort) for local dev.

---

## 10. Repositories

There is no formal repository pattern layer. Data access is thin and Prisma-centric.

- **Server domain access**: Route Handlers call `prisma.<model>.<op>(...)` directly, always with `where: { workspaceId, deletedAt: null }`.
- **Client domain access**: Hooks read Dexie tables through `src/lib/db.ts`. The mutation queue in `mutations` is the only write path — direct writes bypass sync and are forbidden.
- **Mappers**: `src/lib/mappers.ts` translates between server DTOs (Prisma types) and IDB records (numeric timestamps, decrypted payloads).
- **Encryption boundary**: `crypto.ts` transparently encrypts/decrypts fields marked as sensitive when a workspace encryption key is present in `sessionStorage`. When absent, plaintext round-trip is allowed (graceful degradation) and a Sentry breadcrumb notes the fallback.

If the domain grows beyond ~15 models, extracting `src/lib/server/repositories/*` per aggregate (Expense, Ledger, Settings, Workspace) is called out under §17.

---

## 11. Services

Reusable server-side and client-side services, all in `src/lib/**`:

**Server (Node-only, `src/lib/server/**`):\*\*

- `prisma.ts` — Prisma client singleton (`pg` adapter).
- `guards.ts` — auth + workspace membership + IP extraction.
- `rateLimit.ts` — sliding-window limiter (Postgres + memory fallback).
- `tokens.ts` — access/refresh/challenge JWT issuance + verification via `jose`.
- `password.ts` — bcryptjs hashing helpers.
- `totp.ts` — TOTP secret + code lifecycle (`otpauth`).
- `webauthn.ts` — passkey registration + assertion (`@simplewebauthn/server`).
- `email.ts` — transactional email (Resend).
- `cookies.ts` — HttpOnly refresh cookie helpers.
- `withValidation.ts` — Zod wrapper for handlers.
- `audit.ts` — write-only audit-log service.
- `ensureSyncColumns.ts` — startup guard that verifies expected columns exist.
- `captcha.ts` — placeholder for captcha verification hooks.

**Client / isomorphic (`src/lib/**`):\*\*

- `authClient.ts` — token + `authFetch` wrapper.
- `syncEngine.ts` — delta pull + mutation queue + observables (`onSyncPull`, `onSyncPhaseChange`, `onWorkspaceAccessDenied`).
- `crypto.ts` — AES-256-GCM helpers.
- `validators.ts` — Zod schemas shared by client + server.
- `calculations.ts` — pure budget / analytics math.
- `categories.ts`, `constants.ts` — canonical enums.
- `correlations.ts`, `recurringDetection.ts`, `smartNudges.ts` — heuristics for insights.
- `exchangeRates.ts` — FX rate fetcher (public rate APIs, no financial data leaves).
- `ocr.ts` — receipt OCR via `tesseract.js` (client-side; no upload).
- `pushSubscription.ts` — Web Push subscribe/unsubscribe flow.
- `mappers.ts` — DTO ↔ IDB record translation.
- `motion/**` — Framer variants (respects `prefers-reduced-motion`).
- `fingerprint.ts`, `debounce.ts`, `filters.ts`, `utils.ts` — misc helpers.
- `errorReporting.ts` — Sentry wrapper (`reportError`) so callers never import `@sentry/nextjs` directly.

---

## 12. Hooks

Custom hooks in `src/hooks/` are the primary client API. Naming is `useX`; each has a narrow job.

**Data access**

- `useDexieQuery` — subscribe to a live IDB query.
- `useExpenses`, `useAllPayments`, `useLedgers`, `usePayments`, `useSettings`, `useRecurringExpenses`, `useMerchantIndex`, `useCrossMonthSearch`.

**Derived / domain**

- `useCalculations`, `useBusinessCalculations`, `useHistoricalData`, `useAchievements`, `useBudgetHealthBg`, `useWatcher`.
- `useCurrency` — locale-correct formatting + optional multi-currency conversion.

**Sync + notifications**

- `useSyncStatus`, `useSyncConflictToast`, `useOnlineStatus`, `useNotifications`.

**UI / interaction**

- `useToast`, `useConfirm`, `useFocusTrap`, `useKeyboardShortcuts`, `useDragDismiss`, `useSwipeGesture`, `usePullToRefresh`, `useHoldReveal`, `useVisualViewport`, `useSpeechRecognition`, `useEcho`, `useViewTransition`, `useSunsetTheme`.

**Auth / lock**

- `usePinLock`, `usePageTitle`.

**Utility**

- `useMonthUrlSync` — URL hash ↔ month/year state.

Each hook is expected to (a) return a stable value or subscription, (b) clean up in `useEffect` teardown, (c) be usable in tests via `fake-indexeddb`.

---

## 13. Utilities

Small, pure helpers that don't fit "service" (no I/O, no state):

- `src/lib/utils.ts` — `cn()` (Tailwind class merge via `clsx` + `tailwind-merge`), string, date, and formatting helpers.
- `src/lib/constants.ts` — supported currencies, default categories, feature flags.
- `src/lib/filters.ts` — reusable expense filter predicates.
- `src/lib/debounce.ts` — typed debounce.
- `src/lib/fingerprint.ts` — best-effort device fingerprint hash for device linking (no PII).
- `src/lib/categories.ts` — canonical `CategoryId`s + palette mapping.
- `src/lib/mappers.ts` — server DTO ↔ IDB record.
- `src/lib/motion/*` — shared Framer variants (respects reduced motion).

All utilities are unit-tested in `src/__tests__/utils.test.ts`, `calculations.test.ts`, `filters.test.ts`, `categories.test.ts`, etc.

---

## 14. Error Handling

### 14.1 Server

- Handlers return `jsonError(status, message, opts?)` for expected failures (400/401/403/404/409/410/429).
- Unexpected exceptions bubble to Next.js, are captured by Sentry via `sentry.server.config.ts`, and return a generic 500 shape without leaking internals.
- Zod failures return `400` with `details: parsed.error.flatten()` — safe, structured.
- `checkRateLimit` returns `429` with `Retry-After` header.

### 14.2 Client

- All server calls go through `authFetch`, which:
  - Refreshes the access token on `401` and retries once.
  - Emits `onWorkspaceAccessDenied` on `403` for workspace mismatch (used by the sync engine + UI to switch workspace).
  - Surfaces network errors to `useToast` with a retry action.
- React error boundaries at the app root (`src/app/error.tsx`) and per-feature (`ui/ErrorBoundary.tsx`) catch render errors, log via `reportError`, and offer a "reload" affordance.
- Sync errors set `syncPhase = "error"` and drive `SyncIndicator` copy.
- Form errors render via `FormError` and are announced to screen readers.

### 14.3 Sentry policy

`src/lib/errorReporting.ts` is the only sanctioned entry point. Configuration in `sentry.{client,server,edge}.config.ts`:

- 10% transaction sampling.
- 100% replay on error (client).
- **No PII, no monetary values, no request bodies** — `beforeSend` scrubs `amount`, `remark`, `email`, `phone`, `password`, `token`.

---

## 15. Logging

- **Sync engine** — `syncLog`, `syncWarn`, `syncErr` in `src/lib/syncEngine.ts`. Enabled in dev or when `NEXT_PUBLIC_SYNC_LOG=true`. `syncErr` also reports to Sentry.
- **Server routes** — no ad-hoc `console.log`. Structured logging happens via Sentry breadcrumbs + `audit.ts` for privileged actions.
- **Audit log** — durable, append-only. Records `device_link.create`, `invite.create/revoke`, `member.remove`, `password.change`, `session.revoke`. Fields: `userId`, `entityType`, `entityId`, `action`, `ipHash` (SHA-256), `createdAt`.
- **Browser console** — reserved for developer diagnostics; production builds should not emit noisy logs. `NODE_ENV === "production"` guards debug output in `errorReporting.ts`.

---

## 16. Scalability

Current runtime targets a single Next.js deployment (Vercel / Node) backed by a single Postgres primary (Supabase). The design leans on stateless routes and offline-capable clients to absorb load.

### 16.1 Stateless server tier

- Route Handlers hold no per-instance state (rate-limit fallback is best-effort only).
- Access tokens are stateless JWTs; only refresh + session lookup touches Postgres.
- Horizontal scale is a matter of adding instances; RLS + Postgres pooling remain the constraint.

### 16.2 Read scaling

- **Delta sync** minimizes reads: after the initial pull, clients fetch only rows with `updatedAt > cursor`.
- `(workspaceId, updatedAt)` composite indexes on every domain table keep delta queries O(log n).
- `syncCursors` per workspace enables efficient batching and pagination (`hasMore` flag on `changes`).

### 16.3 Write scaling

- Mutations are **idempotent** (client-generated `idempotencyKey`), so retries are safe under failure.
- Client-side mutation queue absorbs offline / slow-network bursts and drains at controlled rate.
- Rate limits protect hot endpoints (login, sync, push).

### 16.4 Data growth

- Soft-delete keeps history; periodic hard-purge is a follow-up (see §17).
- Analytics compute is done **client-side** on delta-synced data, so growing the user base costs no additional server compute for insights.

### 16.5 Known ceilings

- Sync `changes` returns up to 200 ledgers / 500 payments per call with `hasMore`; larger deltas require multiple round-trips (fine for the current use case, worth revisiting for accounts with years of history).
- Postgres-backed rate limiter contends on the `rate_limits` table under very high write rates; migrating to Redis or a token-bucket in an edge KV is called out under §17.

---

## 17. Performance

Targets in `AI_CONTEXT.md` §11: Lighthouse Performance ≥ 90, LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, dashboard initial JS ≤ 180 KB gz.

### 17.1 Frontend

- **React Compiler** enabled (`babel-plugin-react-compiler`) — auto-memoization reduces manual `useMemo` / `useCallback`.
- **RSC where safe** — layout + non-interactive shells are server-rendered.
- **`optimizePackageImports`** in `next.config.ts` for `lucide-react`, `@visx/*`, `date-fns` — smaller client bundles.
- **Code-splitting** — analytics charts and settings zones are lazy-loaded; heavy modules (`tesseract.js`, `xlsx`) load on demand.
- **`next/font`** for zero layout shift; `next/image` for images.
- **Framer variants** honor `prefers-reduced-motion`.
- **Service worker** pre-caches shell + hashed assets → sub-second repeat-visit paint.

### 17.2 Data

- Dexie queries are indexed on `(workspaceId, updatedAt)` and `(workspaceId, year, month)` for month-scoped views.
- `useDexieQuery` batches re-renders during a sync pull to avoid render storms.
- Calculations are memoized per month/year in `CalculationsContext`.

### 17.3 Server

- Prisma queries are workspace-scoped; every hot query has a matching composite index.
- Sentry sampling is 10% for transactions so tracing overhead stays low.

### 17.4 Verification

- Jest suites cover contract regressions (`designTokens`, `motionTokens`, `accessibilityContracts`, `phaseFContracts`).
- Bundle analyzer (`ANALYZE=true npm run build`) for periodic budget review.

---

## 18. Recommended Architecture Improvements

Prioritized backlog. Each item is scoped so it can land as one PR, with tests and no scope creep. None modify the product surface unless noted.

### 18.1 Correctness & safety

1. **Deterministic conflict resolution for money fields.** _(Partially delivered — T-2.3.1, Sprint 2.3.)_ The sync engine now merges pulled records per field: non-money fields use deterministic timestamp last-writer-wins, and `amount`/`expectedAmount` collisions preserve the local value and register a `MoneyConflict` that is only reconciled by an explicit user event (`resolveMoneyConflict`). Remaining: surface the prompt UI (`ConflictReviewSheet`, T-2.3.2), audit-log every resolution (T-2.3.3), and make the conflict registry durable across reloads (see below). Ties into `useSyncConflictToast`. _(Also called out in the PRD.)_
   - **Follow-ups for durability (deferred from T-2.3.1):** persist pending conflicts + resolution intents in IDB (survive reload / engine restart) instead of the in-memory registry; block contested mutations from draining until resolved; coalesce all queued upserts for a table/id on resolution so a retried dead-lettered mutation cannot re-apply a superseded money value; and track a durable per-field money baseline so a remark-only local edit does not falsely flag a remote amount change.
2. **Integer minor units for all monetary math.** Audit every `amount`/`expectedAmount` path to guarantee integer minor units or a decimal-safe helper; add a lint rule / typed money brand (`type Money = number & { __brand: "minor-units" }`) to prevent regression.
3. **Server-side idempotency de-dup index.** Persist `idempotencyKey` per workspace with a unique constraint so retried commits from a slow client cannot double-write even under race.
4. **`server-only` marker on `src/lib/server/**`.** Add `import "server-only"`to entry files to guarantee no accidental client bundling of`pg`, Prisma, or `bcryptjs`.

### 18.2 Boundaries & modularity

5. **Repositories layer.** Extract `src/lib/server/repositories/{expense,ledger,settings,workspace}.ts` to consolidate the `where: { workspaceId, deletedAt: null }` pattern and make future storage swaps trivial.
6. **Typed API contracts shared client ↔ server.** Move DTOs into `src/types/api/*` and derive both Zod schemas and Prisma-facing types from a single source (e.g., via `zod` + `z.infer`). Reduces drift between `validators.ts` and route handlers.
7. **Feature-folder verticalization.** Group `components/`, `hooks/`, `lib/` per feature (`features/expenses/`, `features/business/`, `features/analytics/`) to reduce cross-imports as the surface grows.

### 18.3 Sync engine

8. **Guaranteed-once delivery for the mutation queue.** Persist attempts + backoff in the `mutations` table and add a dead-letter surface visible in Settings > Diagnostics.
9. **Streaming delta.** Move `/api/sync/changes` to a chunked/streaming response (SSE or fetch stream) for large first-time pulls, reducing memory pressure on both ends.
10. **Cursor stability under concurrent writes.** Use `(updatedAt, id)` as a compound cursor to eliminate the theoretical duplicate-record edge case at the boundary.

### 18.4 Performance

11. **Route-level bundle budgets.** Wire `@next/bundle-analyzer` output into CI with a hard cap (e.g. 180 KB gz for `/`, 220 KB gz for `/analytics`). Fail the build on regression.
12. **Web Worker for analytics math.** Move `correlations.ts`, `recurringDetection.ts`, and heavy rolling-average passes off the main thread to guard INP under long lists.
13. **HTTP caching for public assets.** Add long-lived immutable `Cache-Control` for hashed `/_next/static/**` and revisit icon caching (currently forced `must-revalidate`).

### 18.5 Observability & operations

14. **Structured request logging.** Replace ad-hoc `console` in dev with a thin `logger.ts` (pino-style) that emits JSON in prod (still no PII/money) and integrates with Sentry breadcrumbs.
15. **Health & readiness endpoints.** Add `/api/health` and `/api/ready` (public, cache-busted) for uptime probes and deploy gates.
16. **Migration + RLS smoke test in CI.** Run Prisma migrate + a scripted RLS test on a throwaway Postgres in CI to prevent 012-style regressions from shipping.
17. **Rate-limit backend swap.** Abstract `rateLimit.ts` behind an interface so a Redis / Upstash / KV backend can drop in when write contention on `rate_limits` becomes measurable.

### 18.6 Security

18. **Session anomaly alerts.** Surface unusual-IP / new-country logins in-app and via email (audit log already captures the raw signal).
19. **Automated dependency updates.** Enable Renovate/Dependabot with a Critical/High CVE SLA of 24 h, gated by the existing test suite.
20. **CSP tightening.** Remove `'unsafe-eval'` and inline scripts where possible (Next.js supports strict-CSP with nonces). Reduces XSS blast radius.
21. **Encryption key rotation.** Add a rotation path for the per-workspace AES-256-GCM key with re-encryption of at-rest sensitive fields.

### 18.7 Data lifecycle

22. **Hard-purge job for soft-deleted rows.** After a configurable retention window (e.g., 90 days), permanently delete `deletedAt` rows. Reduces index size and honours the "your data is yours" promise on account deletion.
23. **Backup verification.** Automate periodic restore of a Supabase snapshot into an ephemeral DB and run Prisma migrate + a smoke query to prove backups are usable.

### 18.8 Documentation

24. **Populate `docs/SPRINT_BOARD.md`** with the current Horizon 1 items (called out in the PRD's audit findings).
25. **Sequence diagrams for the top flows** (login → 2FA, device link, sync pull, mutation commit, invite accept). Kept next to this document as `docs/ARCHITECTURE_DIAGRAMS.md` if they grow beyond a page.

---

## Appendix A — Environment Contract

Required environment variables (documented separately in `.env.example` if present):

- `DATABASE_URL` — Postgres connection string (Supabase).
- `JWT_SECRET` — HS256 secret for access / challenge tokens.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase realtime + storage.
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (optional) — Sentry.
- `RESEND_API_KEY` — transactional email.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — Web Push.
- `CRON_SECRET` — bearer for `/api/push/send`.

Secrets are **never** committed and **never** shipped in the client bundle. Only variables prefixed with `NEXT_PUBLIC_` are safe on the client.

## Appendix B — Reference Files

Quick jumps for reviewers:

- Middleware: [src/middleware.ts](../src/middleware.ts)
- Guards + rate limit: [src/lib/server/guards.ts](../src/lib/server/guards.ts), [src/lib/server/rateLimit.ts](../src/lib/server/rateLimit.ts)
- Sync engine: [src/lib/syncEngine.ts](../src/lib/syncEngine.ts)
- Auth client: [src/lib/authClient.ts](../src/lib/authClient.ts)
- Dexie schema: [src/lib/db.ts](../src/lib/db.ts)
- Zod validators: [src/lib/validators.ts](../src/lib/validators.ts)
- Prisma schema: [prisma/schema.prisma](../prisma/schema.prisma)
- Migrations: [prisma/migrations/](../prisma/migrations)
- Security headers + CSP: [next.config.ts](../next.config.ts)
- Sentry configs: [sentry.client.config.ts](../sentry.client.config.ts), [sentry.server.config.ts](../sentry.server.config.ts), [sentry.edge.config.ts](../sentry.edge.config.ts)

---

**Last reviewed:** 2026-07-23
