<!--
  2026-audit.md — Accessibility audit of ExpenStream's top pages (M4 · T-4.2.2 / T-4.2.3)
  Owner: Accessibility + AI Engineering
  Audience: Engineers, QA, reviewers.
  Companion docs: ../CONTRACT_TESTS.md, ../DESIGN_SYSTEM.md §15.4 & §17,
                  ../SCREEN_GUIDELINES.md §15, ../UX_DECISIONS.md UX-9.x.
  Rule: Append re-audits as new dated sections; never delete a finding —
        move it to "Closed" with the fix reference.
-->

# Accessibility Audit — 2026 (M4)

**Status:** Complete · **Audited:** 2026-09-30 → 2026-10-01 · **Standard:** WCAG 2.2 AA (+ project DoD: 44 px targets, reduced motion, chart text alternatives) · **Open P0:** **0**

## 1. Scope and method

Pages: `/` (Home), `/analytics`, `/business` (+ `/business/[ledgerId]`), `/settings`, `/expenses`, plus shared shell/header components that appear on all of them (QuickHelpButton, ConfirmDialog, MonthSwitcher, AppShell).

| Pass | How | Result |
| --- | --- | --- |
| Automated — axe-core 4.10 | Rendered the new Analytics building blocks (header, hero, Month Ridge, Spending Velocity, Biggest This Month, Rolling Average, Category Velocity, Top Merchants, StickyReveal) with fixture data on a production build; ran WCAG 2.0/2.1/2.2 A+AA rules at 360 px and 1280 px, dark and light themes, with every data table both closed and open. | **0 violations**, 24 rule groups passing. |
| Automated — contract suite | `npm run contracts:check` (100 % of components) + `npm run test:contracts` — baseline contract (focus indicator, img alt, positive tabindex, reduced-motion JS loops, no raw HTML) on every component; SVG → `role="table"` rule across `src/components/`. | Green. |
| Manual — keyboard | Tab / Shift-Tab / Enter / Space / Escape through each page's interactive elements in source and in the rendered Analytics preview. | Findings below. |
| Manual — screen-reader semantics | Accessible name, role, state, and live-region review (labels ↔ inputs, `aria-expanded`, `aria-pressed`, announcements, landmark/heading structure); verified in the browser accessibility tree for Analytics. | Findings below. |
| Manual — reduced motion & responsive | `prefers-reduced-motion: reduce` emulated (transform removed, opacity kept, sticky rail height 0); 360 px layout checks (month arrows fully visible, no horizontal scroll). | Findings below. |

**Limitation.** Authenticated pages require a live account with synced data; axe was therefore run against fixture-driven renders of the Analytics components rather than every authenticated route. A full authenticated axe sweep is tracked as P1 **A11Y-P1-01**.

Severity: **P0** = WCAG A/AA failure or DoD blocker on a top page (fix in M4) · **P1** = degraded experience / AA risk (next a11y sprint) · **P2** = polish.

## 2. P0 findings — all closed

| ID | Page | Component | Finding | WCAG / DoD | Fix (M4) |
| --- | --- | --- | --- | --- | --- |
| A11Y-01 | all | App root | Framer Motion transforms ignored `prefers-reduced-motion`. | 2.3.3, DoD | `<MotionConfig reducedMotion="user">` in `providers.tsx`. |
| A11Y-02 | `/` | AnimatedNumber | Money counter animated regardless of reduced motion. | DoD | Settles in one frame under reduced motion. |
| A11Y-03 | `/` | Confetti | Canvas particles ran under reduced motion. | 2.3.3, DoD | Skipped entirely under reduced motion. |
| A11Y-04 | `/` | Compact money-spent bar | Mounted abruptly and inserted ~45 px into the flow, shifting the page while scrolling. | 2.3.3, CLS | `StickyReveal` — zero-height sticky rail + `stickyReveal` variant (cross-fade under reduced motion). |
| A11Y-05 | `/analytics`, `/business`, category page, `/` | 8 core charts + Month Ridge, Spending Velocity, Spending fingerprint | No text alternative. | 1.1.1, TD-6 | `DataTableView` toggle with polite announcement; SVGs `aria-hidden`. |
| A11Y-06 | `/analytics` | Header | 3M/6M/12M squeezed the month name/arrows off-screen at 360 px; period buttons ~24 px. | 1.4.10, 2.5.8, DoD 44 px | `AnalyticsHeader` stacks on `< md`; `AnalyticsPeriodSelector` 44 px toggle group. |
| A11Y-07 | `/analytics` | Deep Dive | Toggle had no `aria-expanded` / `aria-controls`; heading outside the button. | 4.1.2 | `AnalyticsDeepDive` — `<h2><button aria-expanded aria-controls>`. |
| A11Y-08 | `/analytics` | Insight cards | `div role="button"` focusable but not keyboard-activatable. | 2.1.1 | Row removed (UX-9.6); its link moved to a real `<Link>` in the ridge footer. |
| A11Y-09 | `/analytics` | TimeMachine | Category select and amount input not programmatically labelled; 12–20 px action targets. | 1.3.1, 4.1.2, DoD | `htmlFor`/`id` pairs; 44 px actions. |
| A11Y-10 | `/analytics` | Rolling Average | 30/60/90 control had no visible effect; no text alternative. | 4.1.2 (state not reflected), 1.1.1 | Period sets the visible range; table alternative. |
| A11Y-11 | `/analytics` | Spending Velocity | A week far over budget drew its bar over the section heading/labels. | 1.4.10 (content overlap) | Clipped plot with shared scale incl. pace line; labels in normal flow. |
| A11Y-12 | `/analytics` | Month Ridge | Title stuck at "6-Month"; period N showed N+1 months. | 1.3.1 (info mismatch), 2.4.6 | Title/bars/table/share follow the period; `period - 1` lookback. |
| A11Y-13 | `/analytics` | Page | No `h1`; section titles were `h3` with no `h2`. | 1.3.1, 2.4.6 | `sr-only h1`; `AnalyticsSection` `<section aria-labelledby>` + `h2`. |
| A11Y-14 | `/analytics` | PredictiveBurnBar | `role="img"` wrapped headings and text (hid them from AT); invalid colour strings broke the projection hatch. | 1.3.1, 1.4.1 | `role="img"` only on the bar with a full summary; `color-mix`; "estimate" label. |
| A11Y-15 | all headers | QuickHelpButton | Icon-only close button unnamed; trigger lacked `aria-expanded`; no Escape; 32 px target. | 4.1.2, 2.1.1, DoD | Named close, `aria-expanded`/`aria-controls`, Escape returns focus, focus moves into panel, 44 px. |
| A11Y-16 | `/business` | LedgerForm | Labels not associated with inputs; tag-remove button unnamed. | 1.3.1, 4.1.2 | `useId` label/input pairs; `aria-label="Remove tag …"`. |
| A11Y-17 | `/business` | CollectionChart, LedgerProgressRing | Chart without alternative; progressbar without name/value text. | 1.1.1, 4.1.2 | `DataTableView`; `aria-label="Collected"` + `aria-valuetext`. |
| A11Y-18 | `/settings` | PinLockSettings | "Lock after" label not associated; PIN input labelled only by placeholder. | 3.3.2, 4.1.2 | `htmlFor`/`id`; `aria-label` on PIN input. |
| A11Y-19 | `/settings` (all confirms) | ConfirmDialog | Type-to-confirm label not associated; Escape did not cancel. | 4.1.2, DS §17.3 | Associated label; Escape cancels and focus returns to the trigger. |
| A11Y-20 | `/expenses` | CategorySelector | New-category input and colour swatches suppressed the focus indicator (`outline-none` / inline `outline: none`). | 2.4.7 | `focus-visible:ring` on both. |
| A11Y-21 | `/` | MoneyDnaCard / FingerprintBlob | Disclosure without `aria-expanded`; radial chart without data table. | 4.1.2, 1.1.1 | `aria-expanded`; `DataTableView` (dimension → score). |
| A11Y-22 | sign-in | AuthModal | Decorative Google mark SVG exposed to AT. | 1.1.1 | `aria-hidden`, `focusable="false"`. |

## 3. P1 findings — open (follow-up tickets)

| ID | Page | Finding | Proposed fix | Tracking |
| --- | --- | --- | --- | --- |
| A11Y-P1-01 | all | Automated axe sweep of authenticated routes not yet run (needs a seeded staging account). | Add a Playwright + axe job against a seeded preview deployment. | Follow-up to [Sprint 4.2](../IMPLEMENTATION_QUEUE.md#sprint-42); candidate for M6 (observability/CI). |
| A11Y-P1-02 | `/analytics`, `/business`, `/` | Charts lack arrow-key traversal of data points (DESIGN_SYSTEM §15.4); values are reachable via the table. | Roving-focus data points with on-focus tooltip. | [Sprint 14.2](../IMPLEMENTATION_QUEUE.md#sprint-142) analytics panel keyboard work. |
| A11Y-P1-03 | all headers | QuickHelp panel is non-modal and portalled, so Tab order after the panel jumps to the end of the document. | Render inline or add a focus trap with explicit close. | M4 follow-up. |
| A11Y-P1-04 | `/expenses`, `/business`, `/settings` | Several inputs replace the outline with low-alpha rings (e.g. `focus:ring-[var(--primary)]/30`); contrast of the indicator may fall below 3:1. | Standardise on the accent `:focus-visible` outline token. | M4 follow-up. |
| A11Y-P1-05 | `/analytics` | MonthSwitcher's first-run hint overlays the second header row on mobile until dismissed. | Position the hint inside the header flow. | M4 follow-up. |

## 4. P2 findings — open

| ID | Page | Finding |
| --- | --- | --- |
| A11Y-P2-01 | `/`, `/business` | Some captions use 9–10 px text (`text-[10px]`, `0.55rem`) — legible at 200 % zoom but below the caption token. |
| A11Y-P2-02 | `/analytics` | Category Seasons hover tooltip is pointer-only (values are in its data table). |
| A11Y-P2-03 | `/expenses` | Category colour swatches are 20 px (pass WCAG 2.5.8 via spacing, below the 44 px DoD). |
| A11Y-P2-04 | `/business/[ledgerId]` | Secondary linear progress bar duplicates the ring without semantics (decorative duplicate of visible numbers). |

## 5. Re-audit cadence

Re-run this audit at every milestone exit and whenever a top page's composition changes; the contract gate (`npm run contracts:check`) and the SVG rule in `phaseFContracts.test.ts` guard the closed P0 classes between audits.
