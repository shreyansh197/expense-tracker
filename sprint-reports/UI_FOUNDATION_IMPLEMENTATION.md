<!--
  UI_FOUNDATION_IMPLEMENTATION.md — ExpenStream UI Foundation Implementation
  Owner: Product Design Director, Principal UX Engineer, Design Systems Lead,
         Staff Frontend Architect, Accessibility Specialist, AI Engineering Team.
  Audience: Product + Engineering leadership, contributing engineers, AI agents
            who will consume the new Product Experience documentation family.
  Companion report: sprint-reports/UI_FOUNDATION_AUDIT.md (the proposal this
            report implements).
  Rule: Documentation-only report. No application source code was modified.
        Every change listed here was authorised by the approved audit.
-->

# ExpenStream — UI Foundation Implementation

**Status:** Final · **Version:** 1.0 · **Date:** 2026-07-24 · **Milestone:** M15 — UI Foundation (Product Experience Documentation) · **Mode:** Documentation-only execution

> This report is the execution record for the approved [`sprint-reports/UI_FOUNDATION_AUDIT.md`](UI_FOUNDATION_AUDIT.md). It lands the three new Product Experience documents, the five in-place doc extensions, and the two prompt-layer updates the audit recommended. **No `src/` file was modified**, and no application code, layout, business logic, or API was touched.

---

## 1. Executive Summary

The UI Foundation Audit identified a missing middle layer between doctrine (`PRODUCT_PRINCIPLES.md`) and mechanics (`DESIGN_SYSTEM.md`) — a **Product Experience** family that would answer *"what should the user feel on each screen, and how do we design for the psychology of money?"*. That gap is now closed.

This sprint:

- Created **three new documents** (`EXPERIENCE_VISION.md`, `SCREEN_GUIDELINES.md`, `FINANCIAL_PSYCHOLOGY.md`), each written to serve as a standalone reference so a future AI agent can bootstrap the ExpenStream product experience without additional prompting.
- Extended **five existing documents** in place (`PRODUCT_PRINCIPLES.md`, `PROJECT_MASTER_PLAN.md`, `DESIGN_SYSTEM.md`, `AI_AGENT_HANDBOOK.md`, `SPRINT_BOARD.md`/`IMPLEMENTATION_QUEUE.md`) additively — no existing section was removed or restructured.
- Updated **two prompt-layer files** (`prompts/STANDARD_HEADER.md` STEP 1; `prompts/IMPLEMENT_SPRINT.md` Phase 2). `prompts/MASTER_AUDIT.md` and `prompts/UI_FOUNDATION_AUDIT.md` were intentionally left unchanged per audit §7.4-§7.5.
- Wired the new docs into the canonical read order and the repository memory layout so agents pick them up on session boot.

Everything below traces directly to a section of the audit report.

---

## 2. Files Created

| Path                                                             | Family              | Responsibility                                                                                                                                     | Audit reference |
| ---------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| [`docs/EXPERIENCE_VISION.md`](../docs/EXPERIENCE_VISION.md)      | Product Experience  | North-star product experience narrative; the Six Qualities of a Premium Finance Surface; benchmark qualities (extracted, never copied); the Sound Absence; anti-patterns refused. | Audit §4.1      |
| [`docs/SCREEN_GUIDELINES.md`](../docs/SCREEN_GUIDELINES.md)      | Product Experience  | Canonical composition and five states (empty / loading / error / offline / success) for every top-level screen — Landing, Login, Dashboard, Expenses, Analytics, Business, Category, Settings — plus screens-wide cross-cutting rules. | Audit §4.2      |
| [`docs/FINANCIAL_PSYCHOLOGY.md`](../docs/FINANCIAL_PSYCHOLOGY.md)| Product Experience  | Money-related cognitive biases (anchoring, loss aversion, present bias, financial shame, notification anxiety, mental accounting, envelope bias, social comparison, sunk cost, endowment, scarcity, category framing, confirmation bias) each paired with an ExpenStream guardrail and the anti-pattern we refuse to ship. Opens with the explicit non-goal statement. | Audit §4.3      |
| `sprint-reports/UI_FOUNDATION_IMPLEMENTATION.md`                 | Ops & History       | This report.                                                                                                                                       | Audit §11       |

Each Product Experience document answers the 18 mandatory Product Experience questions (why, problem, business value, product value, user mindset, emotional goal, user journey, loading, empty, error, offline, accessibility, motion, information hierarchy, interaction philosophy, design rationale, future evolution, common implementation mistakes).

**Not created (rejected in audit):** `docs/MOTION_SYSTEM.md`. Motion remains owned by [`docs/DESIGN_SYSTEM.md §8 + §19`](../docs/DESIGN_SYSTEM.md) per audit §4.4.

---

## 3. Files Updated

All updates are additive. No existing section was removed, renamed, or restructured. The `Last reviewed` footer date was refreshed only on files that received content changes.

| Path                                                                       | Change                                                                                                                                                                       | Audit reference |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| [`docs/PRODUCT_PRINCIPLES.md`](../docs/PRODUCT_PRINCIPLES.md)              | Added §7.5 **Emotional design commitments** (five promises upgrading the §5 Feelings taxonomy) and §7.6 **Financial-psychology guardrails** (doctrine-level posture anchoring the new `FINANCIAL_PSYCHOLOGY.md`). | Audit §3        |
| [`docs/PROJECT_MASTER_PLAN.md`](../docs/PROJECT_MASTER_PLAN.md)            | Added a *primary emotion arc* sub-bullet (start → mid → end) to every subsection of §7 User Journey (§7.1 – §7.6). No new journeys, no restructure. Cross-linked to `EXPERIENCE_VISION.md` and `SCREEN_GUIDELINES.md`. | Audit §3        |
| [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md)                        | Appended §22 **UI Evolution & Versioning** covering versioning model, propose / deprecate / remove flow, sensitivity rules for motion / elevation / typography, cross-references, and scope. Sections §0–§21 unchanged. `Last reviewed` bumped to 2026-07-24. | Audit §3, §4.4  |
| [`docs/AI_AGENT_HANDBOOK.md`](../docs/AI_AGENT_HANDBOOK.md)                | §1 Repository memory layout now lists the three new docs. §2 Canonical read order rewritten to match the audit §6 sequence. §8 Prompts of record adds `prompts/IMPLEMENT_SPRINT.md` and `prompts/UI_FOUNDATION_AUDIT.md`. §9 Change history entry added. Conflict-resolution order **unchanged**. | Audit §3, §6, §7 |
| [`docs/SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md)                          | Added **M15 — UI Foundation (Product Experience Documentation)** milestone with Sprint 15.1 decomposition. Table of contents, Milestone Status Summary, and totals updated to reflect 15 milestones / 33 sprints. | Audit §3        |
| [`docs/IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md)          | Added Sprint 15.1 with 10 atomic tasks (T-15.1.1 – T-15.1.10), one per file created + one per existing-doc update + one for this report. TOC updated. All tasks marked `[x] Done (2026-07-24)`. | Audit §3        |
| [`prompts/STANDARD_HEADER.md`](../prompts/STANDARD_HEADER.md)              | STEP 1 doc list now includes `EXPERIENCE_VISION.md`, `SCREEN_GUIDELINES.md`, `FINANCIAL_PSYCHOLOGY.md` with a note that they sit in "remaining documentation" for conflict resolution. Pre-existing bogus doc references (COMPONENT_LIBRARY, PERFORMANCE_GUIDELINES, SECURITY_GUIDELINES, API_SPECIFICATION, DATABASE_SCHEMA) were **not** touched, per audit §7.1 (out of scope for this milestone). | Audit §7.2      |
| [`prompts/IMPLEMENT_SPRINT.md`](../prompts/IMPLEMENT_SPRINT.md)            | Phase 2 "Understand" list now includes **Experience Vision** and **Screen Guidelines** alongside the existing "Existing design system" bullet, so per-sprint executions consult both. | Audit §7.3      |

**Files intentionally NOT updated** (audit §3, §7):

- [`docs/AI_CONTEXT.md`](../docs/AI_CONTEXT.md) — kept under the two-page constraint. Emotional / financial-psych surface lives in `PRODUCT_PRINCIPLES.md §7.5 / §7.6` instead.
- [`docs/UX_DECISIONS.md`](../docs/UX_DECISIONS.md) — append-only precedent log; new decisions land as new `UX-N.N` entries when made, not pre-emptively.
- [`docs/IMPLEMENTATION_RULES.md`](../docs/IMPLEMENTATION_RULES.md), [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md), [`docs/PRODUCTION_CHECKLIST.md`](../docs/PRODUCTION_CHECKLIST.md), [`docs/TESTING_CHECKLIST.md`](../docs/TESTING_CHECKLIST.md), [`docs/CHANGELOG.md`](../docs/CHANGELOG.md), [`docs/RELEASE_NOTES.md`](../docs/RELEASE_NOTES.md), [`docs/adr/`](../docs/adr/).
- [`prompts/MASTER_AUDIT.md`](../prompts/MASTER_AUDIT.md) — Sprint-0 historical, complete as authored (audit §7.4).
- [`prompts/UI_FOUNDATION_AUDIT.md`](../prompts/UI_FOUNDATION_AUDIT.md) — immutable; this is the prompt that governed the audit (audit §7.5).

**No source code was modified.** `src/`, `prisma/`, `public/`, and `package.json` were not touched.

---

## 4. Cross-References Established

The new docs are cross-linked into the existing memory graph. Direction of every arrow is *consumer → source of truth*.

### 4.1 Outgoing from the new documents

- **`EXPERIENCE_VISION.md` → cites** `PRODUCT_PRINCIPLES.md` (§7.5), `DESIGN_SYSTEM.md` (§8 motion, §11–§14 components, §17 a11y, §22 evolution), `SCREEN_GUIDELINES.md` (per-screen composition), `FINANCIAL_PSYCHOLOGY.md` (biases refused), `UX_DECISIONS.md` (interaction precedent), `PROJECT_MASTER_PLAN.md` (§6 personas, §7 journeys), `ARCHITECTURE.md` (offline-first, sync), `AI_CONTEXT.md` (§18 no-money-in-logs), `IMPLEMENTATION_RULES.md` (contracts).
- **`SCREEN_GUIDELINES.md` → cites** `EXPERIENCE_VISION.md`, `DESIGN_SYSTEM.md` (component sections per screen), `UX_DECISIONS.md` (UX-1.1 dashboard order, UX-3.x sheets, UX-4.1 amount pad), `FINANCIAL_PSYCHOLOGY.md` (per-screen bias guardrails), `PRODUCT_PRINCIPLES.md`, `PROJECT_MASTER_PLAN.md` (§7 journeys), `SPRINT_BOARD.md` (M4 chart alts, M7 business ledger), `ARCHITECTURE.md` (§18.1 conflict UX), `AI_CONTEXT.md`, `IMPLEMENTATION_RULES.md`.
- **`FINANCIAL_PSYCHOLOGY.md` → cites** `PRODUCT_PRINCIPLES.md` (§6 fintech principles, §7.6 doctrine anchor), `EXPERIENCE_VISION.md` (§5 anti-patterns, §7 loading, §9 error), `DESIGN_SYSTEM.md` (§8 motion), `ARCHITECTURE.md` (offline-first).

### 4.2 Incoming to the new documents

- **`PRODUCT_PRINCIPLES.md §7.5`** → `EXPERIENCE_VISION.md`.
- **`PRODUCT_PRINCIPLES.md §7.6`** → `FINANCIAL_PSYCHOLOGY.md`.
- **`PROJECT_MASTER_PLAN.md §7`** → `EXPERIENCE_VISION.md` and `SCREEN_GUIDELINES.md`.
- **`DESIGN_SYSTEM.md §22.5`** → `EXPERIENCE_VISION.md` and `SCREEN_GUIDELINES.md`.
- **`AI_AGENT_HANDBOOK.md §1, §2`** → all three new docs.
- **`prompts/STANDARD_HEADER.md STEP 1`** → all three new docs.
- **`prompts/IMPLEMENT_SPRINT.md Phase 2`** → `EXPERIENCE_VISION.md` and `SCREEN_GUIDELINES.md`.

### 4.3 Cycle check

No cycles introduced. Doctrine (`PRODUCT_PRINCIPLES.md`) is cited by the new docs but does not cite back into them for its authoritative content — the two new subsections (§7.5, §7.6) are self-contained and merely name-check the companion docs for depth. The `EXPERIENCE_VISION → SCREEN_GUIDELINES → UX_DECISIONS` chain is acyclic per audit §5.

---

## 5. Prompt Changes

| Prompt                                                                                | Change                                                                                                                                                                          | Rationale                                                                                                    |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`prompts/STANDARD_HEADER.md`](../prompts/STANDARD_HEADER.md)                         | STEP 1 lists the three new docs; a caveat clarifies they sit in "remaining documentation" for conflict resolution.                                                              | Audit §7.2. Ensures every sprint-executing agent loads the Product Experience family at session boot.        |
| [`prompts/IMPLEMENT_SPRINT.md`](../prompts/IMPLEMENT_SPRINT.md)                       | Phase 2 "Understand" list adds `docs/EXPERIENCE_VISION.md` and `docs/SCREEN_GUIDELINES.md`.                                                                                     | Audit §7.3. Per-sprint executions now consult the target feeling and per-screen composition alongside DS.    |
| [`prompts/MASTER_AUDIT.md`](../prompts/MASTER_AUDIT.md)                               | **Unchanged.**                                                                                                                                                                  | Audit §7.4. Sprint-0 historical prompt; complete as authored.                                                |
| [`prompts/UI_FOUNDATION_AUDIT.md`](../prompts/UI_FOUNDATION_AUDIT.md)                 | **Unchanged.**                                                                                                                                                                  | Audit §7.5. Immutable; this is the prompt that governed the audit.                                           |

**Deferred (audit §7.1, out of scope for this milestone):** cleanup of the five bogus doc references still listed in `prompts/STANDARD_HEADER.md` STEP 1 (`COMPONENT_LIBRARY.md`, `PERFORMANCE_GUIDELINES.md`, `SECURITY_GUIDELINES.md`, `API_SPECIFICATION.md`, `DATABASE_SCHEMA.md`). These are tracked as a Documentation-Truth task, not a UI-Foundation task.

---

## 6. Reading Order (Post-Milestone)

The canonical read order in [`docs/AI_AGENT_HANDBOOK.md §2`](../docs/AI_AGENT_HANDBOOK.md) is now:

1. [`AI_CONTEXT.md`](../docs/AI_CONTEXT.md) — boot memory, "under two pages" constraint.
2. [`PRODUCT_PRINCIPLES.md`](../docs/PRODUCT_PRINCIPLES.md) — doctrine (now with §7.5 emotional / §7.6 fin-psych anchors).
3. **[`EXPERIENCE_VISION.md`](../docs/EXPERIENCE_VISION.md)** *(new)* — target feeling; Six Qualities.
4. **[`FINANCIAL_PSYCHOLOGY.md`](../docs/FINANCIAL_PSYCHOLOGY.md)** *(new)* — biases refused.
5. [`ARCHITECTURE.md`](../docs/ARCHITECTURE.md) (+ [`ARCHITECTURE_DIAGRAMS.md`](../docs/ARCHITECTURE_DIAGRAMS.md) if the task touches auth / sync / notifications / workspace flows).
6. [`DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) — vocabulary (now with §22 UI Evolution).
7. **[`SCREEN_GUIDELINES.md`](../docs/SCREEN_GUIDELINES.md)** *(new)* — per-screen composition + five states.
8. [`UX_DECISIONS.md`](../docs/UX_DECISIONS.md) — precedent log.
9. [`PROJECT_MASTER_PLAN.md`](../docs/PROJECT_MASTER_PLAN.md) — PRD, personas, journeys (§7 emotional arcs).
10. [`SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md) — what's active.
11. [`IMPLEMENTATION_QUEUE.md`](../docs/IMPLEMENTATION_QUEUE.md) — atomic tasks.
12. [`IMPLEMENTATION_RULES.md`](../docs/IMPLEMENTATION_RULES.md) — enforceable contracts.
13. Task-specific: [`adr/`](../docs/adr/), [`PRODUCTION_CHECKLIST.md`](../docs/PRODUCTION_CHECKLIST.md), [`TESTING_CHECKLIST.md`](../docs/TESTING_CHECKLIST.md).

**Conflict-resolution priority is unchanged:** `IMPLEMENTATION_RULES > DESIGN_SYSTEM > UX_DECISIONS > PROJECT_MASTER_PLAN > remaining docs`. The three new Product Experience docs sit inside "remaining docs" — they inform but do not override engineering or design contracts. This preserves the safety property that hard contracts win over aspirational narrative.

---

## 7. Integration Summary

### 7.1 The documentation architecture now resolves into five families

Per audit §8:

| Family                       | Files                                                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Boot & Rules**             | `AI_CONTEXT.md`, `AI_AGENT_HANDBOOK.md`, `IMPLEMENTATION_RULES.md`.                                                                                                                |
| **The Why (Doctrine)**       | `PRODUCT_PRINCIPLES.md` (now including §7.5 emotional / §7.6 fin-psych anchors).                                                                                                   |
| **The What (Product Scope)** | `PROJECT_MASTER_PLAN.md` (now including per-journey emotional arcs in §7).                                                                                                         |
| **The How (Design + Build)** | `DESIGN_SYSTEM.md` (now including §22 UI Evolution), `ARCHITECTURE.md`, `ARCHITECTURE_DIAGRAMS.md`, `adr/`.                                                                        |
| **Product Experience (NEW)** | **`EXPERIENCE_VISION.md`**, **`SCREEN_GUIDELINES.md`**, **`FINANCIAL_PSYCHOLOGY.md`**, `UX_DECISIONS.md`.                                                                          |
| **Ops & History**            | `SPRINT_BOARD.md`, `IMPLEMENTATION_QUEUE.md`, `PRODUCTION_CHECKLIST.md`, `TESTING_CHECKLIST.md`, `CHANGELOG.md`, `RELEASE_NOTES.md`, and this report under `sprint-reports/`.       |

### 7.2 What a future AI agent gets for free

A new session that follows `AI_AGENT_HANDBOOK §2` now bootstraps into a complete Product Experience mindset without additional prompting:

- **What the product *is*** → `AI_CONTEXT.md`.
- **What the product *promises*** → `PRODUCT_PRINCIPLES.md` (with the new §7.5, §7.6 anchors).
- **What the product should *feel* like** → `EXPERIENCE_VISION.md`.
- **What the product *refuses* to do** → `FINANCIAL_PSYCHOLOGY.md`.
- **What the vocabulary *is*** → `DESIGN_SYSTEM.md` (with the new §22 evolution contract).
- **What sentences the vocabulary *composes into*** → `SCREEN_GUIDELINES.md`.
- **What has been *decided* before** → `UX_DECISIONS.md`.
- **What the *scope, personas, and journeys* are** → `PROJECT_MASTER_PLAN.md` (with the new emotional arcs).
- **What the *contracts* are** → `IMPLEMENTATION_RULES.md`.
- **What is *active* right now** → `SPRINT_BOARD.md` + `IMPLEMENTATION_QUEUE.md`.

### 7.3 Verification

- ✓ Every new file exists at the path listed in §2.
- ✓ Every in-place update landed at the location described in §3, additively.
- ✓ Reading order in `AI_AGENT_HANDBOOK §2` matches the audit §6 sequence.
- ✓ Cross-references in §4 resolve to real files and sections.
- ✓ Conflict-resolution priority order in `AI_AGENT_HANDBOOK §2` and `STANDARD_HEADER.md` STEP 1 is byte-identical to the pre-existing chain.
- ✓ No `src/`, `prisma/`, `public/`, `package.json`, or `package-lock.json` file was modified.
- ✓ Each of the three new Product Experience docs answers all 18 mandatory Product Experience questions.
- ✓ `SPRINT_BOARD.md` totals and Milestone Status Summary reflect the new M15.
- ✓ `IMPLEMENTATION_QUEUE.md` lists Sprint 15.1 in the TOC and body, with all ten tasks marked `[x] Done (2026-07-24)`.

### 7.4 Risks called out at audit time — status

| Audit risk | Mitigation as shipped                                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-1 Documentation sprawl | Reading order in §6 above is explicit; `AI_CONTEXT.md` is not extended so the 2-page constraint holds; new docs are inserted at semantically-useful positions in the order.                                              |
| R-2 Duplication drift    | Every new doc opens with a header-comment reviewer checklist ("do not restate DS", "do not restate principles"). Cross-references cite rather than restate.                                                              |
| R-3 Screen Guidelines fossilise UI | `SCREEN_GUIDELINES.md §2-§9` each carries an implementation-status marker (`Implemented` / `Partially implemented` / `Aspirational`). Drift is expected and traceable.                                             |
| R-4 Fin-psych doc misread as nudging playbook | `FINANCIAL_PSYCHOLOGY.md` opens with the explicit non-goal statement; every entry lists an anti-pattern refused; §15 restates the "thoughtful accountant" test.                                          |
| R-5 Benchmark copying    | `EXPERIENCE_VISION.md §4` restates the ban in-doc and only extracts *qualities*, never designs.                                                                                                                          |
| R-6 STANDARD_HEADER prompt drift | Explicitly out of scope for this milestone; tracked separately.                                                                                                                                                    |
| R-7 Agent conflict-resolution ambiguity | Conflict order restated in `AI_AGENT_HANDBOOK §2` and in each new doc's header comment.                                                                                                                        |
| R-8 Scope creep (Component Library) | Explicitly deferred in audit §9 and not created here.                                                                                                                                                              |

---

## 8. What is *not* done in this milestone

Per audit §9 (Reserved for Future Work):

- **`COMPONENT_LIBRARY.md`** — not created. Content lives in `DESIGN_SYSTEM.md`.
- **Dedicated Retention doc** — not created. Retention covered by `PRODUCT_PRINCIPLES.md §9`.
- **Dedicated Accessibility doc** — not created. A11y covered across `PRODUCT_PRINCIPLES §10`, `DESIGN_SYSTEM §17`, `IMPLEMENTATION_RULES.md`, `AI_CONTEXT §12`, `EXPERIENCE_VISION §11`, and `SCREEN_GUIDELINES §15`.
- **Dedicated Motion doc** — not created. Motion remains owned by `DESIGN_SYSTEM §8 + §19`. See audit §4.4.
- **Iconography / illustration / content-style guides** — deferred until a real driver appears.
- **`prompts/STANDARD_HEADER.md` cleanup** of five bogus doc references — deferred to a separate Documentation-Truth task.
- **`prompts/UI_FOUNDATION_EXECUTE.md`** — optional follow-up prompt; not required, since `IMPLEMENT_SPRINT.md` (updated in this milestone) suffices.

---

## 9. Companion Documents

- Audit that authorised this work: [`sprint-reports/UI_FOUNDATION_AUDIT.md`](UI_FOUNDATION_AUDIT.md).
- Sprint decomposition: [`docs/SPRINT_BOARD.md#m15--ui-foundation-product-experience-documentation`](../docs/SPRINT_BOARD.md).
- Atomic task list: [`docs/IMPLEMENTATION_QUEUE.md#sprint-151`](../docs/IMPLEMENTATION_QUEUE.md).
- Agent boot map: [`docs/AI_AGENT_HANDBOOK.md`](../docs/AI_AGENT_HANDBOOK.md) (updated in this sprint).

---

**Last reviewed:** 2026-07-24
