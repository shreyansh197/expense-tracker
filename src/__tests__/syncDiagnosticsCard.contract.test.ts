/// <reference types="jest" />
import { readSource, expectBaselineContract, expectTouchTargets } from "./helpers/contractAssertions";

/**
 * Accessibility contract for SyncDiagnosticsCard (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("SyncDiagnosticsCard contract", () => {
  const src = readSource("components/settings/SyncDiagnosticsCard.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the SyncDiagnosticsCard component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+SyncDiagnosticsCard\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Sync diagnostics\"");
    expect(src).toContain("aria-label=\"Reset sync diagnostics counters\"");
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"region\"");
    expect(src).toContain("role=\"status\"");
    expect(src).toContain("role=\"list\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-live=");
  });

  test("interactive targets meet the 44px minimum", () => {
    expectTouchTargets(src);
  });
});
