/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for CategorySelector (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("CategorySelector contract", () => {
  const src = readSource("components/expenses/CategorySelector.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the CategorySelector component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+CategorySelector\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Select category\"");
    expect(src).toContain("aria-label=\"Add new category\"");
    expect(src).toContain("aria-label=\"New category name\"");
    expect(src).toContain("aria-label=\"Save new category\"");
    expect(src).toContain("aria-label=\"Cancel\"");
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"radiogroup\"");
    expect(src).toContain("role=\"radio\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-checked=");
    expect(src).toContain("aria-pressed=");
  });
});
