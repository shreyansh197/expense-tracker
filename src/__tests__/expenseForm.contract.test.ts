/// <reference types="jest" />
import { readSource, expectBaselineContract, expectTouchTargets } from "./helpers/contractAssertions";

/**
 * Accessibility contract for ExpenseForm (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("ExpenseForm contract", () => {
  const src = readSource("components/expenses/ExpenseForm.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the ExpenseForm component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+ExpenseForm\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Amount keypad\"");
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"group\"");
    expect(src).toContain("role=\"alert\"");
  });

  test("interactive targets meet the 44px minimum", () => {
    expectTouchTargets(src);
  });
});
