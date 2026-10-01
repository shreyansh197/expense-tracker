/// <reference types="jest" />
import { readSource, expectBaselineContract, expectTouchTargets } from "./helpers/contractAssertions";

/**
 * Accessibility contract for DataTableView (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("DataTableView contract", () => {
  const src = readSource("components/ui/DataTableView.tsx");

  test("meets the baseline accessibility contract", () => {
    expectBaselineContract(src);
  });

  test("exports the DataTableView component", () => {
    expect(src).toMatch(/export\s+(default\s+)?function\s+DataTableView\b/);
  });

  test("exposes its semantic roles", () => {
    expect(src).toContain("role=\"status\"");
    expect(src).toContain("role=\"region\"");
    expect(src).toContain("role=\"table\"");
  });

  test("exposes state to assistive technology", () => {
    expect(src).toContain("aria-pressed=");
    expect(src).toContain("aria-live=");
  });

  test("interactive targets meet the 44px minimum", () => {
    expectTouchTargets(src);
  });

  test("toggle is a keyboard-operable button with a stable accessible name", () => {
    expect(src).toContain('type="button"');
    expect(src).toContain("aria-pressed={showTable}");
    expect(src).toContain("aria-controls={regionId}");
    expect(src).toContain("aria-label={`Data table for ${title}`}");
  });

  test("announces the view change through a polite live region", () => {
    expect(src).toContain('aria-live="polite"');
    expect(src).toContain("showing data table with");
    expect(src).toContain("showing chart.");
  });

  test("renders a semantic table with caption, column and row headers", () => {
    expect(src).toContain("<caption");
    expect(src).toContain('scope="col"');
    expect(src).toContain('scope={col.rowHeader ? "row" : undefined}');
  });

  test("cells render the exact formatter output the chart uses", () => {
    expect(src).toContain("{col.cell(row)}");
  });

  test("never scrolls horizontally; long tables scroll in a focusable region", () => {
    expect(src).toContain("table-fixed");
    expect(src).toContain("break-words");
    expect(src).toContain("overflow-y-auto");
    expect(src).not.toContain("overflow-x-auto");
    expect(src).toContain("tabIndex={0}");
  });

  test("chart view keeps an accessible summary for screen readers", () => {
    expect(src).toContain("Use the Table button for exact values.");
  });
});
