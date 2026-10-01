/// <reference types="jest" />
import { readSource, expectBaselineContract, expectSemanticClickTargets } from "./helpers/contractAssertions";

/**
 * Accessibility contract for SpendingChallenges (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("SpendingChallenges contract", () => {
  const src = readSource("components/dashboard/SpendingChallenges.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the SpendingChallenges component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+SpendingChallenges\b/);
  });

  test("names the section with a heading", () => {
    expect(src).toMatch(/<h3[^>]*>Challenges<\/h3>/);
  });

  test("uses real buttons for every action", () => {
    expect(src).toContain("<button");
    expectSemanticClickTargets(src);
  });
});
