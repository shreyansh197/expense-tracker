/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for StickyReveal (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("StickyReveal contract", () => {
  const src = readSource("components/motion/StickyReveal.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the StickyReveal component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+StickyReveal\b/);
  });

  test("pins with a zero-height sticky rail so revealing never shifts the page", () => {
    expect(src).toContain("sticky top-0 z-[var(--z-sticky)] h-0");
  });

  test("animates in and out with tokenised variants", () => {
    expect(src).toContain("<AnimatePresence");
    expect(src).toContain("stickyReveal");
  });

  test("swaps movement for a cross-fade under reduced motion", () => {
    expect(src).toContain("useReducedMotion");
    expect(src).toContain("reducedMotion ? fadeUpReduced : stickyReveal");
  });

  test("Home pins the compact money-spent bar through StickyReveal (regression: abrupt bar)", () => {
    const page = readSource("app/page.tsx");
    expect(page).toContain("<StickyReveal show={heroScrolledOut && !heroLoading && expenses.length > 0}>");
    expect(page).not.toMatch(/\{heroScrolledOut && !heroLoading && expenses\.length > 0 && \(/);
    const hero = readSource("components/dashboard/MonthSummaryHero.tsx");
    expect(hero).not.toContain("sticky top-0 z-[var(--z-sticky)] backdrop-blur-md");
  });
});
