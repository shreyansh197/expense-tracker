/// <reference types="jest" />
import { readSource, expectBaselineContract } from "./helpers/contractAssertions";

/**
 * Accessibility contract for ConfirmDialog (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("ConfirmDialog contract", () => {
  const src = readSource("components/ui/ConfirmDialog.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the ConfirmProvider component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+ConfirmProvider\b/);
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"dialog\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-modal=");
  });

  test("is a labelled modal dialog with a focus trap", () => {
    expect(src).toContain('aria-modal="true"');
    expect(src).toContain("aria-label={pending.options.title}");
    expect(src).toContain("useFocusTrap");
  });

  test("Escape cancels and focus returns to the trigger", () => {
    expect(src).toContain('e.key === "Escape"');
    expect(src).toContain("triggerRef.current.focus()");
  });

  test("type-to-confirm input is programmatically labelled", () => {
    expect(src).toContain("htmlFor={confirmInputId}");
    expect(src).toContain("id={confirmInputId}");
  });
});
