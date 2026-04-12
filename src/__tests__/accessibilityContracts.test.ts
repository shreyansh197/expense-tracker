/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========== aria-label presence on interactive components ===========

describe("accessibility contracts — aria-labels", () => {
  describe("ExpenseExport", () => {
    const src = readComponent("components/expenses/ExpenseExport.tsx");

    test("export trigger has aria-label", () => {
      expect(src).toMatch(/aria-label="Export expenses"/);
    });

    test("CSV button has aria-label", () => {
      expect(src).toMatch(/aria-label="Export as CSV"/);
    });

    test("JSON button has aria-label", () => {
      expect(src).toMatch(/aria-label="Export as JSON"/);
    });
  });

  describe("SubscriptionsSummary", () => {
    const src = readComponent("components/dashboard/SubscriptionsSummary.tsx");

    test("toggle button has aria-expanded", () => {
      expect(src).toContain("aria-expanded");
    });

    test("toggle button has aria-label", () => {
      expect(src).toContain("aria-label");
    });
  });

  describe("CategoryTrendChart", () => {
    const src = readComponent("components/dashboard/CategoryTrendChart.tsx");

    test("chart container has role=img", () => {
      expect(src).toContain('role="img"');
    });

    test("chart container has aria-label", () => {
      expect(src).toContain("aria-label");
    });
  });

  describe("DashboardCustomizer", () => {
    const src = readComponent("components/dashboard/DashboardCustomizer.tsx");

    test("customize trigger has aria-label", () => {
      expect(src).toContain('aria-label="Customize dashboard"');
    });

    test("close button has aria-label", () => {
      expect(src).toContain('aria-label="Close customizer"');
    });

    test("reset button has aria-label", () => {
      expect(src).toContain('aria-label="Reset dashboard to default layout"');
    });

    test("save button has aria-label", () => {
      expect(src).toContain('aria-label="Save dashboard layout"');
    });

    test("drag handle has aria-label", () => {
      expect(src).toContain('aria-label="Drag to reorder"');
    });
  });

  describe("DatePicker", () => {
    const src = readComponent("components/ui/DatePicker.tsx");

    test("trigger button has aria-label with current date", () => {
      expect(src).toMatch(/aria-label=\{`Select date/);
    });

    test("trigger button has aria-expanded", () => {
      expect(src).toContain("aria-expanded={open}");
    });

    test("day buttons have aria-label with full date", () => {
      expect(src).toMatch(/aria-label=\{`\$\{MONTH_NAMES/);
    });

    test("day buttons have aria-pressed", () => {
      expect(src).toContain("aria-pressed={day === value}");
    });

    test("previous month has aria-label", () => {
      expect(src).toContain('aria-label="Previous month"');
    });

    test("next month has aria-label", () => {
      expect(src).toContain('aria-label="Next month"');
    });

    test("today shortcut has aria-label", () => {
      expect(src).toContain('aria-label="Jump to today"');
    });

    test("day grid has role=grid", () => {
      expect(src).toContain('role="grid"');
    });

    test("keyboard navigation handler exists", () => {
      expect(src).toContain("handleGridKeyDown");
      expect(src).toContain("ArrowRight");
      expect(src).toContain("ArrowLeft");
      expect(src).toContain("ArrowDown");
      expect(src).toContain("ArrowUp");
    });
  });
});

// =========== Security: aria-labels don't contain HTML ===========

describe("accessibility contracts — security", () => {
  test("aria-labels use plain text, not dangerous HTML", () => {
    const files = [
      "components/expenses/ExpenseExport.tsx",
      "components/dashboard/DashboardCustomizer.tsx",
      "components/ui/DatePicker.tsx",
      "components/dashboard/CategoryTrendChart.tsx",
    ];

    for (const file of files) {
      const src = readComponent(file);
      const ariaLabels = src.match(/aria-label="[^"]*"/g) || [];
      for (const label of ariaLabels) {
        expect(label).not.toMatch(/<[a-z]/i); // No HTML tags in aria-labels
        expect(label).not.toContain("dangerouslySetInnerHTML");
      }
    }
  });
});
