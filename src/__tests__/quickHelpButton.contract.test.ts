/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for QuickHelpButton (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("QuickHelpButton contract", () => {
  const src = readSource("components/ui/QuickHelpButton.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the QuickHelpButton component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+QuickHelpButton\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Quick help\"");
  });

  test("trigger exposes expanded state and controls the panel", () => {
    expect(src).toContain("aria-expanded={open}");
    expect(src).toContain("aria-controls={open ? panelId : undefined}");
  });

  test("panel is a labelled dialog that closes on Escape", () => {
    expect(src).toContain('aria-label="Quick tips"');
    expect(src).toContain('e.key !== "Escape"');
    expect(src).toContain('aria-label="Close quick tips"');
  });

  test("trigger meets the 44px touch target", () => {
    expect(src).toContain("h-11 w-11 justify-center");
  });
});
