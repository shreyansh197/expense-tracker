<!--
  AI_AGENT_HANDBOOK.md — Operating manual for AI agents working on ExpenStream
  Owner: AI Engineering Team
  Audience: AI coding agents (Copilot, Claude, GPT, custom internal agents) and
            the human engineers who prompt them.
  Companion docs: AI_CONTEXT.md, ARCHITECTURE.md, DESIGN_SYSTEM.md,
                  PROJECT_MASTER_PLAN.md, SPRINT_BOARD.md, IMPLEMENTATION_QUEUE.md,
                  IMPLEMENTATION_RULES.md, prompts/STANDARD_HEADER.md.
  Rule: When this handbook and any other doc disagree, IMPLEMENTATION_RULES.md
        > DESIGN_SYSTEM.md > UX_DECISIONS.md > PROJECT_MASTER_PLAN.md > this
        file. Do not fork.
-->

# ExpenStream — AI Agent Handbook

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-23

This handbook is the boot sequence for any AI agent (or human using an AI agent) working on ExpenStream. It exists so that a new session produces predictable, safe, high-signal work.

---

## 1. Repository memory layout

```
expense-tracker/
├── docs/                       ← authoritative living memory (READ FIRST)
│   ├── AI_CONTEXT.md           ← engineering principles + AI rules (kept short)
│   ├── ARCHITECTURE.md         ← runtime shape today
│   ├── ARCHITECTURE_DIAGRAMS.md← sequence diagrams for critical flows
│   ├── DESIGN_SYSTEM.md        ← tokens, motion, components
│   ├── UX_DECISIONS.md         ← precedent log for UX trade-offs
│   ├── PROJECT_MASTER_PLAN.md  ← PRD, scope, milestones
│   ├── SPRINT_BOARD.md         ← what's active + what's queued
│   ├── IMPLEMENTATION_QUEUE.md ← atomic tasks with acceptance criteria
│   ├── IMPLEMENTATION_RULES.md ← code contracts (types, tests, guards)
│   ├── PRODUCT_PRINCIPLES.md   ← product doctrine
│   ├── PRODUCTION_CHECKLIST.md ← release gate
│   ├── TESTING_CHECKLIST.md    ← QA gates and owning spec files
│   ├── CHANGELOG.md            ← technical change log (Keep a Changelog)
│   ├── RELEASE_NOTES.md        ← user-facing highlights
│   ├── AI_AGENT_HANDBOOK.md    ← this file
│   └── adr/                    ← Architecture Decision Records
├── prompts/                    ← workflow prompts (STANDARD_HEADER, MASTER_AUDIT)
├── sprint-reports/             ← per-sprint execution reports
├── prisma/migrations/          ← authoritative SQL history
├── prisma/legacy/              ← archived pre-Prisma SQL (audit only)
├── src/                        ← app source (do not modify without approval)
│   └── __tests__/              ← co-located Jest specs; every contract lives here
└── package.json                ← scripts: dev / build / lint / test
```

**Rule:** `docs/` is the source of truth. If `src/` and `docs/` disagree, either the doc is stale (fix it in the same PR) or the code is wrong (fix the code).

---

## 2. Canonical read order (session boot)

Read in this order. Skimming is allowed once the doc has been fully read in a previous session — but the boot must **touch** each file to confirm it hasn't changed.

1. [`AI_CONTEXT.md`](AI_CONTEXT.md) — mission, rules, "under two pages" constraint.
2. [`ARCHITECTURE.md`](ARCHITECTURE.md) (+ [`ARCHITECTURE_DIAGRAMS.md`](ARCHITECTURE_DIAGRAMS.md) if the task touches auth, sync, notifications, or workspace flows).
3. [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) — tokens, motion, components. **Never invent new spacing/colors/typography.**
4. [`PROJECT_MASTER_PLAN.md`](PROJECT_MASTER_PLAN.md) — scope + priorities + acceptance criteria.
5. [`SPRINT_BOARD.md`](SPRINT_BOARD.md) — what's active this sprint.
6. [`IMPLEMENTATION_QUEUE.md`](IMPLEMENTATION_QUEUE.md) — the atomic task(s) assigned.
7. [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md) — enforceable contracts.
8. Task-specific: [`UX_DECISIONS.md`](UX_DECISIONS.md) for UX precedent; [`adr/`](adr/) for architecture precedent.

If a workflow prompt (`prompts/STANDARD_HEADER.md`, `prompts/MASTER_AUDIT.md`) is provided, it wins over the default boot and specifies its own read order.

**Conflict resolution order:** `IMPLEMENTATION_RULES > DESIGN_SYSTEM > UX_DECISIONS > PROJECT_MASTER_PLAN > remaining docs`. This handbook loses every tie.

---

## 3. What agents may do freely

- Read any file in the repo.
- Run read-only commands: `git log`, `git diff`, `git blame`, `Get-ChildItem`, `Get-Content`, `Select-String`, `npm test` (no side effects beyond stdout / test artifacts).
- Suggest changes as plain-text patches when the boundary rules below forbid a direct edit.
- Update documentation to match reality — including this file — when the diff is truthful and traceable.

---

## 4. What agents must not do without explicit approval

The following actions require the prompting human to authorize them **in the same session**:

| Forbidden by default                                          | Why                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Modify code under `src/` outside the current sprint's task list | Application changes belong to a task with acceptance criteria.         |
| Introduce a new dependency (`package.json`)                    | Every dep is a supply-chain surface; requires review + `npm audit`.    |
| Create a new database migration                                | Migrations are authoritative and irreversible in prod.                 |
| Change an env var or secret name                               | Coupled to hosting + rotation runbooks.                                |
| Log or transmit monetary values, emails, phone numbers, PII    | Fintech rule — see [`AI_CONTEXT.md §18`](AI_CONTEXT.md).               |
| Weaken auth, RLS, rate limiting, or encryption                 | Security posture must monotonically improve.                           |
| Hard-code colors, spacing, radii, motion durations             | Design tokens exist for a reason — see [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). |
| Cross-feature imports (e.g., analytics reaching into ledger)   | Feature verticalization is a stated architecture goal ([M10](IMPLEMENTATION_QUEUE.md#sprint-101)). |
| Create planning / notes / summary Markdown outside the current task's `Affected Files` | Doc sprawl is a known failure mode. Use in-session memory instead. |
| Delete or rewrite `firestore.rules` while it exists            | Kept as a legacy artifact per [ADR-0001](adr/0001-postgres-over-firestore.md). |

If in doubt: **ask one clarifying question, then pick the smallest reversible change**.

---

## 5. Sprint execution contract

Every sprint task follows the same shape:

1. Read `Sprint`, `Feature`, `Description`, `Business Value`, `Technical Value`, `Priority`, `Impact`, `Effort`, `Dependencies`, `Affected Files`, `Acceptance Criteria` from [`IMPLEMENTATION_QUEUE.md`](IMPLEMENTATION_QUEUE.md).
2. Confirm every dependency task is `[x] Done`. Do not start a task whose dependency is `[ ] Pending`.
3. Modify **only** the files under `Affected Files`. If reality demands a file outside that list, add it to `Affected Files` before touching it, and mention the addition in the sprint report.
4. Satisfy every bullet under `Acceptance Criteria` **and** the Global Definition of Done in [`PROJECT_MASTER_PLAN §16.1`](PROJECT_MASTER_PLAN.md).
5. Update:
   - [`IMPLEMENTATION_QUEUE.md`](IMPLEMENTATION_QUEUE.md) — mark task `[x] Done`.
   - [`SPRINT_BOARD.md`](SPRINT_BOARD.md) — set sprint status.
   - [`CHANGELOG.md`](CHANGELOG.md) — append entry.
   - [`RELEASE_NOTES.md`](RELEASE_NOTES.md) — only if user-visible.
   - [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) / [`TESTING_CHECKLIST.md`](TESTING_CHECKLIST.md) — if new gates were added.
6. Generate `sprint-reports/SPRINT_<N>_SUMMARY.md` following the [`prompts/STANDARD_HEADER.md`](../prompts/STANDARD_HEADER.md) §8 template.
7. Stop. Never auto-advance into the next sprint.

---

## 6. Code contracts (quick reference)

Full details in [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md).

- **TypeScript strict.** No `any` without a comment. Prefer branded types (`type Money = number & { __brand: "minor-units" }`).
- **Zod at every API boundary.** Both request and response validated. Shared schemas in [`src/lib/validators.ts`](../src/lib/validators.ts).
- **Every mutation route:** `requireAuth → requireWorkspaceMember → checkRateLimit → withValidation → handler → Prisma`.
- **Idempotent mutations.** Every write from the client carries an `idempotencyKey`; the server enforces uniqueness on `(workspace_id, idempotency_key)`.
- **Tests co-located.** New feature → new `src/__tests__/<feature>.test.ts` (or extension of an existing spec).
- **Five states.** Every screen ships `empty / loading / error / offline / success`.
- **Design tokens only.** Never `#`, `rgb(`, `px` for spacing/radii, or a raw ms in a motion prop.
- **No `console.log`** outside `syncEngine.ts` (guarded by `NEXT_PUBLIC_SYNC_LOG`) and `errorReporting.ts` (guarded by `NODE_ENV`).
- **No PII / no money** in logs, analytics, Sentry breadcrumbs, or push notification bodies.
- **≥ 44 × 44 px touch targets.** Enforced by [`src/__tests__/touchTargets.test.ts`](../src/__tests__/touchTargets.test.ts).
- **`prefers-reduced-motion`** respected for every animation. Enforced by [`src/__tests__/motionVariants.test.ts`](../src/__tests__/motionVariants.test.ts).

---

## 7. Standard tool usage (agent side)

Preferred tools, in order of preference for common tasks:

| Task                                          | First choice                                    | Fallback                     |
| --------------------------------------------- | ----------------------------------------------- | ---------------------------- |
| Find a symbol or reference                    | `grep` / `glob`                                 | Shell (`Select-String`)      |
| Read a specific file section                  | `view` with `view_range`                        | Shell (`Get-Content`)        |
| Make a precise, small edit                    | `edit` (batched in one response when possible)  | Recreate the file            |
| Recreate a small file after full rewrite      | `create` (delete + create is only for scaffolds) | —                            |
| Run tests / build                             | `npm test`, `npm run build`, `npm run lint`     | —                            |
| Explore a wide, independent research thread   | `task` (explore agent) with a complete prompt   | —                            |

**Never** delegate a small, in-context lookup to an `explore` agent — it costs more than reading the file yourself.

---

## 8. Prompts of record

- [`prompts/STANDARD_HEADER.md`](../prompts/STANDARD_HEADER.md) — the default sprint-execution prompt.
- [`prompts/MASTER_AUDIT.md`](../prompts/MASTER_AUDIT.md) — the audit prompt used to generate [`sprint-reports/SPRINT_0_SUMMARY.md`](../sprint-reports/SPRINT_0_SUMMARY.md).

If a session opens with one of these prompts, follow it verbatim; this handbook is subordinate to the prompt during that session.

---

## 9. Change history

- **2026-07-23:** Handbook created (Sprint 1.2, T-1.2.3).

**Last reviewed:** 2026-07-23
