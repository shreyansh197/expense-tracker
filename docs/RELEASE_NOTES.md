<!--
  RELEASE_NOTES.md — User-facing release highlights for ExpenStream
  Owner: Product
  Audience: End users, stakeholders, support, "What's new" surfacing.
  Companion docs: CHANGELOG.md (technical), PROJECT_MASTER_PLAN.md.
  Voice: Calm editorial voice per AI_CONTEXT.md — never guilt-trip,
         never gamify, never surface monetary values. Every highlight is
         phrased around the user benefit, not the internal implementation.
-->

# ExpenStream — Release Notes

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-23

Release Notes are the human-readable, user-facing companion to the technical [CHANGELOG.md](CHANGELOG.md). Every shipped version has at least one highlight per user-visible feature.

---

## Upcoming — Horizon 1 (in progress)

Focus for the next few releases: reliability, accessibility contracts, sync correctness for money fields, notification polish, and security posture. See [SPRINT_BOARD.md](SPRINT_BOARD.md) for the sprint-by-sprint plan.

- Money-field conflict handling that never silently overwrites.
- Faster, more reliable Web Push reminders.
- Session anomaly awareness in Settings.

_No user-visible changes shipped in this section yet._

---

## Sprint 2.3 — Money conflicts, resolved by you (in progress)

When you edit the same amount on two devices while offline, ExpenStream will no longer quietly pick a winner. Instead, the next time your devices sync, a calm review sheet shows both values side by side — the one on this device and the one from the other device — and lets you choose which to keep. Nothing changes until you decide.

**What this means for you:**

- **No silent overwrites of money.** A conflicting amount is always surfaced for you to resolve, never guessed.
- **Clear, one-handed choices.** Keep this device's value or the other device's value — fully keyboard-accessible and respectful of reduced-motion settings.
- **Rock-solid math everywhere.** Totals, charts, forecasts, and exports now compute amounts with exact currency precision, so figures always add up to the last paisa.

---

## Sprint 1 — Documentation Truth (2026-07-23) · _internal-only_

Sprint 1 is an internal quality release. Nothing changed in the app itself. We refreshed every document under [`docs/`](.) so contributors and AI assistants can onboard without asking clarifying questions.

**What this means for you:** no change in behavior. If you're a returning contributor or a support engineer, the trail from feature → sprint → migration → test file is now walkable end-to-end.

---

## Sprint 0 — Master Audit (2026-07-22) · _internal-only_

A top-to-bottom audit of the codebase against the vision. See [`sprint-reports/SPRINT_0_SUMMARY.md`](../sprint-reports/SPRINT_0_SUMMARY.md) for details. Again, no in-app changes — this release built the runway for the Horizon 1 improvements above.

---

## 2026-06 — Premium overhaul (behind the scenes)

- **More reliable behavior under load.** We moved the request rate limiter from in-memory to the database so protection stays consistent across all servers, not just the one your session happened to hit.
- **Continued visual polish** across the dashboard, analytics, and business ledger — subtler shadows, calmer motion, tighter spacing.

---

## 2026-05 — Calmer defaults, safer data

- **Passkeys on iOS work more quietly.** We switched to Web Authentication Conditional UI, so the passkey prompt only appears when it's helpful — no more pop-up on every screen.
- **App unlock rethought.** Biometric unlock was refined and later removed (in favor of a lighter, native PIN flow), because a well-crafted PIN felt calmer and more predictable than an inconsistent biometric prompt across devices.
- **Smart nudges, capped at two per day.** Weekly digest, budget alerts, and gentle nudges arrive via server-scheduled push — never spammy, never guilt-tripping.
- **A stronger security posture.** Every table in our database now has row-level security applied, so a workspace can only ever see its own data.
- **Small everyday polish.** Today's Allowance hero on the dashboard, Quick Templates on the expenses page, animated numbers on totals, contextual help throughout, and a much smoother scroll on mobile after we fixed a subtle jank caused by the browser's address bar.

---

## 2026-04 — Living Terrain 2026 redesign

- **A new visual language.** The dashboard, analytics, and settings received a coherent redesign around a warm, calm palette and a consistent motion vocabulary. Charts are easier to read at a glance; character illustrations replace generic empty states.
- **New surfaces.** Spending Pulse card, Savings Goals widget, Monthly Postcard (shareable summary), Money Echo category chart, and a Spending Heatmap on the dashboard.
- **Voice-first capture.** Add expenses by speaking — useful when you're between meetings and can't type.
- **Achievements + accent colors.** Personal, opt-in personalization; no gamification pressure.
- **Web Push notifications.** Weekly digest, budget alerts, and quiet nudges — user-configurable and off by default until you turn them on.
- **Forgot password.** Password resets via a signed email link (transactional only; no marketing).
- **Category chip peek.** Long-press a category chip to preview it without committing to a change; release to restore.
- **Multi-currency friendly.** Expenses can now carry their own currency — useful for freelancers billing across regions.
- **Accessibility improvements.** Larger touch targets, keyboard support end-to-end, and reduced-motion respected everywhere motion is used.

---

## 2026-03 — Foundation

- **Track daily and recurring expenses**, set monthly budgets and savings goals, and see where the month is going without a spreadsheet.
- **Business ledgers** for freelancers and micro-businesses: customers, invoices, and payments in one calm surface.
- **End-of-month forecast with anomaly detection** — a gentle heads-up when spending drifts from your usual rhythm, based on a robust statistical measure (MAD).
- **Sign in your way.** Password, Google, or phone OTP.
- **Multi-device from day one.** Link a second device (phone ↔ browser) without re-typing anything sensitive; changes sync in the background even when you're offline.

---

## Breaking Changes

None to date.

---

## Known Issues

- Money-field conflict resolution is not yet deterministic when two devices edit the same expense amount within the same sync window. Tracked in [Sprint 2.3](IMPLEMENTATION_QUEUE.md#sprint-23).
- iOS PWA install education is not yet in-product. Tracked in [Sprint 12.1](IMPLEMENTATION_QUEUE.md#sprint-121).

---

**Editorial rules for this file** — carried forward from [AI_CONTEXT.md](AI_CONTEXT.md):

- No guilt-tripping copy. No gamified urgency.
- No monetary values in copy. Use ranges or plain-English descriptions instead.
- Every highlight is user-visible. Refactors and internal-only changes belong in [CHANGELOG.md](CHANGELOG.md).

**Last reviewed:** 2026-07-23
