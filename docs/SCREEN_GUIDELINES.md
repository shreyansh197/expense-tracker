<!--
  SCREEN_GUIDELINES.md — Canonical per-screen composition + five states
  Owner: Product + Design + AI Engineering
  Audience: Designers, engineers, QA, AI agents.
  Companion docs: EXPERIENCE_VISION.md (the feeling target), DESIGN_SYSTEM.md
                  (tokens + components), UX_DECISIONS.md (precedent for
                  interaction choices), FINANCIAL_PSYCHOLOGY.md (biases to
                  design against), PRODUCT_PRINCIPLES.md (doctrine),
                  PROJECT_MASTER_PLAN.md (§7 journeys + emotional arcs).
  Rule: This document specifies canonical composition and five states for every
        top-level screen. It never overrides IMPLEMENTATION_RULES / DESIGN_SYSTEM
        / UX_DECISIONS / PROJECT_MASTER_PLAN. Where a screen entry disagrees
        with UX_DECISIONS.md, UX_DECISIONS wins and this doc is amended.
  Reviewer checklist: any change here must (a) not restate DESIGN_SYSTEM tokens,
        (b) cite the owning UX-N.N decisions rather than re-litigate them,
        (c) preserve the emotional arc from PROJECT_MASTER_PLAN §7,
        (d) declare an implementation-status marker per screen.
-->

# ExpenStream — Screen Guidelines

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-24 · **Family:** Product Experience

> Design System tells you _what the vocabulary is_. This document tells you _what sentences the vocabulary composes into_. One entry per top-level screen. If you are creating, editing, or reviewing a screen, this is the file to open first.

---

## 0. Meta — Why this document exists

### 0.1 Why the feature exists

Because per-screen composition today is _implicit_ — spread across [`UX_DECISIONS.md`](UX_DECISIONS.md), [`PROJECT_MASTER_PLAN.md §7`](PROJECT_MASTER_PLAN.md), and [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) component families. A future AI agent asked to build a new screen has to reconstruct composition from three docs. This document is the single specification.

### 0.2 What problem it solves

The reconstruction cost. Every reviewer, every AI agent, every returning engineer gets the same canonical answer for _"what should be above the fold on the dashboard?"_ — instead of assembling it themselves and drifting.

### 0.3 Business value

- **Design consistency.** Screens ship with the same composition principles regardless of who authored them.
- **Faster onboarding.** A new engineer/agent gets a per-screen spec they can point at during PR review.
- **Fewer emotional bugs.** Explicit _feeling per screen_ prevents the "technically correct, emotionally wrong" bug class.

### 0.4 Product value

- Gives every screen a single-page specification a reviewer can grade against.
- Makes the _five-states_ discipline (empty / loading / error / offline / success) enumerable and enforceable per screen.
- Provides a stable target for regression testing of composition (which cards, in which order, above which fold).

### 0.5 User mindset

The user opens a specific screen because they have a specific question. Every entry below names the question the screen answers, so composition can be graded on whether it _does_ answer it in one glance.

### 0.6 Emotional goal

Each screen carries a **primary feeling** the user should leave with — see the per-screen "Feeling" field. If a design change would violate the feeling, it is redesigned regardless of any other justification.

---

## 1. How to read this document

Each screen entry has four sub-headings:

1. **Purpose** — the question the screen answers, the feeling it must produce, and the primary user mindset it serves.
2. **Canonical composition** — hero, sections, footer, in the order they appear above and below the fold. Component references cite [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) sections rather than restating them.
3. **Five states** — empty, loading, error, offline, success — each named in terms of what the user sees and _how it should feel_.
4. **Owning UX-N.N + DS references** — the precedent this composition inherits from, plus any doctrine anchor.

Each entry also carries an **implementation status** marker:

- `[Implemented]` — matches the current shipped UI as of the last review.
- `[Partially implemented]` — matches in structure; specific composition or state work remains.
- `[Aspirational]` — target composition; current UI diverges and will catch up on a future sprint.

The five-states contract itself is defined in [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md) and enforced by `src/__tests__/`.

---

## 2. Landing

`Status: [Partially implemented]`

### Purpose

- **Question answered:** _"Is this app for me, and can I trust it with my money?"_
- **Feeling:** curiosity settling into trust.
- **Primary mindset:** the visitor evaluating the product for the first time; often on a mobile browser, often skeptical.

### Canonical composition

- **Hero (above the fold).** One-sentence value proposition ("A calm, private place to see and shape your money") + one primary CTA ("Get started") + one secondary link ("Sign in"). No countdown, no scroll cue animation, no autoplay video.
- **Below the fold.** Three short sections, in this order:
  1. **What ExpenStream is** — three plain sentences, no marketing hyperbole.
  2. **Privacy posture** — the promises from [`PRODUCT_PRINCIPLES §2`](PRODUCT_PRINCIPLES.md) restated in one paragraph.
  3. **What it does not do** — the refusals (no bank scraping, no ads, no data resale). This section is load-bearing for trust.
- **Footer.** Legal (Privacy, Terms), support, and a link to the changelog. No newsletter capture. No cookie banner beyond legal minimum.

### Five states

- **Empty state.** N/A — Landing is always populated.
- **Loading state.** The primary CTA renders in its final position even before hydration; skeletons only for the "recent updates" module if present. First contentful paint under 1 s.
- **Error state.** If a supporting resource fails, the screen degrades gracefully to the hero + refusal section; primary CTA never disappears.
- **Offline state.** Landing works offline once the PWA is installed; auth CTAs remain and a subtle "You're offline" pill appears near the header.
- **Success state.** N/A — success is the click-through to Sign in / Sign up.

### Owning references

- [`EXPERIENCE_VISION §5 Anti-patterns`](EXPERIENCE_VISION.md) — Landing must not carry newsletter modals, upsells, or autoplay motion.
- [`FINANCIAL_PSYCHOLOGY §12`](FINANCIAL_PSYCHOLOGY.md) — no manufactured scarcity ("Join 10,000 users this week!").
- [`DESIGN_SYSTEM.md §9 Buttons, §11 Cards`](DESIGN_SYSTEM.md) — primary CTA + card composition.

---

## 3. Login / Sign up

`Status: [Implemented]`

### Purpose

- **Question answered:** _"Can I get into my workspace right now, safely?"_
- **Feeling:** competent, unhurried, private.
- **Primary mindset:** the returning user (or the first-run user on step 2 of onboarding); often distracted, often on a slow network.

### Canonical composition

- **Hero.** Workspace-scoped brand mark (small), one heading ("Welcome back" or "Create your ExpenStream account"), one primary input (email or phone), one continue button.
- **Below the primary flow.** Password / OTP field revealed after the first tap; "Continue with Google" as a secondary auth option, visually distinct from the primary.
- **Footer.** Forgot password, sign-up ↔ sign-in switcher, and one small note on data handling ("We never share your ledger.").

### Five states

- **Empty state.** N/A — form is always populated with focused first field.
- **Loading state.** Button shows an inline spinner in place; input remains editable until submission is confirmed. Never a full-screen loader on auth.
- **Error state.** Error copy renders inline under the field that failed, in plain language ("That email and password did not match"). Never renders "401 Unauthorized" or similar raw server text. Rate-limit errors advise a wait time explicitly.
- **Offline state.** Continue button remains active; on tap, the form informs the user auth requires a connection ("You're offline — sign in when you're back online. Your local data is unaffected.").
- **Success state.** Navigation to the dashboard within one frame after auth resolves; no interstitial "You're logged in!" screen.

### Owning references

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — auth flow, 2FA, device-link.
- [`UX_DECISIONS.md`](UX_DECISIONS.md) — auth surface precedents.
- [`FINANCIAL_PSYCHOLOGY §11`](FINANCIAL_PSYCHOLOGY.md) — bank credentials are never requested.

---

## 4. Dashboard (Personal)

`Status: [Implemented]`

### Purpose

- **Question answered:** _"Am I on track this month?"_
- **Feeling:** calm relief when things are fine; calm honesty when they are not.
- **Primary mindset:** the Anxious Checker (see [`FINANCIAL_PSYCHOLOGY §0.5`](FINANCIAL_PSYCHOLOGY.md)) opening the app to reduce ambient anxiety.

### Canonical composition

- **Hero (above the fold, no scroll).** A single monetary value — remaining budget for the current month — with one word of context ("on track" / "over by ₹X") and a subtle progress ring. No chart above the fold. No red default.
- **Immediately below hero.** The primary action (FAB or bottom-anchored "Add expense") is one tap from the hero.
- **Then, in order:**
  1. **Recent activity** — the last N transactions, each row showing amount + category + date + note preview. No colour-coded moral judgement of categories.
  2. **Category breakdown** — a small, uncoloured horizontal-bar summary of the top 5 categories this month. Tap to open Analytics.
  3. **Anomaly callout** (if any) — a single quiet card that names what changed and offers _"open in Analytics"_. Never a red alert.
- **Footer.** Bottom navigation to Analytics, Business (if enabled), Settings.

### Five states

- **Empty state.** First-run: illustrated empty state with one primary CTA — "Add your first expense". Copy is neutral: "Nothing here yet. Add an expense to see this month at a glance." Never accusatory.
- **Loading state.** Hero number renders as a settled skeleton in the same footprint as the final number (no layout shift on hydration). Skeletons for cards below; skeletons match final layout footprint. If load > 400 ms, skeleton stays; if < 100 ms, skeleton is skipped.
- **Error state.** If the dashboard data cannot load, the hero shows the last cached value with a subtle "Last updated: X" line and a "Retry" affordance. The app never renders a "Something went wrong" full-screen error where recovery is possible.
- **Offline state.** Optimistic values render from local store immediately. Offline pill appears near the header, informational only. Add-expense continues to work; queued mutations show a subtle "syncing" cue.
- **Success state.** After adding an expense, the sheet dismisses and the dashboard hero updates in a single frame. No confetti, no toast that lingers, no "well done!". A brief 180 ms cross-fade on the changed value is the only motion.

### Owning references

- [`UX-1.1 Dashboard order`](UX_DECISIONS.md).
- [`EXPERIENCE_VISION §1 The Session Story`](EXPERIENCE_VISION.md) — hero answers the session's question.
- [`FINANCIAL_PSYCHOLOGY §3 Loss aversion, §5 Financial shame, §14 Confirmation bias in trends`](FINANCIAL_PSYCHOLOGY.md).
- [`DESIGN_SYSTEM §11 Cards, §14 FAB, §17 Accessibility`](DESIGN_SYSTEM.md).
- [`PROJECT_MASTER_PLAN §7.2 Daily use`](PROJECT_MASTER_PLAN.md) — emotional arc target.

---

## 5. Expenses (list + create/edit sheet)

`Status: [Implemented]`

### Purpose

- **Question answered:** _"What did I spend, and can I capture this one before I forget?"_
- **Feeling:** meticulous, unhurried, in-control.
- **Primary mindset:** the Meticulous Tracker who came to log or review a specific transaction.

### Canonical composition

- **Header.** Screen title, month scope filter (chip), search icon (opens inline search). No aggressive sort/filter chrome.
- **List body.** Virtualised list of expense rows grouped by day. Each row: amount (right-aligned, monospaced), category (icon + label), note preview (truncated), date. Row is tappable to open the sheet in edit mode.
- **Primary action.** FAB "Add expense" bottom-right within safe-area inset.
- **Create/edit sheet (bottom sheet).**
  1. **Amount pad first.** Big numeric keypad, currency prefix visible, decimal handling per [`PRODUCT_PRINCIPLES §6.3`](PRODUCT_PRINCIPLES.md). One tap to `+`, one to save.
  2. **Category grid** second, with search fallback for long lists.
  3. **Note** field third — optional, expandable.
  4. **Advanced** (date, tags, recurring) — collapsed under a "More options" disclosure.
  5. **Save** button anchored at bottom, always in the primary position.

### Five states

- **Empty state.** "Nothing here yet — tap + to add your first expense." Illustration low-weight. One primary CTA.
- **Loading state.** Virtualised list renders skeleton rows in the visible viewport only. Sheet renders instantly on tap; amount pad is interactive before any network load resolves.
- **Error state.** If save fails, the sheet stays open, the amount is preserved, an inline banner explains the failure and offers "Try again" or "Save offline" — the value is never lost. If a row fails to load, that row shows a compact "Couldn't load — retry" line without breaking neighbours.
- **Offline state.** Save works optimistically; the row appears immediately with a subtle "syncing" indicator. Sheet dismisses normally.
- **Success state.** Sheet dismisses; the new row animates into position with a 200 ms slide-in. No toast, no chime, no confetti.

### Owning references

- [`UX-4.1 Amount pad first`](UX_DECISIONS.md).
- [`UX-3.x Sheet composition`](UX_DECISIONS.md).
- [`DESIGN_SYSTEM §10 Inputs, §12 Bottom Sheets, §14 FAB`](DESIGN_SYSTEM.md).
- [`FINANCIAL_PSYCHOLOGY §8 Envelope bias`](FINANCIAL_PSYCHOLOGY.md) — category is optional per transaction.

---

## 6. Analytics

`Status: [Partially implemented]`

### Purpose

- **Question answered:** _"What did I actually spend on, over what period?"_
- **Feeling:** informed, not overwhelmed; charts whisper, they do not shout.
- **Primary mindset:** the Optimistic Planner reviewing to plan next month, or the Anxious Checker investigating a suspected anomaly.

### Canonical composition

- **Hero.** A single "Total for [period]" number with the period switcher (chip: This month · Last month · 3 months · Custom) directly below. No chart in the hero position.
- **Below hero.**
  1. **Category breakdown** — horizontal-bar chart, honest zero-anchored axis, category order = descending by amount.
  2. **Trend** — line chart of monthly totals over the last 6 months, y-axis zero-anchored, no truncation. Forecast values labelled _estimate_ with a visible confidence range.
  3. **Anomaly panel** — a single card per anomaly with a reason string and a "See the transactions" affordance. Reasons come from `src/lib/anomaly/reason.ts`.
- **Footer.** Export button (CSV/JSON), lossless per [`PRODUCT_PRINCIPLES §6.8`](PRODUCT_PRINCIPLES.md).

### Five states

- **Empty state.** "Come back after a few expenses — Analytics finds its feet with more data." One CTA to "Add an expense". No fake demo chart.
- **Loading state.** Skeleton bar and line placeholders that match the final chart footprint. Numbers render before charts when possible.
- **Error state.** If a chart's data cannot compute, the chart card shows a compact "Couldn't compute this view — retry" line, and the neighbouring charts continue to render.
- **Offline state.** Analytics runs against local store; results are the same as online. A subtle "Local view — will refresh when online" pill appears if there are unsynced changes.
- **Success state.** Filter changes update the charts with a 240 ms cross-fade, no bounce.

### Owning references

- [`FINANCIAL_PSYCHOLOGY §14 Confirmation bias in trends`](FINANCIAL_PSYCHOLOGY.md) — y-axis honesty, forecast labelling.
- [`DESIGN_SYSTEM §15 Charts, §17 Accessibility`](DESIGN_SYSTEM.md) — every chart has a text alternative for screen readers.
- [`SPRINT_BOARD M4 Accessibility Contracts Coverage`](SPRINT_BOARD.md) — chart text-alt work.
- [`EXPERIENCE_VISION §13 Information hierarchy`](EXPERIENCE_VISION.md) — user's own numbers are the hero.

---

## 7. Business (dashboard + ledger + payment)

`Status: [Implemented]`

### Purpose

- **Question answered:** _"What am I owed, what came in, and what is overdue?"_
- **Feeling:** professional focus resolving into closure.
- **Primary mindset:** the freelancer / micro-business owner reconciling collections at the end of a day or month.

### Canonical composition

- **Business dashboard hero.** Four KPI cards in a 2×2 grid on mobile (`[Expected, Received] / [Collection %, Overdue]`). Each card: label, monetary value, subtle delta from previous period (arrow only if the delta exceeds a statistical threshold).
- **Below hero.**
  1. **Active ledgers list** — grouped by status (Active, Awaiting, Closed). Each ledger row: name, expected amount, progress ring, due date, overdue tag if applicable.
  2. **Recent payments feed** — the last N payments across all ledgers.
- **Primary action.** FAB "Create ledger" or "Record payment" (contextual to current tab).
- **Ledger detail screen.** Header with expected + received + progress ring; payment list below; "Record payment" primary action; "Send reminder" secondary (opt-in per ledger).

### Five states

- **Empty state.** "No active ledgers. Create one to start tracking what you're owed." One primary CTA. No demo data.
- **Loading state.** Skeleton KPI cards match the final 2×2 grid footprint. List below renders progressively.
- **Error state.** KPI cards render last known values with an "Updated: X" line if fresh compute fails. Never render "0" as a fallback for a failed calculation — 0 is a truthful number and would mislead.
- **Offline state.** Ledgers and payments are local-first; the entire business surface works offline. Overdue detection runs on local time and is reconciled on sync.
- **Success state.** After recording a payment, the progress ring updates in-place (220 ms tween); the ledger row visually settles; no confetti even at 100% collection.

### Owning references

- [`SPRINT_BOARD M7 Business Ledger Polish & Reminders`](SPRINT_BOARD.md).
- [`FINANCIAL_PSYCHOLOGY §5 Financial shame`](FINANCIAL_PSYCHOLOGY.md) — overdue is a state, not a moral judgement.
- [`DESIGN_SYSTEM §11 Cards, §15 Charts`](DESIGN_SYSTEM.md) — progress ring pattern.
- [`PROJECT_MASTER_PLAN §7.4 Business ledger flow`](PROJECT_MASTER_PLAN.md).

---

## 8. Category (list + create/edit)

`Status: [Implemented]`

### Purpose

- **Question answered:** _"How do I organise (or reorganise) my categories?"_
- **Feeling:** in-control, unpressured.
- **Primary mindset:** the user tuning their taxonomy — usually a low-frequency, deliberate action.

### Canonical composition

- **Header.** Screen title + count of categories.
- **List body.** Categories grouped by parent (if hierarchical). Each row: icon, name, monthly usage count, tap to edit.
- **Primary action.** FAB "Add category".
- **Create/edit sheet.** Name, icon picker (from a fixed neutral set), optional colour (from a neutral palette — never assigns "good"/"bad" hues), optional parent. Delete option shows: "Deleting this category will not delete its transactions. They will become uncategorised."

### Five states

- **Empty state.** Never truly empty — default categories seed on workspace creation. If cleared, "You have no categories yet — add one to start organising your expenses."
- **Loading state.** Skeleton rows matching final row height.
- **Error state.** Save failure keeps the sheet open, preserves the name, offers retry. Delete failure surfaces inline.
- **Offline state.** Category CRUD works offline via local store; sync on reconnect.
- **Success state.** New/edited category appears in the list with a 180 ms fade-in.

### Owning references

- [`FINANCIAL_PSYCHOLOGY §5 Financial shame, §13 Category framing`](FINANCIAL_PSYCHOLOGY.md) — no moralising taxonomy.
- [`DESIGN_SYSTEM §10 Inputs, §12 Bottom Sheets, §16 Icons`](DESIGN_SYSTEM.md).

---

## 9. Settings

`Status: [Implemented]`

### Purpose

- **Question answered:** _"How do I change something about how the app works, or about my data?"_
- **Feeling:** ownership, transparency, no friction to leave.
- **Primary mindset:** the user asserting sovereignty — changing a currency, exporting data, deleting an account.

### Canonical composition

- **Header.** User identity chip (workspace + email/phone).
- **Sections, in order:**
  1. **Finances** — currency, monthly budget, envelope toggles.
  2. **Appearance** — theme, density, personal / business toggle.
  3. **Notifications** — per-category opt-in toggles (evening reminder, weekly digest, anomaly, payment reminder). Never a single blanket toggle.
  4. **Security** — 2FA, device list, active sessions, link-a-device.
  5. **Data** — export (CSV, JSON), backup, restore, purge cache.
  6. **Members** (if applicable) — invite, roles, audit log link.
  7. **About** — version, changelog link, privacy policy, terms.
  8. **Danger zone** — sign out; delete account (one tap → one confirmation → receipt).
- **No hidden nudges.** Every toggle is discoverable at its own path; nothing important is buried more than two taps deep.

### Five states

- **Empty state.** N/A — settings are always populated.
- **Loading state.** Sections skeleton in place; individual rows load values progressively without layout shift.
- **Error state.** A failed setting write shows an inline error next to the setting; the toggle reverts to its previous state (never leaves the UI in a lied-about state).
- **Offline state.** Local-only settings (theme, density) apply immediately. Server-dependent settings (2FA, invites) queue with a clear "will apply when online" hint.
- **Success state.** Setting change confirms with a subtle in-place indicator (checkmark that fades over 400 ms). No toast, no chime.

### Owning references

- [`PRODUCT_PRINCIPLES §3 Sovereignty, §6.8 Export parity, §6.9 Deletion is real`](PRODUCT_PRINCIPLES.md).
- [`FINANCIAL_PSYCHOLOGY §10 Sunk-cost / commitment escalation`](FINANCIAL_PSYCHOLOGY.md) — deletion has no retention modal.
- [`DESIGN_SYSTEM §10 Inputs, §13 Dialogs`](DESIGN_SYSTEM.md).

---

## 10. Cross-cutting rules for every screen

These apply to every screen above and to any new screen introduced later. They are the invariants a reviewer can check without opening the specific entry.

1. **One hero answer.** Every screen answers exactly one question in its hero position. Two heroes = zero heroes.
2. **One primary CTA.** Never two competing CTAs of equal weight. Secondary actions are visually secondary.
3. **Five states, all shipped.** Empty / loading / error / offline / success — no screen may ship missing any of the five (enforced by [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md)).
4. **Skeleton over spinner** for any load > 100 ms; skeleton matches final layout footprint.
5. **No modal-inside-a-modal.** A sheet may not spawn another sheet.
6. **No colour-only encoding.** Overspend is amber _and_ labelled; overdue is a tag _and_ a colour.
7. **≥ 44 × 44 px touch targets.** Enforced by contract test.
8. **`prefers-reduced-motion` honoured.** Enforced by contract test.
9. **Money never leaks.** No amount in a push notification body, an analytics event, or a Sentry breadcrumb (see [`AI_CONTEXT §18`](AI_CONTEXT.md)).
10. **Copy passes the thoughtful-accountant test.** See [`FINANCIAL_PSYCHOLOGY §15`](FINANCIAL_PSYCHOLOGY.md).

---

## 11. Loading Experience (screens-wide)

- **First contentful paint targets:** Landing < 1 s, Dashboard < 1 s (warm), Analytics < 1.5 s.
- **Skeletons everywhere** for loads > 100 ms; no shimmer effect longer than the actual load.
- **Numbers render before charts** whenever possible; the user's question is answered before supporting visualisation arrives.
- **Optimistic updates** for every user-initiated mutation.

Full narrative: [`EXPERIENCE_VISION §7`](EXPERIENCE_VISION.md).

---

## 12. Empty State (screens-wide)

- Empty states are the tutorial.
- Every empty state ships: one honest sentence, one low-weight illustration, exactly one primary CTA.
- Never accusatory. Never framed as a deficit.
- Per-screen empty copy lives in each entry above.

---

## 13. Error State (screens-wide)

- Every error names a plain-language cause and a concrete next step.
- Errors that involve money must not lose the user's input — the input is preserved and retryable.
- Recoverable errors offer retry inline; non-recoverable errors offer contact + export + local-copy paths.
- Never render raw server error codes to the user.

---

## 14. Offline Behaviour (screens-wide)

- Every screen listed in this document works offline for read + write against the local store.
- Sync indicators are informational, never alarming.
- Optimistic writes render immediately and reconcile in the background.
- Conflict resolution shows both numbers side-by-side (see [`ARCHITECTURE.md §18.1`](ARCHITECTURE.md)); the app never chooses silently.

---

## 15. Accessibility (screens-wide)

- **Screen reader order matches visual order.** No `tabindex` gymnastics.
- **Focus is always visible** with a calm focus ring (token-driven).
- **Text scales to 200%** without truncation on every screen.
- **Charts carry text alternatives** — enforced by [`SPRINT_BOARD M4`](SPRINT_BOARD.md).
- **Colour never load-bearing alone** (see §10.6).
- Full a11y contract: [`DESIGN_SYSTEM §17`](DESIGN_SYSTEM.md), [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md), `src/__tests__/accessibilityContracts.test.ts`.

---

## 16. Motion Expectations (screens-wide)

- Micro-interactions 120-180 ms; sheet reveals 220-260 ms; page transitions ≤ 300 ms.
- Motion confirms state; it does not perform.
- Standard easings only; no bounce or overshoot on financial surfaces.
- Reduced-motion honoured absolutely.

Full tokens: [`DESIGN_SYSTEM §8`](DESIGN_SYSTEM.md). Full principles: [`EXPERIENCE_VISION §12`](EXPERIENCE_VISION.md).

---

## 17. Information Hierarchy (screens-wide)

- **User's own numbers > suggestions > AI outputs** in visual weight, always.
- **Hero is a number**, not a chart, on every screen that has a hero.
- **Cards group; whitespace separates.**
- **Density is user-choice** — comfortable and compact modes are equal citizens.

---

## 18. Interaction Philosophy (screens-wide)

- **One-handed by default on mobile.** Primary controls in the bottom third; FABs within safe-area inset.
- **Undo over confirmation** for reversible actions.
- **Preview before commit** for setting changes.
- **Progressive disclosure** for advanced options.
- **No modal-inside-a-modal.**
- **Calm copy.** "Save" beats "Confirm and continue".

---

## 19. Design Rationale

Why enumerate screens at all, when the design system defines the components?

- **Because components compose in many ways.** Two engineers using the same `<Card>`, `<Sheet>`, and `<Button>` can ship two very different dashboards. This document is the composition contract.
- **Because per-screen five-states discipline is where most emotional bugs live.** An empty state written by the growth PM will differ from an empty state written by the design lead unless we specify.
- **Because the five states have to be _loaded_ into an agent's context to influence its output.** A screen entry that names the five states in one page is easier to reference than three separate docs.

---

## 20. Future Evolution

- **Add new screen entries** when a new top-level surface ships (e.g., a household activity feed under M13; an AI companion under M14). Every new entry uses the same four sub-headings and carries an implementation-status marker.
- **Update existing entries** whenever a UX-N.N decision changes composition. The change lands in the same PR as the UX decision.
- **Deprecate entries** for screens that are removed; move them under a `Historical` sub-section rather than deleting, so future readers can trace the composition history.
- **Coordinate with [`DESIGN_SYSTEM.md §22`](DESIGN_SYSTEM.md) evolution** — component-level changes may ripple into per-screen composition and this doc must be updated in the same PR.

---

## 21. Common Implementation Mistakes

Fifteen mistakes reviewers and AI agents should flag on sight when reviewing a screen:

1. **Two heroes** on one screen (two big numbers competing for attention).
2. **A chart in the hero position** where a number belongs.
3. **Missing one of the five states** — usually offline, sometimes error.
4. **Empty state framed as a deficit** ("You haven't added anything yet!").
5. **Spinner instead of skeleton** for a load > 100 ms.
6. **Skeleton that does not match final layout footprint** (causes layout shift).
7. **Layout shift when a value hydrates** — the hero must render in its final footprint even as a skeleton.
8. **Red badges by default** on any KPI or category.
9. **Modal spawning another modal.**
10. **A destructive action guarded by a confirmation dialog** where undo would work.
11. **Auto-advancing sections** or auto-scrolling tutorials on any screen.
12. **A push-notification body that includes a monetary value** originating from any screen's logic.
13. **A chart without a text alternative.**
14. **Copy that judges a category or a decision.**
15. **A screen that does not name which question it answers** — this doc has no entry for it because the screen has no purpose.

If a PR triggers any of these, redesign the screen before requesting review.

---

## 22. How to use this document

- **Designers:** open the relevant screen entry before scoping. Every mock must match the canonical composition or explain the divergence in the design brief.
- **Engineers:** treat the five states section as the acceptance criteria for the screen. Contract tests enforce the invariants in §10.
- **Reviewers:** for any PR touching a screen, check: does it match the entry, and if not, was the entry updated?
- **AI agents:** load this doc whenever creating, editing, or reviewing a screen. Cross-reference with [`EXPERIENCE_VISION.md`](EXPERIENCE_VISION.md) for feeling, [`FINANCIAL_PSYCHOLOGY.md`](FINANCIAL_PSYCHOLOGY.md) for what to design against, [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) for components, and [`UX_DECISIONS.md`](UX_DECISIONS.md) for the precedent behind each choice.

---

**Last reviewed:** 2026-07-24
