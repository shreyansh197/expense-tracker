/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for SpendingForecastCalendar (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("SpendingForecastCalendar contract", () => {
  const src = readSource("components/analytics/SpendingForecastCalendar.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the SpendingForecastCalendar component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+SpendingForecastCalendar\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Spending forecast calendar\"");
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"grid\"");
    expect(src).toContain("role=\"gridcell\"");
  });
});
