/// <reference types="jest" />
import { readSource, expectBaselineContract, expectTouchTargets } from "./helpers/contractAssertions";

/**
 * Accessibility contract for MonthSwitcher (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("MonthSwitcher contract", () => {
  const src = readSource("components/layout/MonthSwitcher.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the MonthSwitcher component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+MonthSwitcher\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Previous month\"");
    expect(src).toContain("aria-label=\"Next month\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-live=");
  });

  test("interactive targets meet the 44px minimum", () => {
    expectTouchTargets(src);
  });

  test("previous/next controls are named 44px buttons", () => {
    expect(src).toContain('aria-label="Previous month"');
    expect(src).toContain('aria-label="Next month"');
    expect(src).toContain("h-11 w-11");
  });

  test("announces the month politely when it changes", () => {
    expect(src).toContain('aria-live="polite"');
    expect(src).toContain('aria-atomic="true"');
  });
});
