/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for GoalFundingSheet (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("GoalFundingSheet contract", () => {
  const src = readSource("components/goals/GoalFundingSheet.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the GoalFundingSheet component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+GoalFundingSheet\b/);
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"progressbar\"");
  });

  test("renders inside the focus-trapped BottomSheet with a label", () => {
    expect(src).toContain('<BottomSheet open={!!goal} onClose={onClose} label="Fund savings goal">');
  });

  test("exposes goal progress as a progressbar with bounds", () => {
    expect(src).toContain("aria-valuemin={0}");
    expect(src).toContain("aria-valuemax={100}");
  });
});
