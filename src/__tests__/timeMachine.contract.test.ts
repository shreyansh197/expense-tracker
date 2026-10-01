/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for TimeMachine (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("TimeMachine contract", () => {
  const src = readSource("components/analytics/TimeMachine.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the TimeMachine component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+TimeMachine\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Copy scenario as text\"");
  });

  test("scenario inputs are programmatically labelled", () => {
    expect(src).toContain("htmlFor={`${fieldId}-category`}");
    expect(src).toContain("id={`${fieldId}-category`}");
    expect(src).toContain("htmlFor={`${fieldId}-amount`}");
    expect(src).toContain("id={`${fieldId}-amount`}");
  });

  test("saved scenarios can be deleted by name", () => {
    expect(src).toMatch(/aria-label=\{`Delete saved scenario: \$\{s\.name\}`\}/);
  });

  test("action buttons meet the 44px touch target", () => {
    expect(src).toContain("min-h-[44px]");
  });
});
