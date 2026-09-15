<!--
  IMPLEMENTATION_RULES.md — Engineering standards for ExpenStream
  Owner: AI Engineering
  Audience: Engineers, AI agents, reviewers, and anyone opening a PR.
  Companion docs: AI_CONTEXT.md, ARCHITECTURE.md, DESIGN_SYSTEM.md,
                  PROJECT_MASTER_PLAN.md, TESTING_CHECKLIST.md,
                  PRODUCTION_CHECKLIST.md, SPRINT_BOARD.md.
  Rule: This document defines HOW we build. It is binding. Every sprint,
        every PR, every AI-authored change must comply. Update in place
        when a rule changes — never fork, never soften silently.
-->

# ExpenStream — Implementation Rules

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-22

These are the engineering standards for ExpenStream. They are the rulebook every sprint plays by. Where this document and code disagree, **this document wins** — the code must be brought into line, not the other way around. Where this document and [AI_CONTEXT.md](AI_CONTEXT.md) or [ARCHITECTURE.md](ARCHITECTURE.md) disagree, treat the mismatch as a bug and fix the docs together in the same PR.

Read this file **before** starting any task. Cite the rule you are following in the PR description when the change is non-trivial.

---

## 0. The Hard Bans (Never Allow)

These are not preferences. They fail review automatically. There are no exceptions without a linked issue and an explicit sign-off in the PR.

| #   | Ban                                                                                                           | Why                                                       |
| --- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | **Duplicate logic** — two implementations of the same behavior in different files.                            | Divergent bugs, doubled test surface, silent drift.       |
| 2   | **Dead code** — unreachable branches, unused exports, commented-out blocks, orphan files.                     | Rots the codebase, misleads readers, poisons search.      |
| 3   | **`TODO` / `FIXME` / `XXX` comments** in shipped code.                                                        | A TODO is a bug without a ticket. File an issue instead.  |
| 4   | **`console.log` / `console.debug`** in application code.                                                      | Use the structured logger. Debug logs leak PII.           |
| 5   | **Duplicated CSS** — the same values, tokens, or utility stacks copy-pasted across files.                     | Design drift, theme breakage, token bypass.               |
| 6   | **Oversized components** — a single component file exceeding **250 lines** or handling more than one concern. | Untestable, unreadable, unowned. Split by responsibility. |

Additional automatic-fail patterns:

- Hard-coded colors, radii, spacing, durations, or z-indices (must be tokens).
- Raw SQL in feature code (must go through Prisma or `src/lib/server/*`).
- Any `// @ts-ignore` / `// @ts-expect-error` without a linked issue.
- Any `eslint-disable` without a one-line justification comment.
- Any secret, key, or token in the client bundle or the repo.
- Any query that omits `workspaceId` scoping.
- Any monetary math using binary floats (`number` for currency arithmetic).
- Any network call from a component (must go through a hook + `authFetch`).

---

## 1. General Development

**Principle:** Small, reversible, well-typed changes. Ship the smallest correct thing.

**Rules**

- Follow the **YAGNI** and **KISS** discipline. Do not build for imagined futures.
- Every change is scoped to one concern. If a PR touches auth, sync, and charts, split it.
- Prefer **editing existing files** over creating new ones. New files require justification.
- **TypeScript strict** is non-negotiable: `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`.
- Use `unknown` at boundaries and narrow with Zod — never `any`.
- Zod parses **every** external input: API bodies, query strings, `localStorage`, `IndexedDB` reads, env vars.
- Currency uses integer minor units or the decimal-safe helpers in [src/lib/money.ts](../src/lib/money.ts) (`addMoney`, `subMoney`, `mulMoney`, `sumMoney`; `toMinor`/`fromMinor`). No raw `+`, `-`, `*` on floats for money — enforced by the `no-restricted-syntax` guard in [eslint.config.mjs](../eslint.config.mjs).
- Dates are ISO 8601 strings on the wire, `Date` objects in memory, and always locale-aware in the UI via helpers in [src/lib/utils.ts](../src/lib/utils.ts).
- No new npm dependency without: bundle-size check, license check, and a one-line note in the PR.
- Feature flags gate anything user-visible that is not yet ready.

**Best practices**

- Write the test first when the behavior is knowable up front.
- Read the file completely before editing it.
- When in doubt, mirror the pattern of the nearest neighbor of the same kind.

---

## 2. Component Design

**Principle:** A component does **one thing**, renders it, and gets out of the way.

**Rules**

- **Max 250 lines per component file**, including JSX. Larger means split.
- **Max one default export per component file.** Named exports for helpers.
- **Presentational vs. container split:** components in `src/components/ui/` are pure, tokenized, and stateless; feature components in `src/components/<domain>/` compose them with hooks.
- **No fetching inside components.** Data comes from hooks in [src/hooks/](../src/hooks/); mutations go through the sync engine.
- **No business logic in JSX.** Move it to a hook, a util, or a `src/lib/*` module.
- Props are typed with an explicit `interface` or `type`, exported, and documented at the type level.
- No prop drilling more than **two levels**. Use a context in [src/contexts/](../src/contexts/) or a store in [src/stores/](../src/stores/).
- Every interactive component ships with the four canonical states: **empty, loading, error, offline** (see [AI_CONTEXT.md](AI_CONTEXT.md) §8).
- Client components declare `"use client"` on the first line; server components must not import client-only libs.
- Motion uses variants from [src/lib/motion/tokens.ts](../src/lib/motion/tokens.ts). No inline `transition` objects in feature code.

**Best practices**

- Name components by role (`ExpenseRow`, not `Row1`).
- Prefer composition over configuration — five boolean props is a code smell.
- Extract sub-components the moment JSX exceeds one screen of your editor.

---

## 3. Folder Structure

**Principle:** File location tells you what a file is allowed to do.

**Canonical layout (do not invent new top-level folders):**

```
src/
  app/           Next.js App Router routes + route handlers only.
  components/    UI. Split by domain: ui/, dashboard/, expenses/, business/, ...
  contexts/      React contexts (auth, workspace, theme, sync).
  hooks/         Reusable hooks (data, mutations, UI behavior).
  lib/           Framework-agnostic logic. The heart of the app.
    server/      Server-only helpers (Prisma, guards, crypto secrets).
    motion/      Motion tokens + variants.
    firebase/    FCM helpers.
  stores/        Zustand stores.
  types/         Shared TypeScript types (no runtime code).
  __tests__/     Jest specs. One spec per module or contract.
  middleware.ts  Next.js middleware.
```

**Rules**

- `src/components/**` may import from `src/lib/**`, `src/hooks/**`, `src/contexts/**`, `src/stores/**`, `src/types/**`. It must **not** import from `src/app/**`.
- `src/lib/**` is framework-agnostic where possible. It must **not** import from `src/components/**` or `src/app/**`.
- `src/lib/server/**` is server-only. It must **not** be imported by any client component.
- `src/app/api/**` route handlers are thin: parse → authorize → call `src/lib/server/*` → serialize. No business logic.
- Tests live under `src/__tests__/` and mirror the module path they cover.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities, `kebab-case.md` for docs.
- One concern per file. If a file exports two unrelated things, split it.

**Best practices**

- Before adding a file, search for an existing home. Nine times out of ten, one exists.
- Co-locate a component's styles, types, and story (if any) only if they exceed 40 lines each; otherwise inline them.

---

## 4. Frontend

**Principle:** Calm, fast, offline-perfect, token-driven.

**Rules**

- **Tailwind + design tokens only.** No inline `style={{ color: ... }}` for design values. Tokens are defined in [src/app/globals.css](../src/app/globals.css) and mirrored in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- **No hard-coded colors, radii, spacing, or z-indices.** Use CSS variables or Tailwind tokens.
- **Accent color is user-owned.** Components inherit via `--accent-*` tokens; never hard-code brand hues.
- **Themes are first-class.** Every screen must render correctly in light, dark, and sunset themes without special-casing.
- **`prefers-reduced-motion` is respected** in every Framer variant — use the helpers in `src/lib/motion/`.
- **Images** via `next/image`; **icons** via inline SVG or Lucide; **fonts** via `next/font` with `display: swap`.
- **No layout shift** on first paint. Reserve space for async content with skeletons from [src/components/ui/](../src/components/ui/).
- **Mobile-first.** Primary actions must be reachable in the bottom half of the viewport on mobile.
- **Hit targets ≥ 44×44px.** Focus rings visible, using the accent token, never `outline: none`.
- **No new global CSS classes.** Extend tokens or add a UI primitive instead.

**Best practices**

- If a Tailwind class stack repeats three times, extract a UI primitive.
- Prefer CSS grid / flex over absolute positioning.
- Test on a real mid-tier Android device before merging visual changes.

---

## 5. Backend

**Principle:** The server is the source of truth. It is paranoid, idempotent, and boring.

**Rules**

- Route handlers live only in `src/app/api/**` and follow the shape: **parse → authenticate → authorize → execute → serialize → audit**.
- **Zod validates** every request body, query, and header before use.
- **`getSessionUser()`** (or the equivalent guard in [src/lib/server/](../src/lib/server/)) authenticates every non-public route.
- **Workspace scoping is enforced server-side**, not trusted from the client. Every query includes `workspaceId` derived from the session.
- **Mutations are idempotent.** Use client-provided `mutationId` for dedupe on the write path.
- **Rate limits** apply to auth, sync, invite, and export endpoints. See migration `013_rate_limit_table.sql`.
- **No raw SQL** in feature code. Prisma is the only path. Migrations live in [prisma/migrations/](../prisma/migrations/).
- **No PII or monetary values** in logs, error messages, or third-party analytics.
- **Audit privileged actions** (device link, invite, member removal, password change, 2FA toggle) to the audit log.
- Long-running work happens off the request path (queue, cron, edge function) — never block a user request.

**Best practices**

- Return typed error shapes (`{ code, message }`), never leaked stack traces.
- Prefer 4xx with a `code` the client can branch on over free-text errors.
- If a handler exceeds ~80 lines, extract the business logic into `src/lib/server/`.

---

## 6. Database

**Principle:** The schema is a contract. Migrations are forever. RLS is on.

**Rules**

- **Prisma is the only schema authority.** Edit [prisma/schema.prisma](../prisma/schema.prisma), generate a migration, commit both.
- **Every migration is additive and reversible where possible.** Never edit a shipped migration — write a new one.
- **RLS is enabled on every table** (baseline: migration `012_enable_rls_all_tables.sql`). New tables must ship with an RLS policy in the same migration.
- **Every user-owned row carries `workspaceId`** and is indexed on `(workspaceId, ...)`.
- **Soft-delete by default** for user-facing data (`deletedAt`). Hard-delete only via explicit admin path.
- **Money columns** are integer minor units or Prisma `Decimal`, never `Float`.
- **Timestamps** are `timestamptz`, defaulted server-side, and never trusted from the client.
- **Foreign keys** are declared with `ON DELETE` semantics that match the product intent (cascade for owned children, restrict for referenced ones).
- **Indexes** are added when a query pattern is known — not speculatively. Justify each index in the migration comment.
- **Seed data** for tests lives in `src/__tests__/fixtures/`, not in migrations.

**Best practices**

- Write the query first, then design the index.
- When renaming a column, ship the rename in two migrations (add + backfill, then drop) so rollouts are safe.

---

## 7. API Design

**Principle:** Predictable, versioned, workspace-scoped, sync-friendly.

**Rules**

- **REST-shaped** JSON over HTTPS. Verbs match semantics: `GET` (safe), `POST` (create / action), `PATCH` (partial update), `DELETE` (soft-delete).
- **Resource paths** are plural nouns: `/api/expenses`, `/api/business/ledgers/:id/payments`.
- **Request and response schemas** are Zod, exported from `src/lib/validators.ts` or a co-located `schema.ts`, and shared with the client.
- **All list endpoints** support `?since=<iso>` for delta pulls (sync-first).
- **All mutation endpoints** accept a client `mutationId` and return the persisted entity, so the client can reconcile.
- **Errors** use a consistent shape: `{ error: { code: string, message: string, details?: unknown } }` with correct HTTP status.
- **Pagination** is cursor-based, never offset-based, for anything that can grow unbounded.
- **No PII in URLs.** Identifiers are opaque IDs, not emails or phone numbers.
- **CORS, CSRF, and rate-limit headers** are set centrally, never per-route.
- **Breaking changes are versioned** — add `/api/v2/...` before removing `/api/...`.

**Best practices**

- Keep responses flat. Nest only when the client always needs the nested data.
- Return the full entity after a mutation so the client doesn't have to re-fetch.
- Document new endpoints in [ARCHITECTURE.md](ARCHITECTURE.md) in the same PR.

---

## 8. Accessibility

**Principle:** If it isn't accessible, it isn't done. WCAG 2.2 AA minimum, AAA for text on primary surfaces.

**Rules**

- **100% keyboard operable.** Every interactive element is reachable and activatable with `Tab` / `Shift+Tab` / `Enter` / `Space`.
- **Visible focus rings** on every focusable element, using the accent token.
- **Semantic HTML first.** Use `<button>`, `<a>`, `<label>`, `<nav>`, `<main>`, `<section>` before reaching for ARIA.
- **ARIA is a last resort.** If used, it must be tested — an incorrect ARIA attribute is worse than none.
- **Every icon-only button** has an `aria-label`. Every form control has a `<label>`.
- **Color is never the sole channel.** Pair with icon, shape, or text.
- **Charts have text alternatives** (data table, `aria-label`, or accessible summary).
- **Live regions** (`aria-live`) announce sync status, errors, and success toasts.
- **Reduced motion** is honored via `prefers-reduced-motion` in every animated component.
- **Contrast ratios** meet WCAG AA (4.5:1 body, 3:1 large) in **every** theme, verified by the token tests.
- **Every new component ships with an accessibility contract test** in `src/__tests__/accessibilityContracts.test.ts` or a companion spec.

**Best practices**

- Test with a screen reader (NVDA on Windows, VoiceOver on macOS/iOS) before merging.
- Zoom to 200% and confirm nothing overflows or clips.

---

## 9. Performance

**Principle:** Fast on a mid-tier Android over 3G, or it doesn't ship.

**Rules**

- **Lighthouse budgets** (mobile): Performance ≥ 90, PWA ≥ 100, Best Practices ≥ 95, Accessibility ≥ 95.
- **Core Web Vitals:** LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
- **Initial JS ≤ 180KB gz** for the dashboard route. Charts, settings, and admin surfaces are lazy-loaded via `next/dynamic`.
- **No unnecessary re-renders.** Use `React.memo`, `useMemo`, `useCallback` deliberately — measure first, memoize second.
- **List virtualization** for any list that can exceed ~50 items.
- **Images:** `next/image` with correct `sizes`; no images over 200KB without justification.
- **Fonts:** `next/font`, subset to the glyphs actually used, `display: swap`.
- **Sync engine never blocks the main thread.** Heavy math goes to a Web Worker or is chunked with `requestIdleCallback`.
- **No blocking third-party scripts.** Analytics and error tools load `defer` / `async`.
- **Every PR** that adds > 20KB gz to any route bundle needs an explicit justification.

**Best practices**

- Profile before optimizing. Use the React Profiler and the Chrome performance panel.
- Prefer cheaper CSS animations over JS-driven ones for pure visual effects.
- Cache aggressively on the client (Dexie), invalidate precisely.

---

## 10. Animations

**Principle:** Motion is meaning. Every animation confirms a state change. Nothing bounces for fun.

**Rules**

- **All motion goes through Framer Motion** using variants from [src/lib/motion/tokens.ts](../src/lib/motion/tokens.ts).
- **No inline `transition` objects** in feature components. Reference a token.
- **Durations** live in tokens: `motion.duration.instant / fast / base / slow`. No raw numbers.
- **Easings** are tokenized. No raw cubic-bezier values in feature code.
- **Respect `prefers-reduced-motion`.** Reduced motion means: no translate, no scale, opacity only, ≤ 100ms.
- **No decorative motion on data.** Numbers do not bounce. Currency does not spin.
- **Enter, exit, and layout transitions** are named intentions, not decorations.
- **No parallax** heavier than 4px on mobile.
- **60fps or don't ship.** If an animation drops frames on a mid-tier Android, remove it or simplify.
- **Motion tokens are covered by** `src/__tests__/motionTokens.test.ts` and `motionVariants.test.ts`. New variants extend the tests.

**Best practices**

- Prefer opacity and transform (compositor-only) over layout-triggering properties.
- If you cannot describe what an animation _communicates_ in one sentence, delete it.

---

## 11. State Management

**Principle:** State lives at the smallest scope that works. The server is the source of truth; the client is a cache.

**Rules**

- **Local state (`useState`)** for anything scoped to one component.
- **URL state (`searchParams`)** for anything shareable, bookmarkable, or refresh-survivable (filters, tabs, ranges).
- **React Context** for cross-cutting concerns that rarely change (auth, workspace, theme). Contexts live in [src/contexts/](../src/contexts/).
- **Zustand stores** in [src/stores/](../src/stores/) for cross-component ephemeral state that changes often (toasts, drawers, transient UI).
- **Dexie (IndexedDB)** is the durable client cache. Reads go through hooks in [src/hooks/](../src/hooks/); writes go through the mutation queue in [src/lib/syncEngine.ts](../src/lib/syncEngine.ts).
- **Never** put server data in Zustand. Never put ephemeral UI state in Dexie.
- **Never** duplicate the same piece of state in two stores.
- **Selectors** are memoized. Consumers subscribe to the smallest slice they need.
- **Mutations are optimistic** by default: write to Dexie, enqueue for sync, roll back on failure with a toast.
- **Every store and context is typed** — no `any`, no `unknown` escapes without a Zod parse.

**Best practices**

- Ask "who else needs this?" before promoting state upward.
- If two components need the same derived value, put the derivation in a hook, not in both components.

---

## 12. Error Handling

**Principle:** Fail loudly to the logger, softly to the user, and never silently.

**Rules**

- **Every `async` boundary** (route handler, hook, sync task) has a `try/catch` and reports to the structured logger.
- **User-facing errors** use the toast / error-state components from [src/components/ui/](../src/components/ui/) — never `alert()`.
- **Error boundaries** wrap every top-level route via [src/app/error.tsx](../src/app/error.tsx) and per-feature boundaries where appropriate.
- **Never swallow errors.** A `catch` block that does nothing is a bug. At minimum, log and re-throw or surface a typed error.
- **Never leak stack traces** or internal messages to the user. Map to a friendly copy string.
- **Never log PII or monetary values.** See §13.
- **Retryable errors** (network, 5xx) are retried by the sync engine with exponential backoff and jitter.
- **Non-retryable errors** (4xx, validation) surface immediately with actionable copy.
- **Sentry** captures unhandled errors via [sentry.client.config.ts](../sentry.client.config.ts) and its server/edge siblings. Financial values are scrubbed in `beforeSend`.

**Best practices**

- Prefer typed error results (`Result<T, E>`) over throwing across module boundaries.
- Error messages are for humans: what happened, what to do next.
- Test the error path with the same rigor as the happy path.

---

## 13. Logging

**Principle:** Logs are for engineers, not for users, and never for advertisers.

**Rules**

- **Use the structured logger** in [src/lib/errorReporting.ts](../src/lib/errorReporting.ts) (or its server equivalent). Do **not** use `console.log`, `console.debug`, or `console.info` in application code.
- **`console.warn` and `console.error`** are allowed only in the logger implementation itself and in `scripts/`.
- **Log levels:** `debug` (dev only, stripped in prod), `info` (state transitions), `warn` (recoverable anomalies), `error` (unhandled or user-visible failure).
- **Never log:** email, phone, name, address, IP, device fingerprints, monetary values, workspace names, category names, or any body of a user-authored expense/note.
- **Log IDs, not payloads.** `userId`, `workspaceId`, `mutationId`, `requestId` are safe.
- **Every server request** carries a `requestId` propagated to logs and error reports.
- **Sentry breadcrumbs** follow the same PII rules. `beforeSend` scrubs known fields.
- **Client logs never leave the device** unless the user has opted in to diagnostics.

**Best practices**

- If you need a value in a log to debug, ask whether an ID + a server query would work instead.
- Prefer one structured `logger.info({ event, ids })` over five string logs.

---

## 14. Testing

**Principle:** New logic ships with tests. Tests describe intent, not implementation.

**Rules**

- **Jest** is the test runner. Specs live under [src/**tests**/](../src/__tests__/) and mirror the module path.
- **Every new module in `src/lib/`** ships with a unit test.
- **Every new component** ships with a contract test (props, states, a11y).
- **Every new API route** ships with an integration test that covers: auth failure, validation failure, workspace-scope failure, happy path.
- **Every bug fix** ships with a regression test that fails before the fix and passes after.
- **Never test implementation details.** Test the behavior a user or caller can observe.
- **No skipped tests** (`xit`, `.skip`) merged to `main` without a linked issue.
- **No time-based flakiness.** Use fake timers and deterministic inputs.
- **Accessibility contracts** are covered by `src/__tests__/accessibilityContracts.test.ts` — extend it, do not fork it.
- **Design token contracts** (colors, motion, spacing) are covered by their respective spec files — extend them, do not fork.
- **CI is green** before merge. A red CI is a stop-the-line event.

**Best practices**

- Arrange–Act–Assert; one behavior per test.
- Name tests as sentences: `it("re-queues a failed mutation with backoff")`.
- When a bug is found, first write the failing test, then fix.

---

## 15. Documentation

**Principle:** Docs describe what is true today. They are updated in the same PR as the code.

**Rules**

- **Living docs** ([AI_CONTEXT.md](AI_CONTEXT.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md), this file) are updated **in place**. Never fork.
- **Do not create a new markdown file to describe your own PR.** Update the relevant living doc, [CHANGELOG.md](CHANGELOG.md), or [RELEASE_NOTES.md](RELEASE_NOTES.md).
- **`CHANGELOG.md`** gets an entry for every user-visible change, following the existing style.
- **`RELEASE_NOTES.md`** is written for humans and updated at release time.
- **`SPRINT_BOARD.md`** is the source of truth for in-flight work. Tasks move only there.
- **Comments in code** explain _why_, not _what_. If the code needs a comment to explain what it does, refactor it.
- **JSDoc / TSDoc** is required on every exported symbol in `src/lib/` and every public hook.
- **Screenshots and diagrams** live under `docs/` and are versioned with the code.
- **Broken doc links** fail review.

**Best practices**

- If you find a doc that lies, fix it in your PR. Truth debt compounds.
- Prefer a small, correct paragraph over a long, hedged one.

---

## 16. Git Commits

**Principle:** Commits are the project's second source of truth. Write them for the engineer who reads them in two years.

**Rules**

- **Conventional Commits** are mandatory: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `build:`, `ci:`, `style:`, `revert:`.
- **Scope** is optional but encouraged: `feat(expenses): ...`, `fix(sync): ...`.
- **Subject** is ≤ 72 chars, imperative mood ("add", not "added"), no trailing period.
- **Body** explains the _why_ and links the issue / sprint task.
- **Breaking changes** use `!` and a `BREAKING CHANGE:` footer.
- **One logical change per commit.** Do not mix a refactor with a feature.
- **No merge commits on feature branches** — rebase onto `main` (or the target branch).
- **Never force-push** to `main`, `release/*`, or any shared branch.
- **Never commit** secrets, `.env` files, `node_modules`, generated artifacts, or personal editor config.
- **Signed commits** are preferred; required for release tags.

**Best practices**

- If the diff is > 400 lines, ask whether it should be two commits.
- A good commit message earns its place in `git log` search.

---

## 17. Security

**Principle:** Treat every input as hostile. OWASP Top 10 is the floor, not the ceiling.

**Rules**

- **Auth:** JWT access (15m) + opaque refresh (30d, SHA-256 at rest) + optional TOTP 2FA + Passkeys. Session flow lives in `src/lib/server/` and `src/lib/authClient.ts`.
- **Every server route authenticates and authorizes** before doing work. No exceptions for "internal" routes.
- **Workspace isolation** is enforced by guards; never trust `workspaceId` from the client body.
- **Zod validates** every external input before it touches Prisma or business logic.
- **Rate limiting** on auth, sync, invite, export, and password endpoints (Postgres-backed with in-memory fallback).
- **AES-256-GCM** for workspace-encrypted fields; keys held in `sessionStorage` only, never persisted to disk, never sent to the server.
- **Secrets** live only in server-side env vars. Never `NEXT_PUBLIC_*` for anything sensitive.
- **CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy** are set at the edge / middleware.
- **CSRF protection** on cookie-authenticated routes (double-submit token or same-site + origin check).
- **RLS on every Postgres table** (baseline: migration `012`).
- **Dependencies** are audited every sprint; `npm audit high+` blocks release.
- **Audit log** for privileged actions (device link, invite, member removal, password change, 2FA toggle).
- **Sentry** never receives PII or monetary values — scrub in `beforeSend`.
- **No `dangerouslySetInnerHTML`** without a sanitizer and a linked review.

**Best practices**

- Prefer allow-lists over deny-lists.
- Assume the attacker has your source code (they do).
- When in doubt, fail closed.

---

## 18. Code Reviews

**Principle:** Review is where the codebase's future is decided. Be kind, be exact, be firm.

**Rules for authors**

- **PR title** follows Conventional Commits.
- **PR description** answers: _what changed_, _why_, _how it was tested_, _what could break_.
- **Small PRs.** Aim for < 400 lines of diff excluding lockfiles and snapshots.
- **Self-review** the diff before requesting review. Delete drift, TODOs, and dead code.
- **Screenshots or a short video** for any UI change, in light and dark themes.
- **Green CI** before requesting review. No "will fix in a follow-up" for red CI.
- **Link the sprint task** or issue. Orphan PRs are not reviewed.
- **Acknowledge every rule broken** in the PR description with justification (or fix it).

**Rules for reviewers**

- **First reviewer within one working day.** Blocking is expensive.
- **Approve, request changes, or comment** — never leave a review ambiguous.
- **Every "request changes"** cites a rule, a test, or a concrete alternative.
- **Never approve** a PR that violates §0 (The Hard Bans) without a linked exception.
- **Nitpicks are prefixed** `nit:` and never block merge on their own.
- **Security-sensitive changes** (auth, crypto, RLS, migrations, deps) require **two approvals**.
- **Docs-only PRs** may be merged by the author after one approval.
- **The author merges** their own PR when green and approved.

**Best practices**

- Review the tests first — they reveal the intent.
- If a comment thread exceeds three round-trips, move to a call.
- Praise good work publicly. Correct silently.

---

## 19. Enforcement

- **ESLint + Prettier** enforce syntax-level rules. Do not disable a rule locally without a one-line justification and a linked issue.
- **`tsc --noEmit`** must pass. `any`, `@ts-ignore`, and `@ts-expect-error` without a linked issue fail review.
- **Jest** must pass. Coverage does not regress on `src/lib/`.
- **CI runs**: lint, typecheck, test, build, bundle-size check, migration dry-run.
- **Pre-commit hooks** (via Husky, if configured) run `lint-staged`. Do not bypass with `--no-verify`.
- **Sprint reviews** ([SPRINT_BOARD.md](SPRINT_BOARD.md)) verify: no TODOs added, no `console.log` added, no oversized components, no undocumented endpoints.

---

## 20. Change Log for This Document

| Version | Date       | Change                                    |
| ------- | ---------- | ----------------------------------------- |
| 1.0     | 2026-07-22 | Initial rulebook for ExpenStream sprints. |

---

**End of document.** When a rule here proves wrong in practice, open a PR that updates this file first — then change the code. Rules are only as strong as the discipline that keeps them honest.


---

**Last reviewed:** 2026-07-23
