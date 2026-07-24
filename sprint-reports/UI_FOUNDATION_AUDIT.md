<!--
  UI_FOUNDATION_AUDIT.md — ExpenStream UI Foundation Audit (documentation-only)
  Owner: Product Design Director, Principal UX Engineer, Design Systems Lead,
         Staff Frontend Architect, Motion Designer, Accessibility Specialist,
         AI Engineering Team.
  Audience: Product + Engineering leadership, contributing engineers, AI agents
            who will execute the UI Foundation milestone in later sprints.
  Companion docs: prompts/UI_FOUNDATION_AUDIT.md, docs/AI_CONTEXT.md,
                  docs/PRODUCT_PRINCIPLES.md, docs/PROJECT_MASTER_PLAN.md,
                  docs/DESIGN_SYSTEM.md, docs/UX_DECISIONS.md,
                  docs/ARCHITECTURE.md, docs/IMPLEMENTATION_RULES.md,
                  docs/SPRINT_BOARD.md, docs/IMPLEMENTATION_QUEUE.md,
                  docs/AI_AGENT_HANDBOOK.md, prompts/STANDARD_HEADER.md,
                  prompts/IMPLEMENT_SPRINT.md, prompts/MASTER_AUDIT.md.
  Rule: This report is documentation only. No application source code, no
        components, no layouts, no business logic, no APIs, no existing docs
        were modified during this audit. It is a proposal awaiting approval;
        no documentation changes are executed until approval is granted.
-->

# ExpenStream — UI Foundation Audit

**Status:** Proposal · **Version:** 1.0 · **Date:** 2026-07-24 · **Milestone:** UI Foundation (pre-execution) · **Mode:** Documentation-only audit

> Deliverable defined by [`prompts/UI_FOUNDATION_AUDIT.md`](../prompts/UI_FOUNDATION_AUDIT.md). This report evaluates whether the existing ADK (docs + prompts) is sufficient to guide future AI agents in building a **premium finance application**, identifies where the ADK is already strong, where it must be extended, and where a **new** document is genuinely justified under the Single Responsibility Principle. **No files were modified.** Approval is required before any documentation change is executed.

---

## 1. Executive Summary

The ExpenStream ADK is already unusually mature for a project at this milestone. Seven documents carry most of the load and are internally consistent:

- [`docs/AI_CONTEXT.md`](../docs/AI_CONTEXT.md) — permanent boot memory.
- [`docs/PRODUCT_PRINCIPLES.md`](../docs/PRODUCT_PRINCIPLES.md) — the *why*.
- [`docs/PROJECT_MASTER_PLAN.md`](../docs/PROJECT_MASTER_PLAN.md) — scope, personas, journeys, KPIs.
- [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) *(Living Terrain 2026)* — tokens, motion, components.
- [`docs/UX_DECISIONS.md`](../docs/UX_DECISIONS.md) — precedent log for 40+ interaction decisions.
- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) + [`docs/ARCHITECTURE_DIAGRAMS.md`](../docs/ARCHITECTURE_DIAGRAMS.md) — runtime shape.
- [`docs/IMPLEMENTATION_RULES.md`](../docs/IMPLEMENTATION_RULES.md) — enforceable engineering contracts.

Against the UI Foundation topic list (Product Vision · Experience Vision · Screen Guidelines · Motion System · User Journeys · Interaction Patterns · Visual Language · UI Evolution · Premium Fintech UX · Accessibility · Emotional Design · Financial Psychology · Retention · Behavioral Design), the ADK is:

| Coverage tier | Topics                                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Complete**  | Product Vision, Visual Language, Motion System, Accessibility (contract level), Retention (principle level).                                              |
| **Partial**   | Experience Vision, User Journeys, Interaction Patterns, Emotional Design, Premium Fintech UX.                                                             |
| **Missing**   | Screen Guidelines (per-screen recipes), UI Evolution (versioning + deprecation policy), Financial Psychology, Behavioral Design (behavioural-science lens). |

**Recommendation.** Extend five existing documents in place; add **four** new documents that pass the Single Responsibility test; consolidate two prompt-layer references. No document is a candidate for deletion. Zero application source code will be touched. Estimated documentation surface added: ~4 files, ~5 targeted section additions.

The most important single insight from this audit: **ExpenStream already has a design system; what it does not yet have is a `Product Experience` layer** — a small, disciplined set of documents that answers "what should the user *feel* on each screen, and how do we design for the psychology of money?" That is the gap this milestone should close, without duplicating anything in `DESIGN_SYSTEM.md`, `PRODUCT_PRINCIPLES.md`, or `UX_DECISIONS.md`.

---

## 2. Existing Documentation Assessment

Each row lists: current responsibility, current coverage against the 14 UI-Foundation topics, and the verdict.

| Doc                                                                    | Current single responsibility                                                          | UI-Foundation topics it already owns                                                                          | Verdict                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`AI_CONTEXT.md`](../docs/AI_CONTEXT.md)                               | Short-form boot memory ("under two pages"). Rules + mission summary.                   | Product Vision (§1), UX Philosophy summary (§5), UI Philosophy summary (§6), Modern 2026 UI Trends (§14).     | **Keep unchanged**. Any new content would break the 2-page constraint. Add cross-links only. |
| [`PRODUCT_PRINCIPLES.md`](../docs/PRODUCT_PRINCIPLES.md)               | The *why*: mission, vision, values, promises, principle families.                      | Product Vision, Experience Vision (§5 "Feelings taxonomy"), Retention principles (§9), A11y principles (§10). | **Extend** — add Emotional Design promise + Financial Psychology anchor (see §3). |
| [`PROJECT_MASTER_PLAN.md`](../docs/PROJECT_MASTER_PLAN.md)             | The *what*: PRD, KPIs, personas, journeys, milestones, roadmap.                        | User Journeys (§7), Personas (§6), UX Principles (§10), Roadmap (§5).                                         | **Extend** — expand §7 with journey emotional arc references; no restructure. |
| [`DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) *("Living Terrain")*    | Visual + motion + component tokens and rules.                                          | Visual Language (§1–7), Motion System (§8, §19), Component patterns (§9–16), Accessibility contract (§17).    | **Extend** — add §22 "UI Evolution & Versioning" (see §3). No topic overlap. |
| [`UX_DECISIONS.md`](../docs/UX_DECISIONS.md)                           | Precedent log — one-line-per-decision rationale, immutable history.                    | Interaction Patterns (indirectly via decisions), a11y decisions, motion decisions.                            | **Keep** its shape. Reference from the new screen-guidelines doc rather than moving content in. |
| [`ARCHITECTURE.md`](../docs/ARCHITECTURE.md) + `ARCHITECTURE_DIAGRAMS` | Runtime shape, file map, guard chain.                                                  | None directly (out of UI scope).                                                                              | **Keep unchanged**. |
| [`IMPLEMENTATION_RULES.md`](../docs/IMPLEMENTATION_RULES.md)           | Enforceable engineering contracts (types, tests, tokens, a11y).                        | A11y contracts, token-usage bans.                                                                             | **Keep unchanged**. New Product-Experience docs will *reference* it, not duplicate. |
| [`AI_AGENT_HANDBOOK.md`](../docs/AI_AGENT_HANDBOOK.md)                 | Boot sequence + conflict resolution order for AI agents.                               | Meta-navigation only.                                                                                         | **Extend** — the "Canonical read order (§2)" and "Repository memory layout (§1)" must list any new docs from §4 below. |
| [`SPRINT_BOARD.md`](../docs/SPRINT_BOARD.md) + `IMPLEMENTATION_QUEUE`  | Milestone / sprint / task decomposition.                                               | None directly.                                                                                                | **Extend** — one new milestone entry ("M — UI Foundation") that anchors the docs work, plus a task line per new doc. Owned by a later sprint prompt, not by this audit. |
| [`PRODUCTION_CHECKLIST.md`](../docs/PRODUCTION_CHECKLIST.md), [`TESTING_CHECKLIST.md`](../docs/TESTING_CHECKLIST.md) | Release + QA gates.                             | A11y verification gates.                                                                                      | **Keep unchanged**. |
| [`CHANGELOG.md`](../docs/CHANGELOG.md), [`RELEASE_NOTES.md`](../docs/RELEASE_NOTES.md) | Technical + user-facing change history.                              | None.                                                                                                         | **Keep unchanged** for the audit; add one line each when doc changes ship. |
| [`adr/`](../docs/adr)                                                  | Architecture Decision Records.                                                          | None.                                                                                                         | **Keep** — the template already fits. Any decision the new docs surface (e.g., "adopt behavioural-design lens") should land as an ADR, not be inlined. |

### Documentation responsibilities that overlap today

Only two soft overlaps exist, and both are intentional; the audit recommends **preserving** them and adding cross-links, not consolidating:

1. **Vision** appears in `AI_CONTEXT §1`, `PRODUCT_PRINCIPLES §1–2`, and `PROJECT_MASTER_PLAN §1`. Each restatement serves a different audience (agent boot / product doctrine / PRD scope). Leave as-is.
2. **UX principles** appear in `AI_CONTEXT §5`, `PRODUCT_PRINCIPLES §5`, `PROJECT_MASTER_PLAN §10`, and `UX_DECISIONS.md` (as decisions). Same reason. Leave as-is.

No hard duplication was found. **No content needs to be deleted or merged.**

---

## 3. Existing Files to Update

Five documents receive **additive, in-place** edits. No section is removed, renamed, or restructured. All edits are small.

| File                                                                           | Change scope                                                                                                                                                                            | Justification                                                                                            |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **`docs/PRODUCT_PRINCIPLES.md`**                                               | Add §7.5 "Emotional design commitments" (3–5 promises) that upgrades the §5 "Feelings taxonomy" from a table to a set of principles. Add §7.6 "Financial-psychology guardrails" (anchoring, loss aversion, ambient anxiety) that we design *against*, referencing the new Financial-Psychology doc. | Places the *why* of emotional/financial-psych design in the doctrine doc where all "why" already lives. Prevents the new Emotional-Design doc from re-litigating principles. |
| **`docs/PROJECT_MASTER_PLAN.md`**                                              | In §7 (User Journey), add one sub-bullet per journey: *primary emotion* (start → mid → end). No new journeys.                                                                          | Journeys already exist; only the emotional arc is missing. Belongs here because the doc already owns Journeys. |
| **`docs/DESIGN_SYSTEM.md`**                                                    | Add §22 "UI Evolution & Versioning": how tokens/components deprecate, how new patterns are proposed, how the design system version bumps.                                              | The doc already owns visual/motion/components; evolution policy for the *same* surface is a natural §. Avoids a separate doc. |
| **`docs/AI_AGENT_HANDBOOK.md`**                                                | Extend §1 "Repository memory layout" and §2 "Canonical read order" to reference the four new docs from §4. Extend the conflict-resolution table only if a new doc introduces a rule — none do. | Handbook is the map. Map must include new destinations. |
| **`docs/SPRINT_BOARD.md`** + **`docs/IMPLEMENTATION_QUEUE.md`**                | Add one new milestone entry: **"M — UI Foundation (Product Experience Documentation)"** with N atomic tasks (one per new doc + one per existing-doc update). Status `Pending`.          | Sprint execution model requires every documented change to be an atomic, dependency-tracked task.        |

**Documents intentionally NOT updated by this audit:**

- `AI_CONTEXT.md` (must stay under two pages — the new emotional/psychology surface goes into `PRODUCT_PRINCIPLES.md` instead).
- `UX_DECISIONS.md` (append-only precedent log; new decisions land as new UX-N.N entries when they are made, not pre-emptively).
- `IMPLEMENTATION_RULES.md`, `ARCHITECTURE.md`, `PRODUCTION_CHECKLIST.md`, `TESTING_CHECKLIST.md`, `CHANGELOG.md`, `RELEASE_NOTES.md`, `adr/*`.

---

## 4. New Files to Create

Four new documents pass the Single Responsibility test. Each has a **narrow, non-overlapping** scope and each is **substantial enough** to warrant independent reading by a future AI agent.

Every new doc lives under `docs/` so `AI_AGENT_HANDBOOK.md`'s read order picks them up automatically.

### 4.1 `docs/EXPERIENCE_VISION.md`

**Single responsibility.** The **north-star product experience**, one level above `PRODUCT_PRINCIPLES.md`: what an ExpenStream session *feels* like end-to-end, what emotional promises the app makes moment-to-moment, and what "premium finance experience" concretely means for this product. Not principles. Not screens. The **experience narrative**.

**Owned topics from the audit list.**

- Experience Vision (primary).
- Premium Fintech UX (primary — extracted principles from Apple Wallet / Copilot Money / Monarch / YNAB / Revolut, plus Material 3 and HIG, expressed as reusable qualities — never a copy).
- Emotional Design (narrative anchor — principles live in `PRODUCT_PRINCIPLES §7.5`).

**Why a new doc.** The existing "Feelings taxonomy" table (`PRODUCT_PRINCIPLES §5`) is a *list*; premium finance apps ship a *narrative* — a description of the calm, the pace, the sound absence, the typographic silence, the way money is treated on a screen. That narrative is longer than a section and belongs to no existing doc.

**Why not fold into `DESIGN_SYSTEM.md`.** Design System is *tokens and components*. Experience Vision is *feeling*. Merging would violate SRP and mix "what things look like" with "what the product feels like".

**Why not fold into `PRODUCT_PRINCIPLES.md`.** Principles are *rules the product must not break*. Experience Vision is *the target we are trying to reach*. Different verb.

**Rough shape (proposed, not authored here).** Section headings only:
1. The Session Story (open → glance → act → close).
2. The Six Qualities of a Premium Finance Surface (calm, honest, unhurried, private, precise, human).
3. The Sound Absence (no chime, no confetti, no interruption).
4. Benchmarks — Reusable Qualities (Apple Wallet · Copilot Money · Monarch · YNAB · Revolut · Material 3 · HIG). Extracted qualities, never copied designs.
5. Anti-patterns we refuse.
6. How to use this document (reviewers, designers, agents).

### 4.2 `docs/SCREEN_GUIDELINES.md`

**Single responsibility.** Per-screen recipes: for each screen (Dashboard, Expenses, Analytics, Business, Category, Settings, Login, Landing), the **canonical composition** — what must be above the fold, what the empty/loading/error/offline/success states look like conceptually, and which UX-N.N decisions govern it. **No visual redesign; only guidance.**

**Owned topics.**

- Screen Guidelines (primary).
- Interaction Patterns (per-screen — cross-screen patterns stay in `DESIGN_SYSTEM.md` §12–14 and `UX_DECISIONS.md`).

**Why a new doc.** Screen composition is currently *implicit* — spread across `UX_DECISIONS.md` (UX-1.1 dashboard order, UX-3.x sheets, UX-4.1 amount pad), `PROJECT_MASTER_PLAN §7`, and `DESIGN_SYSTEM.md` component families. A future AI agent asked to build a new screen would have to reconstruct the composition from three docs. A single doc, one page per screen, prevents that.

**Why not fold into `DESIGN_SYSTEM.md`.** DS defines *the vocabulary*; Screen Guidelines define *the sentences the vocabulary composes into*. Different granularity.

**Why not fold into `UX_DECISIONS.md`.** `UX_DECISIONS.md` is a **history log** (append-only, immutable). Screen Guidelines is a **specification** that evolves.

**Shape.** One `##` per screen, four sub-headings each: *Purpose (feeling + question answered)* · *Canonical composition (hero → sections → footer)* · *Five states* · *Owning UX-N.N and DS references*.

### 4.3 `docs/FINANCIAL_PSYCHOLOGY.md`

**Single responsibility.** How ExpenStream designs **with awareness of** — and often **against** — the psychology of money: anchoring, loss aversion, mental accounting, present bias, financial shame, notification-driven anxiety, envelope biases. Each entry pairs the bias with the *concrete design guardrail* ExpenStream applies (and the ones it refuses to apply).

**Owned topics.**

- Financial Psychology (primary).
- Behavioral Design (primary — as *what we refuse to weaponise*, distinct from doctrinaire behavioural design).

**Why a new doc.** No existing doc names a behavioural bias. `PRODUCT_PRINCIPLES §9` says "no dark patterns" but never enumerates *which* patterns. A future AI agent that reaches for a nudge-shaped solution has nothing to consult. This gap is the single biggest risk to the "premium, calm, honest" positioning.

**Why not fold into `PRODUCT_PRINCIPLES.md`.** Principles state posture; this doc gives working knowledge (biases, evidence, guardrails). It is instruction-manual-shaped, not doctrine-shaped.

**Shape.** One entry per bias — five fields: *Bias · Where it appears in personal finance · How competitors typically exploit it · Our guardrail · Our anti-pattern (what we refuse to ship)*.

### 4.4 `docs/MOTION_SYSTEM.md` — **NOT recommended (rejected)**

Explicit non-recommendation, recorded to prevent future re-litigation.

**Why not.** Motion is already fully owned by `DESIGN_SYSTEM.md §8` (durations, easings, springs, distances, stagger, reduced motion) and `§19` (Animation Principles). Extracting it would (a) violate SRP by splitting a design surface across two docs, (b) create drift risk (tokens live in `src/lib/motion/tokens.ts` and are mirrored in DS today), (c) force every screen guideline and UX decision to update two cross-links. **Keep motion in `DESIGN_SYSTEM.md`.**

### 4.5 Summary — Responsibilities of each proposed new file

| New file                       | One-sentence responsibility                                                                     | Passes SRP? | Substantial? | Independent reading value? |
| ------------------------------ | ----------------------------------------------------------------------------------------------- | ----------- | ------------ | -------------------------- |
| `docs/EXPERIENCE_VISION.md`    | Describes the north-star product experience narrative and premium-fintech qualities.            | ✓           | ✓            | ✓ (loaded during design reviews and new-feature scoping) |
| `docs/SCREEN_GUIDELINES.md`    | Documents the canonical composition and five states of every top-level screen.                  | ✓           | ✓            | ✓ (loaded whenever a screen is created, edited, or reviewed) |
| `docs/FINANCIAL_PSYCHOLOGY.md` | Catalogues money-related cognitive biases and the guardrails ExpenStream applies against them. | ✓           | ✓            | ✓ (loaded during feature framing and copy review) |

---

## 5. Documentation Dependency Graph

Arrows point **from consumer to source of truth** ("A depends on / cites B"). New nodes marked with `[NEW]`. Existing edges preserved.

```
                            ┌────────────────────────────┐
                            │ AI_AGENT_HANDBOOK.md       │
                            │ (boot sequence + map)      │
                            └──────────────┬─────────────┘
                                           │ lists / read order
      ┌────────────────────┬───────────────┼────────────────┬──────────────────┐
      ▼                    ▼               ▼                ▼                  ▼
┌───────────┐   ┌────────────────────┐  ┌──────────┐  ┌────────────────┐  ┌─────────────┐
│AI_CONTEXT │   │PRODUCT_PRINCIPLES  │  │PROJECT_  │  │DESIGN_SYSTEM   │  │IMPL_RULES   │
│(2 pages)  │──▶│(the WHY)           │  │MASTER_   │  │(tokens/motion/ │  │(HOW to build│
│           │   │ + §7.5 emotional   │  │PLAN (PRD)│  │ components)    │  │ safely)     │
│           │   │ + §7.6 fin-psych   │  │ §7 arcs  │  │ + §22 UI evol. │  │             │
└─────┬─────┘   └──────────┬─────────┘  └────┬─────┘  └───────┬────────┘  └──────┬──────┘
      │                    │                 │                │                  │
      │                    ▼                 │                │                  │
      │       ┌────────────────────────┐     │                │                  │
      │       │ EXPERIENCE_VISION.md   │◀────┘                │                  │
      │       │ [NEW]                  │                      │                  │
      │       │ narrative + premium    │                      │                  │
      │       │ fintech qualities      │                      │                  │
      │       └─────────┬──────────────┘                      │                  │
      │                 │                                     │                  │
      │                 ▼                                     │                  │
      │       ┌────────────────────────┐                      │                  │
      │       │ FINANCIAL_PSYCHOLOGY.md│                      │                  │
      │       │ [NEW]                  │                      │                  │
      │       │ biases + guardrails    │                      │                  │
      │       └─────────┬──────────────┘                      │                  │
      │                 │                                     │                  │
      │                 ▼                                     │                  │
      │       ┌────────────────────────┐                      │                  │
      │       │ SCREEN_GUIDELINES.md   │◀─────────────────────┘                  │
      │       │ [NEW]                  │                                         │
      │       │ per-screen recipes     │─────────────────────────────────────────┘
      │       └─────────┬──────────────┘
      │                 │
      │                 ▼
      │       ┌────────────────────────┐
      └──────▶│ UX_DECISIONS.md        │  (append-only precedent log — cited, never authoritative for new screens)
              └────────────────────────┘

                        ┌──────────────────────────────────┐
                        │ SPRINT_BOARD / IMPLEMENTATION_   │
                        │ QUEUE                            │
                        │ (schedules the docs work — does  │
                        │  not carry design content)       │
                        └──────────────────────────────────┘

           ┌───────────────────────────┐
           │ ARCHITECTURE / DIAGRAMS   │  (independent of the UI foundation stack)
           └───────────────────────────┘
```

**Read this graph as:** `SCREEN_GUIDELINES` cites `EXPERIENCE_VISION`, `DESIGN_SYSTEM`, and `UX_DECISIONS`. `EXPERIENCE_VISION` cites `PRODUCT_PRINCIPLES` (and its new §7.5/§7.6) and `PROJECT_MASTER_PLAN` personas. `FINANCIAL_PSYCHOLOGY` cites `PRODUCT_PRINCIPLES §7.6` and is cited by `SCREEN_GUIDELINES` (per-screen guardrails) and by future feature specs. **No cycles introduced. No back-references from `PRODUCT_PRINCIPLES` up into the new docs** (doctrine must stay authoritative).

---

## 6. Reading Order (Canonical, Post-Milestone)

The order below extends [`AI_AGENT_HANDBOOK §2`](../docs/AI_AGENT_HANDBOOK.md). New docs inserted where their scope makes them useful; nothing existing is reordered.

1. `AI_CONTEXT.md` — boot.
2. `PRODUCT_PRINCIPLES.md` — doctrine (now with §7.5 emotional / §7.6 fin-psych anchors).
3. **`EXPERIENCE_VISION.md`** *(new)* — the target feeling.
4. **`FINANCIAL_PSYCHOLOGY.md`** *(new)* — what we refuse to weaponise.
5. `DESIGN_SYSTEM.md` — the visual + motion vocabulary (now with §22 UI evolution).
6. **`SCREEN_GUIDELINES.md`** *(new)* — how the vocabulary composes per screen.
7. `UX_DECISIONS.md` — precedent for the composition choices.
8. `PROJECT_MASTER_PLAN.md` — PRD, personas, journeys.
9. `ARCHITECTURE.md` (+ diagrams) — runtime shape.
10. `IMPLEMENTATION_RULES.md` — engineering contracts.
11. `SPRINT_BOARD.md` → `IMPLEMENTATION_QUEUE.md` — what's active.
12. Task-specific: `adr/`, `PRODUCTION_CHECKLIST.md`, `TESTING_CHECKLIST.md`.

**Conflict-resolution order is unchanged** (`IMPLEMENTATION_RULES > DESIGN_SYSTEM > UX_DECISIONS > PROJECT_MASTER_PLAN > remaining`). The new docs sit **inside "remaining"** — they inform but do not override. This preserves the safety property that engineering + design contracts win over aspirational narrative.

---

## 7. Prompt Changes Required

Prompt-layer maintenance uncovered during the audit. All are **small** and none block this milestone.

### 7.1 `prompts/STANDARD_HEADER.md` — **inaccurate doc list (pre-existing bug, out of scope for this milestone)**

Lists five documents that do not exist in `docs/`:

- `COMPONENT_LIBRARY.md`
- `PERFORMANCE_GUIDELINES.md`
- `SECURITY_GUIDELINES.md`
- `API_SPECIFICATION.md`
- `DATABASE_SCHEMA.md`

Recommended action: **out of scope for the UI-Foundation milestone**, but flagged here. Either (a) create those docs in a separate sprint, or (b) prune the references. Recommendation: (b) — the content already lives in `DESIGN_SYSTEM.md` (components), `IMPLEMENTATION_RULES.md` (perf + security), `ARCHITECTURE.md` (API + DB) and duplication would violate SRP. Track as a task under Documentation Truth, not UI Foundation.

### 7.2 `prompts/STANDARD_HEADER.md` — additive changes required by *this* milestone

Once the new docs land, `STEP 1 — READ PROJECT DOCUMENTATION` should list:

- `docs/EXPERIENCE_VISION.md`
- `docs/SCREEN_GUIDELINES.md`
- `docs/FINANCIAL_PSYCHOLOGY.md`

The conflict-resolution priority order does **not** change.

### 7.3 `prompts/IMPLEMENT_SPRINT.md`

`Phase 2 — Repository Analysis` bullet list should add "Experience Vision" and "Screen Guidelines" alongside the existing "Existing design system" bullet, so per-sprint executions consult them.

### 7.4 `prompts/MASTER_AUDIT.md`

No change. `MASTER_AUDIT` is Sprint-0 historical; it is complete and should stay as-authored.

### 7.5 `prompts/UI_FOUNDATION_AUDIT.md`

No change. This is the prompt that governed *this* audit; leave immutable.

### 7.6 New prompt (optional, later sprint)

If the follow-up execution sprint is large enough to warrant its own workflow prompt (`prompts/UI_FOUNDATION_EXECUTE.md`), it can be authored later. Not required now. `IMPLEMENT_SPRINT.md` (+ the updates in 7.3) will suffice for the initial doc-writing sprint.

---

## 8. Documentation Architecture (Target State)

The `docs/` folder resolves into **five families**, each with a clear owner and boundary:

| Family                        | Owner concept                             | Files                                                                                          |
| ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Boot & Rules**              | Short-form memory, engineering contracts. | `AI_CONTEXT.md`, `AI_AGENT_HANDBOOK.md`, `IMPLEMENTATION_RULES.md`.                            |
| **The Why** (Doctrine)        | Principles, promises, product philosophy. | `PRODUCT_PRINCIPLES.md`.                                                                       |
| **The What** (Product Scope)  | PRD, roadmap, personas, journeys, KPIs.   | `PROJECT_MASTER_PLAN.md`.                                                                      |
| **The How** (Design + Build)  | Visual language, motion, components, runtime. | `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `ARCHITECTURE_DIAGRAMS.md`, `adr/`.                 |
| **Product Experience** (NEW)  | Feeling, screens, psychology, precedent. | **`EXPERIENCE_VISION.md`** *(new)*, **`SCREEN_GUIDELINES.md`** *(new)*, **`FINANCIAL_PSYCHOLOGY.md`** *(new)*, `UX_DECISIONS.md`. |
| **Ops & History**             | Release gates, changelog, sprint state.   | `SPRINT_BOARD.md`, `IMPLEMENTATION_QUEUE.md`, `PRODUCTION_CHECKLIST.md`, `TESTING_CHECKLIST.md`, `CHANGELOG.md`, `RELEASE_NOTES.md`. |

The **Product Experience family** is the net addition. It is the missing middle between doctrine (`PRODUCT_PRINCIPLES`) and mechanics (`DESIGN_SYSTEM`). It absorbs the topics that were previously stranded (Emotional Design, Financial Psychology, Screen Guidelines, Premium Fintech UX) without disturbing the four existing families.

---

## 9. Reserved for Future Work — Not This Milestone

Explicitly parked, to prevent scope creep:

- **`COMPONENT_LIBRARY.md`** — the STANDARD_HEADER cleanup (§7.1). Not a UI-Foundation deliverable.
- **A dedicated "Retention" doc** — retention is fully covered by `PRODUCT_PRINCIPLES §9`; a separate doc would duplicate.
- **A dedicated "Accessibility" doc** — a11y is fully covered across `PRODUCT_PRINCIPLES §10`, `DESIGN_SYSTEM §17`, `IMPLEMENTATION_RULES`, `AI_CONTEXT §12`. Extracting it would create four back-references and one drift risk. **Reject.**
- **A dedicated "Motion" doc** — see §4.4 above. **Reject.**
- **Iconography, illustration, and content-style guides** — likely warranted eventually; too small to justify now.

---

## 10. Risks & Concerns

| #    | Risk                                                                                                            | Severity | Mitigation                                                                                                                                                       |
| ---- | --------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | **Documentation sprawl** — adding four files even with SRP still increases boot cost for agents.                | Medium   | Reading order (§6) is explicit. `AI_CONTEXT.md` is not extended, so the 2-page contract holds. Files are inserted at semantically-useful positions in the order. |
| R-2  | **Duplication drift** — Experience Vision could re-litigate `PRODUCT_PRINCIPLES §5`.                            | Medium   | Enforced by contract: Experience Vision cites but does not restate principles. Reviewer checklist added to the doc's HTML header comment.                        |
| R-3  | **Screen Guidelines fossilise UI** — an aspirational spec may not match today's implementation.                 | Medium   | Each screen entry declares its status: `Aspirational` / `Partially implemented` / `Implemented`. Drift is *expected* until the UI catches up.                    |
| R-4  | **Financial-psychology doc misread as behavioural nudging playbook.**                                            | High     | Doc opens with an explicit non-goal: "This document exists so we design *against* these biases, not with them." Every entry lists the anti-pattern we refuse.    |
| R-5  | **Benchmarking → copying.** Referencing Apple Wallet / Copilot / etc. may tempt visual mimicry.                 | Medium   | Prompt already forbids it (§101 of the audit prompt). Docs will restate the ban in-doc and only extract *qualities*, never designs.                              |
| R-6  | **Prompt drift** — `STANDARD_HEADER.md` still lists five nonexistent docs (§7.1 above).                         | Low      | Called out but explicitly out of this milestone's scope. Track separately.                                                                                       |
| R-7  | **Agent conflict-resolution ambiguity** — new narrative docs may be misread as authoritative over `DESIGN_SYSTEM`. | Medium | Conflict order (§6) is unchanged and restated. Each new doc's header comment cites the priority chain.                                                            |
| R-8  | **Scope creep** — reviewers may push for a full Component Library doc during this milestone.                    | Medium   | Explicitly deferred in §9. This audit records the rejection so it does not reappear.                                                                             |

None of the risks warrant redesigning the proposal.

---

## 11. Approval Gate — Await Before Any Documentation Change

Per [`prompts/UI_FOUNDATION_AUDIT.md`](../prompts/UI_FOUNDATION_AUDIT.md): **stop after generating this audit report**.

Before any documentation change is executed, this proposal requires an approval on:

1. The five in-place updates listed in §3.
2. The three new documents listed in §4 (and the rejection of a fourth in §4.4).
3. The prompt updates listed in §7.
4. The parked items in §9.
5. The reading order in §6.

Only after approval will the follow-up execution sprint author the new files and land the in-place edits. **No source code, no components, no layouts, no business logic, no APIs will be modified in that follow-up sprint either** — it remains a documentation sprint.

---

**Last reviewed:** 2026-07-24
