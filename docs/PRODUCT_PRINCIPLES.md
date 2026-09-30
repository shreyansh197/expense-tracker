<!--
  PRODUCT_PRINCIPLES.md — The philosophy of ExpenStream
  Owner: Product + Design + AI Engineering
  Audience: PMs, designers, engineers, QA, marketers, and AI agents.
  Companion docs: AI_CONTEXT.md, PROJECT_MASTER_PLAN.md, DESIGN_SYSTEM.md,
                  UX_DECISIONS.md, ARCHITECTURE.md, IMPLEMENTATION_RULES.md.
  Rule: This document is the *why* behind the product. Every feature, screen,
        copy string, animation, and API decision must be traceable to a
        principle below. When principles and features conflict, principles
        win — the feature is redesigned.
-->

# ExpenStream — Product Principles

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-22

> A product principle is a promise we keep even when it costs us a feature, a shortcut, or a quarter of growth. If a decision would break a principle, we redesign the decision — not the principle.

Every feature in ExpenStream must answer two questions before it ships:

1. **How does this make the user feel?** _(Calmer. More in control. Never anxious, never judged, never surveilled.)_
2. **Does this reduce financial anxiety or increase confidence?** _(If neither, it does not belong.)_

The whole product exists to move a single emotional needle: **from money-as-worry to money-as-clarity.**

---

## 1. Mission

**To give every person a calm, private place to see and shape their money — without spreadsheets, bank scraping, or ad-driven surveillance.**

We build the tool a thoughtful accountant would build for a friend: fast, honest, quiet, and on the friend's side. We measure success not in engagement minutes but in the number of people who close the app feeling _lighter_ than when they opened it.

---

## 2. Vision

**A world where personal finance software works for the person using it, not the platform hosting it.**

By 2030, ExpenStream is the default personal-finance surface for privacy-conscious mobile-first users across India, SEA, and EMEA, and the lightest possible collections ledger for freelancers and micro-businesses. Money apps will have moved past ad-funded, data-harvesting models — and ExpenStream will have helped set that standard.

The long arc: **make financial clarity a human right, not a premium feature.**

---

## 3. Core Values

The five values below are load-bearing. They are the tie-breakers when two good ideas disagree.

| #   | Value           | What it means in practice                                                                    | What we refuse                                            |
| --- | --------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | **Calm**        | Quiet defaults, no red numbers by default, no gamified guilt, no streak-shaming.             | Anxiety-driven engagement loops.                          |
| 2   | **Privacy**     | Local-first data, encrypted sync, zero third-party analytics on monetary values.             | Ad networks, bank scraping, data resale, dark patterns.   |
| 3   | **Honesty**     | Show the number that is true, not the number that flatters. Never hide fees or trade-offs.   | Fake progress bars, vanity metrics, deceptive framings.   |
| 4   | **Craft**       | Motion, typography, tokens, and code quality treated as first-class product surface.         | "Ship it and polish later" as a permanent posture.        |
| 5   | **Sovereignty** | The user owns their data, their accent, their categories, their export, their delete button. | Vendor lock-in, hidden exports, hostile account deletion. |

**Ordering rule.** When values collide, **Privacy > Honesty > Calm > Sovereignty > Craft.** Craft never justifies a privacy breach; honesty never justifies cruelty.

---

## 4. User Promise

Every user of ExpenStream is promised, explicitly:

1. **Your money data belongs to you.** Local-first storage. Export anytime, in an open format. Delete anytime, permanently.
2. **We will never sell, share, or monetize your financial data.** No ads. No third-party trackers on monetary values. No "anonymized" data resale.
3. **We will not scrape your bank.** You type what you spend, or you don't. Your credentials never leave your device — because we never ask for them.
4. **We will not shame you.** No red-alert notifications for overspending, no streak-breaking guilt, no forced comparisons with "people like you."
5. **We will be honest about limits.** If sync fails, we say so. If a feature is beta, we say so. If we don't know, we don't guess.
6. **We will keep the app fast.** Under 200 KB of critical JavaScript. Under 2.5 s LCP on a mid-tier Android. Offline-capable by default.
7. **We will respect your attention.** Notifications are opt-in, batched, and quiet. We do not fight for engagement minutes.
8. **We will keep the free tier honest.** The core loop — log, see, understand — will never be paywalled.

If we ever break one of these promises, we owe the user a clear, plain-language explanation and a path to redress. This list is a contract, not marketing.

---

## 5. UX Philosophy

**Every screen should make the user feel: _"I understand my money right now, and nothing is trying to trick me."_**

The five UX commitments:

1. **One glance answers the main question.** The dashboard hero must answer _"Am I on track this month?"_ in under a second, without scrolling, without a chart, without a modal.
2. **The next action is always obvious.** There is exactly one primary action per screen. Never two competing CTAs of equal weight.
3. **The empty state is the tutorial.** No onboarding wizard. Empty states teach by example: an empty budget shows a suggested budget; an empty expense list shows a one-tap sample.
4. **Reversibility is a feature.** Every destructive action has an undo. Every setting change is preview-able. The user should never fear the tap.
5. **Silence is a valid response.** If nothing changed, don't notify. If nothing is wrong, don't alert. The absence of a red dot is a feature.

**Feelings taxonomy.** Every feature is tagged with the feeling it should produce. If the tag is missing, the feature ships without a purpose.

| Feeling we want            | Feeling we refuse                        |
| -------------------------- | ---------------------------------------- |
| _"I see it clearly."_      | _"Wait, what am I looking at?"_          |
| _"I'm in control."_        | _"The app is nudging me somewhere."_     |
| _"That was fast."_         | _"Why is this loading again?"_           |
| _"My data is safe here."_  | _"Where did that number just go?"_       |
| _"I can undo this."_       | _"Oh no, did I just delete everything?"_ |
| _"The app is on my side."_ | _"The app is on someone else's side."_   |

---

## 6. Fintech Principles

Money is not a game. These rules are non-negotiable in every finance-adjacent feature.

1. **Money is displayed as a number, not a score.** No confetti when the user "wins" at budgeting. No sad faces when they don't.
2. **Currency is explicit, always.** Every amount carries a currency symbol and, on ambiguous surfaces, an ISO code. We never assume USD.
3. **Rounding is documented.** Display rounding is banker's-rounding to two decimals; storage retains four. The user can see the exact stored value on tap.
4. **No projections presented as facts.** Forecasts, trends, and "you'll spend ₹X by month-end" are always labelled _estimate_ and always show their basis.
5. **No third-party analytics on monetary values.** Amounts, category totals, budget deltas, and business collections never leave the device to a third party. Aggregated counts (e.g., "expense created") may be sent; the amount may not.
6. **Encryption at rest for sensitive fields.** Workspace encryption keys, business ledger notes, and payer identifiers are encrypted client-side before sync.
7. **Bank credentials are never requested.** Full stop. If we ever integrate a bank feed, it will be user-initiated, read-only, and via a regulated open-banking API — never scraping.
8. **Exports are lossless and open.** CSV and JSON exports include every field the user has entered. No "premium export" tier.
9. **Deletion is real.** Account deletion removes rows from primary storage, purges from replicas within 30 days, and returns a signed receipt.
10. **Regulatory posture: minimum data, minimum retention, maximum user control.** We collect only what a feature requires, retain only as long as the user retains their account, and expose every stored field in a Data page.

---

## 7. Design Principles

Anchored in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) (_Living Terrain_). Restated here as principles rather than tokens:

1. **Calm over clever.** The default state is quiet. Alerts earn their place through severity, not novelty.
2. **Depth over decoration.** Hierarchy comes from elevation, whitespace, and typography — not from color, gradients, or glass effects.
3. **Motion is meaning.** Every animation confirms a state change. If it doesn't communicate, it doesn't ship. Respect `prefers-reduced-motion` absolutely.
4. **Tokens are law.** No hard-coded colors, radii, spacing, durations, or easings in feature code. Ever.
5. **Inheritance over override.** The accent, theme, and mode are user-owned. Components inherit; they do not hard-code.
6. **Typography carries the brand.** The primary type stack does more visual work than any color choice.
7. **Color is functional, not decorative.** Red means overspent. Green means within budget. Amber means attention. Colors are not chosen for mood.
8. **Density is user-choice.** Comfortable and compact modes are equal citizens; neither is the "power-user" mode.
9. **Icons carry labels.** Every icon-only control has an accessible name and, above `sm`, a visible label on hover or long-press.
10. **Empty is a design surface.** Empty states are designed with the same rigor as full states — they are the user's first impression of every feature.

### 7.5 Emotional design commitments

The [§5 Feelings taxonomy](#5-ux-philosophy) lists the feelings we want and the feelings we refuse. This subsection upgrades that list from a taxonomy to a set of **promises** the product keeps on every screen. It is anchored by [`EXPERIENCE_VISION.md`](EXPERIENCE_VISION.md), which describes the narrative these promises compose into.

1. **Calm is the default, not the celebration.** The neutral state of every screen is quiet: no red, no confetti, no exclamation. Emphasis is earned by the number that matters, not by the color of the chrome. If the user finishes an action and _notices nothing changed_, the design succeeded.
2. **Honesty precedes optimism.** We show the true number before we show any reassurance. A budget that is 12% overspent is displayed as 12% overspent — never as "close to on track". Reassurance, when we offer it, comes as context, not as spin.
3. **Respect the money-shaped moment.** Opening a personal-finance app is rarely idle. The user came with a question, a worry, or a decision. The first screen answers that question in under a second. We do not stall, tease, or ask them to sit through a splash animation.
4. **Never weaponise emotion.** No streak-shaming, no red push notifications engineered to drive re-open, no fake urgency, no manipulative loss framing. Any emotional signal we send has to survive the test "would a thoughtful accountant say this to a friend?".
5. **Undo is an emotional feature, not a technical one.** Reversibility is the promise that lets the user tap without fear. Every destructive action carries a visible, immediate undo path. See [UX-9.x](UX_DECISIONS.md) for the pattern.

Reviewers verifying a new feature must be able to point to which of the five promises it keeps. If none apply, the feature has no emotional purpose and should be redesigned before shipping.

### 7.6 Financial-psychology guardrails

Personal finance is a domain saturated with cognitive biases (anchoring, loss aversion, mental accounting, present bias, financial shame, notification-driven anxiety). Most competing products _exploit_ these biases to drive engagement metrics. ExpenStream designs _against_ them.

The full bias catalogue and per-bias guardrails live in [`FINANCIAL_PSYCHOLOGY.md`](FINANCIAL_PSYCHOLOGY.md). This subsection records the doctrine-level posture that governs it:

1. **Anchoring — we do not seed reference points that flatter or shame.** No "average user your age spends…" framing. The only anchors we display are ones the user set themselves (budget, envelope, goal).
2. **Loss aversion — we do not dramatise loss.** Overspend is shown as a number and a small amber marker, not a red alert. Notifications never say "You've lost…".
3. **Present bias — we do not use countdowns or scarcity.** No "24 hours left to hit your goal" ticking clocks. No "you'll miss your target if…" pre-emptive guilt.
4. **Ambient anxiety — silence is a valid response.** If nothing changed, we don't notify. If nothing is wrong, we don't alert. Push, badges, red dots, and haptics are rationed.
5. **Financial shame — we do not judge categories.** No frowny face for "eating out". No colour-coding a category as "bad". Category totals are presented in the same visual weight regardless of what the category represents.
6. **Mental accounting — we let the user carve money into envelopes, but we never _enforce_ the carving.** Envelopes are a tool, not a moral system.

Any feature proposal that would knowingly exploit one of these biases is redesigned. Any feature proposal that would _design against_ one earns a citation in [`FINANCIAL_PSYCHOLOGY.md`](FINANCIAL_PSYCHOLOGY.md).

---

## 8. Engineering Principles

Anchored in [IMPLEMENTATION_RULES.md](IMPLEMENTATION_RULES.md) and [ARCHITECTURE.md](ARCHITECTURE.md). Restated as principles:

1. **Offline-first is the architecture, not a feature.** Every mutation is enqueued locally first and reconciled on sync. The network is treated as an optimization.
2. **Server is a mirror, not a source of truth.** The device is authoritative for user-entered data until a conflict resolver says otherwise.
3. **Types are the contract.** TypeScript strict mode. No `any` in feature code. Runtime validation (`zod`) at every trust boundary.
4. **Tests describe behavior, not implementation.** We test what the user experiences, not how the reducer stores it.
5. **Feature flags for rollout, not for hiding tech debt.** Flags have expiry dates. Dead flags are removed.
6. **Migrations are forward-only, reviewed, and idempotent.** Every schema change ships with a migration file, a rollback plan in review notes, and a test.
7. **The build is the truth.** If it doesn't build, it doesn't ship. `main` is always green.
8. **Performance budgets are constraints, not targets.** Exceeding a budget requires a written justification in the PR — not a promise to optimize later.
9. **Errors are surfaced, not swallowed.** Every catch either recovers, retries with backoff, or reports to Sentry with sanitized context.
10. **PII and money never enter analytics.** Enforced by lint rule and code review. Violation is a P0.
11. **No feature ships without a test, an empty state, an error state, an offline state, and a reduced-motion state.**
12. **Code is read more than written.** Clarity beats cleverness. A junior on their first day should be able to trace any feature end-to-end.

---

## 9. Retention Principles

We keep users because the product is genuinely useful — never because we've engineered dependency. Retention is a _consequence_, not a _mechanic_.

1. **No dark patterns, ever.** No fake urgency. No confirm-shaming. No "are you sure you want to leave?" traps. Cancel is one tap.
2. **No streak-shaming.** Streaks may be shown as celebration; breaks are never punished. A missed day is not a failure.
3. **Notifications are opt-in and quiet.** The default is off. When on, they are batched, timezone-aware, and never sent between 10 PM and 8 AM local.
4. **We celebrate rare wins, not routine ones.** Logging an expense is not an achievement. Closing a month within budget for the first time is.
5. **We do not gamify anxiety.** No "you're falling behind" nudges. No comparison to other users. No leaderboards for spending.
6. **The retention question is: _"Was the user's life better this week because of us?"_** If yes, they'll return. If no, no retention hack will save us.
7. **Churn is a signal, not a leak to plug.** We interview departing users, we listen, we redesign — we do not add friction to leaving.
8. **The re-engagement email is a summary, not a plea.** "Here's what happened in your finances" — never "we miss you."
9. **Loyalty is earned monthly.** We assume the user could leave tomorrow. We build as if they will.

---

## 10. Accessibility Principles

Accessibility is a **precondition** for shipping, not a phase. A feature that is inaccessible is not "done" — it is broken.

1. **WCAG 2.2 AA is the floor, not the ceiling.** Every audited screen conforms.
2. **Keyboard-first design.** Every interaction reachable and completable with a keyboard alone. Focus order is deliberate and visible.
3. **Screen readers get first-class semantics.** Landmarks, labels, live regions, and roles are engineered — not sprinkled after the fact.
4. **Color is never the only signal.** Overspend is red _and_ carries an icon _and_ carries a label.
5. **Contrast ratios are enforced by tokens.** No component may fall below 4.5:1 for text, 3:1 for large text and UI.
6. **Motion is opt-in for the sensitive.** `prefers-reduced-motion: reduce` disables all non-essential animation — not just some.
7. **Touch targets are ≥ 44×44 CSS pixels.** Always. On every density mode.
8. **Language is plain.** No jargon. No idioms that don't translate. Reading level: 8th grade.
9. **Translations are first-class.** Copy is authored with translators in the room, not sent to them after the fact.
10. **Assistive tech is tested, not assumed.** VoiceOver, TalkBack, and NVDA are in the QA matrix.

---

## 11. Performance Principles

Performance is a **feeling** — it is the first thing users experience and the last thing they consciously notice. Speed is a form of respect.

1. **Under 2.5 s LCP on a mid-tier Android over 3G.** Non-negotiable.
2. **Under 200 ms INP at P75.** Every interaction feels immediate.
3. **Under 180 KB gzipped critical JavaScript on the dashboard.** Enforced by CI.
4. **Zero layout shift after first paint.** CLS ≤ 0.1.
5. **Data loads incrementally, never in a blocking wall.** Skeleton first, then content, then enhancements.
6. **The app opens fully offline.** Every core surface renders without a network round-trip.
7. **Images are always sized.** Every image has intrinsic dimensions and a modern format (AVIF/WebP).
8. **Fonts do not block paint.** Font swap is immediate; the fallback stack is chosen to minimize CLS.
9. **We measure on real devices.** Synthetic Lighthouse scores are a sanity check, not the truth. Real-user metrics (RUM) are the source of truth.
10. **A regression in performance blocks a release.** Same tier as a security regression.

---

## 12. AI Principles

If and when AI is introduced into ExpenStream (summaries, categorization hints, natural-language search, insights), these rules govern.

1. **AI is a helper, not an authority.** Every AI output is labelled as such and is dismissible, correctable, and never blocks the user's path.
2. **No monetary values leave the device without explicit, per-session consent.** AI features that require server inference are opt-in, disclosed in plain language, and remember the choice.
3. **On-device inference is the preferred path.** When quality permits, we run models locally.
4. **The AI never invents a number.** Categorization is deterministic and rule-first; AI ranks candidates but never fabricates a currency amount.
5. **Prompt-injection is a security incident.** All AI inputs derived from user or third-party data are sanitized and treated as untrusted. See the security posture summarized in [ARCHITECTURE.md §6 and §14](ARCHITECTURE.md) and the audit findings in [`sprint-reports/SPRINT_0_SUMMARY.md`](../sprint-reports/SPRINT_0_SUMMARY.md).
6. **Explainability by default.** Every AI-generated insight shows its inputs on tap: _"Based on 12 expenses in Groceries this month."_
7. **No training on user data without opt-in.** Ever. Anonymized aggregates do not count as anonymization for training purposes.
8. **Model provenance is transparent.** The user can see which model produced a given output, and when the model last changed.
9. **AI never delivers bad news alone.** If the model flags an overspend risk, a human-authored copy string frames it calmly and offers a next step.
10. **Failure of AI is silent, not loud.** If a suggestion cannot be generated, the surface degrades to the non-AI baseline without an error message.
11. **We do not use AI to increase engagement.** Only to increase clarity.

---

## 13. How to Use This Document

**For PMs.** Every PRD attaches a _principle map_: which principles the feature honors and which it stresses. If a feature stresses a principle, it needs an explicit justification and a mitigation.

**For designers.** Every design review begins with the question _"Which feeling from Section 5 does this produce?"_ If the answer is unclear, the design is not ready.

**For engineers.** Every PR that touches user-facing surface links to at least one principle. Reviewers may request a principle citation.

**For QA.** Every test plan includes a _principle regression_ check: does this change weaken a promise in Sections 4, 6, or 10?

**For AI agents.** When generating code, copy, or designs for ExpenStream, load this document first. When a user request would violate a principle, surface the conflict and propose an alternative — do not silently comply.

---

## 14. Change Discipline

- This document is amended by pull request with at least two reviewers: one from Product, one from Engineering.
- Principles may be **added, refined, or clarified** freely. Removing or weakening a principle requires a written rationale in the PR description and a note in [CHANGELOG.md](CHANGELOG.md).
- Superseded principles are struck through and dated, never deleted.
- Version and _Last reviewed_ date at the top must be updated on every merge.

---

## 15. The Single Sentence

If everything else in this document is forgotten, remember this:

> **ExpenStream exists to reduce financial anxiety and increase financial confidence — for every user, on every screen, in every interaction. If a feature does not do this, it does not ship.**

---

**Last reviewed:** 2026-07-23
