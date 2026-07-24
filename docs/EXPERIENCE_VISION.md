<!--
  EXPERIENCE_VISION.md — The north-star product experience of ExpenStream
  Owner: Product + Design + AI Engineering
  Audience: Designers, product managers, engineers, copywriters, AI agents.
  Companion docs: PRODUCT_PRINCIPLES.md (§7.5 emotional design commitments,
                  §7.6 financial-psychology guardrails), DESIGN_SYSTEM.md,
                  SCREEN_GUIDELINES.md, FINANCIAL_PSYCHOLOGY.md, UX_DECISIONS.md,
                  PROJECT_MASTER_PLAN.md (§7 user journeys + emotional arcs).
  Rule: This document describes the *target feeling* of ExpenStream. It never
        overrides IMPLEMENTATION_RULES, DESIGN_SYSTEM, UX_DECISIONS, or
        PROJECT_MASTER_PLAN. If a promise here would break an engineering
        contract, the contract wins and this document is amended.
  Reviewer checklist: any change here must (a) not restate PRODUCT_PRINCIPLES,
        (b) not restate DESIGN_SYSTEM tokens, (c) not name a screen recipe
        (that belongs in SCREEN_GUIDELINES.md), (d) not enumerate biases
        (that belongs in FINANCIAL_PSYCHOLOGY.md).
-->

# ExpenStream — Experience Vision

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-24 · **Family:** Product Experience

> A design system tells you what things look like. A vision tells you what things feel like. This is the second one.

Every feature that ExpenStream ships passes through the same test: **does opening the app leave the user lighter than when they opened it?** That is the emotional needle. This document describes the session, the qualities, the silences, and the anti-patterns that keep that needle moving in the right direction.

---

## 0. Meta — Why this document exists

### 0.1 Why the feature exists

Because the ExpenStream ADK already has doctrine (`PRODUCT_PRINCIPLES.md`) and mechanics (`DESIGN_SYSTEM.md`), but it does not have a **narrative** for what a premium finance experience *feels* like end-to-end. Without a narrative, every designer and every AI agent reconstructs the target from scratch, and the target drifts.

### 0.2 What problem it solves

The gap between "we know the principles" and "we know what to ship". This document is the middle sentence: the target sensory experience each feature must aim at, described concretely enough that a reviewer can point at a screen and say *"that is (or is not) the feeling."*

### 0.3 Business value

- **Positioning integrity.** ExpenStream is being built as a premium, privacy-first, calm alternative to attention-economy money apps. That positioning collapses the moment the app feels rushed, loud, or manipulative. This document is the daily reminder.
- **Faster feature scoping.** With a shared narrative, feature debates end sooner — "would that ship on Apple Wallet? on a payday-loan app?" — and the answer is unambiguous.
- **Reduced rework.** Emotional bugs (features that feel *off*) are the most expensive to catch late. Catching them at the scoping table is orders of magnitude cheaper.

### 0.4 Product value

- Gives every screen a single **feeling target** that reviewers can grade against.
- Turns the "premium fintech" phrase into an operational, non-vague spec.
- Provides the vocabulary — *calm, honest, unhurried, private, precise, human* — that appears in every future PR description and design review.

### 0.5 User mindset

Users open a personal-finance app in one of three mindsets:

1. **Curious** — "Where am I this month?"
2. **Concerned** — "Something feels off. Can I check?"
3. **Transactional** — "I just spent ₹340; log it before I forget."

None of these mindsets is *leisure*. Every one of them is a small, purposeful, slightly-tense moment. The vision below is engineered for those three mindsets — never for the fourth, hypothetical "browsing for fun" mindset that does not exist for personal finance.

### 0.6 Emotional goal

**From money-as-worry to money-as-clarity.** By the time the user closes the app, the primary emotion should be *quiet relief* — the question is answered, the log is captured, nothing is nagging. If the user closes the app more anxious than they opened it, the design has failed regardless of every other metric.

---

## 1. The Session Story

Every ExpenStream session moves through four beats. They apply whether the session is 4 seconds or 4 minutes.

1. **Open.** The first paint is meaningful. No splash. No brand animation. The dashboard hero — "am I on track this month?" — is the first thing on screen and the answer is legible within one second (see [`DESIGN_SYSTEM.md §8 Motion`](DESIGN_SYSTEM.md) for the timing budget and [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md) for the first-paint contract).
2. **Glance.** The user's actual question is answered without scrolling and without a chart. The answer is a number and, at most, one word of context ("on track", "over by ₹410"). No confetti; no red alerts.
3. **Act.** If the user came to *do* something (log an expense, record a payment, adjust a budget), the primary action is one tap away and completes in one gesture. Amount pad first, category grid second, save third — this order is [UX-4.1](UX_DECISIONS.md) precedent.
4. **Close.** The app makes it easy to leave. There is no "wait, one more thing" — no upsell modal, no rating request, no streak reminder. The absence of a hook is a feature.

The story is deliberately anticlimactic. The most successful ExpenStream session is one the user does not remember having.

---

## 2. The Six Qualities of a Premium Finance Surface

Six qualities compose the ExpenStream *feeling*. They are the reviewer's checklist and the copywriter's tuning fork.

| # | Quality      | What it means concretely                                                                                                            | What it forbids                                                                    |
| - | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1 | **Calm**     | Neutral defaults. Emphasis reserved for the number that matters. Motion is short, gentle, and always cued by a state change.        | Red badges by default; celebratory animations; punchy microcopy.                   |
| 2 | **Honest**   | The true number appears before any reassurance. Estimates are labelled. Rounding is visible on tap.                                 | Vanity metrics; "close to on track" spin; hidden fees; fake progress bars.         |
| 3 | **Unhurried**| Actions complete at human pace. Confirmations are quiet. Loading skeletons are calm rectangles, not shimmering rivers.              | Auto-advancing tutorials; countdown timers; forced onboarding flow.                |
| 4 | **Private**  | Sensitive fields render lazily. Screenshots do not expose amounts. Push bodies never include monetary values (see `AI_CONTEXT §18`).| Amounts in notifications, analytics, or logs; tracking pixels; ad networks.        |
| 5 | **Precise**  | Every amount carries a currency. Rounding is documented. Two-decimal display, four-decimal storage. Alignment is monospaced on numbers.| Locale-guessing without confirmation; ambiguous units; drifting decimal columns. |
| 6 | **Human**    | Microcopy is written by a thoughtful accountant, not a growth hacker. Empty states teach. Errors apologise without grovelling.      | Emoji at a user's loss; gamified guilt ("you broke your streak!"); passive-aggressive nags. |

If a proposed feature does not clearly advance at least one of these six qualities, it does not belong in ExpenStream regardless of how "engaging" it is.

---

## 3. The Sound Absence

Personal finance apps commonly reach for chimes, badges, red dots, and celebratory sounds to drive engagement. ExpenStream refuses all of them.

- **No chime on save.** A saved expense confirms visually with a settled state, not audibly.
- **No confetti.** Not on first expense, not on budget met, not on payday. Money is not a game.
- **No red dot without a decision to make.** Badges appear only when there is an action the user must take, and disappear the moment they do.
- **No push haptics for informational updates.** Haptics are reserved for the user's own primary action (save, delete, undo), and never for server-initiated notifications.
- **No streak counters.** Streaks weaponise the fear of losing them. See [`FINANCIAL_PSYCHOLOGY.md`](FINANCIAL_PSYCHOLOGY.md).

The user's evening should be quieter *because* they use ExpenStream, not louder.

---

## 4. Benchmark Qualities — Extracted, Never Copied

ExpenStream studies other products for the *qualities* they achieve, never for the designs they ship. Any resemblance to a specific screen or motion of another product in ExpenStream code is a bug. The following are the qualities we admire and extract:

| Product              | Quality worth extracting                                                            | What we refuse to import                                                    |
| -------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Apple Wallet**     | Extreme restraint; typography does the work; motion confirms rather than performs.  | Skeuomorphic depth; card metaphor for non-card entities.                    |
| **Copilot Money**    | Warm neutrals; the "your money" narrative; charts that whisper.                     | Aggressive weekly digests; feature discovery via nudge.                     |
| **Monarch**          | Category discipline; long-run views without doom-framing.                           | Household comparison social layer; premium-tier gating of exports.          |
| **YNAB**             | Envelope-as-first-class-object; opinionated defaults that respect the user.         | Guilt-driven copy; onboarding that presumes a mental model.                 |
| **Revolut**          | Speed; the ledger renders instantly; sub-second interactions feel weightless.       | Interstitial upsells; card gamification; loot-box "spend to spin" surfaces. |
| **Material Design 3**| The five states discipline; motion tokens; a11y-first defaults.                     | Ripple-heavy tactility; brand-colour dependence.                            |
| **Apple HIG**        | Restraint on sound + haptic budget; alerts that earn their interruption cost.       | System-native chrome that dictates layout choices.                          |

Reviewers who see a design that "looks like [product]" should reject it. Extract the quality, ship an ExpenStream original.

---

## 5. Anti-Patterns We Refuse

The following are permanently forbidden. Any proposal that includes one is redesigned:

- **Streak counters, daily-open rewards, gamified "levels".** Money is not a game.
- **Loss-framed push notifications.** ("You spent ₹4,200 more than last month!" is not shipped; it drives anxiety without agency.)
- **Interstitial upsells or feature-discovery modals.** Discovery lives in Settings and in the surface where the feature applies, not in a blocking modal.
- **Emoji or icons that "react" to the user's numbers.** No frowny face for overspending; no thumbs-up for saving.
- **Progress bars that misrepresent progress.** A ring that fills faster near the end to feel "close" is banned. See [`FINANCIAL_PSYCHOLOGY.md`](FINANCIAL_PSYCHOLOGY.md).
- **Dark patterns in destructive actions.** Delete = one tap + undo. No "are you sure? / no, keep me subscribed" dialog.
- **Any surface that treats money as a score.** No leaderboards. No badges. No "level up".

This list is intentionally long. Erring on the side of refusal is the whole point.

---

## 6. The Five States — Feeling per state

Every screen ships five states. `DESIGN_SYSTEM.md §11-14` defines their visual mechanics; `SCREEN_GUIDELINES.md` gives per-screen composition. This section names the **feeling** each state must produce:

- **Empty state — "I know what to do next."** The empty state teaches by example. It is never accusatory ("You have no expenses — start adding some!"). It shows a single, tappable next action.
- **Loading state — "The app has heard me."** A calm skeleton or a subtle progress indicator; never a spinner-only screen; never a shimmer effect longer than the actual load. If a load exceeds 400 ms, the skeleton stays in place; if under 100 ms, the skeleton is skipped to avoid flicker.
- **Error state — "I understand what happened, and there is a way forward."** Every error has a plain-language cause and one primary recovery action. No stack traces. No blame ("Please try again" is the ceiling of vagueness).
- **Offline state — "Nothing is lost."** Optimistic writes render immediately; sync indicators are informational, not alarming. The user learns quickly that the network is an optimisation, not a requirement (see [`ARCHITECTURE.md`](ARCHITECTURE.md) offline-first section).
- **Success state — "The number moved. Nothing else needed my attention."** Success is a settled state, not an animation. The primary action returns focus to the surface it came from.

---

## 7. Loading Experience

- **Budget:** first paint under 1 s for a warm PWA; under 2.5 s on a cold load over 3G. Enforced by Lighthouse gate.
- **Skeletons over spinners** for any load > 100 ms. Skeletons match final layout footprint (no reflow on hydrate).
- **Progress is honest.** If we know progress, we show it; if we do not, we do not fake it.
- **Optimistic updates** for every user-initiated mutation. The UI reflects the desired state immediately; sync reconciles in the background (see [`ARCHITECTURE.md`](ARCHITECTURE.md) sync engine).
- **No blocking splash.** Brand chrome never appears between tap and content.

---

## 8. Empty State

- Empty states are the tutorial. They **teach by showing the next action**, not by explaining the concept.
- Every empty state carries: (a) a short honest sentence, (b) an illustration or icon at low visual weight, (c) exactly one primary CTA.
- Never accusatory. "Add your first expense" ✓ / "You haven't added any expenses yet!" ✗.
- Empty state is a design surface with the same rigor as the full state (see [`PRODUCT_PRINCIPLES §7`](PRODUCT_PRINCIPLES.md)).

---

## 9. Error State

- Every error message pairs a plain-language cause with a concrete next step.
- Errors that originate on the server (sync conflicts, rate limits, 500s) are translated into user-facing language before rendering. Raw error codes never appear outside diagnostic surfaces.
- Recoverable errors offer retry inline. Non-recoverable errors offer contact + export + local-copy paths.
- Errors that involve money (mutation failed, conflict on amount) surface both the local and remote values so the user resolves them — the app never chooses silently (see [UX-3.x conflict resolution](UX_DECISIONS.md)).
- Tone: apologetic without grovelling. "Sorry, we couldn't reach the server. Your expense is saved on this device and will sync when the connection returns." ✓

---

## 10. Offline Behaviour

- **Offline is a first-class state, not a failure.** The app functions fully offline for read + write of local data.
- **Sync indicators are informational.** A subtle pill ("Offline — 3 changes will sync") appears at the top of the screen. It never blocks input; it never alarms.
- **Optimistic writes.** Every mutation renders instantly and joins the sync queue. On reconnect, changes replay in insertion order with idempotency keys.
- **Conflict UX is deterministic.** When the server and device disagree on money, the user resolves the conflict explicitly with both numbers visible (see [`ARCHITECTURE.md §18.1`](ARCHITECTURE.md)).
- **Nothing is lost.** The queue is durable; force-quitting the app does not drop unsynced changes.

---

## 11. Accessibility

The a11y contract lives in [`DESIGN_SYSTEM.md §17`](DESIGN_SYSTEM.md), [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md), and `src/__tests__/accessibilityContracts.test.ts`. From the **experience** side, the promises are:

- **Nothing feels bolted-on.** Every interaction usable by mouse is equally usable by keyboard, voice, and screen reader.
- **Motion is optional.** `prefers-reduced-motion` disables all decorative motion and replaces state transitions with instant cross-fades ≤ 100 ms.
- **Text scales.** Every screen survives 200% user text scaling without truncation.
- **Colour is never load-bearing alone.** Overspend is *both* amber-tinted *and* labelled "over by ₹X".
- **Touch targets are ≥ 44 × 44 px.** Enforced by contract test.
- **Screen reader order matches visual order.** No `tabindex` gymnastics.
- **Focus is always visible.** A calm focus ring, never a system-default outline.

Accessibility is not a compliance ceiling; it is part of the calm.

---

## 12. Motion Expectations

Full tokens in [`DESIGN_SYSTEM.md §8`](DESIGN_SYSTEM.md) and principles in §19. From the experience side:

- **Motion confirms; it does not perform.** Every animation communicates a state change. If a reviewer cannot name the state change, the animation is removed.
- **Durations are short.** Micro-interactions 120-180 ms; sheet reveals 220-260 ms; page transitions ≤ 300 ms.
- **Easings are gentle.** Standard easings only; no bounce, no overshoot on financial surfaces.
- **Staggers are subtle.** Multiple items animate with 20-40 ms offset, not choreographed cascades.
- **Reduced motion is honoured absolutely.** No exceptions, no "essential motion" carve-outs.

The goal: after using ExpenStream for a week, the user should struggle to name a single animation they remember. That silence is craft.

---

## 13. Information Hierarchy

- **One hero answer per screen.** The dashboard hero answers *"where am I this month?"*; the analytics hero answers *"what did I actually spend on?"*; the business hero answers *"what am I owed?"*. If a screen has two heroes, it has none.
- **The hero is a number, not a chart.** Charts are supporting evidence.
- **Cards group; whitespace separates.** No dividers where whitespace suffices. See [`DESIGN_SYSTEM.md §11 Cards`](DESIGN_SYSTEM.md).
- **Density is user-choice.** Comfortable and compact modes are equal citizens; neither is the "power-user" mode.
- **The primary CTA is unambiguous.** Never two CTAs of equal weight on the same screen.

Per-screen composition is enumerated in [`SCREEN_GUIDELINES.md`](SCREEN_GUIDELINES.md).

---

## 14. Interaction Philosophy

- **One-handed by default.** Primary controls sit in the bottom third of the screen on mobile. FABs land above the safe-area inset (see [`DESIGN_SYSTEM.md §14`](DESIGN_SYSTEM.md)).
- **Reversibility over confirmation.** Delete then Undo, not "Are you sure?".
- **Preview before commit.** Setting changes show their consequence before the tap is final.
- **Progressive disclosure.** Advanced options live in an expandable footer, not a nested settings tree.
- **No modal-inside-a-modal.** A sheet may not spawn another sheet. If a flow needs multiple steps, the sheet expands vertically or navigates in-place.
- **Copy is calm.** "Save" beats "Confirm and continue". "Delete" beats "Are you absolutely sure?".

Interaction precedent lives in [`UX_DECISIONS.md`](UX_DECISIONS.md); this section is the philosophy those decisions were made from.

---

## 15. Design Rationale

Why *this* vision, and not something more energetic?

- **Because money is high-stakes context.** A colourful, animated finance app produces the same anxiety as a colourful, animated MRI report. The chrome must match the seriousness of the subject.
- **Because the target user has ambient financial anxiety.** ExpenStream's target personas ([`PROJECT_MASTER_PLAN §6`](PROJECT_MASTER_PLAN.md)) include people for whom every rupee is decided. Loud interfaces make that anxiety worse, not better.
- **Because engagement metrics are the wrong target for personal finance.** The successful ExpenStream user opens the app *less* over time, not more. The vision is engineered to earn that outcome.
- **Because craft compounds.** Restrained, precise, unhurried products earn trust slowly and permanently. Loud products earn attention quickly and lose it just as fast.

---

## 16. Future Evolution

- **Voice input** for expense capture, opt-in and on-device only. Must not compromise the sound-absence principle for other users.
- **Ambient companion surfaces** — Apple Watch complication, iOS home-screen widget, Android glance widget — all read-only, all calm, all optional.
- **Longitudinal narratives** ("your calmest month this year") only if we can produce them without ranking, comparison, or gamification.
- **AI-assisted categorisation and anomaly explanation** (see M14) only on-device; user can turn it off and never see it again.
- **Design system evolution** is governed by [`DESIGN_SYSTEM.md §22`](DESIGN_SYSTEM.md); this vision must be updated in the same PR whenever the visual language changes materially.

Any future evolution must survive the six-qualities test in §2. Anything that trades calm for engagement is rejected regardless of business appeal.

---

## 17. Common Implementation Mistakes

Fifteen mistakes that reviewers and AI agents should flag on sight:

1. **Adding celebratory motion** on save, on budget met, on payday — anywhere.
2. **Making the dashboard hero a chart** instead of a number.
3. **Two competing primary CTAs** on one screen.
4. **A spinner instead of a skeleton** for loads over 100 ms.
5. **Red numeric badges as the default** state of a KPI card.
6. **Push notification bodies that include a monetary value** — this violates a11y (privacy on lock screen), positioning, and [`AI_CONTEXT §18`](AI_CONTEXT.md).
7. **Onboarding modal that blocks the first paint.**
8. **Confirmation dialog on a reversible action** (delete-then-undo is the pattern).
9. **A cascading animation** for a list load (subtle stagger only; ≤ 40 ms per item).
10. **A tooltip that carries essential information** (tooltips are aids, not sources of truth).
11. **A chart without a text alternative** for screen readers.
12. **A copy string that uses guilt** ("You broke your streak!") — refuse.
13. **A rating/review prompt** — refuse.
14. **A "premium" export tier** — refuse; export parity is a principle.
15. **A design that "looks like [competitor]"** — extract the quality, ship an original.

If a PR triggers any of these, the correct response is *"redesign, then re-review"*, not *"amend and merge"*.

---

## 18. How to use this document

- **Designers:** read before scoping any feature. Grade the design against §2, §5, and §17. Cite this doc in the design brief.
- **Engineers:** read once at project onboarding. Refer back when a spec is ambiguous — the answer often lives in §6, §7, §8, or §12.
- **Copywriters:** §6 (Human), §9 (Error tone), §14 (calm copy) are the tuning fork.
- **AI agents:** load this doc immediately after `PRODUCT_PRINCIPLES.md`. When asked to design a screen or feature, cross-reference against `SCREEN_GUIDELINES.md` for composition and `FINANCIAL_PSYCHOLOGY.md` for what to design *against*.
- **Reviewers:** any PR that changes user-facing behaviour must name which §2 quality it advances. If it does not, ask.

---

**Last reviewed:** 2026-07-24
