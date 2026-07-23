<!--
  UX_DECISIONS.md — Major UX decisions for ExpenStream
  Owner: Product Design + AI Engineering
  Audience: PMs, designers, engineers, QA, and AI agents.
  Companion docs: AI_CONTEXT.md, PROJECT_MASTER_PLAN.md, DESIGN_SYSTEM.md,
                  ARCHITECTURE.md, TESTING_CHECKLIST.md.
  Rule: This document records the *why* behind visible product choices.
        Update in place when a decision is revisited. Never remove a decision;
        supersede it with a new entry and mark the old one "superseded by".
-->

# ExpenStream — UX Decisions

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-22

Each entry follows the same five-field shape so future engineers, designers, and AI agents can reconstruct the reasoning without re-litigating it.

> **Decision · Reason · Alternatives Considered · Trade-offs · Future Considerations**

Decisions are grouped by concern:

1. Information Architecture & Dashboard
2. Navigation & Reachability
3. Interaction Surfaces (Sheets, Dialogs, FAB)
4. Data Entry
5. Data Visualization
6. Motion & Feedback
7. Personalization & Theming
8. Trust, Privacy & Security posture
9. Accessibility
10. Offline, Sync & Continuity
11. Copy, Tone & Notifications

---

## 1. Information Architecture & Dashboard

### UX-1.1 · Dashboard is organized as a vertical narrative: Hero → KPIs → Charts → Recent activity

**Decision.** The dashboard renders top-to-bottom in a fixed order:

1. **Hero total** — the single number that answers "how am I doing this month?" in `--text-amount-hero`.
2. **KPI cards** — remaining budget, this-month total, category leader, streak. One-column stack on `xs`, 2 columns at `md`, 4 at `xl`.
3. **Primary chart** — rolling average with ±1σ confidence band.
4. **Secondary charts / insights** — YoY, merchant breakdown, category velocity, forecast, anomaly callouts.
5. **Recent activity** — last N expenses, tapable.
6. **Empty scroll region** — reserves `88px + safe-area` for the FAB and iOS home indicator.

**Reason.** Persona A (Priya) opens the app to answer one question — _am I on track?_ — and the hero + KPI stack answers it above the fold on a mid-tier Android in ≤ 1 s (LCP budget). Charts and lists are the "one tap deeper" that Progressive Disclosure (UX Philosophy #4 in [AI_CONTEXT.md](AI_CONTEXT.md)) reserves for users who ask a follow-up question. Recent activity is last because it is the highest-cardinality region and would otherwise push the answer below the fold.

**Alternatives Considered.**

- _Tabbed dashboard_ (Overview / Analytics / Recent). Rejected: adds a nav decision before the user gets their answer, and tabs hide the insight cards that carry the "quiet accountant" voice.
- _Card grid with drag-to-reorder_. Rejected for v1: personalization at that granularity encourages novelty over calm, and adds sync/conflict surface area.
- _Recent-first list (Splitwise-style)_. Rejected: turns the app into a log, not an answer.

**Trade-offs.**

- Users who _only_ want to log an expense scroll past the hero/KPI region every session. Mitigated by the FAB being reachable at all times without scrolling.
- The fixed order removes user agency over layout. Accepted, because the design system's editorial voice depends on rhythmic hierarchy.

**Future Considerations.**

- Per-persona layouts (Business mode already reorders to KPI → Collections → Overdue).
- An opt-in "compact" mode that collapses secondary charts into an accordion for power users who prefer a denser view.
- Home-screen widget (PWA widget spec) as an even shallower surface for the hero total.

---

### UX-1.2 · Charts are ordered _rolling average → YoY → merchant → category velocity → forecast → anomalies_

**Decision.** The analytics stack has a canonical order: rolling average first, YoY second, merchant/category breakdowns third, forecast fourth, anomaly callouts last.

**Reason.** The order maps directly to the questions a user asks in sequence: _"What's my baseline?" → "How does this month compare to last year?" → "Where is the money going?" → "What will the month end at?" → "Anything weird?"_ This mirrors how a skilled accountant would present a month-end — from the calmest, most trusted signal (30-day average) to the most action-triggering (anomalies). Placing anomalies last also honors the "no red unless truly wrong" rule ([AI_CONTEXT.md §5](AI_CONTEXT.md)) — the user reaches red only after they've seen the calm baseline.

**Alternatives Considered.**

- _Anomalies first_ (alert-driven). Rejected: pattern-matches to notification apps and breaks the "calm over clever" commitment ([DESIGN_SYSTEM.md §0](DESIGN_SYSTEM.md)).
- _Forecast first_ (predictive hook). Rejected: forecast is inherently uncertain; leading with it undermines the trust KPI ("trusts the answer" — north star in [PROJECT_MASTER_PLAN.md §1](PROJECT_MASTER_PLAN.md)).
- _User-configurable order_. Deferred: adds preferences surface without a clear KPI lift.

**Trade-offs.**

- Users hunting for anomalies scroll further. Accepted; anomalies also surface as insight cards higher in the page when they cross a severity threshold.
- Fixed order is harder to A/B test.

**Future Considerations.**

- Once the natural-language filter bar (Horizon 2) ships, the chart order may become query-driven — the user's question re-ranks the surfaces.
- If Persona B (Marco) data shows Business users skip the analytics page entirely, Business mode may collapse the chart stack into two summary cards.

---

### UX-1.3 · Insight cards use editorial callouts, not banners

**Decision.** Insights ("This month is 12% below your 90-day average", "Groceries has drifted up 3 weeks in a row") render as calm cards inside the flow — icon, `--text-h4` title, `--text-body` body — never as dismissible banners above the fold.

**Reason.** Banners train users to swipe-dismiss without reading, and they compete with the hero number for the eye. Cards in-flow read as _observations from a colleague_, not _alerts from a system_ — which is the product personality ([AI_CONTEXT.md §4](AI_CONTEXT.md)).

**Alternatives Considered.**

- _Toast-on-open_ for insights. Rejected: toasts are for user-triggered async results; using them for insight would violate the "no modals the user didn't ask for" rule.
- _Push notification for every insight_. Rejected: erodes the notification channel's signal-to-noise.

**Trade-offs.**

- Users who don't scroll past the KPIs will miss most insights. Accepted; the highest-severity ones promote into an insight strip directly under the hero.

**Future Considerations.**

- AI-native "quiet suggestions" (Horizon 4) will use this same card family, not a new surface.

---

## 2. Navigation & Reachability

### UX-2.1 · Bottom tab bar on mobile, side rail on tablet, expanded side nav on desktop

**Decision.**

- `< md` (< 768 px): **bottom tab bar**, max 4 slots, plus the FAB above it.
- `md–lg`: **collapsed rail** on the left, icons only, labels on hover.
- `≥ lg`: **expanded side nav** with labels and section groupings.

**Reason.** On mobile, the thumb's reachable arc is the bottom third of the screen ([Steven Hoober, 2013; Google Material research, 2021](https://m3.material.io/foundations/adaptive-design/foldables/overview)). Top nav on a modern phone requires a hand shift or grip change, which raises the cost of every navigation act. On tablet and desktop the mouse or trackpad negates that cost, and vertical real estate is scarcer than horizontal — so nav moves to the left edge and stops competing with content for the bottom safe area.

**Alternatives Considered.**

- _Top tab bar universally_ (webapp convention). Rejected on mobile for reachability; kept in the mind for desktop but rejected because desktop users benefit from labels + section grouping that a horizontal bar can't hold.
- _Hamburger menu_. Rejected outright: hides destinations behind a tap, well-documented to lower engagement ([NN/g, 2016](https://www.nngroup.com/articles/hamburger-menus/)).
- _Gesture-only nav (edge-swipe)_. Rejected: discoverability and a11y regression for keyboard/screen-reader users.

**Trade-offs.**

- Four tab slots force ruthless IA prioritization. Overflow goes into a "More" sheet, which is a known compromise but preserves reachability.
- Two nav paradigms (tab bar + side nav) is more code to maintain and test.

**Future Considerations.**

- If Business mode grows to > 4 top-level destinations, the tab bar may become mode-specific (Personal vs Business) rather than growing a fifth slot.
- iPadOS "sidebar + navigation split view" pattern could replace the collapsed rail on tablets ≥ 900 px.

---

### UX-2.2 · One-handed operation is prioritized over screen-density

**Decision.** Every primary action on mobile is reachable with the thumb of the dominant hand without a grip change. FAB, tab bar, sheet footers, and modal buttons live in the bottom half of the viewport. Secondary and destructive actions may live higher (headers, kebab menus).

**Reason.** Persona A (Priya, commuting) and Persona D (Wale, on the go with a mid-tier phone) log expenses in transit — often literally one-handed on a bus or in a queue. Time-to-first-expense ≤ 30 s ([PROJECT_MASTER_PLAN.md §2.1](PROJECT_MASTER_PLAN.md)) is only achievable if the primary flow never requires a grip change. Placing destructive actions higher also creates _deliberate friction_ for hard-to-reverse ops (see UX-3.2).

**Alternatives Considered.**

- _Symmetric layout_ (buttons on both edges). Rejected: only one thumb is dominant; symmetry costs the non-dominant path nothing and wastes the dominant path.
- _Left-hand-mode toggle_ (Samsung-style). Deferred: complexity for a small user segment; RTL locales handled separately by CSS logical properties.

**Trade-offs.**

- On 6.7"+ phones, the very top of the screen is essentially unreachable. Content there must be non-critical (page title, decorative eyebrow) or interactive via a lower alternative (e.g. a header search icon has a keyboard shortcut and appears in the FAB long-press menu).
- Constrains layout freedom — some analytics-heavy tablets could benefit from top-mounted controls, and we intentionally forbid that on mobile.

**Future Considerations.**

- Foldables (Galaxy Z, Pixel Fold) shift the reachable arc. The design system will need a "posture-aware" hook that reads `screen.orientation` + hinge angle when the CSS `spanning` media query lands.
- Voice-to-expense (future feature in [PROJECT_MASTER_PLAN.md §17](PROJECT_MASTER_PLAN.md)) makes reachability moot for that path.

---

### UX-2.3 · Navigation hierarchy is flat: Dashboard, Analytics, Ledgers/Recurring, Settings

**Decision.** Only four top-level destinations. Deeper surfaces are reached via **cards on the dashboard**, **rows in a list**, or **sheets**, not via nested nav.

**Reason.** Deep hierarchies (three or more levels) force users to remember paths ([NN/g, "Depth vs Breadth"](https://www.nngroup.com/articles/menu-design/)). ExpenStream's data is naturally shallow: a workspace has expenses, budgets, categories, ledgers — none of which need their own nav slot when they can be surfaced contextually. Flat nav also aligns with the four-slot tab-bar constraint (UX-2.1).

**Alternatives Considered.**

- _Categories as a top-level destination_. Rejected: category management is edited rarely, browsed via filters. It lives in Settings.
- _Separate "Budgets" tab_. Rejected: budgets are contextual to the dashboard hero and to each category — not a destination.

**Trade-offs.**

- Power users who edit categories weekly need one extra tap to reach them (Settings → Categories). Accepted.
- Business mode nudges against this — collections deserve a top-level slot when the user is in Business mode. Solved by the mode toggle re-labeling the third slot (Recurring ↔ Ledgers).

**Future Considerations.**

- If envelope budgets (Horizon 2) become a daily surface, they may earn a card group on the dashboard rather than a nav slot.

---

## 3. Interaction Surfaces (Sheets, Dialogs, FAB)

### UX-3.1 · Bottom sheets are the primary composition surface on mobile

**Decision.** Any flow that composes new data or edits existing data on mobile opens in a **bottom sheet**, not a full-page route and not a centered modal. Sheets support drag-to-dismiss (80 px threshold or > 500 px/s velocity), a focus trap, an independently scrolling body, and a sticky safe-area-padded footer for the primary action.

**Reason.** Bottom sheets originate from the reachable arc (UX-2.2), preserve context (the underlying page is dimmed but visible), and are dismissible without moving the thumb to the top of the screen. Full-page routes force a navigation transition and break the sense of "I'm still on the dashboard, just adding one thing." Centered modals on mobile land in the middle of the screen — outside the reachable arc — and their close button is invariably in the top-right corner, the least reachable point on any modern phone.

**Alternatives Considered.**

- _Full-page routes_ (native-app pattern). Kept for genuinely multi-step flows (onboarding, guided ledger creation) but rejected for one-screen composition.
- _Centered modals_. Kept for **blocking decisions only** (UX-3.3); rejected for composition.
- _Inline expansion_ (accordion). Rejected: pushes the rest of the page down, causes layout shift, and gives no focus trap.

**Trade-offs.**

- Sheets are dismissible, so a user can lose in-progress work with a stray swipe. Mitigated by "unsaved changes → confirm exit" on sheets with dirty state.
- Only one sheet may be open at a time ([DESIGN_SYSTEM.md §12.4](DESIGN_SYSTEM.md)), so chained flows must use step-in-place, which is more complex than nesting sheets.
- Desktop users see the same content in a centered dialog; the sheet-vs-dialog switch is a responsive concern the components must handle.

**Future Considerations.**

- Snap-points beyond the standard 60 vh / 90 vh (e.g. mini-mode for chained flows) once Framer Motion + iOS Safari behave reliably.
- Sheet-to-page promotion animation for flows that outgrow their sheet (rare, but useful for the future "split expense" flow).

---

### UX-3.2 · Dialogs are reserved for blocking, hard-to-reverse decisions

**Decision.** Centered dialogs (`role="dialog"`, `aria-modal="true"`) are used only when a decision blocks progress or cannot be undone: destructive delete, revoke device, wipe workspace, sign out with unsynced writes, legal/consent gates. Never for success messages, non-blocking questions, or marketing.

**Reason.** Modals are the loudest surface in the app — they steal focus, block interaction, and demand attention. Overusing them trains users to reflexively click "OK" without reading, defeating their safety purpose ([NN/g, "Modal & Non-modal Dialogs"](https://www.nngroup.com/articles/modal-nonmodal-dialog/)). By reserving dialogs for irreversible actions, when one _does_ appear the user knows to slow down.

**Alternatives Considered.**

- _Inline confirmation strip_ (Gmail-style undo bar for delete). Adopted for _reversible_ destructive actions — expense delete, ledger archive — because the 10-second undo makes them soft-destructive. Dialogs are reserved for hard-destructive.
- _Two-step FAB_ (long-press to confirm). Rejected for delete because it's discoverable only after use.
- _Toast confirmation_ ("Really delete? [Yes / No]"). Rejected: toasts auto-dismiss; using them for a decision violates the "toasts are for async result" contract.

**Trade-offs.**

- The distinction between "reversible → toast + undo" and "irreversible → dialog" must be enforced in code review. A drift is easy.
- Screen-reader users experience dialog interruption more forcefully; we compensate with clear titles and safe-action autofocus (see UX-9.4).

**Future Considerations.**

- A "deliberate confirm" pattern for high-value money edits (e.g. changing a paid ledger's expected amount) that requires typing the amount rather than clicking OK.

---

### UX-3.3 · Exactly one Floating Action Button per screen, tied to the screen's most frequent action

**Decision.** Every screen with a primary generative action exposes exactly one FAB. On the dashboard: **+ Add expense**. On Ledgers: **+ New ledger**. On Recurring: **+ New recurring**. Analytics and Settings have no FAB. The FAB hides on scroll-down and reappears on scroll-up.

**Reason.** The FAB is the fastest path to the app's most-used action. In telemetry-free terms: entering an expense is the reason the user opened the app in 80%+ of sessions (Persona A/D use case). Making that action reachable in one thumb-tap from the reachable arc collapses time-to-first-expense to near-zero. Two FABs would force the user to _choose_ before acting, which is the opposite of the calm hierarchy the design system enforces.

**Alternatives Considered.**

- _Speed-dial FAB_ (Material's expanding FAB with sub-actions). Rejected: adds a decision (which sub-action?) that undermines the "one thumb, one screen, one second" goal (G2 in [PROJECT_MASTER_PLAN.md §3](PROJECT_MASTER_PLAN.md)).
- _No FAB, primary action in header_. Rejected: header is outside the reachable arc.
- _FAB as navigation shortcut_. Rejected: nav is the tab bar's job; conflating navigation and creation confuses affordance.

**Trade-offs.**

- Screens without a natural "one primary action" (Analytics, Settings) look asymmetric. Accepted; not every screen needs a FAB, and forcing one would create a false hierarchy.
- The hide-on-scroll behavior can feel jittery on iOS Safari's momentum scrolling. Mitigated by `spring.water` and a small hysteresis threshold.

**Future Considerations.**

- Contextual FAB variants (e.g. "+ Add payment" appears when a ledger detail sheet is open) — must respect the "one FAB visible at a time" invariant.
- 3D-touch / long-press to switch mode (Personal → Business quick-add) is a candidate once the interaction is discoverable.

---

### UX-3.4 · Quick Add exists as an install-scoped shortcut, distinct from the FAB

**Decision.** Installed PWAs register a **shortcut** in the manifest (`shortcuts[]`) labeled "Quick Add" that deep-links directly to the expense sheet with the amount pad focused. On desktop this appears in the Windows jump list / macOS dock menu; on Android it appears via long-press on the home-screen icon.

**Reason.** The FAB (UX-3.3) makes expense entry fast _inside_ the app. Quick Add makes it fast _from outside_ — the user is on the home screen, remembers they spent ₹450 at lunch, and can capture it in a single tap without waiting for the dashboard to hydrate. This shaves ~1–2 s off cold-start time-to-first-expense, which matters for the 30 s KPI.

**Alternatives Considered.**

- _Rely on the FAB alone_. Rejected: the FAB requires the dashboard to load first, which on a cold PWA install is 1–2 s of latency even at LCP budget.
- _A separate mini-app / widget_. Deferred: PWA widget spec is not broadly available; the shortcut is the closest cross-platform equivalent today.
- _Notification-triggered quick add_ (persistent silent push). Rejected: abuses the notification channel and drains battery.

**Trade-offs.**

- Two ways to add an expense means two flows to keep in sync, especially around auth (the Quick Add deep link must handle the "not signed in" and "PIN-locked" cases gracefully).
- Users on iOS Safari without install do not benefit — the shortcut needs the app to be installed.

**Future Considerations.**

- Voice-triggered Quick Add via Web Speech API for hands-free capture.
- Widget-based Quick Add once the PWA widget spec ships in major browsers.
- Watch-face Quick Add (mentioned in [PROJECT_MASTER_PLAN.md §17](PROJECT_MASTER_PLAN.md)) as the ultimate cold-start collapse.

---

## 4. Data Entry

### UX-4.1 · Amount pad is the first field in the expense sheet

**Decision.** The expense entry sheet opens with the **amount pad focused** and visible above the fold. Category grid is second. Remark, date, and tags are optional, reachable via scroll or an "Add detail" reveal.

**Reason.** Amount is the one field the user _always_ has to fill. Category is often obvious from context (recent-most category is pre-selected). Remark, date, and tags are almost never required to answer "did I spend ₹450 today?". Placing amount first respects the user's mental model — they came to log a _number_, not to answer a form.

**Alternatives Considered.**

- _Category first_ (Splitwise-style). Rejected: users know the amount but often not the category label; forcing category first stalls the flow.
- _Free-form parsing_ ("₹450 groceries lunch"). Deferred: promising, but harder to make locale-safe and screen-reader-friendly. Considered again for the AI-native horizon.
- _Chatbot-style entry_. Rejected: conversational UI is slower for repeat entry than a keypad.

**Trade-offs.**

- Users who _do_ care about tags/dates every time (Persona E, Meera for business) have to scroll or tap "Add detail". Business mode compensates by showing tag chips inline in the amount region.
- Category pre-selection can be wrong; users must always be able to change it in one tap.

**Future Considerations.**

- Amount pad currency-aware "smart suggestions" (recent amounts as chips) — measure lift before shipping.
- Split-expense mode may re-order to "amount → participants → category".

---

### UX-4.2 · Optimistic writes with a soft-delete undo window

**Decision.** Saving an expense **immediately** updates the dashboard, KPI cards, and category totals — before the network write succeeds. Deleting shows a 10-second toast with "Undo" and only physically deletes after the window closes.

**Reason.** Optimism matches the offline-first commitment (G4 in [PROJECT_MASTER_PLAN.md §3](PROJECT_MASTER_PLAN.md)) — the client is the source of truth for the current session, and the sync engine reconciles later. Latency for the user is zero. Undo makes destruction reversible, which is the "reversible by default" principle ([AI_CONTEXT.md §5](AI_CONTEXT.md)) applied to the delete gesture.

**Alternatives Considered.**

- _Pessimistic writes_ (wait for server 200 before updating UI). Rejected: violates offline-first and adds a spinner where none is needed.
- _Confirm-before-delete dialog_ for every expense. Rejected: fatigue; users start clicking OK reflexively.
- _Trash bin / archive_ (30-day retention). Deferred: adds a surface (recycle bin) that most users won't use. May be revisited for business ledgers where audit matters.

**Trade-offs.**

- Optimistic writes require idempotent mutations and a conflict resolution strategy for the money field — tracked as TD-3 in [PROJECT_MASTER_PLAN.md §11](PROJECT_MASTER_PLAN.md).
- The 10-second undo window means a delete followed immediately by a workspace switch could race the physical delete. Mitigated by flushing pending deletes on workspace change.

**Future Considerations.**

- Extend the undo pattern to "undo import" and "undo bulk-delete" for symmetry.
- Optional user setting for a longer undo window (up to 60 s) for cautious users.

---

### UX-4.3 · Recurring expenses are auto-detected, not manually declared

**Decision.** After a user logs three occurrences of a similar expense (same category, same-ish amount, roughly the same day-of-month), the app surfaces a quiet suggestion: _"Looks like this repeats monthly — mark as recurring?"_ The user opts in with one tap.

**Reason.** Recurring management is one of the most-abandoned features in manual-entry PFMs ([NN/g PFM audits](https://www.nngroup.com/articles/personal-finance-apps/)) because it requires the user to _predict_ which entries will repeat before they've seen them repeat. Auto-detection turns a prediction problem into a confirmation problem, which is dramatically lighter cognitive load.

**Alternatives Considered.**

- _Force recurring flag at entry time_. Rejected: prediction burden, low accuracy, adds a field.
- _Fully automatic (no confirmation)_. Rejected: silently converting one-time expenses into recurring risks bad forecasts and violates the "reversible by default" principle without a user in the loop.
- _End-of-month bulk review_. Rejected: recurring items should benefit _this_ month's forecast.

**Trade-offs.**

- False positives (three coincidences that aren't a pattern) are annoying. Mitigated by strict thresholds and one-tap dismissal that suppresses the suggestion for that expense signature.
- Users who understand "recurring" and want to declare it up-front have to enter three occurrences first, or use Settings → Recurring.

**Future Considerations.**

- Weekly / bi-weekly / quarterly / annual detection with different confidence thresholds.
- On-device ML for merchant-string similarity (Horizon 4) to improve match precision.

---

### UX-4.4 · Auto-categorization rules are user-authored, not black-box

**Decision.** Auto-categorization is powered by explicit rules the user creates in `AutoRulesManager` (conditions: remark contains, amount threshold, day-of-month, recurring flag; actions: set category, add tag, flag). No hidden ML classifier runs behind the user's back.

**Reason.** Privacy-conscious users (Persona D, Wale) and Fintech Principles ([AI_CONTEXT.md §7](AI_CONTEXT.md)) reject opaque data behavior. A rule engine is inspectable, exportable, and shareable — the user can understand _why_ an expense was categorized and can fix it deterministically. A black-box classifier would drift, would need retraining, and would create a "why did it do that?" support surface.

**Alternatives Considered.**

- _Cloud ML classifier_ (bank-app default). Rejected: requires sending remarks server-side; violates privacy commitment.
- _On-device ML classifier_. Deferred to Horizon 4 (AI-native) with strict opt-in.
- _No auto-categorization at all_. Rejected: manual re-entry of "Uber → Transport" every week is exactly the "data-entry punishment" the product exists to eliminate.

**Trade-offs.**

- Users must configure rules to benefit; the first-run experience currently ships with sensible defaults, but power comes only with investment.
- Rule syntax is a small learning curve. Mitigated by a natural-language rule editor.

**Future Considerations.**

- Rules marketplace ([PROJECT_MASTER_PLAN.md §17](PROJECT_MASTER_PLAN.md)) so users can share rule packs without data leaving the workspace.
- Hybrid: on-device ML suggests a rule; user reviews and accepts. Preserves inspectability.

---

## 5. Data Visualization

### UX-5.1 · Charts are quiet: minimal chrome, no legends unless needed, no gridlines except horizontal

**Decision.** Charts render with:

- Transparent background (inherits the card),
- Horizontal gridlines only at 0.4 opacity,
- No axis boxes, no tick marks,
- Legends only when > 1 series,
- Currency-aware axis labels in `--font-numeric`.

**Reason.** The design system's editorial commitment ([DESIGN_SYSTEM.md §0](DESIGN_SYSTEM.md)) means every pixel earns its place. Traditional chart chrome (boxed axes, tick marks, dark gridlines, always-on legends) was invented for print, where you couldn't hover for a tooltip. On a screen, the tooltip carries precise values; the chart carries shape. Reducing chrome makes the shape louder.

**Alternatives Considered.**

- _Full chart chrome_ (like most PFM apps). Rejected: competes visually with the amounts.
- _No axes at all_. Rejected: users need a scale reference.
- _Colored gridlines_. Rejected: color is reserved for meaning (series, status).

**Trade-offs.**

- Users habituated to bank-app charts may find ExpenStream charts "sparse". Acceptable — the sparse-ness _is_ the brand.
- Print-friendly export needs to add chrome back explicitly.

**Future Considerations.**

- Data-density modes (compact vs comfortable) for the analytics page.
- Print / PDF export style with visible axes and printed legends.

---

### UX-5.2 · Every chart has a text alternative (data table or `aria-describedby` summary)

**Decision.** Every chart on every page ships with either a sibling `<table>` (visible via a "View as table" toggle) or an `aria-describedby` summary sentence ("30-day rolling average, currently ₹1,240, up 4% from last month"). Arrow keys navigate data points; Enter opens the tooltip.

**Reason.** WCAG 2.2 AA (baseline in [AI_CONTEXT.md §12](AI_CONTEXT.md)) forbids information delivered by color/shape alone. Screen-reader users, users with cognitive load, and users on print need the same insight sighted users get. A text alternative is not a compromise for accessibility users — it's often the _fastest_ way to answer "what's the exact number?".

**Alternatives Considered.**

- _`alt` text on a chart image_. Rejected: charts are SVG + interactive, not images, and static alt cannot capture the dynamic tooltip content.
- _Screen-reader-only summary, no visible table_. Considered acceptable for simple charts; the visible-table toggle is required for merchant/category breakdowns where the table is a valid primary view.

**Trade-offs.**

- Every new chart component costs additional work (table rendering + keyboard nav). Mitigated by a shared `<ChartAccessibilityLayer>` component.
- Table view for large series (52-week YoY) is long; scrolling is preferred over pagination for screen-reader continuity.

**Future Considerations.**

- Auto-generated summaries for anomaly callouts ("Groceries drifted 3 weeks in a row, currently 18% above baseline").
- Voice-read summary on demand (long-press a chart).

---

### UX-5.3 · No animation on chart re-renders after first paint

**Decision.** Chart series animate on first paint (line draw-in over `duration.slow`, `ease.out`; bars grow from baseline with `spring.gentle` + `stagger.tight`). On filter changes, theme changes, or workspace switches, charts render the final state **instantly**.

**Reason.** Motion is meaning ([DESIGN_SYSTEM.md §19.1](DESIGN_SYSTEM.md)). First paint animation confirms "the data has arrived and this is its shape". A re-animation on every filter tweak would confirm nothing new and would delay the user's ability to compare — which is the entire point of a filter change.

**Alternatives Considered.**

- _Always animate transitions between states_. Rejected: fun the first time, jarring the tenth. Kills the calm.
- _Never animate, even on first paint_. Rejected: loses the "the data arrived" signal.

**Trade-offs.**

- Screenshots taken during first paint may capture mid-animation state. Mitigated by ensuring the resting state is meaningful even if truncated.

**Future Considerations.**

- Time-machine playback (Horizon 2) is the one place chart re-animation is meaningful — it's telling a story, not confirming a state.

---

## 6. Motion & Feedback

### UX-6.1 · Animations exist to confirm state changes, never to decorate

**Decision.** Every animation in the app answers "what just happened?" — sheet enters from below (new context), toast slides in from top (system message), FAB scales down on press (tap confirmation), page background tints when budget health changes (state signal). No looping decoration, no idle spinners on cards, no ambient hover shimmers.

**Reason.** ExpenStream is a _financial_ surface. Decorative motion competes with the user's ability to read numbers, and prolonged motion around money signals unseriousness — the exact wrong tone. The "quiet, precise, respectful" personality ([AI_CONTEXT.md §4](AI_CONTEXT.md)) requires motion to be a language of state, not decoration.

**Alternatives Considered.**

- _Ambient background motion_ (subtle particle fields, gradient shimmers). Rejected: introduces GPU cost and violates the "no parallax on money" rule.
- _Full-page transitions between routes_. Kept minimal — cross-fade only, no slide, to avoid disorienting mid-task users.

**Trade-offs.**

- The app can feel "static" compared to competitors that use heavy motion for perceived polish. This is a deliberate positioning choice.
- Requires design discipline in code review — motion PRs must justify their state-change payload.

**Future Considerations.**

- Signature "narrative" moments (payday celebration, goal reached) may earn a single, opt-in celebration animation. Currently limited to a subtle numeric roll-up, not confetti.

---

### UX-6.2 · Motion tokens are the only source of durations, easings, and springs

**Decision.** All motion values are imported from `src/lib/motion/tokens.ts` (`duration`, `ease`, `spring`, `distance`, `scale`, `stagger`). Inline `duration: 0.3` or `easing: "easeOut"` in a Framer variant is a lint error.

**Reason.** Consistent motion vocabulary is what makes an app _feel_ like one product. If sheet enter is `spring.water` on the dashboard and `spring.default` on Settings, users perceive it — subconsciously — as two apps stitched together. Tokens enforce the vocabulary.

**Alternatives Considered.**

- _Component-local motion_. Rejected: guarantees drift.
- _Per-designer choice_. Rejected: same problem.

**Trade-offs.**

- Adding a new motion requires a token-update PR, which is more ceremony than an inline number.
- Some experimental animations end up shoehorned into an existing token that isn't quite right; the fix is to add a new token, not to inline.

**Future Considerations.**

- ESLint rule to forbid numeric literals in `transition={{ duration: ... }}` Framer props.
- Motion Storybook page cataloging every token with a live demo.

---

### UX-6.3 · `prefers-reduced-motion` is a designed variant, not a switch-off

**Decision.** Every Framer variant reads `useReducedMotion()` and returns a **cross-fade at `duration.fast`** instead of translate/scale motion. The state-change signal is preserved; the movement is replaced.

**Reason.** Reduced-motion users still need to know "the sheet opened". Removing all animation would leave them wondering whether their tap registered. WCAG 2.3.3 (Animation from Interactions) is met by preserving the signal in a non-vestibular form.

**Alternatives Considered.**

- _Disable all motion under `prefers-reduced-motion`_. Rejected: strips a meaningful state channel.
- _Provide an in-app "reduce motion" toggle_. Kept as a stretch goal but not primary — respecting the OS setting is the correct default.

**Trade-offs.**

- Every new animated component costs additional test coverage (a `motionVariants.test.ts` case).
- Cross-fade at `duration.fast` is still a small animation — some users may want zero. If we see feedback, we'll add a stricter "no motion" opt-in.

**Future Considerations.**

- A user-visible "Motion" setting with three levels: Full, Reduced (current default under `prefers-reduced-motion`), Off.

---

### UX-6.4 · The sync engine surfaces status through a quiet indicator, not a modal

**Decision.** Sync phase (idle / syncing / error) is exposed as a small indicator in the header/status area — a subtle icon and, when tapped, a compact sheet with "last synced N seconds ago" and manual "Retry". Errors and conflicts surface as toasts with clear action ("Review conflict").

**Reason.** Sync is infrastructure the user should never think about. When it works, silence. When it fails, an honest, one-tap-to-review signal. Modals here would be catastrophic UX — every network hiccup on a bus becomes a full-screen interruption.

**Alternatives Considered.**

- _No indicator, just work silently_. Rejected: when sync fails, users deserve to know before they trust the numbers.
- _Persistent banner when offline_. Rejected: creates constant visual noise for users on spotty connections (Persona D). Instead: a subtle "offline" dot in the header.

**Trade-offs.**

- A user who never notices the indicator may miss a conflict. Mitigated by promoting unresolved conflicts to a toast on next app open.
- The indicator adds header real estate.

**Future Considerations.**

- A dedicated Sync Health surface in Settings for power users who want the full log.
- Server-side observable of push delivery (TD-4 in [PROJECT_MASTER_PLAN.md §11](PROJECT_MASTER_PLAN.md)).

---

## 7. Personalization & Theming

### UX-7.1 · Dark, Light, and Sunset themes are peers — not variants

**Decision.** Three themes ship as first-class: **Light (chalk & parchment)**, **Dark (obsidian)**, and **Sunset (adaptive warm)**. Each has its own token values for surfaces, text, and accents. No theme is "the default with modifications" — they are equal.

**Reason.** Dark mode is not "night light" and light mode is not "regular mode". Users pick a theme based on device, time, environment, and personal comfort — a design that treats one as primary implicitly under-designs the others. Sunset exists because _time-of-day adaptation_ is a 2026 UI trend ([AI_CONTEXT.md §14](AI_CONTEXT.md)) that also serves users in low-blue-light hours.

**Alternatives Considered.**

- _Dark as an inverted-light color scheme_. Rejected: naive inversion produces muddy neutrals and washed-out accents.
- _System-theme only, no in-app override_. Rejected: users often want the app to differ from the system (dark app on a light OS, etc.).

**Trade-offs.**

- Three themes mean 3× token maintenance and 3× QA. Mitigated by tokens-as-law (UX-7.3) — surfaces are named semantically, so a new component gets three themes for free.
- Sunset's warm palette makes accents shift ways that must be QA'd against the accent color choice (UX-7.2).

**Future Considerations.**

- Auto-switch Sunset at user-local golden hour based on device time.
- High-contrast theme variant for low-vision users (currently satisfied by contrast tokens on all three themes).

---

### UX-7.2 · The accent color is user-owned and inherited, never hard-coded

**Decision.** The `--accent` token is user-configurable (subset of designer-approved hues) and drives FAB gradients, CTA buttons, focus rings, active tab indicators, and chart highlights. No component ever imports a specific hex.

**Reason.** Accent choice is one of the highest-signal personalization surfaces — it makes the app feel like _yours_ without requiring layout customization. Because components inherit, a single setting change re-themes the entire app instantly. Hard-coded accents would drift, break themes, and force per-component updates.

**Alternatives Considered.**

- _Fixed brand accent_ (like most fintechs). Rejected: personalization is a stickiness lever (retention KPI in [PROJECT_MASTER_PLAN.md §2.1](PROJECT_MASTER_PLAN.md)) at very low product cost.
- _Free-color-picker_. Rejected: users can pick unreadable combinations. We ship a curated palette with pre-verified contrast against each theme's surfaces.

**Trade-offs.**

- Accent choice must be validated against contrast requirements (UX-9.1) for every theme, so the picker only shows accents that pass. The curation is ongoing work.
- Custom accents complicate chart series color assignment (accent is one of the series slots).

**Future Considerations.**

- Per-workspace accent (business workspace on canopy, personal on clay).
- Time-of-day accent shift (aligned with Sunset theme).

---

### UX-7.3 · Design tokens are law — never hard-code color, spacing, radius, or motion

**Decision.** Feature code uses only tokens (`--space-*`, `--text-*`, `--radius-*`, `--accent`, `--surface-*`, motion tokens). Inline hex codes, pixel values off the scale, or numeric durations in variants are ESLint errors or contract-test failures.

**Reason.** Tokens are the enforcement mechanism for every other design commitment — theming, accessibility contrast, motion vocabulary, spacing rhythm. A single hard-coded color in a feature component defeats accent inheritance, dark theme adaptation, and design cohesion across the app.

**Alternatives Considered.**

- _Trust designers and engineers to eyeball values_. Rejected empirically — every codebase without tokens drifts within weeks.
- _Utility CSS with fixed values (Tailwind defaults only)_. Rejected: Tailwind is fine as a shorthand, but its color and spacing scales are not our design language. We map Tailwind arbitrary values to our tokens.

**Trade-offs.**

- Onboarding new engineers requires token-language literacy.
- Some design experiments are slower because you have to add a token before you can use a value.

**Future Considerations.**

- Automated token-drift detection in CI (compare `globals.css` values to the token snapshot).
- Design-tool integration (Figma variables that mirror the tokens 1:1).

---

### UX-7.4 · Personal ↔ Business mode is a workspace-scoped toggle, not a separate app

**Decision.** A single app-mode switch (Settings → Appearance, or in the in-app switcher) flips the workspace between Personal (warm palette, expense-first UI) and Business (cool palette, collections-first UI). Data model is shared; surface and IA differ.

**Reason.** Persona E (Meera) and Persona B (Marco) run both a personal life and a small business. Two apps mean two logins, two devices to link, two backup pipelines — friction that pushes them back to WhatsApp screenshots. One app with a mode toggle collapses that to a two-tap switch.

**Alternatives Considered.**

- _Separate app for business_. Rejected: doubles code, doubles ops, doubles user friction.
- _Mode inferred from data_ (auto-detect based on ledger presence). Rejected: too magical; user wants control.
- _Business as a "workspace type"_ (per-workspace, not global). Currently the design — the toggle changes the workspace mode, not a device-wide setting. This means Priya's personal workspace and Meera's business workspace can co-exist on the same device.

**Trade-offs.**

- Some UI surfaces have two variants to maintain (KPI cards especially — personal shows spend, business shows collections).
- Users can be confused by mode-switching mid-session; clear header labeling and mode-tinted surfaces mitigate.

**Future Considerations.**

- Split-mode dashboard for users who want both at once on tablets.
- Business mode extensions: multi-account ledgers, tax tagging, invoice PDF export.

---

## 8. Trust, Privacy & Security posture

### UX-8.1 · No bank linking, ever — surfaced as a visible product promise

**Decision.** The app never connects to bank APIs, aggregators, or credit-card feeds. The absence is not hidden — it is **surfaced** as a design element: a Privacy card in Settings shows "No bank connections", "No third-party analytics on your money", and the workspace encryption status.

**Reason.** Persona D (Wale) and a growing global cohort actively reject bank scraping. Competitors (Mint, Wallet) treat privacy as compliance fine print; ExpenStream treats it as a differentiator. Making the _absence_ of a feature visible is unusual, but it is how you earn a trust-buying segment.

**Alternatives Considered.**

- _Bank linking as an opt-in feature_. Rejected: even opt-in bank linking normalizes the data flow, and supporting it means storing bank credentials or refresh tokens — a security surface we refuse.
- _Silent privacy_ (do the right thing but don't advertise). Rejected: trust is a stated contract, not an assumption.

**Trade-offs.**

- Loses the "automatic import" competitive lane. Accepted — that lane is dominated by well-funded incumbents, and our position is orthogonal.
- Manual entry is friction; every other UX decision on this page is partly a compensation for that friction.

**Future Considerations.**

- OCR receipt capture as a _non-bank_ auto-entry path (privacy-preserving because it stays on device).
- Import from CSV / OFX / bank statement PDF — user-initiated, one-shot, no persistent connection.

---

### UX-8.2 · Money is never truncated silently; currency is always locale-correct

**Decision.** Any monetary value that overflows its container **wraps to a smaller size or wraps to a new line**, never truncates with ellipsis. Currency symbol, grouping separators, and decimal separators always match the user's locale.

**Reason.** A truncated amount is a lie: "₹1,20…" could be ₹1,200 or ₹1,200,000. Trust KPI (north star: "trusts the answer") requires that every number the user sees is complete and unambiguous. Locale correctness ("₹1,20,000" for Indian grouping, "€1.200,00" for European) is table-stakes for the target geographies.

**Alternatives Considered.**

- _Truncate with tooltip_. Rejected: tooltips are unreliable on touch and invisible to screen readers.
- _Always render in short form_ ("₹1.2L"). Rejected for detail views; kept only for hero labels where the exact number lives elsewhere on the same screen.

**Trade-offs.**

- Layouts have to accommodate variable-width numerics — tabular figures (DM Mono) help, but very large amounts on narrow phones still force wrap.
- Locale handling is complex and must be tested per target geography.

**Future Considerations.**

- Per-workspace primary currency plus a display-only conversion for multi-currency views (already partially shipped).
- Optional short-form toggle for hero (₹1.2L / $1.2M) with the long form still available via long-press.

---

### UX-8.3 · Privacy badges appear as design elements, not fine print

**Decision.** Trust signals — "End-to-end encrypted", "No analytics on your money", "No bank connections", "Your data, your export" — appear as **pill-shaped chips with icons** in relevant surfaces (Settings, onboarding, export flow), styled with the design system's badge tokens, not as footer legalese.

**Reason.** Fine print is invisible. A user scanning Settings must be able to _see_ the trust properties in a few seconds. Treating privacy as a visible design element also makes it hard to accidentally regress — the badge would either be there or missing.

**Alternatives Considered.**

- _Privacy policy link only_. Rejected: nobody reads it.
- _Marketing splash_. Rejected: aggressive; erodes the calm.

**Trade-offs.**

- Badges must be truthful and current — a regression that adds analytics without removing the badge would be a trust violation. Enforced by cross-checking with the audit test suite.

**Future Considerations.**

- Verification links on badges — tap "No bank connections" to see the actual permissions the PWA has requested.

---

## 9. Accessibility

### UX-9.1 · WCAG 2.2 AA is the floor, AAA is the target for hero text

**Decision.** Body text meets **≥ 4.5:1** contrast; hero amounts and headings meet **≥ 7:1**. Every color pairing is verified via automated contrast tests in `accessibilityContracts.test.ts`.

**Reason.** Numbers on a fintech surface are the highest-stakes text the user reads. Under-contrasted hero amounts (a common editorial-design mistake) cause misreads that undermine trust and are unreadable in bright sunlight — exactly when a mobile user checks their budget.

**Alternatives Considered.**

- _Meet AA everywhere, ignore AAA_. Rejected: AA on a serif hero at 44 px in dim ambient light is fine; on a bus in sunlight it's a struggle.
- _Rely on OS-level accessibility magnifier_. Rejected: it's a poor fallback for a design failure.

**Trade-offs.**

- Constrains accent choices — some warm hues on a warm surface fail AAA and must be adjusted.
- Testing every combination is expensive; automated contract tests carry that load.

**Future Considerations.**

- User-facing "large text" mode independent of OS setting.
- Ambient-light-aware theme tinting via `light-level` media query when browsers support it.

---

### UX-9.2 · Color is never the sole channel — always paired with icon, label, or shape

**Decision.** Status pills combine color + icon + label ("⚠ Approaching monthly budget", not just a yellow pill). Positive/negative deltas combine color + arrow glyph. Chart series combine color + shape/pattern in the legend.

**Reason.** Approximately 8% of male users have some form of color-vision deficiency. Color-only status is invisible to them, invisible in high-glare situations, and invisible in print. Adding an icon or label costs almost nothing and pays back permanently.

**Alternatives Considered.**

- _Color-only status pills_. Rejected — a11y regression.
- _Text-only status_. Considered acceptable when scanning speed doesn't matter; icon pairing is preferred where it does.

**Trade-offs.**

- More visual elements per status pill — mitigated by generous surface padding and consistent icon sizing.

**Future Considerations.**

- Pattern-based chart series (dashed, dotted, hatched) for print export.

---

### UX-9.3 · Every interactive element has a 44 × 44 px tap target and a visible focus ring

**Decision.** No interactive element is smaller than 44 × 44 px including padding. Focus-visible rings use `--border-focus` (2 px) plus a `--focus-ring` glow (4 px). `outline: none` is banned without a replacement.

**Reason.** 44 px is the Apple HIG standard and matches Android accessibility guidance — it's the smallest reliable thumb target. Focus rings are the keyboard user's cursor; removing them makes the app un-navigable by keyboard.

**Alternatives Considered.**

- _32 px targets to fit denser layouts_. Rejected — increases mistap rate, especially for older users and users on the move.
- _Focus rings on `:focus` not `:focus-visible`_. Rejected — mouse users don't need rings on every click, but keyboard users must have them.

**Trade-offs.**

- Dense list rows must still meet the target — solved by making the entire row tappable, not just the inline button.

**Future Considerations.**

- 48 × 48 for critical CTAs (currently primary buttons at `lg` size).
- Windows High Contrast mode audit for focus-ring visibility.

---

### UX-9.4 · Modals autofocus the safe action; destructive actions require deliberate keyboard traversal

**Decision.** In a delete-confirmation dialog, `Cancel` receives focus on open. `Delete` requires a Tab. Escape closes; Enter confirms the safe path only.

**Reason.** Fast-clickers or fast-Enterers who dismiss a dialog reflexively must land on the non-destructive path. Delete requires an explicit act (Tab → Enter, or a click) — the extra keystroke is the friction that stops a mistake.

**Alternatives Considered.**

- _Autofocus destructive action_ (matches some OS conventions). Rejected — the cost of a mistaken delete is much higher than the cost of one extra keystroke.
- _Type-to-confirm_ ("type DELETE"). Reserved for workspace wipe and account deletion — extreme actions only.

**Trade-offs.**

- Users who _want_ to delete have one extra keystroke. Accepted.

**Future Considerations.**

- "Slow confirm" (hold-to-confirm) for money-editing destructive actions on touch devices.

---

## 10. Offline, Sync & Continuity

### UX-10.1 · Every action works offline; sync is invisible when it succeeds

**Decision.** All mutations (add, edit, delete expense; edit budget; add ledger; record payment) work with no network. They are enqueued in an IndexedDB mutation queue and drain on reconnect. The UI never shows a spinner waiting for the network.

**Reason.** Persona D (spotty 3G) and Persona A (subway commute) cannot afford an app that only works online. Offline-first is a north-star principle ([AI_CONTEXT.md §5](AI_CONTEXT.md), G4 in the master plan). When sync works, silence is the correct feedback — the user has no reason to know or care.

**Alternatives Considered.**

- _Online-first with offline queue as fallback_. Rejected: this is what most PFMs do, and it produces different behavior online vs offline, which trains users to distrust the offline case.
- _Show sync spinner on every mutation_. Rejected: creates the illusion the network is a requirement.

**Trade-offs.**

- Every mutation must be **idempotent** (server-side) — significant engineering discipline, enforced by DoD in [PROJECT_MASTER_PLAN.md §16.1](PROJECT_MASTER_PLAN.md).
- Conflict resolution is complex when two devices edit the same expense offline — tracked as TD-3.

**Future Considerations.**

- Deterministic per-field last-writer-wins with a user-facing conflict review sheet for money fields (Sprint 2, [PROJECT_MASTER_PLAN.md §15](PROJECT_MASTER_PLAN.md)).
- Server-side dead-letter queue for mutations that fail repeatedly.

---

### UX-10.2 · Sync errors surface as a toast with clear recovery, never a modal

**Decision.** When sync fails, a toast (`role="status"`) appears with the failure summary and a "Retry" or "Review" action. Modals are never used for sync errors.

**Reason.** Sync failures are transient — most resolve on the next successful heartbeat. Modals interrupt the user's task; toasts inform without blocking. The user should be able to keep working (adding more expenses to the offline queue) while a sync failure sits at the top of the screen.

**Alternatives Considered.**

- _Blocking dialog on sync failure_. Rejected: hostile UX; the user is already offline and blocking them further compounds it.
- _Silent failure_. Rejected: trust requires honesty when things go wrong.

**Trade-offs.**

- Toasts auto-dismiss; a user who missed one may not know sync failed. Mitigated by the persistent sync-status icon (UX-6.4).

**Future Considerations.**

- Rich conflict-resolution sheets for money-field conflicts.
- A "sync health" section in Settings with the last N sync attempts.

---

### UX-10.3 · Multi-device linking is a two-tap flow, not a data migration

**Decision.** Linking a new device is: **(1) on device A → generate 10-minute token URL; (2) on device B → open URL, sign in, done.** Delta sync brings the new device to parity in the background. No CSV import, no QR-code scanning required (though QR is offered), no "restore from backup" step.

**Reason.** Persona C (shared household) and Persona A (phone upgrade) need continuity. Every extra step in the switch flow loses users to "I'll do it later" that becomes "never".

**Alternatives Considered.**

- _Cloud sign-in with automatic device pickup_. This is essentially what happens after linking; the token step exists because we require an out-of-band confirmation from an already-trusted device (security posture).
- _QR-only linking_. Kept as an option, not the default — sharing a link works over any messaging channel.

**Trade-offs.**

- Requires the user to have access to the original device (breaking the "lost my phone" case). Recovery via email/2FA/passkey handles that.
- Time-bound tokens can expire mid-flow — the URL surfaces its expiry.

**Future Considerations.**

- Passkey-based device link (no token URL needed once passkeys are on both devices).
- Cross-account link revocation from any linked device (already available).

---

## 11. Copy, Tone & Notifications

### UX-11.1 · Copy is human, calm, and never gamified

**Decision.** Product copy uses short declarative sentences: "You're on track.", "Rent is due Friday.", "This looks unusual — worth a check?". Never streaks, never guilt ("You're behind!"), never fake urgency ("Act now!"), never emoji clusters.

**Reason.** The product personality ([AI_CONTEXT.md §4](AI_CONTEXT.md)) is a skilled accountant, not a coach or a marketer. Gamified copy patronizes users about their money — a domain that already carries emotional weight. Calm copy is a differentiator against Mint-era "You spent $X on coffee this week!" nudges.

**Alternatives Considered.**

- _Achievement / streak system_. Explicitly rejected — trivializes money.
- _Personalized AI-generated copy_. Deferred; would need extreme quality control to preserve tone.

**Trade-offs.**

- Copy tone is subjective and requires review discipline.
- Some users may find the tone "flat" — better than the alternative.

**Future Considerations.**

- Localization must preserve the tone in every language, not just translate literally.

---

### UX-11.2 · Notifications default to quiet; digest and reminders are opt-in per channel

**Decision.** No push notifications are sent by default. On first run, the user is invited to enable an evening reminder and/or weekly digest. Each channel (reminders, digest, milestone alerts, business overdue) is independently toggleable. Quiet-hours are honored.

**Reason.** Persona D (privacy-conscious) explicitly rejects notification-noisy apps. Persona A (calm-seeking) values silence between check-ins. The signal-to-noise ratio in the notification channel is the ratio the user carries in their pocket — burning it once loses trust permanently.

**Alternatives Considered.**

- _Default-on notifications_. Rejected — trains users to disable them wholesale.
- _One master toggle_. Rejected — users want to keep reminders but drop the weekly digest, or vice versa.

**Trade-offs.**

- Lower notification-permission grant rate than aggressive apps. Accepted; those grants are more meaningful when they happen.

**Future Considerations.**

- Server-scheduled reminders with retries (M3 in [PROJECT_MASTER_PLAN.md §14](PROJECT_MASTER_PLAN.md)).
- Smart quiet-hours inferred from user routine (opt-in).

---

### UX-11.3 · Empty states are illustrated and instructive, not scolding

**Decision.** Every empty state (no expenses, no ledgers, no goals) shows a calm illustration or icon, a one-line explanation of the surface, and a single primary CTA to populate it. Never "You have nothing here" without a next step.

**Reason.** Empty states are onboarding surfaces in disguise. A user reaching an empty screen without guidance leaves. A user reaching an empty screen with a warm illustration and a clear CTA converts.

**Alternatives Considered.**

- _No empty state (show data placeholders)_. Rejected — fake data confuses.
- _Marketing-style empty states_ ("Get pro to unlock…"). Rejected — the product has no such upsells.

**Trade-offs.**

- Every new list-bearing surface must ship an empty state. Enforced by the "five states" rule ([PROJECT_MASTER_PLAN.md §10](PROJECT_MASTER_PLAN.md)).

**Future Considerations.**

- Contextual first-run tips that appear inside empty states based on the user's stated intent from onboarding.

---

## Appendix — How to add a UX decision

1. Add a new entry under the appropriate section, numbered `UX-<section>.<n>`.
2. Fill all five fields: Decision, Reason, Alternatives Considered, Trade-offs, Future Considerations.
3. Cross-link to the specific principle, KPI, or component that motivates the decision.
4. If a new decision supersedes an old one, keep the old entry and add `**Superseded by UX-x.y**` at the top of it, plus `**Supersedes UX-a.b**` at the top of the new one.
5. Bump the version and Last reviewed date.

## Appendix — Cross-references

- Product mission, personality, principles: [AI_CONTEXT.md](AI_CONTEXT.md).
- Personas, journeys, KPIs, priorities: [PROJECT_MASTER_PLAN.md](PROJECT_MASTER_PLAN.md).
- Tokens, components, contracts: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- Architecture and boundaries: [ARCHITECTURE.md](ARCHITECTURE.md).
- QA gates: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md).


---

**Last reviewed:** 2026-07-23
