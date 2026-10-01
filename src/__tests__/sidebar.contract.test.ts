/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for Sidebar (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("Sidebar contract", () => {
  const src = readSource("components/layout/Sidebar.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the Sidebar component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+Sidebar\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Sidebar\"");
    expect(src).toContain("aria-label=\"Sidebar navigation\"");
    expect(src).toContain("aria-label=\"Budget used\"");
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"progressbar\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-current=");
  });
});
