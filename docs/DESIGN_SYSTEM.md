<!--
  DESIGN_SYSTEM.md — ExpenStream Design System 2026 ("Living Terrain")
  Owner: Product Design + AI Engineering
  Audience: Designers, engineers, QA, and AI agents.
  Companion docs: AI_CONTEXT.md, PROJECT_MASTER_PLAN.md, ARCHITECTURE.md.
  Rule: This is the single source of truth for visual, motion, and interaction
        language. Tokens defined here are mirrored in src/app/globals.css and
        src/lib/motion/tokens.ts. If code and this doc disagree, code wins —
        then update this doc.
-->

# ExpenStream — Design System 2026

**Codename:** _Living Terrain_ · **Status:** Living document · **Version:** 2026.1 · **Last reviewed:** 2026-07-21

---

## 0. Design Philosophy

ExpenStream's visual language is **editorial minimalism for money**. It borrows the calm of a printed almanac, the precision of a Swiss timetable, and the warmth of a well-worn ledger. It refuses the glassy neon of most fintech UIs.

Five commitments shape every decision:

1. **Calm over clever.** The default state is quiet. Alerts earn their place.
2. **Depth over decoration.** Elevation, whitespace, and typography carry hierarchy — not color, not gradients.
3. **Motion is meaning.** Every animation confirms a state change. Nothing bounces for fun.
4. **Tokens are law.** No hard-coded colors, radii, spacing, or durations in feature code.
5. **Inheritance over override.** The accent, theme, and mode are user-owned; components inherit and never hard-code.

Two visual worlds live under one system:

- **Personal (warm organic)** — chalk, parchment, moss, clay. Optimistic, calm, editorial.
- **Business (cool professional)** — cooler surface, canopy accents, tighter chrome. Precise, credible, quiet.

Both share the same tokens, the same motion, the same spacing — only surface temperature and accent shift.

---

## 1. Typography

Type is the primary hierarchy device. Color and weight are secondary.

### 1.1 Font families

| Role        | Family            | CSS variable     | Notes                              |
| ----------- | ----------------- | ---------------- | ---------------------------------- |
| **Display** | Sora              | `--font-display` | Editorial headings, hero amounts.  |
| **Body**    | Plus Jakarta Sans | `--font-body`    | UI, paragraphs, controls.          |
| **Numeric** | DM Mono           | `--font-numeric` | Money, tabular figures, code, IDs. |

All three ship via `next/font` with `display: swap` — no FOIT, no CLS from font loading.

### 1.2 Fluid type scale

Sizes use `clamp()` and scale between the 320 px and 1440 px viewport. Never override with a fixed `px` value in feature code.

| Token                 | Range (rem) | Use                                  |
| --------------------- | ----------- | ------------------------------------ |
| `--text-display`      | 2.25 → 3.5  | Marketing hero, splash screens.      |
| `--text-hero`         | 2.00 → 2.75 | Dashboard hero total.                |
| `--text-h1`           | 1.50 → 2.00 | Page titles.                         |
| `--text-h2`           | 1.25 → 1.50 | Section titles.                      |
| `--text-h3`           | 1.06 → 1.25 | Card titles.                         |
| `--text-h4`           | 0.94 → 1.06 | Sub-card titles, list group headers. |
| `--text-body-lg`      | 0.94 → 1.06 | Emphasised paragraph.                |
| `--text-body`         | 0.88 → 0.94 | Default paragraph, form control.     |
| `--text-body-sm`      | 0.81 → 0.88 | Dense lists, secondary text.         |
| `--text-caption-size` | 0.75 → 0.81 | Metadata, timestamps.                |
| `--text-label`        | 0.75 → 0.81 | Form labels, uppercase micro-titles. |
| `--text-overline`     | 0.75 → 0.81 | Section eyebrows, tracked uppercase. |

**Amount-specific:**

| Token                  | Range (rem) | Use                                         |
| ---------------------- | ----------- | ------------------------------------------- |
| `--text-amount-hero`   | 2.75 → 4.50 | Dashboard budget total, single hero figure. |
| `--text-amount-large`  | 1.25 → 1.75 | KPI cards, per-category totals.             |
| `--text-amount-medium` | 1.00 → 1.25 | Row totals, sub-KPIs.                       |

### 1.3 Weight, tracking, and case

- **Display headings** (Sora): weight **600**, tracking **-0.02em**.
- **Body** (Jakarta): weight **400**, tracking **0**.
- **Emphasised body**: weight **500**, never **700** — bold is reserved for numerics.
- **Numeric hero / KPI** (DM Mono): weight **500**, tabular figures (`font-feature-settings: "tnum"`).
- **Overline / label**: weight **500**, tracking **+0.06em**, `text-transform: uppercase`.
- **Never use** `font-weight: 700` or above except for hero amounts.

### 1.4 Line height

- Display / hero: **1.05**.
- H1 / H2 / H3: **1.15**.
- Body / body-lg: **1.55**.
- Body-sm / caption: **1.45**.
- Numeric: **1.0** (money never wraps its baseline).

### 1.5 Examples

**Good**

```tsx
<h1 className="font-display text-[length:var(--text-h1)] tracking-tight text-[color:var(--text-primary)]">
  July at a glance
</h1>
<p className="font-mono text-[length:var(--text-amount-hero)] tabular-nums">
  ₹48,210
</p>
```

**Bad**

```tsx
<h1 style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>
  July at a glance
</h1>
<p style={{ fontSize: 44, fontFamily: "Arial" }}>Rs. 48210.00</p>
```

Why bad: hard-coded pixels, hard-coded color, wrong family, wrong weight, wrong locale formatting, non-tabular figures.

---

## 2. Spacing

A single scale, mirrored 1:1 in Tailwind (`space-*`) and CSS custom properties.

| Token        | rem  | px  | Use                                                    |
| ------------ | ---- | --- | ------------------------------------------------------ |
| `--space-1`  | 0.25 | 4   | Icon-to-label gap.                                     |
| `--space-2`  | 0.50 | 8   | Chip padding, tight inline gaps.                       |
| `--space-3`  | 0.75 | 12  | Row internal gap, form field vertical rhythm.          |
| `--space-4`  | 1.00 | 16  | Default card padding on mobile.                        |
| `--space-5`  | 1.25 | 20  | Card padding (`--card-padding`), section body gap.     |
| `--space-6`  | 1.50 | 24  | Section gap (`--section-gap`), page horizontal gutter. |
| `--space-8`  | 2.00 | 32  | Between page sections, hero padding.                   |
| `--space-10` | 2.50 | 40  | Large section gap (`--section-gap-lg`), splash rhythm. |
| `--space-12` | 3.00 | 48  | Empty-state vertical rhythm.                           |

**Rules**

- Never use values off the scale. If you need `18px`, choose `--space-4` or `--space-5`.
- Padding scales down one step on `< sm`: a `--card-padding` (20) becomes `--card-padding-sm` (16).
- Never mix `px` and `rem` in the same layout region.

**Good**

```tsx
<section className="px-[var(--space-6)] py-[var(--space-8)] space-y-[var(--space-5)]">
  {/* … */}
</section>
```

**Bad**

```tsx
<section style={{ padding: "18px 22px", marginBottom: 27 }}>{/* … */}</section>
```

---

## 3. Grid

Layout is **stack-first**, columns are opt-in.

### 3.1 Container widths

| Breakpoint   | Max content width | Horizontal gutter |
| ------------ | ----------------- | ----------------- |
| xs (< 640)   | 100 %             | `--space-4` (16)  |
| sm (≥ 640)   | 640 px            | `--space-5` (20)  |
| md (≥ 768)   | 720 px            | `--space-6` (24)  |
| lg (≥ 1024)  | 960 px            | `--space-6` (24)  |
| xl (≥ 1280)  | 1120 px           | `--space-8` (32)  |
| 2xl (≥ 1536) | 1200 px           | `--space-8` (32)  |

Dashboard and settings never exceed **1200 px**. Analytics may go **1360 px** for wide charts.

### 3.2 Column grids

- **Mobile (xs–sm):** single-column stack. Never split KPIs into two columns below `sm`.
- **Tablet (md):** 2-column card grid for KPI / goal cards, `gap-[var(--space-4)]`.
- **Desktop (lg+):** 3–4 column card grid, `gap-[var(--space-5)]`.
- **Analytics grid (lg+):** 12-column, `gap-[var(--space-6)]`. Cards may span 4 / 6 / 8 / 12.

### 3.3 Bottom safe area

Every scrollable page reserves **`88px + env(safe-area-inset-bottom)`** of bottom padding on mobile — enough for the FAB and iOS home indicator.

**Good:** `pb-[calc(88px+env(safe-area-inset-bottom))]` on the scroll container.
**Bad:** letting the FAB overlap the last row of content or hard-coding `pb-24`.

---

## 4. Colors

Colors are **semantic first, palette second**. Feature code references `--text-primary`, `--accent`, `--danger` — never the underlying hex.

### 4.1 Palette — "Living Terrain 2026"

The named palette lives under `--es-*` tokens. Semantic tokens map to it and switch by theme.

**Personal (warm organic)**

| Name      | Token            | Hex       | Role                           |
| --------- | ---------------- | --------- | ------------------------------ |
| Obsidian  | `--es-obsidian`  | `#1A1B2E` | Ink, primary text.             |
| Charcoal  | `--es-charcoal`  | `#2D2E40` | Secondary ink, dark surfaces.  |
| Chalk     | `--es-chalk`     | `#FAF7F2` | Primary light surface.         |
| Parchment | `--es-parchment` | `#F0EBE0` | Secondary light surface.       |
| Vellum    | `--es-vellum`    | `#E8E0D0` | Hover / subtle border.         |
| Moss      | `--es-moss`      | `#2D6B5A` | Primary brand — trust, growth. |
| Sage      | `--es-sage`      | `#7BAF9E` | Secondary — softer moss.       |
| Mist      | `--es-mist`      | `#BDD9D0` | Tint / soft primary.           |
| Clay      | `--es-clay`      | `#B5654A` | Accent / CTA (personal).       |
| Dust      | `--es-dust`      | `#D4906A` | Accent border / warm tint.     |
| Sand      | `--es-sand`      | `#E8C99A` | Warm surface highlight.        |
| Canopy    | `--es-canopy`    | `#1B5B4A` | Business accent (deep moss).   |
| Harvest   | `--es-harvest`   | `#C17A2E` | Warning.                       |
| Ember     | `--es-ember`     | `#C0392B` | Danger.                        |

**Business (cool professional)**

- `--es-biz-surface` `#F0F4F8` — surface.
- `--es-biz-bg` `#EBF0F5` — page background.
- Accents shift to **Canopy** (`#1B5B4A`) on personal-light, **Amber** (`#F59E0B`) on dark.

### 4.2 Semantic tokens

Feature code must consume these — never `--es-*` directly.

| Concern        | Tokens                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text           | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-inverse`                                                                                    |
| Surfaces       | `--background`, `--surface`, `--surface-secondary`, `--surface-hover`, `--surface-tertiary`, `--surface-elevated`, `--surface-modal`, `--surface-popover`, `--surface-quiet` |
| Borders        | `--border`, `--border-subtle`, `--border-strong`, `--border-card`, `--border-focus`                                                                                          |
| Brand          | `--primary`, `--primary-soft`, `--primary-hover`, `--primary-border`, `--primary-text`, `--primary-gradient`                                                                 |
| Secondary      | `--secondary`, `--secondary-soft`, `--secondary-hover`, `--secondary-border`, `--secondary-text`                                                                             |
| Accent (CTA)   | `--accent`, `--accent-soft`, `--accent-hover`, `--accent-deep`, `--accent-border`, `--accent-gradient`                                                                       |
| Status         | `--success*`, `--warning*`, `--danger*`, `--info*`, plus `--status-{ok,warn,err}-{bg,border,text}`                                                                           |
| Business       | `--biz-accent*`, `--biz-pending-*`, `--biz-{upi,cash,cheque,other}-{bg,text}`                                                                                                |
| Interaction    | `--focus-ring`, `--focus-ring-biz`, `--disabled-opacity`                                                                                                                     |
| Goals          | `--goal-{achieved,warning,exceeded}-{bg,text,border}`                                                                                                                        |
| Section washes | `--section-{moss,sage,clay,emerald,mint}`                                                                                                                                    |

### 4.3 Contrast contract

- Body text on any surface: **≥ 4.5 : 1** (AA).
- Headings and hero numerics: **≥ 7 : 1** (AAA target).
- Iconography inside a semantic pill: **≥ 3 : 1** minimum.
- Never use color as the sole channel — pair with icon, label, or shape.

### 4.4 Examples

**Good**

```tsx
<div className="bg-[color:var(--status-warn-bg)] text-[color:var(--status-warn-text)] border border-[color:var(--status-warn-border)]">
  <AlertTriangle aria-hidden /> <span>Approaching monthly budget</span>
</div>
```

**Bad**

```tsx
<div style={{ background: "#FBF0E0", color: "#C17A2E" }}>
  Approaching monthly budget
</div>
```

Why bad: hard-coded hexes will drift from tokens, will not adapt to dark / sunset themes, and cannot be re-themed by a user's accent choice.

---

## 5. Dark Theme

Dark is **obsidian, not black**. Neutral values are cool, tinted slightly indigo.

### 5.1 Surface stack

| Layer             | Token                 | Hex       |
| ----------------- | --------------------- | --------- |
| Page background   | `--background`        | `#0A0A0F` |
| Base surface      | `--surface`           | `#111118` |
| Card              | `--surface-secondary` | `#1C1C27` |
| Hover             | `--surface-hover`     | `#252532` |
| Elevated / modal  | `--surface-elevated`  | `#1C1C27` |
| Highest (popover) | `--surface-tertiary`  | `#2E2E3C` |

### 5.2 Text stack

| Role      | Token              | Hex       |
| --------- | ------------------ | --------- |
| Primary   | `--text-primary`   | `#E8E8F0` |
| Secondary | `--text-secondary` | `#9E9EB8` |
| Tertiary  | `--text-tertiary`  | `#7A7A90` |
| Muted     | `--text-muted`     | `#AAAABF` |
| Inverse   | `--text-inverse`   | `#0A0A0F` |

### 5.3 Accents in dark

- **Primary** shifts from Moss → **Sage** `#7BAF9E` (readable on obsidian).
- **Accent** shifts from Clay → **Amber** `#F59E0B` — the signature dark-mode CTA glow.
- **Business** accent shifts to soft Canopy `#6EB88A`.

### 5.4 Dark elevation

Dark mode uses **darker shadows** _and_ subtle glows for the accent.

- `--shadow-sm`: `0 1px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)`
- `--shadow-md`: `0 4px 18px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)`
- `--shadow-lg`: `0 8px 36px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.35)`
- `--shadow-glow`: `0 0 24px rgba(245,158,11,0.18), 0 0 60px rgba(245,158,11,0.08)` — reserved for FAB and hero CTA.

### 5.5 Rules

- Never use pure `#000` for a background — use `--background` (`#0A0A0F`).
- Never invert brand hex manually — the token switch handles it.
- Divider borders in dark are `--border` `#2A2A38` — do not use `rgba(255,255,255,0.1)`.

---

## 6. Light Theme

Light is **chalk & parchment**, not white. Neutrals are warm, editorial, and slightly cream.

### 6.1 Surface stack

| Layer             | Token                 | Hex       |
| ----------------- | --------------------- | --------- |
| Page background   | `--background`        | `#FAF7F2` |
| Base surface      | `--surface`           | `#FAF7F2` |
| Card              | `--surface-secondary` | `#F0EBE0` |
| Hover             | `--surface-hover`     | `#E8E0D0` |
| Elevated / modal  | `--surface-elevated`  | `#FAF7F2` |
| Highest (popover) | `--surface-tertiary`  | `#D8CFC0` |

### 6.2 Text stack

| Role      | Token              | Hex       |
| --------- | ------------------ | --------- |
| Primary   | `--text-primary`   | `#1A1B2E` |
| Secondary | `--text-secondary` | `#4A4E6B` |
| Tertiary  | `--text-tertiary`  | `#545870` |
| Muted     | `--text-muted`     | `#595D73` |
| Inverse   | `--text-inverse`   | `#FFFFFF` |

### 6.3 Accents in light

- **Primary:** Moss `#2D6B5A`.
- **Accent (CTA):** Clay `#B5654A`.
- **Business accent:** Canopy `#1B5B4A`.

### 6.4 Light elevation

Softer, warmer, quieter shadows:

- `--shadow-sm`: `0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)`
- `--shadow-md`: `0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)`
- `--shadow-lg`: `0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)`

### 6.5 Sunset theme (adaptive)

An opt-in third theme that warms surfaces further and shifts primary toward Harvest / Dust. Uses the same tokens — only values differ. Never referenced directly by feature code.

---

## 7. Elevation

A **three-tier depth system**. Elevation is created with shadow _and_ a one-step surface color change — never with borders alone.

| Level             | Token           | Use                                                  |
| ----------------- | --------------- | ---------------------------------------------------- |
| 0 — flat          | `--elevation-0` | Page background, inline rows.                        |
| 1 — resting card  | `--elevation-1` | Default cards, KPI tiles, list groups.               |
| 2 — hover / focus | `--elevation-2` | Hovered card, focused control, dropdown menu.        |
| 3 — overlay       | `--elevation-3` | Modals, dialogs, bottom sheets, popovers, FAB press. |

Legacy aliases (still supported): `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--card-shadow`, `--card-shadow-hover`.

### 7.1 Rules

- **Never** stack more than two elevation levels visible at once (Level-3 overlay + Level-1 page).
- Elevation on top of elevation dilutes hierarchy — nested cards should be Level-0 with a border.
- Dark mode elevation uses **stronger shadows + optional glow**; light mode uses **soft warm shadows**.
- Skeuomorphic inner shadows are banned.

### 7.2 Examples

**Good**

```tsx
<article className="bg-[color:var(--surface-secondary)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] rounded-[var(--radius-card)]">
  {/* KPI content */}
</article>
```

**Bad**

```tsx
<article
  style={{ boxShadow: "0 20px 50px rgba(0,0,0,.3), inset 0 0 8px #fff" }}
>
  {/* KPI content */}
</article>
```

Why bad: over-heavy shadow competes with the FAB, inner shadow is skeuomorphic, values off-token.

---

## 8. Motion

Motion is a **language of confirmation**. Every animation answers "what just happened?" Never "look at me."

Tokens live in `src/lib/motion/tokens.ts` and are the only source of durations, easings, springs, distances, and scales for the app.

### 8.1 Durations (seconds)

| Token       | Value | Use                                               |
| ----------- | ----- | ------------------------------------------------- |
| `instant`   | 0.08  | Micro-feedback, ripple start.                     |
| `fast`      | 0.15  | Hover, press, exits.                              |
| `normal`    | 0.25  | Fade, toggle, small movement.                     |
| `emphasis`  | 0.40  | Page entrance, hero elements.                     |
| `slow`      | 0.70  | Progress bars, chart reveals.                     |
| `glacial`   | 0.60  | Full-page transitions, onboarding.                |
| `exit`      | 0.15  | All exit animations — must be snappy.             |
| `narrative` | 1.20  | Scroll-story transitions, signature moments only. |

### 8.2 Easing

- `ease.out` — `[0.22, 1, 0.36, 1]` — **the signature curve**. Default for entrances.
- `ease.inOut` — `[0.4, 0, 0.2, 1]` — expand / collapse, layout shifts.
- `ease.in` — `[0.55, 0, 1, 0.45]` — snappy exits only.

### 8.3 Springs

| Preset    | Config                        | Use                                            |
| --------- | ----------------------------- | ---------------------------------------------- |
| `default` | `stiffness: 400, damping: 28` | Modals, overlays, dropdowns.                   |
| `stiff`   | `stiffness: 500, damping: 30` | Tab indicators, layout shifts.                 |
| `bouncy`  | `stiffness: 600, damping: 15` | FAB press, celebrations. Use sparingly.        |
| `gentle`  | `stiffness: 200, damping: 20` | Slow reveals, background elements.             |
| `water`   | `stiffness: 120, damping: 14` | Bottom sheet, spending stream, liquid effects. |

### 8.4 Distances and scale

- `distance`: `sm` 6 px, `md` 12 px, `lg` 24 px, `swipeExit` 80 px.
- `scale.tapButton` `0.96`, `scale.tapFab` `0.88`, `scale.tapChip` `0.94`, `scale.modalEnter` `0.97`.

### 8.5 Stagger

- `stagger.tight` 0.04 — dense lists (expense rows).
- `stagger.normal` 0.06 — card grids (KPI, goals).
- `stagger.loose` 0.10 — dashboard section-level reveals.
- Total stagger time capped at **~480 ms** (`MAX_STAGGER_ITEMS = 12`, `staggerDelay(i)`).

### 8.6 Reduced motion

Every Framer variant must honor `prefers-reduced-motion`:

- Replace movement with a **cross-fade** at `duration.fast`.
- Never remove the animation entirely — leave the state-change signal.

### 8.7 Rules

- Never author durations, easings, or springs inline — always import from `@/lib/motion/tokens`.
- No decorative loops. If it moves without a state change, it does not ship.
- No parallax on data. Amounts do not bob.

---

## 9. Buttons

Buttons are the app's most-touched surface. Consistency here is non-negotiable.

### 9.1 Variants

| Variant              | Surface                          | Text               | Border     | Use                                           |
| -------------------- | -------------------------------- | ------------------ | ---------- | --------------------------------------------- |
| **Primary**          | `--accent` (`--accent-gradient`) | `--text-inverse`   | none       | The single most important action on a screen. |
| **Secondary**        | `--surface`                      | `--text-primary`   | `--border` | Alternate paths (Cancel next to Save).        |
| **Tertiary**         | transparent                      | `--primary-text`   | none       | Inline text actions, links inside cards.      |
| **Ghost**            | transparent → `--surface-hover`  | `--text-secondary` | none       | Icon-only toolbar buttons.                    |
| **Destructive**      | `--danger`                       | `--text-inverse`   | none       | Delete, revoke, wipe.                         |
| **Business primary** | `--biz-accent`                   | `--text-inverse`   | none       | Primary action in Business mode.              |

**Rule:** exactly **one primary** per screen. Everything else steps down.

### 9.2 Sizes

| Size | Height | Padding X   | Font             | Radius        | Icon size     |
| ---- | ------ | ----------- | ---------------- | ------------- | ------------- |
| `sm` | 36 px  | `--space-3` | `--text-body-sm` | `--radius-sm` | `--icon-sm`   |
| `md` | 44 px  | `--space-4` | `--text-body`    | `--radius-md` | `--icon-base` |
| `lg` | 52 px  | `--space-5` | `--text-body-lg` | `--radius-md` | `--icon-md`   |
| `xl` | 60 px  | `--space-6` | `--text-body-lg` | `--radius-lg` | `--icon-lg`   |

Minimum tap target: **44 × 44 px** (`md` size or larger for anything the thumb reaches).

### 9.3 States

- **Hover:** `--accent-hover`, transition `duration.fast` `ease.out`.
- **Press:** `scale.tapButton` (`0.96`), `duration.instant` `ease.out`.
- **Focus-visible:** 2 px `--border-focus` outline + 4 px `--focus-ring` glow. Never `outline: none`.
- **Loading:** replace label with a `Loader2` spinner (`--icon-sm`), keep width via `min-width`.
- **Disabled:** `opacity: var(--disabled-opacity)`, `cursor: not-allowed`, pointer-events off, `aria-disabled`.

### 9.4 Examples

**Good**

```tsx
<button
  className="h-11 px-[var(--space-4)] rounded-[var(--radius-md)]
             bg-[image:var(--accent-gradient)] text-[color:var(--text-inverse)]
             font-body text-[length:var(--text-body)] font-medium
             transition-transform duration-[150ms] ease-out
             active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-[color:var(--border-focus)]"
>
  Save expense
</button>
```

**Bad**

```tsx
<button style={{ background: "#0F62FE", padding: "6px 10px", color: "#fff" }}>
  save
</button>
```

Why bad: wrong palette, sub-44 px target, missing focus ring, missing press feedback, no theme awareness.

---

## 10. Inputs

Inputs are quiet by default. All the emphasis is on the label above and the value inside.

### 10.1 Anatomy

- **Label** above, `--text-label`, `--text-secondary`.
- **Field** below, height **48 px** (mobile) / **44 px** (desktop). Radius `--radius-md`.
- **Helper / error** below the field, `--text-body-sm`, `--text-muted` (helper) or `--danger-text` (error).
- **Prefix / suffix** slots (currency symbol, unit) padded by `--space-2`.

### 10.2 States

| State     | Border                  | Background            | Notes                                     |
| --------- | ----------------------- | --------------------- | ----------------------------------------- |
| Rest      | `--border`              | `--surface-secondary` |                                           |
| Hover     | `--border-strong`       | `--surface-secondary` |                                           |
| Focus     | `--border-focus` + ring | `--surface-elevated`  | `box-shadow: 0 0 0 4px var(--focus-ring)` |
| Filled    | `--border`              | `--surface-elevated`  | Value is `--text-primary`.                |
| Error     | `--danger-border`       | `--danger-soft`       | Text `--danger-text`.                     |
| Disabled  | `--border-subtle`       | `--surface`           | `opacity: var(--disabled-opacity)`        |
| Read-only | `--border-subtle`       | `--surface-quiet`     | No caret, keyboard focusable.             |

### 10.3 Field types

- **Amount pad** — full-width numeric keypad on mobile, tabular figures, currency prefix.
- **Text** — single line, 48 px, respects `inputMode` for keyboards.
- **Textarea** — min 3 lines, autogrow, no fixed max height.
- **Select** — native on mobile, custom listbox on desktop; keyboard navigable.
- **Combobox / autocomplete** — free text + filtered suggestions, ARIA combobox pattern.
- **Toggle** — 44 px hit target, 24 × 44 track, animated with `spring.stiff`.
- **Checkbox / radio** — 20 × 20, 44 × 44 hit target, focus ring visible.
- **Date** — native picker on mobile, custom on desktop.
- **Search** — leading `Search` icon, clear button appears after 1 char.

### 10.4 Validation

- Validate on **blur**, never on every keystroke (except async availability checks).
- Inline error appears below the field with `role="alert"` and `aria-describedby` wiring.
- Form-level error appears in a `Level-2` banner above the submit row.
- Money fields must accept locale digits (`, . ` grouping), reject `NaN`, and cap at 15 digits.

### 10.5 Examples

**Good**

```tsx
<label className="block space-y-[var(--space-2)]">
  <span className="font-body text-[length:var(--text-label)] uppercase tracking-wide text-[color:var(--text-secondary)]">
    Amount
  </span>
  <div className="flex items-center rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-secondary)] focus-within:border-[color:var(--border-focus)] focus-within:shadow-[0_0_0_4px_var(--focus-ring)]">
    <span
      aria-hidden
      className="pl-[var(--space-3)] text-[color:var(--text-tertiary)]"
    >
      ₹
    </span>
    <input
      inputMode="decimal"
      className="h-12 w-full bg-transparent px-[var(--space-3)] font-mono tabular-nums"
    />
  </div>
</label>
```

**Bad**

```tsx
<input
  type="text"
  placeholder="amount"
  style={{ height: 30, border: "1px solid red" }}
/>
```

Why bad: 30 px is below tap target, red border used as default (only for errors), no label, no `inputMode`, no currency prefix, no theming.

---

## 11. Cards

The card is the workhorse container of the app.

### 11.1 Anatomy

- **Surface:** `--surface-secondary` (light) / `--surface-secondary` (dark).
- **Radius:** `--radius-card` (16 px). Never sharper.
- **Padding:** `--card-padding` (20 px), `--card-padding-sm` (16 px) on `< sm`.
- **Elevation:** Level-1 rest, Level-2 on hover for interactive cards.
- **Border:** 1 px `--border-card` only when elevation is not enough to separate the card from its background (e.g. inside another surface).

### 11.2 Card families

| Family               | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| **KPI card**         | Single metric + delta + micro-chart.              |
| **Insight card**     | Editorial callout with icon, title, body.         |
| **List card**        | Grouped rows (expenses, ledgers).                 |
| **Chart card**       | Header + chart + optional footer legend.          |
| **Empty-state card** | Illustration + line + CTA.                        |
| **Accent card**      | Uses `--surface-accent-{moss,sage,coral}` washes. |

### 11.3 Rules

- **Never** nest a card inside a card that has the same surface color. Use a border-only inner group (Level 0) or a different surface family.
- Interactive cards have a **`role="button"`** _or_ wrap the primary action in a real `<button>` / `<a>`. Whole-card hit targets are encouraged.
- Never truncate money. Truncate remarks with `line-clamp-1` / `line-clamp-2` and a trailing ellipsis.
- Card titles are `--text-h3` or `--text-h4`; use `--text-overline` for eyebrows.

### 11.4 Examples

**Good**

```tsx
<article
  className="p-[var(--card-padding)] rounded-[var(--radius-card)]
             bg-[color:var(--surface-secondary)] shadow-[var(--elevation-1)]
             hover:shadow-[var(--elevation-2)] transition-shadow duration-[250ms] ease-out"
>
  <p className="font-body text-[length:var(--text-overline)] uppercase tracking-wide text-[color:var(--text-tertiary)]">
    This month
  </p>
  <p className="mt-[var(--space-1)] font-mono text-[length:var(--text-amount-large)] tabular-nums text-[color:var(--text-primary)]">
    ₹48,210
  </p>
</article>
```

**Bad**

```tsx
<div
  style={{
    background: "#fff",
    borderRadius: 6,
    padding: 8,
    boxShadow: "0 20px 40px black",
  }}
>
  48210
</div>
```

Why bad: sharp corners, tight padding, overkill shadow, no locale formatting, no theming.

---

## 12. Bottom Sheets

The primary composition surface on mobile. Reachable, dismissible, one-thumb friendly.

### 12.1 Anatomy

- **Handle** — 4 × 36 px grabber, `--surface-tertiary`, centered top with `--space-3` padding.
- **Header** — title (`--text-h3`), optional right-side close button (44 × 44).
- **Body** — scrolls independently. `overscroll-behavior: contain` to prevent page pull-refresh.
- **Footer** — sticky primary + secondary buttons, safe-area padded.
- **Backdrop** — `--overlay` (light `rgba(0,0,0,0.4)`, dark `rgba(0,0,0,0.6)`), tap-to-dismiss.

### 12.2 Sizes

- **Compact** — content-height, max **60 vh**. Confirmations, single questions.
- **Standard** — snap to **60 vh**, expandable to **90 vh**. Expense entry, filters.
- **Full** — 100 vh minus safe area. Long forms, guided flows.

### 12.3 Motion

- Enter: `spring.water` (soft, liquid). Backdrop fades over `duration.fast`.
- Exit: `ease.in` at `duration.exit`.
- Drag-to-dismiss: threshold **80 px** (`distance.swipeExit`) or velocity > 500 px/s.
- Respect `prefers-reduced-motion`: replace slide with cross-fade.

### 12.4 Rules

- **Only one bottom sheet on screen at a time.** Chained flows use step-in-place.
- Never nest a bottom sheet inside another sheet.
- Focus must move to the sheet on open; return to trigger on close.
- Trap focus while open (`role="dialog"`, `aria-modal="true"`).
- The primary action lives in the **footer**, not scrolled inside the body.

### 12.5 Examples

**Good:** an expense entry sheet with amount pad first, category grid second, remark optional, `Save` sticky at the bottom, `Cancel` inline, close button in the header, swipe-to-dismiss enabled.

**Bad:** a sheet that opens above another sheet, hides its Save button below the fold, has no focus trap, and closes only via the tiny × icon.

---

## 13. Dialogs

Dialogs are used **only** when a decision blocks progress or a task cannot be reversed.

### 13.1 When to use

- Destructive confirmation (delete, revoke, wipe).
- Missing required info before a critical action.
- Legal / consent gates.

### 13.2 When NOT to use

- Success notifications → use a toast.
- Non-blocking questions → use an inline prompt or bottom sheet.
- Marketing / education → use a card in-flow.

### 13.3 Anatomy

- **Max width:** 420 px on desktop, `calc(100vw - 2*var(--space-6))` on mobile.
- **Radius:** `--radius-lg` (20 px).
- **Elevation:** Level-3.
- **Backdrop:** `--overlay`, blocks pointer events.
- **Structure:** title (`--text-h3`), body (`--text-body`), 1–2 buttons (destructive = `--danger`, primary right).

### 13.4 Motion

- Enter: `spring.default` + `scale.modalEnter` (0.97 → 1) + fade.
- Exit: `ease.in`, `duration.exit`.
- Backdrop: fade only.

### 13.5 Rules

- Never more than **two** primary actions.
- The **safe** action is autofocused. The **destructive** action requires deliberate keyboard traversal.
- Escape closes, Enter confirms the safe path.
- Never open a dialog inside a bottom sheet without dismissing the sheet first.

### 13.6 Examples

**Good**

> **Delete this expense?**
> This will remove ₹450 (Groceries, Jul 12) from your history. You can undo for 10 seconds.
> [ Cancel ] [ Delete ]

**Bad**

> **Are you sure?** [OK]

Why bad: no context, no reversibility hint, single-button dialog offers no escape from the decision, wording is passive-aggressive.

---

## 14. FAB (Floating Action Button)

There is **exactly one FAB per screen**, and it triggers the screen's single most-frequent action.

### 14.1 Anatomy

- **Size:** 56 × 56 px (default), 64 × 64 (extended with label).
- **Radius:** full pill (28 px).
- **Surface:** `--accent-gradient` (personal) / `--biz-accent-gradient` (business).
- **Icon:** `--icon-lg` (24 px), `--text-inverse`.
- **Elevation:** Level-2 rest, Level-3 press.
- **Optional label** appears on scroll-up, hides on scroll-down.

### 14.2 Placement

- **Mobile:** bottom-right, offset **`var(--space-6)`** from right, **`calc(var(--space-6) + env(safe-area-inset-bottom))`** from bottom, above the tab bar.
- **Desktop:** bottom-right of the content container, or absent if the primary action is a top-right button.

### 14.3 Motion

- Press: `scale.tapFab` (0.88), `spring.bouncy`.
- Show / hide on scroll: `spring.water`, translate `distance.md` (12 px) + fade.
- Never rotate the icon for state changes below 90°.

### 14.4 Rules

- Never use a FAB for a destructive action.
- Never stack two FABs. If two actions compete, one of them isn't primary.
- Never let the FAB overlap the last row of content — reserve `88px + safe-area` scroll padding.
- Focus ring must be visible (accent focus glow ring, not `outline: none`).

### 14.5 Examples

**Good:** dashboard shows a single **+ Add expense** FAB at bottom-right; it hides while the user scrolls a long list, reappears when they stop, and lifts above the tab bar via safe-area offsets.

**Bad:** dashboard has two FABs (add + import), the FAB overlaps the last expense row, and its icon spins on press.

---

## 15. Charts

Charts are Visx. They are quiet, currency-aware, and always have a text alternative.

### 15.1 Chrome

- **Background:** transparent (inherits card).
- **Grid:** 1 px `--border-subtle`, horizontal only, 0.4 opacity.
- **Axis labels:** `--text-caption-size`, `--text-tertiary`, `--font-numeric` for values.
- **Tooltip:** `--chart-tooltip-bg`, 1 px `--chart-tooltip-border`, radius `--radius-sm`, `--text-body-sm`.
- **Legend:** below chart, `--text-caption-size`, chips of 8 × 8 with `--radius-sm`.

### 15.2 Color mapping

- Primary series: `--primary`.
- Secondary series: `--secondary`.
- Highlighted / hovered: `--accent`.
- Positive delta: `--success`.
- Negative delta: `--danger`.
- Anomaly band: `--warning-soft` fill, `--warning` stroke.
- Confidence band (rolling avg ±1σ): `--primary-soft` fill at 0.35 alpha.
- Never use more than **6 distinct series** on a single chart. Above 6, switch to Top-N + Other.

### 15.3 Motion

- Line reveals: draw-in over `duration.slow`, `ease.out`.
- Bars: grow from baseline, `spring.gentle`, staggered `stagger.tight`.
- Never animate on scroll after first paint.
- Respect `prefers-reduced-motion`: render final state instantly.

### 15.4 Accessibility

- Every chart has a **text alternative**: either a `<table>` sibling or `aria-describedby` summary ("30-day rolling average, currently ₹1,240, up 4% from last month").
- Every chart is keyboard focusable; arrow keys move through data points; Enter opens the tooltip.
- Chart colors are paired with **shape or label** — never encoded by color alone.

### 15.5 Examples

**Good:** a rolling-average line with a ±1σ shaded band using `--primary` and `--primary-soft`, tooltip in `--font-numeric`, and a hidden `<table>` mirroring the data.

**Bad:** rainbow lines, glossy 3D bars, animated on every re-render, no legend, no keyboard access, values shown in a proportional font.

---

## 16. Icons

Icons are **Lucide-first**, inline SVG when custom.

### 16.1 Sizes

| Token         | px  |
| ------------- | --- |
| `--icon-xs`   | 14  |
| `--icon-sm`   | 16  |
| `--icon-base` | 18  |
| `--icon-md`   | 20  |
| `--icon-lg`   | 24  |

Icons inside tap targets never dictate the target size — the target is always ≥ 44 × 44 padding, with the icon centered.

### 16.2 Style

- **Stroke:** 1.75 px (Lucide default 2 tuned down for editorial calm).
- **Corners:** rounded (Lucide's `strokeLinejoin="round"`).
- **Fill:** none by default; filled variants only for _active_ toggle states.
- **Color:** inherits `currentColor`; set via `--text-*` or `--accent`.

### 16.3 Rules

- Decorative icons: `aria-hidden="true"`. **Never** a text alternative.
- Meaningful icons: `role="img"` + `aria-label` **or** a visible adjacent label.
- Icon-only buttons: **must** have `aria-label`.
- Never invent new icons if a Lucide equivalent exists.
- Never mix stroke widths in the same view.
- Category / merchant emojis are text glyphs, not icons — do not style them.

### 16.4 Examples

**Good**

```tsx
<button
  aria-label="Add expense"
  className="h-11 w-11 rounded-[var(--radius-md)]"
>
  <Plus
    aria-hidden
    className="h-[var(--icon-md)] w-[var(--icon-md)] text-[color:var(--text-inverse)]"
  />
</button>
```

**Bad**

```tsx
<button>
  <Plus size={12} color="#0F62FE" strokeWidth={4} />
</button>
```

Why bad: 12 px icon inside no-context button, no `aria-label`, custom color off-token, heavier stroke than the system.

---

## 17. Accessibility

WCAG 2.2 AA is the floor. AAA is the target on hero text.

### 17.1 Contract for every interactive element

1. **Focus-visible** ring is visible at all times. Never `outline: none` without a replacement.
2. **Tap target** ≥ 44 × 44 px (48 × 48 on primary CTAs).
3. **Keyboard operable** end-to-end. Tab / Shift-Tab, Enter, Space, Escape all behave.
4. **Semantic role** — a button is a `<button>`, a link is an `<a href>`. `<div onClick>` is banned.
5. **Name, role, state** exposed to assistive tech (`aria-*` where semantics don't cover it).
6. **Color is never the sole channel** — pair with icon, label, or shape.
7. **Contrast** ≥ 4.5 : 1 for body, ≥ 3 : 1 for large and iconography.
8. **Motion** honors `prefers-reduced-motion`.
9. **Live regions** for async updates that the user cannot see (sync status, toast).
10. **Text alternatives** for every non-decorative image, icon, and chart.

### 17.2 Forms

- Every field has a persistent, visible label.
- Errors use `role="alert"` and `aria-describedby`; never rely on red border alone.
- Required fields marked with visible `*` **and** `aria-required="true"`.
- Amount fields expose the currency via label _and_ `aria-label` ("Amount in Indian rupees").

### 17.3 Modals & sheets

- `role="dialog"`, `aria-modal="true"`, labeled by title.
- Focus trap while open; focus returns to the trigger on close.
- Escape closes; backdrop click closes non-destructive dialogs.

### 17.4 Charts & data viz

- Data table sibling or `aria-describedby` summary is mandatory.
- Keyboard traversal of data points with arrow keys.
- Never encode meaning in color alone.

### 17.5 Reduced motion

Every Framer variant reads `useReducedMotion()` and swaps translate/scale for a cross-fade at `duration.fast`.

### 17.6 Examples

**Good**

```tsx
<button
  aria-label="Delete expense"
  aria-describedby="expense-3-summary"
  onClick={handleDelete}
  className="h-11 w-11 rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-[color:var(--border-focus)]"
>
  <Trash2 aria-hidden />
</button>
```

**Bad**

```tsx
<div onClick={handleDelete} style={{ outline: "none" }}>
  <Trash2 />
</div>
```

Why bad: not a button, no focus ring, no label, no keyboard support.

---

## 18. Responsive Breakpoints

Mobile-first. Layout stacks, then unlocks at each breakpoint.

| Token | min-width | Typical device                  | Layout intent                          |
| ----- | --------- | ------------------------------- | -------------------------------------- |
| `xs`  | 0         | Small phone (iPhone SE)         | Single column, 16 px gutter.           |
| `sm`  | 640 px    | Large phone / small tablet      | Single column, 20 px gutter.           |
| `md`  | 768 px    | Tablet portrait                 | 2-column card grid, 24 px gutter.      |
| `lg`  | 1024 px   | Tablet landscape / small laptop | 3-column card grid, side nav appears.  |
| `xl`  | 1280 px   | Laptop / desktop                | 4-column card grid, 32 px gutter.      |
| `2xl` | 1536 px   | Wide desktop                    | Same as xl; content capped at 1200 px. |

### 18.1 Layout rules

- Never introduce a **fifth** column above `2xl` — density is the enemy of calm.
- Navigation shifts:
  - `< md` → **bottom tab bar** (4 slots max) + FAB.
  - `md–lg` → **collapsed rail** on the left.
  - `≥ lg` → **expanded side nav** with labels.
- Modals become **bottom sheets on `< md`** and centered dialogs on `≥ md`.
- Tables become **card lists on `< md`**. Never horizontal-scroll a data table on mobile.

### 18.2 Fluid vs. stepped

- Type, amounts, and hero spacing scale **fluidly** with `clamp()`.
- Grids and card padding step at breakpoints.

### 18.3 Examples

**Good:** dashboard renders a single stacked column at `xs`, two-column KPIs at `md`, four-column KPIs at `xl`, side nav from `lg` upward, FAB at bottom-right on `< lg`.

**Bad:** four-column KPI grid at `xs` (60 px per card, unreadable), a horizontal-scrolling transactions table on mobile, a full-height sidebar shown at 375 px width.

---

## 19. Animation Principles

Motion earns its place by answering "what changed?" Anything else is decoration and does not ship.

### 19.1 The seven principles

1. **Confirm, don't perform.** Motion must confirm a user or system action.
2. **Fast to feel, slow to notice.** Small = fast (`instant`/`fast`). Large = emphasis (`normal`/`emphasis`).
3. **One curve unless there's a reason.** `ease.out` is the default.
4. **Direction has meaning.**
   - Enter from below → new context (sheet, toast).
   - Enter from above → alert (banner).
   - Enter from left/right → navigation direction.
   - Fade only → cross-context (theme change, no spatial meaning).
5. **Stagger to tell a story, not to entertain.** Cap at 12 items, ≤ 480 ms total.
6. **Exits are snappier than entrances.** `duration.exit = 0.15s`, `ease.in`.
7. **Reduced motion is not a fallback, it is a variant.** Design it deliberately as a cross-fade.

### 19.2 Choreography

- The FAB waits for the sheet backdrop to fade in before it hides.
- Toasts stack from the top-right (desktop) / top-center (mobile), oldest first.
- Chart reveals begin **after** their card enters, not simultaneously.
- Loading skeletons pulse at **1.4 s** cycles — slow enough to feel calm.

### 19.3 What we don't do

- No parallax on money.
- No spinning-globe or "AI thinking" flourishes.
- No looping animations on the dashboard.
- No confetti on money events unless the user opted into celebrations.
- No haptics without a user action.

### 19.4 Examples

**Good**

- Adding an expense: FAB `scale.tapFab` → bottom sheet enters with `spring.water` → on save, sheet exits with `ease.in` → new row appears with `stagger.tight` in the list.
- Toggling budget health: page background tints from `--background` to a warmer wash over `duration.emphasis` `ease.inOut`.

**Bad**

- Every card pulses on hover.
- Charts re-animate on every filter change.
- A giant confetti burst when the user records rent.

---

## 20. Cross-cutting rules (the short list)

1. Use **tokens** — never hex, never inline durations, never off-scale spacing.
2. **One primary action per screen.** One FAB per screen.
3. **Every screen has five states:** empty, loading, error, offline, success.
4. **44 × 44 minimum** for anything the thumb touches.
5. **Focus-visible always.**
6. **Color is never the sole channel.**
7. **Money is never truncated silently** and is always locale-formatted.
8. **Motion has meaning** or it does not exist.
9. **Dark and Light are peers**, not variants.
10. **Ask before deviating** — the design system is the contract.

---

## 21. Governance

- This document is versioned with the app. Breaking token changes require a `docs/CHANGELOG.md` entry.
- New tokens are proposed via PR that updates both `src/app/globals.css` **and** this doc in the same commit.
- Component-level contracts (props, states, a11y) live in `src/__tests__/componentContracts.test.ts`, `accessibilityContracts.test.ts`, and `designTokens.test.ts` — those tests are the enforcement layer.
- When a component drifts from a token, the fix is to align the component to the token, not the token to the component.


---

## 22. UI Evolution & Versioning

The design system is a living surface. This section is the **contract for how it changes** so a future engineer or AI agent can propose, deprecate, and version tokens and components without breaking downstream consumers. The intent is to make evolution cheap, drift expensive, and history readable.

### 22.1 Versioning model

- **The design system is versioned with the app.** There is no separate DS release train — a token or component that ships in app version `X.Y.Z` is authoritative for that version.
- **Semver of *intent*, not just of *tokens*:**
  - **Major** — a token is removed, renamed, or has its semantic meaning changed (e.g., `--color-danger` remapped to a different hue family, or `--space-4` re-quantised). Also: a component prop is removed, or default behaviour changes in a way an existing screen would notice.
  - **Minor** — a new token, a new component, or a new variant is *added*. Existing consumers keep working.
  - **Patch** — non-visual clarifications (docs, tests, JSDoc, contract-test coverage).
- Every version-affecting change lists its DS impact in [`CHANGELOG.md`](CHANGELOG.md) under the app version it ships in. Major DS changes additionally require an [ADR](adr/) explaining the rationale.

### 22.2 Proposing a new token, component, or variant

1. **Check that no existing token or component already carries the semantic meaning.** Reuse beats invention. If a screen wants "a slightly warmer amber", it uses the existing amber token — it does not add a new one.
2. **Write the definition in both places atomically:** `src/app/globals.css` (or the relevant token file such as `src/lib/motion/tokens.ts`) and the corresponding section of this document. A PR that updates one without the other is rejected.
3. **Extend the contract tests** in `src/__tests__/designTokens.test.ts` (and `componentContracts.test.ts` / `accessibilityContracts.test.ts` if a component is involved). Contract tests are the enforcement layer — a token that no test references does not exist.
4. **Cite the ownership.** In the doc entry, name the section it belongs to (§4 Colors, §10 Inputs, etc.). Cross-cutting additions go into §20 "Cross-cutting rules".
5. **Prefer additive over destructive.** New variants ship alongside old ones; deprecation runs on its own schedule (§22.3).

### 22.3 Deprecating a token, component, or variant

Deprecation is a two-phase, minimum-one-release process — never a delete-in-place.

- **Phase 1 — Announce.**
  - Mark the token or component `@deprecated` in code (JSDoc / CSS comment) with the version it will be removed in and the replacement to migrate to.
  - Add a "Deprecated in vX.Y.Z" row to the owning section of this document with the same information.
  - The token or component continues to work; contract tests keep enforcing it.
  - Add a lint or contract-test entry that surfaces new usages as a warning (so no new consumers appear during the deprecation window).
- **Phase 2 — Remove.**
  - Only after every consumer has migrated (grep confirmed, contract tests updated).
  - The removal is a **Major DS change** (§22.1), gets an [ADR](adr/), and a [`CHANGELOG.md`](CHANGELOG.md) entry.
  - The doc section moves the row from "Deprecated" to "Historical" with the version the removal shipped in, so future readers can trace it.

**Never:**

- Delete a token in the same PR that announces its deprecation.
- Reassign an existing token to a new value without going through Phase 1 → Phase 2 first (silent remap is the highest-severity DS bug — it changes every screen without warning).
- Rename a component prop without a Phase-1 deprecation window (breaks consumers).

### 22.4 Evolving motion, elevation, and typography scales

These three families are the most sensitive to drift because they are physical (feel, depth, rhythm) rather than semantic. Any change to §1 Typography, §7 Elevation, §8 Motion, or §19 Animation Principles additionally requires:

- Screenshot / video diff attached to the PR (before / after) so reviewers can *see* the change.
- A note on `prefers-reduced-motion` behaviour if motion is touched.
- Confirmation that the change does not violate the WCAG AA contrast contract (§17) or the 44 × 44 px touch-target contract ([`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md)).

### 22.5 Cross-references

- **Precedent for interaction decisions the change affects:** [`UX_DECISIONS.md`](UX_DECISIONS.md).
- **The engineering contracts that enforce the change:** [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md).
- **The narrative / feeling the change must not violate:** [`EXPERIENCE_VISION.md`](EXPERIENCE_VISION.md).
- **The per-screen composition the change ripples into:** [`SCREEN_GUIDELINES.md`](SCREEN_GUIDELINES.md).
- **The Product Experience family this doc sits inside:** see the family map in [`AI_AGENT_HANDBOOK.md §1`](AI_AGENT_HANDBOOK.md).

### 22.6 What this section is not

- Not a component library changelog — that lives in [`CHANGELOG.md`](CHANGELOG.md) under each app version.
- Not a design-review protocol — reviews follow the ordinary sprint acceptance-criteria flow ([`SPRINT_BOARD.md`](SPRINT_BOARD.md)).
- Not a place for new tokens themselves — those go into their semantic section above.

The purpose of §22 is one thing: **make the process of changing the design system as legible as the design system itself.**


---

**Last reviewed:** 2026-07-24
