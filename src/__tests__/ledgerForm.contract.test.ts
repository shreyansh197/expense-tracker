/// <reference types="jest" />
import { readSource, expectBaselineContract, expectTouchTargets } from "./helpers/contractAssertions";

/**
 * Accessibility contract for LedgerForm (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("LedgerForm contract", () => {
  const src = readSource("components/business/LedgerForm.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the LedgerForm component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+LedgerForm\b/);
  });

  test("interactive elements keep their accessible names", () => {
    expect(src).toContain("aria-label=\"Clear date\"");
  });

  test("interactive targets meet the 44px minimum", () => {
    expectTouchTargets(src);
  });

  test("every field is programmatically labelled", () => {
    for (const field of ["name", "amount", "status", "tag", "notes"]) {
      expect(src).toContain(`htmlFor={\`\${fieldId}-${field}\`}`);
      expect(src).toContain(`id={\`\${fieldId}-${field}\`}`);
    }
  });

  test("invalid amount is exposed to assistive technology", () => {
    expect(src).toContain("aria-invalid={amountInvalid || undefined}");
  });

  test("tag remove buttons are named", () => {
    expect(src).toMatch(/aria-label=\{`Remove tag \$\{tag\}`\}/);
  });
});
