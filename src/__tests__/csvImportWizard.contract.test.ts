/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for CSVImportWizard (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("CSVImportWizard contract", () => {
  const src = readSource("components/expenses/CSVImportWizard.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the CSVImportWizard component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+CSVImportWizard\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Close\"");
  });

  test("names the wizard with a heading and a labelled close control", () => {
    expect(src).toContain("Import from CSV");
    expect(src).toContain('aria-label="Close"');
  });
});
