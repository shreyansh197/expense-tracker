<!--
  PRODUCTION_CHECKLIST.md — Release-readiness gate for ExpenStream
  Owner: AI Engineering Team + Product
  Audience: Release captains, on-call, deploy operators.
  Companion docs: TESTING_CHECKLIST.md, ARCHITECTURE.md (§Appendix A env contract),
                  CHANGELOG.md, RELEASE_NOTES.md, SPRINT_BOARD.md.
  Rule: Every item is objectively verifiable (pass / fail). If an item is not
        applicable to a given release, mark it N/A with a one-line reason.
        No release ships with any P0 item unchecked.
-->

# ExpenStream — Production Checklist

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-23

This checklist is the release-readiness gate for every production deploy. Every item is objectively verifiable. Cross-referenced with:

- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) — automated + manual test gates.
- [ARCHITECTURE.md — Appendix A](ARCHITECTURE.md) — environment contract.
- [CHANGELOG.md](CHANGELOG.md) / [RELEASE_NOTES.md](RELEASE_NOTES.md) — must both be updated before tag.

**Legend:** `[P0]` blocking · `[P1]` strongly recommended · `[P2]` best-practice · `N/A` with one-line reason accepted.

---

## 1. Environment variables

Verified against [ARCHITECTURE.md — Appendix A](ARCHITECTURE.md) and [`.env.example`](../.env.example).

- [ ] `[P0]` `DATABASE_URL` set (Supabase pooled connection string — port 6543).
- [ ] `[P0]` `JWT_SECRET` set, ≥ 32 chars, **not** the placeholder `expense-tracker-jwt-secret-change-me-in-prod-32chars`.
- [ ] `[P0]` `IP_HASH_SALT` set to a unique per-environment value (never reused across staging/prod).
- [ ] `[P0]` `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (anon key only; service-role never exposed to client).
- [ ] `[P0]` `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:` URL) set — required for Web Push send.
- [ ] `[P0]` `RESEND_API_KEY` set — required for password reset / verification email.
- [ ] `[P1]` `NEXT_PUBLIC_SENTRY_DSN` set; `SENTRY_AUTH_TOKEN` set for source-map upload.
- [ ] `[P1]` `NEXT_PUBLIC_SYNC_LOG` **unset** (or `false`) in production.
- [ ] `[P0]` No secret is committed to git (grep for `JWT_SECRET`, `RESEND`, `VAPID_PRIVATE`, `DATABASE_URL` in the diff before tag).
- [ ] `[P0]` Vercel / hosting env vars scoped `Production` only for prod values; `Preview` uses staging DB.

## 2. Database & migrations

- [ ] `[P0]` `prisma migrate status` clean against production DB — no drift, no unapplied migrations.
- [ ] `[P0]` Latest migration in [`prisma/migrations/`](../prisma/migrations) applied (through `013_rate_limit_table.sql` at time of writing; check for higher-numbered files).
- [ ] `[P0]` Row-Level Security (RLS) enabled on every table — verify with the SQL smoke query documented in [ARCHITECTURE.md §8.2](ARCHITECTURE.md) (`SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity = false;` returns zero rows).
- [ ] `[P0]` Rate-limit table `rate_limit_hits` exists (migration `013_rate_limit_table.sql`) and is indexed on `(key, window_start)`.
- [ ] `[P1]` `prisma/legacy/*.sql` present but **not** in the migration path — see [ADR-0001](adr/0001-postgres-over-firestore.md) for context.
- [ ] `[P0]` Backups: automated Supabase point-in-time restore enabled with ≥ 7-day retention.
- [ ] `[P0]` Restore drill run in the last 90 days — restore a snapshot to a staging DB and verify workspace queries succeed.

## 3. Authentication & security

- [ ] `[P0]` `middleware.ts` fast-fails protected `/api/*` routes without an `Authorization: Bearer` header.
- [ ] `[P0]` Every mutation route calls `requireAuth → requireWorkspaceMember → checkRateLimit` (audit: grep for handlers under `src/app/api/**` that don't).
- [ ] `[P0]` `firestore.rules` file is **not** referenced by any code path — kept only as a legacy artifact per [ADR-0001](adr/0001-postgres-over-firestore.md).
- [ ] `[P0]` WebAuthn (passkey) `rpID` and `origin` derived from the request host — verify on the actual production host (see fix commit `b63d894`).
- [ ] `[P0]` TOTP secrets are workspace-encrypted at rest (migration `008_workspace_encryption_key.sql` applied).
- [ ] `[P1]` Content-Security-Policy header present in `next.config.ts`. (TD-6: `'unsafe-eval'` scheduled to drop in [Sprint 5.3](IMPLEMENTATION_QUEUE.md#sprint-53).)
- [ ] `[P0]` HTTPS enforced end-to-end. HSTS header served on the production host.
- [ ] `[P0]` Cookies: refresh token cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, scoped to production domain.

## 4. Third-party services

- [ ] `[P0]` **Sentry** project reachable — send a test error from staging, confirm it lands with PII/money scrubbed (`beforeSend` strips `amount`, `remark`, `email`, `phone`, `password`, `token`).
- [ ] `[P0]` **Resend** domain verified (SPF/DKIM/DMARC green); sender address matches configured `mailto:` in VAPID subject.
- [ ] `[P0]` **Web Push (VAPID)** key pair regenerated per environment. Rotating a key invalidates every existing subscription — plan a coordinated push-resubscribe.
- [ ] `[P1]` **FX rates provider** (Frankfurter / currency-api) health-checked in the last 24 h. Only rates are fetched, never balances or transactions.

## 5. DNS / networking

- [ ] `[P0]` Production domain resolves and terminates TLS at the edge.
- [ ] `[P0]` Manifest `start_url` and `scope` match production origin exactly (`https://<prod-host>/`).
- [ ] `[P1]` Preview / staging deployments use a distinct hostname and their own env vars.
- [ ] `[P1]` No mixed content — all `Set-Cookie`, `manifest.json`, and asset URLs are HTTPS.

## 6. PWA & service worker

- [ ] `[P0]` `manifest.webmanifest` validates in Chrome DevTools > Application > Manifest.
- [ ] `[P0]` Maskable icon set present (see [Sprint 12.2](IMPLEMENTATION_QUEUE.md#sprint-122) for polish work; today's manifest covers baseline).
- [ ] `[P0]` Service worker registers on install; cache versioning strategy bumps on release.
- [ ] `[P1]` "Add to Home Screen" flow verified on Android Chrome + iOS Safari on latest OS.
- [ ] `[P2]` Offline fallback route registered (planned in [Sprint 12.2](IMPLEMENTATION_QUEUE.md#sprint-122)).

## 7. Performance

- [ ] `[P0]` `pnpm run build` (`prisma generate && next build`) succeeds with zero errors.
- [ ] `[P1]` Lighthouse mobile (Moto G-class, throttled) — Performance ≥ 95, Accessibility ≥ 95, Best-Practices ≥ 95, PWA installable.
- [ ] `[P1]` Bundle analyzer (`@next/bundle-analyzer`) reviewed: no route JS chunk > 250 KB gzipped without an explicit budget waiver.
- [ ] `[P1]` No `useEffect` on the analytics page renders faster than 60 FPS during heavy chart interaction (verified in [Sprint 9.1](IMPLEMENTATION_QUEUE.md#sprint-91)).
- [ ] `[P2]` Bundle budgets enforced in CI (planned in [Sprint 6.2](IMPLEMENTATION_QUEUE.md#sprint-62)).

## 8. Accessibility

- [ ] `[P0]` `src/__tests__/accessibilityContracts.test.ts` green.
- [ ] `[P0]` `src/__tests__/touchTargets.test.ts` green — every interactive element ≥ 44×44 px.
- [ ] `[P0]` `src/__tests__/motionTokens.test.ts` and `motionVariants.test.ts` green — `prefers-reduced-motion` respected everywhere.
- [ ] `[P1]` Full keyboard tab-through of primary flows: login → dashboard → add expense → analytics → settings.
- [ ] `[P1]` Screen reader smoke on VoiceOver (iOS) and TalkBack (Android): landmark regions announced, form labels read correctly.
- [ ] `[P1]` Focus indicators visible on all interactive elements in both light and dark mode.

## 9. Observability & operations

- [ ] `[P0]` Sentry release tag matches the git tag being deployed.
- [ ] `[P1]` `/api/health` (or equivalent) returns 200 with git SHA + build time. (Planned formalization in [Sprint 6.1](IMPLEMENTATION_QUEUE.md#sprint-61).)
- [ ] `[P1]` Audit log (`audit_logs` table) receives a write for every privileged action tested in a staging run (login, TOTP enable, workspace invite accept, encryption key rotation when it lands).
- [ ] `[P2]` Alert routes configured for Sentry error rate + rate-limit spike (planned expansion in [Sprint 5.2](IMPLEMENTATION_QUEUE.md#sprint-52)).

## 10. Rollback strategy

Every release must have a **written** rollback plan before deploy. At minimum:

### 10.1 Migration rollback

- [ ] `[P0]` Every new migration includes a documented **inverse** (either a paired `_down.sql` in the sprint report, or an explicit "irreversible — data-preserving on rollback via app-level guard" note).
- [ ] `[P0]` If the migration alters or drops a column, the previous release must have already been shipped with defensive reads that tolerate the missing column, or the release must be run behind a feature flag.

### 10.2 Deploy rollback

- [ ] `[P0]` Previous production build tag is redeployable within 10 minutes via the hosting platform's "Promote previous deployment" (Vercel) or equivalent.
- [ ] `[P0]` Redeploy path documented in the release ticket — no tribal knowledge.

### 10.3 Feature-flag rollback

- [ ] `[P1]` Any user-visible change gated by a feature flag has a documented "kill switch" (env var or DB setting) that disables the surface without a redeploy.

## 11. Release artifacts

- [ ] `[P0]` [CHANGELOG.md](CHANGELOG.md) updated with a versioned block for this release — every changed subsystem represented under Added/Changed/Fixed/Removed/Performance/Accessibility/Security/Notes.
- [ ] `[P0]` [RELEASE_NOTES.md](RELEASE_NOTES.md) updated **only if** user-visible behavior changed; otherwise marked "internal-only".
- [ ] `[P0]` Git tag created (`vX.Y.Z` or `sprint-N.M`) and pushed.
- [ ] `[P1]` Version in [`package.json`](../package.json) bumped to match tag.
- [ ] `[P1]` Sprint report generated under `sprint-reports/SPRINT_<N>_SUMMARY.md`.

## 12. Post-deploy verification (T + 15 minutes)

- [ ] `[P0]` Homepage loads in production (`HTTP 200`).
- [ ] `[P0]` Login → dashboard smoke path completes in < 5 s on 4G-throttled mobile.
- [ ] `[P0]` Add-expense mutation round-trips: create → appears on dashboard → survives page reload (proves DB write + sync pull).
- [ ] `[P0]` Sentry error rate does not spike above baseline within the first 30 minutes.
- [ ] `[P1]` Web Push send from an admin console reaches at least one test device.

---

## Sign-off

| Role                 | Signed by | Date       | Notes |
| -------------------- | --------- | ---------- | ----- |
| Release captain      |           | YYYY-MM-DD |       |
| Security reviewer    |           | YYYY-MM-DD |       |
| Accessibility review |           | YYYY-MM-DD |       |
| Product              |           | YYYY-MM-DD |       |

---

**Last reviewed:** 2026-07-23
