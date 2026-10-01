/// <reference types="jest" />
import { readSource, expectBaselineContract, expectTouchTargets } from "./helpers/contractAssertions";

/**
 * Accessibility contract for SyncDeadLetterBanner (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("SyncDeadLetterBanner contract", () => {
  const src = readSource("components/sync/SyncDeadLetterBanner.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the SyncDeadLetterBanner component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+SyncDeadLetterBanner\b/);
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"region\"");
    expect(src).toContain("role=\"list\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-live=");
    expect(src).toContain("aria-expanded={expanded}");
    expect(src).toContain("aria-controls=\"sync-dead-letter-list\"");
  });

  test("renders nothing when the dead-letter queue is empty", () => {
    expect(src).toContain("if (deadLetter.length === 0) return null;");
  });

  test("exposes retry and discard as the only recovery actions", () => {
    expect(src).toContain("handleRetry(m.localId)");
    expect(src).toContain("handleDiscard(m.localId)");
    expect(src).toMatch(/aria-label=\{`Retry \$\{m\.table\} \$\{m\.operation\}`\}/);
    expect(src).toMatch(/aria-label=\{`Discard \$\{m\.table\} \$\{m\.operation\}`\}/);
  });

  test("interactive targets meet the 44px minimum", () => {
    expectTouchTargets(src);
  });
});
