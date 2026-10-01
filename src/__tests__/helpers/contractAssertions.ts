/// <reference types="jest" />
/**
 * Shared accessibility-contract assertions (M4 — see docs/CONTRACT_TESTS.md).
 *
 * The Jest environment is `node` (no DOM), so contracts are locked through
 * source-level assertions. Every helper strips comments first so a rule cannot
 * be satisfied — or violated — by prose.
 */
import * as fs from "fs";
import * as path from "path";

/** Read a file relative to `src/` (e.g. `components/ui/DataTableView.tsx`). */
export function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relativePath), "utf-8");
}

/** Remove block, line, and JSX comments so assertions only see executable code. */
export function stripComments(src: string): string {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

/** No debug logging in shipped components (IMPLEMENTATION_RULES §0.4). */
export function expectNoDebugLogging(src: string): void {
  expect(stripComments(src)).not.toMatch(/console\.(log|debug|info)\(/);
}

/** No raw HTML injection (IMPLEMENTATION_RULES §17). */
export function expectNoDangerousHtml(src: string): void {
  expect(stripComments(src)).not.toContain("dangerouslySetInnerHTML");
}

/** Positive tabindex breaks visual/focus order (SCREEN_GUIDELINES §15). */
export function expectNoPositiveTabIndex(src: string): void {
  expect(stripComments(src)).not.toMatch(/tabIndex=\{\s*[1-9]/);
}

/** Every `<img>` carries an `alt` (empty alt allowed for decorative images). */
export function expectImagesHaveAlt(src: string): void {
  const imgs = [...stripComments(src).matchAll(/<img\b([^>]*)>/g)];
  for (const [, attrs] of imgs) expect(attrs).toMatch(/\balt=/);
}

/**
 * If a component suppresses the native outline it must supply a visible
 * replacement (`focus-visible:` / `focus:` ring, border, outline, or background).
 */
export function expectFocusIndicator(src: string): void {
  const code = stripComments(src);
  const suppresses = /\boutline-none\b|outline:\s*["']?none/.test(code);
  if (!suppresses) return;
  expect(code).toMatch(/focus(-visible|-within)?:(ring|border|outline|shadow|bg)/);
}

/**
 * JS-driven animation loops cannot be neutralised by the global CSS
 * `prefers-reduced-motion` rule or `<MotionConfig reducedMotion="user">`,
 * so they must consult the preference themselves.
 */
export function expectReducedMotionAware(src: string): void {
  const code = stripComments(src);
  const jsAnimation = /requestAnimationFrame\(\s*(tick|step|loop|animate|frame)\b/.test(code);
  if (!jsAnimation) return;
  expect(code).toMatch(/useReducedMotion|prefers-reduced-motion|reducedMotion/);
}

/** Interactive controls meet the ≥ 44 × 44 px target (DESIGN_SYSTEM §17.1). */
export function expectTouchTargets(src: string): void {
  expect(src).toMatch(/min-h-\[4[48]px\]|min-h-11|min-h-12|\bh-11\b|\bh-12\b|min-w-\[44px\]|\bh-\[44px\]/);
}

/** No hard-coded hex colours outside `var(--token, #fallback)` fallbacks. */
export function expectNoHardcodedHex(src: string): void {
  const code = stripComments(src).replace(/var\(--[\w-]+,\s*#[0-9a-fA-F]{3,8}\)/g, "");
  expect(code).not.toMatch(/["'`\s(]#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/);
}

/** Non-semantic elements with `onClick` must expose a role (or be an aria-hidden backdrop). */
export function expectSemanticClickTargets(src: string): void {
  const code = stripComments(src);
  const offenders = [...code.matchAll(/<(div|span|li|p|section|m\.div|m\.span)\b([^>]*?)\bonClick=/g)]
    .map(([, , attrs]) => attrs)
    .filter((attrs) => !/\brole=/.test(attrs) && !/aria-hidden/.test(attrs));
  expect(offenders).toEqual([]);
}

/**
 * Baseline invariants every component contract applies. Component-specific
 * assertions (names, roles, states) are layered on top in each spec.
 */
export function expectBaselineContract(src: string): void {
  expectNoDebugLogging(src);
  expectNoDangerousHtml(src);
  expectNoPositiveTabIndex(src);
  expectImagesHaveAlt(src);
  expectFocusIndicator(src);
  expectReducedMotionAware(src);
}
