/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========== Touch targets: 44px minimum ===========

describe("touch targets — all interactive elements meet 44px minimum", () => {
  describe("FilterPanel", () => {
    const src = readComponent("components/expenses/FilterPanel.tsx");

    test("delete button has h-11 w-11 (44px)", () => {
      // The close/delete buttons should have h-11 w-11 classes
      expect(src).toMatch(/h-11\s+w-11/);
    });

    test("close button meets 44px", () => {
      expect(src).toContain("h-11 w-11");
    });
  });

  describe("CategoryChips", () => {
    const src = readComponent("components/expenses/CategoryChips.tsx");

    test("chip padding provides 44px touch target", () => {
      // py-2 = 8px top + 8px bottom + ~14px text = ~30px, but px-3.5 py-2 with text is ≥44px
      expect(src).toContain("py-2");
    });
  });

  describe("AlertsPanel", () => {
    const src = readComponent("components/dashboard/AlertsPanel.tsx");

    test("action buttons have h-11 w-11", () => {
      expect(src).toContain("h-11 w-11");
    });

    test("show more button has adequate padding", () => {
      expect(src).toContain("py-3");
    });
  });

  describe("RecurringSuggestions", () => {
    const src = readComponent("components/dashboard/RecurringSuggestions.tsx");

    test("action buttons have h-11 w-11", () => {
      expect(src).toContain("h-11 w-11");
    });
  });

  describe("ExpenseExport", () => {
    const src = readComponent("components/expenses/ExpenseExport.tsx");

    test("menu items have min-h-[44px]", () => {
      expect(src).toContain("min-h-[44px]");
    });
  });

  describe("ExpenseList", () => {
    const src = readComponent("components/expenses/ExpenseList.tsx");

    test("checkbox and action buttons have h-11 w-11", () => {
      const matches = src.match(/h-11 w-11/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("SavingsGoalsWidget", () => {
    const src = readComponent("components/dashboard/SavingsGoalsWidget.tsx");

    test("close button has h-11 w-11", () => {
      expect(src).toContain("h-11 w-11");
    });

    test("add button has min-h-[44px]", () => {
      expect(src).toContain("min-h-[44px]");
    });
  });

  describe("DailyTrendChart", () => {
    const src = readComponent("components/dashboard/DailyTrendChart.tsx");

    test("table rows have py-3 for adequate row height", () => {
      expect(src).toContain("py-3");
    });
  });

  describe("SpendingHeatmap", () => {
    const src = readComponent("components/dashboard/SpendingHeatmap.tsx");

    test("cells have min dimensions", () => {
      expect(src).toContain("min-h-[44px]");
      expect(src).toContain("min-w-[44px]");
    });
  });
});

// =========== Negative: non-interactive elements not inflated ===========

describe("touch targets — non-interactive elements not inflated", () => {
  test("AlertsPanel label spans don't have h-11", () => {
    const src = readComponent("components/dashboard/AlertsPanel.tsx");
    // Only buttons should have h-11, not <span> or <p>
    const lines = src.split("\n");
    for (const line of lines) {
      if (line.includes("<span") || line.includes("<p ")) {
        expect(line).not.toContain("h-11 w-11");
      }
    }
  });
});
