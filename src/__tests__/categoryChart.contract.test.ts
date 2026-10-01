/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for CategoryChart (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("CategoryChart contract", () => {
  const src = readSource("components/dashboard/CategoryChart.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the CategoryChart component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+CategoryChart\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"View mode\"");
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"img\"");
    expect(src).toContain("role=\"group\"");
    expect(src).toContain("role=\"table\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-pressed=");
  });
});
