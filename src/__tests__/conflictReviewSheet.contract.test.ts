/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", relativePath), "utf-8");
}

/**
 * Contract / visual-invariant test for the ConflictReviewSheet (T-2.3.2).
 *
 * The project's jest environment renders logic, not DOM, so visual invariants
 * are locked via source assertions (mirroring BottomSheet/accessibility contract
 * tests): the sheet must stay keyboard-operable, reduced-motion respectful, use
 * design tokens only, and offer exactly the two deterministic resolution choices.
 */
describe("ConflictReviewSheet contract", () => {
  const src = readComponent("components/sync/ConflictReviewSheet.tsx");

  test("renders inside a focus-trapped, reduced-motion BottomSheet", () => {
    // BottomSheet provides role=dialog, useFocusTrap, and useReducedMotion.
    expect(src).toContain("BottomSheet");
    expect(src).toMatch(/from\s+["']@\/components\/ui\/BottomSheet["']/);
  });

  test("opens exactly when there is a pending money conflict", () => {
    expect(src).toContain("getPendingMoneyConflicts");
    expect(src).toContain("onMoneyConflictsChange");
    expect(src).toMatch(/open=\{total > 0\}/);
  });

  test("shows both contested values side by side", () => {
    expect(src).toContain("This device");
    expect(src).toContain("Other device");
    expect(src).toContain("current.localValue");
    expect(src).toContain("current.serverValue");
    expect(src).toContain('role="group"');
  });

  test("offers only the two deterministic resolution choices (no bogus merge)", () => {
    expect(src).toContain('handleResolve("mine")');
    expect(src).toContain('handleResolve("theirs")');
    expect(src).toContain("resolveMoneyConflict");
    // Money is scalar — there is no automatic merge path.
    expect(src).not.toMatch(/handleResolve\(["']merge["']\)/);
  });

  test("formats money through the currency helper, never raw", () => {
    expect(src).toContain("useCurrency");
    expect(src).toContain("formatCurrency(current.localValue)");
    expect(src).toContain("formatCurrency(current.serverValue)");
  });

  test("uses design-system tokens only (no hard-coded hex)", () => {
    expect(src).toContain("var(--surface-secondary)");
    expect(src).toContain("var(--warning-soft)");
    expect(src).toContain("var(--text-inverse)");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  test("action buttons meet the 48px touch-target minimum", () => {
    expect(src).toContain("min-h-[48px]");
  });
});
