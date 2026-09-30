<!--
  FINANCIAL_PSYCHOLOGY.md — Money-bias catalogue + guardrails
  Owner: Product + Design + AI Engineering
  Audience: Designers, product managers, engineers, copywriters, QA, AI agents.
  Companion docs: PRODUCT_PRINCIPLES.md (§7.6 financial-psychology guardrails),
                  EXPERIENCE_VISION.md (§5 anti-patterns we refuse),
                  SCREEN_GUIDELINES.md (per-screen guardrail application),
                  UX_DECISIONS.md, DESIGN_SYSTEM.md, IMPLEMENTATION_RULES.md.
  Rule: This document exists so ExpenStream designs *against* money-related
        cognitive biases, not with them. It is not a behavioural-nudging
        playbook. Every entry lists an anti-pattern we refuse to ship.
  Priority: Sits in "remaining documentation" in the conflict-resolution order.
        Never overrides IMPLEMENTATION_RULES / DESIGN_SYSTEM / UX_DECISIONS /
        PROJECT_MASTER_PLAN. If a bias-guardrail here would break an
        engineering contract, the contract wins and this doc is amended.
-->

# ExpenStream — Financial Psychology

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-24 · **Family:** Product Experience

> **Non-goal.** This document exists so we design _against_ these biases, not with them. If a proposal cites this document to justify a nudge, the proposal is misreading it. The playbook here is _refusal_, not _exploitation_.

Personal finance is a domain saturated with cognitive biases — anchoring, loss aversion, present bias, financial shame, notification-driven anxiety, mental accounting, envelope framing. Most competing products _exploit_ these biases to drive engagement metrics that look good in a board deck. ExpenStream designs against them. This document is the operational catalogue.

---

## 0. Meta — Why this document exists

### 0.1 Why the feature exists

Because [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) forbids dark patterns as a rule but does not enumerate _which_ patterns. Without an enumeration, an AI agent (or a well-meaning engineer) reaching for a "small nudge" has no reference to consult and no vocabulary to refuse. That gap is the single biggest risk to the "premium, calm, honest" positioning.

### 0.2 What problem it solves

The gap between "we do not do dark patterns" (posture) and "here are the specific biases, here is where they show up, here is what we refuse" (working knowledge). This is an instruction manual, not doctrine — doctrine lives in `PRODUCT_PRINCIPLES §7.6`.

### 0.3 Business value

- **Brand integrity.** ExpenStream's premium positioning cannot survive a single shipped dark pattern. This document is the tripwire.
- **Regulatory tail-risk avoidance.** Loss-framed notifications, artificial scarcity, and gamified financial guilt are increasingly regulated (UK FCA, EU DSA, India RBI guidance). Designing against them is compliance-adjacent.
- **Trust compounding.** Users who realise the app is not manipulating them stay for years. Users who feel manipulated churn within weeks.

### 0.4 Product value

- Gives every feature scoping conversation a shared vocabulary for what we refuse.
- Turns "no dark patterns" into an operational review checklist.
- Anchors microcopy, notification, and animation choices to a psychological rationale.

### 0.5 User mindset

Users bring five money-related mindsets into a personal-finance app, and each is vulnerable to a different bias:

1. **The Anxious Checker** — "Am I okay?" Vulnerable to loss aversion, ambient anxiety.
2. **The Optimistic Planner** — "How do I hit my goal?" Vulnerable to present bias, anchoring.
3. **The Shame Avoider** — "Please don't judge me for what I spent." Vulnerable to financial shame, category framing.
4. **The Meticulous Tracker** — "Let me capture this before I forget." Vulnerable to mental accounting, envelope over-rigidity.
5. **The Household Coordinator** — "Where is our joint money?" Vulnerable to social comparison, guilt attribution.

Every guardrail below is engineered for at least one of these mindsets.

### 0.6 Emotional goal

**Users leave the app less anxious than they entered.** Where a bias would produce anxiety, shame, or manufactured urgency, we intercept it with a design guardrail that leaves the user _informed_ but _calm_.

---

## 1. Catalogue schema

Each entry below has five fields:

- **Bias** — the psychological pattern.
- **Where it appears in personal finance** — the surfaces where the bias typically activates.
- **How competitors typically exploit it** — the shipped patterns we refuse to imitate.
- **Our guardrail** — the ExpenStream design commitment.
- **Our anti-pattern (what we refuse to ship)** — the specific patterns any PR must not contain.

---

## 2. Anchoring

- **Bias.** People weigh the first number they see disproportionately when interpreting subsequent numbers. A "recommended budget" of ₹50,000 shifts the user's own budget upward even when it is arbitrary.
- **Where it appears in personal finance.** Suggested budgets, "average users your age spend X", default deposit amounts, target-savings widgets, category benchmarks.
- **How competitors typically exploit it.** Onboarding wizards that pre-fill spending targets sourced from opaque aggregate data. "People like you spend ₹Y on groceries" comparisons. Default premium-tier prices anchored high so a "sale" looks generous.
- **Our guardrail.** The only anchors we display are the ones the user set themselves — the budget they typed, the envelope they defined, the goal they created. Any suggestion during onboarding is labelled _suggestion_ and must be dismissible in one tap, and its arithmetic basis is exposed on tap.
- **Our anti-pattern (refused).** No "average user" framing. No pre-filled amounts in optional fields. No comparison to a cohort the user did not opt into. No pricing psychology anchoring (₹999 crossed out to make ₹499 look cheap).

---

## 3. Loss aversion

- **Bias.** Losses feel roughly twice as painful as equivalent gains. Framing a spend as a loss activates disproportionate anxiety and drives compulsive checking.
- **Where it appears in personal finance.** Overspend indicators, budget-exceeded push notifications, drop in net worth, negative delta arrows.
- **How competitors typically exploit it.** Red alerts on any negative delta. Push notifications that lead with the amount lost ("You spent ₹4,200 more than last month"). Weekly digests framed around what the user "lost" versus a comparison period.
- **Our guardrail.** Overspend is shown as a number and a small amber marker; never a red alert. Push notifications never lead with a monetary value. Weekly digests are framed as _observation_, not _judgement_ ("You spent ₹4,200 more than last month on groceries" ✗ / "Groceries were higher this month; tap to see the breakdown" is closer, but still opt-in and never on the lock screen).
- **Our anti-pattern (refused).** Red push notifications. Amounts on the lock screen. "You lost X" copy. Colour-coded net-worth arrows that are red for down and green for up without user opt-in.

---

## 4. Present bias (hyperbolic discounting)

- **Bias.** People value immediate rewards disproportionately over larger future rewards, and immediate costs disproportionately over larger future costs. Ticking countdowns exploit this ruthlessly.
- **Where it appears in personal finance.** Countdown timers to a goal, "24 hours left to save this rate" upsells, streak counters, artificial scarcity around premium tiers.
- **How competitors typically exploit it.** Ticking clocks on savings goals ("18 days left!"). Streaks that reset if the user skips a day. Limited-time premium discounts. "Don't lose your progress" framing on any pause.
- **Our guardrail.** No countdowns to user-defined goals; the goal is shown with progress and an honest date, no ticking urgency. No streaks of any kind. No time-limited discounts on export, features, or storage. The user's pace is the user's business.
- **Our anti-pattern (refused).** Streak counters. Countdown clocks. "Only N hours left" copy. Auto-scheduled reminders framed as "don't lose momentum".

---

## 5. Financial shame

- **Bias.** Spending on certain categories (eating out, entertainment, personal care) carries cultural shame. An app that visually judges those categories weaponises the shame.
- **Where it appears in personal finance.** Category icons and colours, budget-exceeded copy, weekly reflections, AI-generated commentary.
- **How competitors typically exploit it.** Frowny-face reactions on discretionary categories. Colour-coding "wasteful" categories orange or red. Weekly summaries that call out categories by name in a scolding tone. AI chat that says "You could save by eating in more."
- **Our guardrail.** No category carries a moral colour. Every category renders in the same visual weight. Microcopy never judges a spending decision. Weekly summaries are neutral: they name the number, not the choice.
- **Our anti-pattern (refused).** Frowny faces on any category. Category-specific "warning" colours. AI commentary that recommends behavioural change. Progress rings that fill "good" and drain "bad".

---

## 6. Notification-driven anxiety

- **Bias.** Push notifications create a background hum of anxiety even when the user does not open them. The ambient stress accumulates across the day.
- **Where it appears in personal finance.** Daily balance push, transaction confirmations, budget alerts, weekly summary push, offer push, competitor product push.
- **How competitors typically exploit it.** Multiple push events per day. Amounts in the notification body. "You have 3 unread alerts" badge that never fully clears. Notifications that require opening the app to dismiss.
- **Our guardrail.** Silence is a valid response. If nothing changed, we do not notify. If nothing is wrong, we do not alert. Every push category is opt-in per category, not blanket-opt-in. Amounts never appear in push bodies. Badges appear only when a _decision_ is required, and clear the moment the decision is made.
- **Our anti-pattern (refused).** More than one push per day per user by default. Amounts on the lock screen. Ever-present badge counts. Push that cannot be dismissed without opening the app.

---

## 7. Mental accounting

- **Bias.** People assign money to mental "buckets" and treat identical rupees differently depending on the bucket. This is sometimes useful (envelope budgeting) and sometimes harmful (a windfall spent frivolously because it "doesn't count").
- **Where it appears in personal finance.** Envelope budgeting, "windfall" bonuses, "fun money" categories, cashback treated as separate from income.
- **How competitors typically exploit it.** Encouraging users to spend "found money" freely via celebratory framing ("You got a bonus! Splurge here."). Locking users out of moving envelope allocations to punish "envelope hopping".
- **Our guardrail.** Envelopes and buckets are tools, not moral systems. The user may reallocate at any time with no penalty, no scolding, no "are you sure?" dialog. Cashback and windfall income appear alongside earned income with equal visual weight; no celebratory framing.
- **Our anti-pattern (refused).** Celebratory motion on windfall income. "You broke your envelope!" scolding copy. Penalties for reallocating an envelope. Read-only envelopes that lock funds against the user's will.

---

## 8. Envelope bias (over-rigid mental categorisation)

- **Bias.** A close cousin of mental accounting: users who over-categorise their money can become paralysed by category boundaries and miss the larger picture.
- **Where it appears in personal finance.** Deep category hierarchies, "must categorise every transaction" prompts, un-categorised counters shamed in red.
- **How competitors typically exploit it.** Forcing categorisation before a transaction can be saved. Displaying an "un-categorised" counter as a red badge that never clears. Aggressive AI categorisation that removes user control.
- **Our guardrail.** Categorisation is optional per transaction. Un-categorised transactions render normally, without warning colour. AI suggestions are opt-in, on-device, always overrideable, and never applied without user tap.
- **Our anti-pattern (refused).** Blocking save until a category is chosen. Red badges for un-categorised counts. Auto-categorisation without user opt-in.

---

## 9. Social comparison

- **Bias.** People measure their financial well-being against a perceived peer group. When apps surface peer comparisons, they replace the user's own goals with someone else's arbitrary average.
- **Where it appears in personal finance.** "People like you", "friends of X spent Y", household leaderboards, social feed of transactions, cohort benchmarks.
- **How competitors typically exploit it.** Publishing anonymised cohort spending. Ranking users against household members. Encouraging invite-a-friend by comparing balances or "green streaks".
- **Our guardrail.** No cohort comparisons anywhere. In household mode, spending is _attributed_ (who spent what) but never _ranked_ (no leaderboard, no colour scale). No social feed. No public profile.
- **Our anti-pattern (refused).** Leaderboards. Social feeds. Cohort benchmarks. "You are in the top X% of savers in your city" copy.

---

## 10. Sunk-cost / commitment escalation

- **Bias.** The more effort a user invests in a system, the harder it is to leave, even when leaving would be better for them. Vendor lock-in exploits sunk cost.
- **Where it appears in personal finance.** Export restrictions, proprietary formats, deletion friction, deep customisation that cannot be exported.
- **How competitors typically exploit it.** "Premium export" tiers. Requiring email verification to delete an account. Multi-step deletion with retention pitches at each step.
- **Our guardrail.** Exports are lossless and open (CSV + JSON, every field). Deletion is one tap plus one confirmation, and returns a signed receipt within 30 days as per [`PRODUCT_PRINCIPLES §6`](PRODUCT_PRINCIPLES.md). No "wait — reconsider" retention modal.
- **Our anti-pattern (refused).** Premium-tier export. Multi-step deletion. Retention pitches during deletion. Proprietary-only formats.

---

## 11. Endowment effect on data

- **Bias.** Users overvalue data they have entered themselves and undervalue data an app has captured on their behalf. This makes bank-scraping apps feel less "theirs".
- **Where it appears in personal finance.** Automatic transaction ingestion, bank feeds, automatic categorisation, AI-generated notes.
- **How competitors typically exploit it.** Positioning bank scraping as time-saving to obscure that the user no longer owns the truth of their ledger.
- **Our guardrail.** User-entered data is the primary ledger. Any future automatic ingestion is opt-in, user-initiated, and always shown as _suggested — please confirm_ until confirmed by a tap. No bank credentials are ever requested (see [`PRODUCT_PRINCIPLES §6`](PRODUCT_PRINCIPLES.md)).
- **Our anti-pattern (refused).** Silently importing transactions. Requesting bank passwords. Auto-confirming ingested transactions.

---

## 12. Manufactured scarcity / FOMO

- **Bias.** Users act more impulsively when they believe an opportunity is time-limited or exclusive.
- **Where it appears in personal finance.** Limited-time premium offers, "invite-only" tiers, seasonal discounts, expiring rewards.
- **How competitors typically exploit it.** Ticking-clock premium sales. "Only 100 slots left." Early-access waitlists that convert to paid.
- **Our guardrail.** All features are available on the same terms to everyone. No time-limited offers. No waitlists that manufacture demand. No "exclusive" tiers.
- **Our anti-pattern (refused).** Timers on any pricing surface. Waitlist-driven scarcity. "Founding member" tiers that create in-group psychology.

---

## 13. Category framing

- **Bias.** How a spend is _labelled_ changes how the user feels about it. Calling ride-share "transportation" and calling it "convenience spending" produce different emotions for the same amount.
- **Where it appears in personal finance.** Default category names, AI-generated category suggestions, hierarchical taxonomies.
- **How competitors typically exploit it.** Renaming user categories to more judgemental terms during "smart categorisation" upgrades. Grouping discretionary spending under "luxuries" or "wants".
- **Our guardrail.** Category names come from the user or from a neutral default (Food, Transport, Housing, Health, Personal). No moralising taxonomies (no "wants vs needs" imposed by the app). AI suggestions never rename existing categories.
- **Our anti-pattern (refused).** Auto-renaming user categories. "Wants" and "needs" as default categories. Category-as-moral-judgement.

---

## 14. Confirmation bias in trends

- **Bias.** Users see the trend they expect to see. A chart that presents ambiguous data with a strong visual slope reinforces whatever conclusion the user already believed.
- **Where it appears in personal finance.** Line charts of net worth, spending "trends", forecast projections.
- **How competitors typically exploit it.** Charts with truncated y-axes that exaggerate small changes. Forecast projections presented as facts. Colour-coding of "trend direction" without confidence intervals.
- **Our guardrail.** Y-axes on financial charts are honest (zero-anchored unless there is a documented reason otherwise). Forecasts are labelled _estimate_ and show the arithmetic basis on tap (see [`PRODUCT_PRINCIPLES §6.4`](PRODUCT_PRINCIPLES.md)). Trend arrows appear only when the delta exceeds a statistically meaningful threshold; otherwise the value renders neutral.
- **Our anti-pattern (refused).** Truncated y-axes. Forecast lines shown without a confidence range. Trend arrows on noise-level deltas.

---

## 15. Cross-cutting: the "would a thoughtful accountant" test

For any proposed nudge, notification, animation, or copy string, ask: **would a thoughtful accountant say this to a friend?**

- A thoughtful accountant would say: _"You're a bit over on groceries this month — here's the breakdown if you want to look."_
- A thoughtful accountant would not say: _"You BROKE your grocery budget! 🚨 Tap to fix it now!"_

If the proposed surface passes the accountant test, it may ship. If it does not, it is redesigned. This test is deliberately human, not statistical — it is a bias-detector, not a metrics-optimiser.

---

## 16. Loading Experience

Loading is a psychologically loaded moment in a finance app — the user is often waiting to learn whether they can afford something, whether a payment landed, or whether their sync worked.

- **Never leave the user staring at a spinner without context.** The skeleton or progress state names what is loading ("Refreshing your ledger…").
- **Never delay a truthful number.** Optimistic values render immediately; a "syncing" pill communicates that the number may adjust.
- **Never fake-load.** If the value is instantly available, show it instantly. Artificial delays to make the app feel "considered" are a dark pattern.

Full contract: [`EXPERIENCE_VISION.md §7`](EXPERIENCE_VISION.md) and [`DESIGN_SYSTEM.md §8`](DESIGN_SYSTEM.md).

---

## 17. Empty State

Empty states in a financial context are also emotionally loaded — the user is often looking at a "you have no savings yet" or "no income recorded" screen.

- **Neutral, not accusatory.** "Add your first expense" ✓ / "You haven't added anything yet — get started!" ✗
- **Suggest without anchoring.** An empty budget shows an _illustrative_ suggested budget with clear "example — tap to customise" framing; the number is not pre-selected or defaulted.
- **Never framed as a deficit.** An empty savings goal is not "₹0 of ₹100,000 — 100% remaining!". It is "Set a target when you're ready. Nothing to worry about."

---

## 18. Error State

Errors in a money app risk triggering catastrophic-thinking (_"is my money gone?"_).

- **Reassure specifically.** Every error involving money confirms that the local record is safe ("Your expense is saved on this device").
- **Never blame the user** for a network, server, or app failure.
- **Never hide a real financial error** behind cheerful copy. If a sync conflict changed a value the user typed, we show the conflict explicitly and let the user resolve it.

Full tone guidance: [`EXPERIENCE_VISION.md §9`](EXPERIENCE_VISION.md).

---

## 19. Offline Behaviour

Offline is a moment of vulnerability to loss aversion — the user fears their data was not saved.

- The offline indicator is _informational_ ("Offline — 3 changes will sync"), never _alarming_.
- Optimistic writes render immediately with a subtle "syncing" cue; they never disappear on reconnect (see [`ARCHITECTURE.md`](ARCHITECTURE.md) offline-first section).
- Conflict resolution shows both numbers side-by-side; the app never chooses silently.

---

## 20. Accessibility

The biases documented here disproportionately harm users who already carry cognitive load — users with anxiety disorders, ADHD, non-native language readers, low-vision users depending on screen readers.

- **Screen readers announce state changes calmly.** No live-region shouting.
- **Colour-only encoding is never load-bearing.** Overspend is amber _and_ labelled "over by ₹X" (a colour-blind user is not more vulnerable to a bias than a sighted user).
- **Reduced-motion users still get all the guardrails.** No guardrail depends on animation.
- **Language options** — copy is translated by humans who understand the tone requirements in §15 (thoughtful-accountant test). No auto-translated financial guilt.

---

## 21. Motion Expectations

Motion is a common vector for bias exploitation — a "shake" on error, a "pulse" on a budget alert, a "grow" animation when a balance rises.

- **Motion communicates state, never emotion.** A budget-exceeded state may animate the marker into place at 220 ms; it does not pulse, shake, or throb.
- **Never animate to celebrate a spend.** Money leaving the account is a neutral event, not a happy one.
- **Never animate to punish overspend.** No dramatic red fills, no bounce-scale on the amount.

Full timing budget: [`DESIGN_SYSTEM.md §8`](DESIGN_SYSTEM.md).

---

## 22. Information Hierarchy

Bias exploitation often works by promoting a manipulative element to the top of the visual hierarchy.

- **The user's own numbers are the hero.** Suggestions, comparisons, and AI outputs are always secondary in visual weight.
- **Anchors, if shown at all, are lower in the hierarchy** than the user's own values.
- **Any promotional or upsell surface** (should any exist) sits below primary content and is dismissible in one tap.

---

## 23. Interaction Philosophy

- **Undo over "are you sure".** Reversibility disarms loss aversion — the user does not fear the tap.
- **Preview before commit.** Setting changes show their consequence before they are final, so present bias cannot cause silent regret.
- **User pace is user's business.** No pacing pressure, no completion streaks, no time-locked features.

---

## 24. Design Rationale

Why enumerate the biases at all, when the principles already say "no dark patterns"?

- **Because "no dark patterns" is vague, and vagueness always loses to a specific KPI.** When a growth PM proposes a streak counter with data showing it increases retention 8%, the counter-argument is not "we don't do dark patterns"; it is "streak counters exploit present bias, and here is the anti-pattern entry that names it."
- **Because AI agents need a lookup table, not doctrine.** An agent asked "how do I nudge the user to open the app more often?" needs to see, in a document, that the correct answer is "we do not."
- **Because the biases evolve as the market invents new manipulations.** A living catalogue is the only way to keep up.

---

## 25. Future Evolution

- **Add entries as new biases and new competitor patterns emerge** — regulatory guidance (FCA, RBI, EU DSA) is a strong source signal.
- **Add on-device evidence hooks** — if the app ever computes local suggestions or anomaly explanations (M14), each one must be cross-referenced against the anti-patterns in this document before shipping.
- **Do not add entries for biases we intend to exploit** — if a proposal to weaponise a bias reaches this document, this document is not the right place to house it; the proposal is rejected upstream.
- **Coordinate with [`DESIGN_SYSTEM.md §22`](DESIGN_SYSTEM.md) evolution** — token or component changes that would affect how a bias is presented must reference the relevant entry here.

---

## 26. Common Implementation Mistakes

Twelve mistakes reviewers and AI agents should flag on sight:

1. **Streaks of any kind.** Refuse.
2. **Amounts in push notification bodies.**
3. **Red numeric badges as the default KPI state.**
4. **"Average user" or cohort comparisons** anywhere.
5. **Countdown timers on user-defined goals.**
6. **Frowny-face or thumbs-down icons on any category.**
7. **Auto-categorisation applied without user tap.**
8. **Weekly digest push that leads with a monetary loss.**
9. **Truncated y-axis on any financial chart.**
10. **Forecast projections rendered without a labelled confidence range.**
11. **Multi-step deletion flow that pitches retention.**
12. **Any copy string that would fail the thoughtful-accountant test in §15.**

Each of these is _individually_ enough to block a merge. Reviewers should not accumulate concerns before speaking up; one entry from this list is a full reason to redesign.

---

## 27. How to use this document

- **Product managers:** consult before scoping any feature that involves notifications, badges, streaks, categorisation, or copy. Cite the relevant entry in the feature brief.
- **Designers:** grade every screen against §16-§23 before design review. Any screen that violates a guardrail is redesigned, not amended.
- **Engineers:** the anti-pattern entries are effectively prohibitions. When implementing, if a spec seems to require one, treat the spec as buggy and escalate.
- **Copywriters:** §15 (thoughtful-accountant test) is the tuning fork. Every microcopy string must pass it.
- **AI agents:** load this doc immediately after [`EXPERIENCE_VISION.md`](EXPERIENCE_VISION.md). When asked to design an engagement mechanic, a retention nudge, or a notification, cross-reference every candidate against §2-§14 before proposing.

---

**Last reviewed:** 2026-07-24
