/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for InstallBanner (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("InstallBanner contract", () => {
  const src = readSource("components/pwa/InstallBanner.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the InstallBanner component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+InstallBanner\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Dismiss\"");
  });

  test("dismiss control is named", () => {
    expect(src).toContain('aria-label="Dismiss"');
  });
});
