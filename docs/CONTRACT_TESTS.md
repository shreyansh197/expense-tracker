<!--
  CONTRACT_TESTS.md — How to write an accessibility contract test
  Owner: AI Engineering + Accessibility
  Audience: Engineers, AI agents, reviewers.
  Companion docs: DESIGN_SYSTEM.md §17, IMPLEMENTATION_RULES.md §8 & §14,
                  TESTING_CHECKLIST.md, SCREEN_GUIDELINES.md §15.
  Rule: Every component under src/components/ ships with a contract test.
        CI (`npm run contracts:check`) fails when one is missing.
-->

# ExpenStream — Contract Tests

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-09-30 · **Milestone:** M4 (Sprint 4.1)

A **contract test** locks the accessibility and design-system invariants of one component so they cannot silently regress. It answers: _"Is this component still keyboard-operable, screen-reader labelled, reduced-motion safe, token-driven, and big enough to tap?"_

Our Jest environment is `node` (no DOM), so contracts are **source-level assertions**: a spec reads the component file and asserts the attributes, roles, tokens, and patterns that make it accessible. This is intentionally cheap, fast (the whole contract suite runs in seconds), and deterministic.

---

## 1. Add a contract test in under 5 minutes

1. **Scaffold** (≈ 30 s):

   ```bash
   npm run contracts:new -- src/components/<domain>/<Component>.tsx
   ```

   This writes `src/__tests__/<component>.contract.test.ts` with the baseline invariants plus the ARIA/role/state attributes it detected in your component. The skeleton passes immediately.

2. **Add intent** (≈ 3 min): open the generated spec and add at least one assertion that describes the component's accessible **name, role, or state** in terms a reviewer would recognise (see §4 matchers). Delete any auto-detected assertion that is incidental rather than contractual.

3. **Run** (≈ 30 s):

   ```bash
   npx jest src/__tests__/<component>.contract.test.ts
   npm run contracts:check
   ```

4. **Commit** the component and its spec together. CI blocks the PR otherwise.

---

## 2. Anatomy of a contract test

```ts
/// <reference types="jest" />
import {
  readSource,
  expectBaselineContract,
  expectTouchTargets,
} from "./helpers/contractAssertions";

/**
 * Contract for DataTableView (T-4.2.1): chart text alternative.
 */
describe("DataTableView contract", () => {
  const src = readSource("components/ui/DataTableView.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("toggle is a real button exposing its state", () => {
    expect(src).toContain('type="button"');
    expect(src).toContain("aria-pressed={showTable}");
  });

  test("announces the view change politely", () => {
    expect(src).toContain('aria-live="polite"');
  });

  test("toggle meets the 44px touch target", () => {
    expectTouchTargets(src);
  });
});
```

Rules:

- **File name:** `src/__tests__/<camelCaseComponent>.contract.test.ts` — e.g. `MonthSwitcher.tsx` → `monthSwitcher.contract.test.ts`. The CI gate matches on this name.
- **One component per file**, one `describe` named `"<Component> contract"`.
- **Read with `readSource()`** (path relative to `src/`). Never import the component — the node environment cannot render it.
- **Assert behaviour a user relies on**, not incidental markup. `aria-expanded={open}` is a contract; `className="mt-2"` is not.
- **No snapshots.** They lock implementation details and get rubber-stamped.

---

## 3. The baseline contract (`expectBaselineContract`)

Every spec starts with `expectBaselineContract(src)` from [`src/__tests__/helpers/contractAssertions.ts`](../src/__tests__/helpers/contractAssertions.ts). It enforces:

| Assertion                  | Rule                                                                                                                               | Source                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `expectNoDebugLogging`     | No `console.log / debug / info`.                                                                                                   | IMPLEMENTATION_RULES §0            |
| `expectNoDangerousHtml`    | No `dangerouslySetInnerHTML`.                                                                                                      | IMPLEMENTATION_RULES §17           |
| `expectNoPositiveTabIndex` | No `tabIndex={1+}` — focus order follows DOM order.                                                                                | SCREEN_GUIDELINES §15              |
| `expectImagesHaveAlt`      | Every `<img>` has `alt` (empty for decorative).                                                                                    | DESIGN_SYSTEM §17.1 (10)           |
| `expectFocusIndicator`     | If the outline is suppressed (`outline-none`), a `focus:` / `focus-visible:` replacement must exist.                               | DESIGN_SYSTEM §17.1 (1)            |
| `expectReducedMotionAware` | JS-driven animation loops (`requestAnimationFrame(tick)`) must consult `prefers-reduced-motion` — CSS and Framer are handled globally. | DESIGN_SYSTEM §8.6, §17.5          |

Helpers strip comments first, so a comment can neither satisfy nor violate a rule.

---

## 4. Common matchers

| Intent                           | Matcher                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Icon-only button has a name      | `expect(src).toContain('aria-label="Close"')` or `toMatch(/aria-label=\{`Delete \$\{/)`                   |
| Disclosure exposes state         | `expect(src).toContain("aria-expanded={open}")` + `toContain("aria-controls=")`                           |
| Toggle / segmented control state | `expect(src).toContain("aria-pressed={active}")` or `role="radiogroup"` + `aria-checked`                  |
| Dialog / sheet semantics         | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (or render inside `BottomSheet`)                |
| Live announcement                | `expect(src).toMatch(/aria-live="(polite|assertive)"/)` or `role="status"` / `role="alert"`              |
| Semantic click target            | `expectSemanticClickTargets(src)` — no `<div onClick>` without a role (backdrops must be `aria-hidden`)   |
| Chart text alternative           | `expect(src).toContain("<DataTableView")` (renders a `role="table"`) — see §7                              |
| Tokens only                      | `expectNoHardcodedHex(src)`; `expect(src).toContain("var(--accent)")`                                     |

---

## 5. Reduced-motion assertions

Reduced motion is honoured in three layers; assert the layer your component uses:

1. **Framer Motion** — the app root wraps everything in `<MotionConfig reducedMotion="user">` ([src/app/providers.tsx](../src/app/providers.tsx)), which disables transform/layout animation and keeps opacity cross-fades. Components that need a _different_ reduced variant import `useReducedMotion` / `safeVariants` from `@/lib/motion`:

   ```ts
   expect(src).toMatch(/useReducedMotion|safeVariants/);
   ```

2. **CSS keyframes / transitions** — neutralised by the global `@media (prefers-reduced-motion: reduce)` block in [globals.css](../src/app/globals.css). No per-component assertion needed.

3. **JS loops** (`requestAnimationFrame`, canvas) — must check the preference themselves. `expectReducedMotionAware(src)` enforces this automatically.

---

## 6. Focus-ring and touch-target checks

- **Focus ring:** the global `:focus-visible { outline: 2px solid var(--accent) }` rule is the default. Only components that remove it need an assertion — `expectFocusIndicator(src)` is part of the baseline.
- **Touch target:** interactive components assert `expectTouchTargets(src)` (matches `min-h-[44px]`, `min-h-[48px]`, `h-11`, `h-12`, `min-w-[44px]`). Primary CTAs use 48 px (`min-h-[48px]`).

---

## 7. Chart contracts (Sprint 4.2)

Every component that renders a **non-decorative** `<svg>` must expose a `role="table"` text alternative through [`DataTableView`](../src/components/ui/DataTableView.tsx). Decorative SVGs must be `aria-hidden="true"`. This is enforced for the whole `src/components/` tree by [`phaseFContracts.test.ts`](../src/__tests__/phaseFContracts.test.ts) and per-chart by [`chartTextAlternatives.contract.test.ts`](../src/__tests__/chartTextAlternatives.contract.test.ts).

---

## 8. CI gate and coverage report

| Command                   | What it does                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run contracts:new`   | Scaffold a passing spec for a component ([scripts/gen-contract-test.js](../scripts/gen-contract-test.js)). |
| `npm run contracts:check` | CI gate. Fails if any component lacks a contract, an allowlist entry is stale, or coverage < 90 %.  |
| `npm run contracts:report`| Prints coverage % and the ranked list of uncovered components (largest first).                     |
| `npm run test:contracts`  | Runs every contract/a11y spec.                                                                      |

A component is **covered** when either:

1. a dedicated `src/__tests__/<camelCaseComponent>.contract.test.ts` exists, or
2. an existing aggregate contract spec reads its path (e.g. [accessibilityContracts.test.ts](../src/__tests__/accessibilityContracts.test.ts) inventory, `componentContracts.test.ts`).

**Allowlist** — [`contract-tests.allowlist.json`](../contract-tests.allowlist.json) exempts only _pure-presentation primitives_ (decorative illustrations, the icon barrel) and _non-rendering_ components (providers, service-worker registration). Every entry needs a `reason`. Adding a product component to the allowlist fails review — write the spec instead.

The GitHub Actions workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs `contracts:check` and `test:contracts` on every push and pull request.

---

## 9. Review checklist

- [ ] Spec file name matches the component (`<camelCase>.contract.test.ts`).
- [ ] Starts with `expectBaselineContract(src)`.
- [ ] Asserts at least one accessible **name**, **role**, or **state**.
- [ ] Interactive component asserts `expectTouchTargets(src)`.
- [ ] Chart asserts `<DataTableView` (or its SVG is `aria-hidden`).
- [ ] No snapshots, no class-name trivia, no TODOs.
