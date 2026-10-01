/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for AppShell (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("AppShell contract", () => {
  const src = readSource("components/layout/AppShell.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the AppShell component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+AppShell\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Loading ExpenStream\"");
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"alert\"");
    expect(src).toContain("role=\"status\"");
  });

  test("provides the main landmark and announces loading", () => {
    expect(src).toContain("<main");
    expect(src).toContain('role="status"');
  });
});
