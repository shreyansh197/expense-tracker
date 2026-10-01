/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for WatcherConstellation (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("WatcherConstellation contract", () => {
  const src = readSource("components/ui/WatcherConstellation.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the WatcherConstellation component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+WatcherConstellation\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Spending insight\"");
    expect(src).toContain("aria-label=\"Insight history\"");
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"dialog\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-expanded=");
  });
});
