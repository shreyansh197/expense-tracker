/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for SpendingStream (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("SpendingStream contract", () => {
  const src = readSource("components/dashboard/SpendingStream.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("summarises the stream for screen readers", () => {
    expect(src).toContain('role="img"');
    expect(src).toMatch(/aria-label=\{`Spending stream: \$\{Math\.round\(clamped\)\}% of budget used/);
  });

  test("is explorable by keyboard and dismissible with Escape", () => {
    expect(src).toContain("Use arrow keys to explore");
    expect(src).toContain('e.key === "Escape"');
  });

  test("honours reduced motion for the flowing stream", () => {
    expect(src).toContain("useReducedMotion");
  });
});
