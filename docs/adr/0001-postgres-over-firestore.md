# ADR-0001 — Adopt Postgres (Supabase) as the source of truth over Firestore

**Status:** Accepted (retroactive record of a historical decision)
**Date:** 2026-07-23 (retroactive; original decision landed with [`prisma/migrations/001_initial_schema.sql`](../../prisma/migrations/001_initial_schema.sql), 2026-03-21)
**Deciders:** Founding engineer(s)
**Consulted:** —
**Informed:** All future contributors (via this ADR and [ARCHITECTURE.md](../ARCHITECTURE.md))

---

## Context

Early ExpenStream prototypes used **Firebase / Firestore** as the backend, evidenced by the [`firestore.rules`](../../firestore.rules) file still present at repo root. As the product matured, four forces pushed against Firestore as a long-term choice:

1. **Relational integrity for money data.** Ledgers, invoices, and payments are naturally relational (customer → invoice → payments; expense → category → budget). Firestore's document model requires denormalization that produces "money in two places" — the exact anti-pattern the [Money Field Correctness](../PROJECT_MASTER_PLAN.md) work is trying to eliminate.
2. **Row-Level Security.** Postgres RLS gives us a workspace-boundary guarantee that is provable, auditable, and enforced by the database engine itself — verified end-to-end by [`012_enable_rls_all_tables.sql`](../../prisma/migrations/012_enable_rls_all_tables.sql). Firestore security rules can express similar constraints but are harder to unit-test and lack the deterministic query planner behavior we need for analytics.
3. **Offline-first is our client story, not our server story.** Our sync engine treats the browser (IndexedDB via Dexie) as the working store and the server as the source of truth. Firestore's realtime listeners actively pushed against this — they encourage direct client-DB coupling that we deliberately do not want, and we removed the last `postgres_changes` listeners in the same commit that enabled RLS.
4. **Ecosystem fit.** Prisma + `pg` + Next.js Route Handlers is a mainstream, well-supported stack with strong migration tooling, first-class TypeScript types, and a mature Sentry / observability story. Firestore's Node SDK has poorer typing and a less predictable cost model at our expected read volume.

## Decision

Standardize on **Postgres (Supabase)** as the sole persistent store for ExpenStream. Use **Prisma with the `pg` adapter** as the migration + query authority. Use **Supabase Auth** only for infrastructure primitives we still need (e.g., managed Postgres, storage buckets if adopted later) — the application-level auth stack is our own `tokens.ts` / `guards.ts` / `password.ts` / `webauthn.ts` / `totp.ts` implementation. **Disable Firestore.** Retain [`firestore.rules`](../../firestore.rules) at repo root as a legacy artifact for audit continuity; no code path reads it.

## Consequences

### Positive

- Closes the "money in two places" risk (mitigates R-1, R-5, R-7 in [PROJECT_MASTER_PLAN §12](../PROJECT_MASTER_PLAN.md)).
- Enables RLS as the primary authorization mechanism, verifiable in CI (planned in [Sprint 5.3](../IMPLEMENTATION_QUEUE.md#sprint-53)).
- Enables workspace-scoped analytics queries with joins we could not express in Firestore.
- Aligns with the stack the majority of contributors already know (Prisma + Next.js).
- Predictable per-row cost model; no surprise reads from client-side realtime subscriptions.

### Negative

- We forgo Firestore's zero-config realtime listeners. We replaced them with an explicit **delta-sync engine** in [`src/lib/syncEngine.ts`](../../src/lib/syncEngine.ts), which is more code to maintain but also more auditable and testable (see [Sprint 2.1–2.3](../IMPLEMENTATION_QUEUE.md#sprint-21)).
- Supabase Postgres becomes a load-bearing dependency; if we ever need to migrate off Supabase, we own the migration path. Prisma keeps this cost manageable.
- We must run our own auth stack. This is deliberate — see [`ARCHITECTURE §6`](../ARCHITECTURE.md) — but it is more surface area than "just use Firebase Auth".

### Neutral

- The presence of [`firestore.rules`](../../firestore.rules) at repo root is a visual reminder of the historical choice. It is retained by policy (kept in [PRODUCTION_CHECKLIST §3](../PRODUCTION_CHECKLIST.md) as a "not referenced by any code path" gate) rather than deleted, so that a future audit can trace the transition.

## Alternatives considered

1. **Stay on Firestore.** Rejected — see forces (1) and (2) above. Would have required denormalizing money into multiple documents, and would have made RLS-style workspace guarantees harder to prove.
2. **Postgres without Supabase (self-hosted).** Rejected for now — the operational cost of self-hosting Postgres + backups + connection pooling exceeded the team's Horizon-1 capacity. Supabase gives us managed Postgres, PITR backups, and a familiar dashboard for free-tier costs. Revisit at [Horizon 2](../PROJECT_MASTER_PLAN.md) if operational needs change.
3. **DynamoDB + AppSync.** Rejected — same relational-integrity concerns as Firestore, plus lock-in to a specific cloud.
4. **SQLite (via Turso / D1) on the edge.** Rejected for our workload — analytics queries benefit from Postgres's planner and window functions, and we want a single primary rather than a fan-out of replicas.

## References

- Related documents:
  - [ARCHITECTURE.md §8 (Database)](../ARCHITECTURE.md)
  - [PROJECT_MASTER_PLAN §11 (Technical Debt)](../PROJECT_MASTER_PLAN.md) — TD-1, TD-12.
  - [`prisma/migrations/012_enable_rls_all_tables.sql`](../../prisma/migrations/012_enable_rls_all_tables.sql) — the concrete RLS enforcement this ADR justifies.
  - [`firestore.rules`](../../firestore.rules) — legacy artifact retained for audit.
- Related sprints:
  - [Sprint 5.3 — RLS smoke test in CI](../IMPLEMENTATION_QUEUE.md#sprint-53).
  - [Sprint 2.1–2.3 — Sync Engine correctness](../IMPLEMENTATION_QUEUE.md#sprint-21).

---

**Last reviewed:** 2026-07-23
