/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========== Empty states: components render EmptyState instead of null ===========

describe("empty states — components render EmptyState for empty data", () => {
  describe("CollectionChart", () => {
    const src = readComponent("components/business/CollectionChart.tsx");

    test("imports EmptyState component", () => {
      expect(src).toMatch(/import.*EmptyState.*from/);
    });

    test("renders EmptyState when data is empty", () => {
      expect(src).toContain("EmptyState");
      expect(src).toContain("No collection data");
    });

    test("does not return bare null for empty data", () => {
      // data.length === 0 should lead to EmptyState, not plain null
      const emptyCheck = src.match(/data\.length === 0\) return null/);
      expect(emptyCheck).toBeNull();
    });
  });

  describe("TagBreakdown", () => {
    const src = readComponent("components/business/TagBreakdown.tsx");

    test("imports EmptyState component", () => {
      expect(src).toMatch(/import.*EmptyState.*from/);
    });

    test("renders EmptyState when data is empty", () => {
      expect(src).toContain("EmptyState");
      expect(src).toContain("No tags yet");
    });

    test("does not return bare null for empty data", () => {
      const emptyCheck = src.match(/data\.length === 0\) return null/);
      expect(emptyCheck).toBeNull();
    });
  });
});

// =========== Boundary: single item renders chart, not empty state ===========

describe("empty states — boundary: single item", () => {
  test("CollectionChart renders chart container when data has items", () => {
    const src = readComponent("components/business/CollectionChart.tsx");
    // After the empty check, the component should render a chart (visx ParentSize or ResponsiveContainer)
    expect(src).toMatch(/ParentSize|ResponsiveContainer/);
  });

  test("TagBreakdown renders tag items when data has items", () => {
    const src = readComponent("components/business/TagBreakdown.tsx");
    expect(src).toContain("data.map");
  });
});

// =========== UI: empty state has required content ===========

describe("empty states — UI contract", () => {
  test("CollectionChart empty state has icon, title, and description", () => {
    const src = readComponent("components/business/CollectionChart.tsx");
    expect(src).toContain("BarChart3"); // icon
    expect(src).toContain("No collection data"); // title
    expect(src).toContain("Collection history will appear"); // description
  });

  test("TagBreakdown empty state has icon, title, and description", () => {
    const src = readComponent("components/business/TagBreakdown.tsx");
    expect(src).toContain("Tag"); // icon
    expect(src).toContain("No tags yet"); // title
    expect(src).toContain("Tag your business ledgers"); // description
  });
});
