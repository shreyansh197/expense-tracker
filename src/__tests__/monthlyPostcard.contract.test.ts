/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for MonthlyPostcard (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("MonthlyPostcard contract", () => {
  const src = readSource("components/dashboard/MonthlyPostcard.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the MonthlyPostcard component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+MonthlyPostcard\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Share month summary\"");
    expect(src).toContain("aria-label=\"Close\"");
  });

  test("share and close controls are named", () => {
    expect(src).toContain('aria-label="Share month summary"');
    expect(src).toContain('aria-label="Close"');
  });
});
