/// <reference types="jest" />
import { readSource, expectBaselineContract, expectSemanticClickTargets } from "./helpers/contractAssertions";

/**
 * Accessibility contract for QuickAddSheet (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("QuickAddSheet contract", () => {
  const src = readSource("components/layout/QuickAddSheet.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the QuickAddSheet component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+QuickAddSheet\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Close\"");
  });

  test("close control is named and Enter submits the quick amount", () => {
    expect(src).toContain('aria-label="Close"');
    expect(src).toContain('e.key === "Enter"');
  });

  test("uses real buttons for every action", () => {
    expectSemanticClickTargets(src);
  });
});
