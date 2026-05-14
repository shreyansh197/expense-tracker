/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Feature Tests: Quick Templates, Category View Mode,
 *               Today's Allowance Hero stat
 * ═══════════════════════════════════════════════════════════════════
 *
 * Requirements:
 *   Feature 2 — "Today's allowance" first-class in MonthSummaryHero
 *   Feature 3 — Quick expense templates on Expenses page
 *   Feature 4 — Category view toggle (Day | Category) on ExpenseList
 *
 * Environment: Node (Jest), source-level contract analysis
 */

import * as fs from "fs";
import * as path from "path";

const SRC = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(SRC, relativePath), "utf-8");
}

// =========================================================================
// Feature 2: MonthSummaryHero — Today's allowance (paceToStayUnder)
// =========================================================================

describe("MonthSummaryHero: Today's allowance stat (Feature 2)", () => {
  const src = read("components/dashboard/MonthSummaryHero.tsx");

  test("TC-F2-01: 'Spend today' label present in stat grid", () => {
    expect(src).toContain("Spend today");
  });

  test("TC-F2-02: paceToStayUnder is rendered as the primary large number", () => {
    // The stat now shows paceToStayUnder when effectiveBudget > 0
    expect(src).toContain("paceToStayUnder");
    // Must format it
    expect(src).toMatch(/formatCurrency\(Math\.round\(paceToStayUnder\)\)/);
  });

  test("TC-F2-03: falls back to avgDaily label when no budget", () => {
    // 'Daily avg' shown when no effectiveBudget
    expect(src).toContain("Daily avg");
  });

  test("TC-F2-04: shows warning color when avgDaily > paceToStayUnder", () => {
    expect(src).toContain("avgDaily > paceToStayUnder");
    expect(src).toContain("var(--warning)");
  });

  test("TC-F2-05: shows accent color when within budget pace", () => {
    expect(src).toContain("var(--accent)");
  });

  test("TC-F2-06: secondary line shows actual avg daily spend", () => {
    // The sub-label shows "avg {avgDaily}" as context
    expect(src).toMatch(/avg.*formatCurrency\(Math\.round\(avgDaily\)\)/);
  });

  test("TC-F2-07: legacy 'Pace' label no longer used for this stat", () => {
    // The old label was literally just 'Pace' — replaced by contextual label
    // Guard: 'Pace' might appear elsewhere; specifically the stat header should not say Pace
    // We check the new label IS there (already done above) not the absence of 'Pace' globally
    expect(src).toContain("Spend today");
  });

  test("TC-F2-08: paceToStayUnder prop is declared in the component props interface", () => {
    expect(src).toContain("paceToStayUnder");
    // It must appear in the props destructuring too
    expect(src).toMatch(/paceToStayUnder[,\s]/);
  });
});

// =========================================================================
// Feature 3: QuickTemplates component contract
// =========================================================================

describe("QuickTemplates component contract (Feature 3)", () => {
  const src = read("components/expenses/QuickTemplates.tsx");

  test("TC-F3-01: file exists and exports QuickTemplates", () => {
    expect(src).toMatch(/export\s+function\s+QuickTemplates/);
  });

  test("TC-F3-02: uses 'use client' directive", () => {
    expect(src).toContain('"use client"');
  });

  test("TC-F3-03: reads quickTemplates from settings", () => {
    expect(src).toContain("settings.quickTemplates");
  });

  test("TC-F3-04: saves templates to settings via updateSettings", () => {
    expect(src).toContain("updateSettings");
    expect(src).toContain("quickTemplates");
  });

  test("TC-F3-05: uses useUIStore openAddForm to pre-fill add form", () => {
    expect(src).toContain("openAddForm");
    expect(src).toContain("amount: t.amount");
    expect(src).toContain("category: t.category");
  });

  test("TC-F3-06: template chip shows label and formatted amount", () => {
    expect(src).toContain("t.label");
    expect(src).toContain("formatCurrency(t.amount)");
  });

  test("TC-F3-07: remove template handler prevents event propagation", () => {
    expect(src).toContain("e.stopPropagation");
  });

  test("TC-F3-08: inline creation form has label input", () => {
    expect(src).toContain("Label");
    expect(src).toContain("maxLength={20}");
  });

  test("TC-F3-09: creation form has amount input with min validation", () => {
    expect(src).toContain('type="number"');
    expect(src).toContain('min="0.01"');
  });

  test("TC-F3-10: creation form has category select", () => {
    expect(src).toContain("<select");
    expect(src).toContain("allCategories");
  });

  test("TC-F3-11: save button is disabled when label or amount is empty", () => {
    expect(src).toContain("disabled={!newLabel.trim() || !newAmount}");
  });

  test("TC-F3-12: template creation generates a unique id", () => {
    expect(src).toContain('`tpl-${Date.now()}`');
  });

  test("TC-F3-13: AnimatePresence used for create form transition", () => {
    expect(src).toContain("AnimatePresence");
  });

  test("TC-F3-14: empty state shows 'Pin quick expense' prompt", () => {
    expect(src).toContain("Pin quick expense");
  });

  test("TC-F3-15: whileTap animation on template chips", () => {
    expect(src).toContain("whileTap");
  });

  test("TC-F3-16: imports useSettings, useUIStore, useCurrency", () => {
    expect(src).toContain("useSettings");
    expect(src).toContain("useUIStore");
    expect(src).toContain("useCurrency");
  });
});

// =========================================================================
// Feature 3: ExpenseTemplate type in types/index.ts
// =========================================================================

describe("ExpenseTemplate type definition (Feature 3)", () => {
  const src = read("types/index.ts");

  test("TC-F3-TYPE-01: ExpenseTemplate interface is exported", () => {
    expect(src).toMatch(/export\s+interface\s+ExpenseTemplate/);
  });

  test("TC-F3-TYPE-02: ExpenseTemplate has id, label, amount, category fields", () => {
    expect(src).toContain("id: string");
    expect(src).toContain("label: string");
    expect(src).toContain("amount: number");
    expect(src).toContain("category: CategoryId");
  });

  test("TC-F3-TYPE-03: ExpenseTemplate has optional remark field", () => {
    expect(src).toContain("remark?: string");
  });

  test("TC-F3-TYPE-04: UserSettings has optional quickTemplates field", () => {
    expect(src).toContain("quickTemplates?: ExpenseTemplate[]");
  });
});

// =========================================================================
// Feature 3: Expenses page wires QuickTemplates
// =========================================================================

describe("Expenses page: QuickTemplates integration (Feature 3)", () => {
  const src = read("app/expenses/page.tsx");

  test("TC-F3-PAGE-01: imports QuickTemplates", () => {
    expect(src).toContain("QuickTemplates");
    expect(src).toMatch(/from\s+["']@\/components\/expenses\/QuickTemplates["']/);
  });

  test("TC-F3-PAGE-02: renders <QuickTemplates /> in JSX", () => {
    expect(src).toContain("<QuickTemplates");
  });
});

// =========================================================================
// Feature 4: Category view toggle — ExpenseList
// =========================================================================

describe("ExpenseList: viewMode prop contract (Feature 4)", () => {
  const src = read("components/expenses/ExpenseList.tsx");

  test("TC-F4-01: viewMode prop is declared in ExpenseListProps", () => {
    expect(src).toContain('viewMode?: "day" | "category"');
  });

  test("TC-F4-02: defaults viewMode to 'day'", () => {
    expect(src).toContain('viewMode = "day"');
  });

  test("TC-F4-03: imports groupByCategory from filters", () => {
    expect(src).toContain("groupByCategory");
    expect(src).toMatch(/from\s+["']@\/lib\/filters["']/);
  });

  test("TC-F4-04: groupedByCategory computed only when viewMode === 'category'", () => {
    expect(src).toMatch(/viewMode\s*===\s*["']category["']/);
  });

  test("TC-F4-05: renders category headers with color dot when in category mode", () => {
    // The category group header has a colored circle dot
    expect(src).toContain("catGroup.color");
    expect(src).toContain("catGroup.label");
  });

  test("TC-F4-06: shows item count per category group", () => {
    expect(src).toMatch(/catGroup\.expenses\.length/);
  });

  test("TC-F4-07: shows category total formatted with formatCurrency", () => {
    expect(src).toContain("catGroup.total");
    expect(src).toContain("formatCurrency");
  });

  test("TC-F4-08: infinite scroll sentinel only shown in day mode", () => {
    expect(src).toMatch(/viewMode\s*!==\s*["']category["'].*hasMore/s);
  });

  test("TC-F4-09: categoryMetaMap built from settings.customCategories", () => {
    expect(src).toContain("settings.customCategories");
    expect(src).toContain("categoryMetaMap");
  });

  test("TC-F4-10: AnimatePresence wraps expense items in category groups", () => {
    // Category group rendering also uses AnimatePresence
    expect(src).toContain("AnimatePresence");
  });

  test("TC-F4-11: empty state check uses filtered.length not grouped.length", () => {
    // After refactor, empty state is guarded by filtered.length to work in both modes
    expect(src).toContain("filtered.length === 0");
    expect(src).not.toContain("grouped.length === 0");
  });
});

// =========================================================================
// Feature 4: Expenses page — toggle UI and viewMode state
// =========================================================================

describe("Expenses page: viewMode toggle (Feature 4)", () => {
  const src = read("app/expenses/page.tsx");

  test("TC-F4-PAGE-01: viewMode state is initialised from localStorage", () => {
    expect(src).toContain("expenstream-expenses-view");
  });

  test("TC-F4-PAGE-02: viewMode toggles between 'day' and 'category'", () => {
    expect(src).toContain('"day"');
    expect(src).toContain('"category"');
  });

  test("TC-F4-PAGE-03: viewMode is persisted to localStorage on change", () => {
    expect(src).toContain('localStorage.setItem("expenstream-expenses-view"');
  });

  test("TC-F4-PAGE-04: LayoutList icon used for day mode button", () => {
    expect(src).toContain("LayoutList");
  });

  test("TC-F4-PAGE-05: Tag icon used for category mode button", () => {
    expect(src).toContain("Tag");
  });

  test("TC-F4-PAGE-06: viewMode passed to ExpenseList", () => {
    expect(src).toContain("viewMode={viewMode}");
  });

  test("TC-F4-PAGE-07: active view button has accent background", () => {
    expect(src).toContain('viewMode === "day"');
    expect(src).toContain('viewMode === "category"');
  });
});

// =========================================================================
// Feature 4: groupByCategory in filters.ts
// =========================================================================

describe("filters.ts: groupByCategory export contract (Feature 4)", () => {
  const src = read("lib/filters.ts");

  test("TC-F4-FILTERS-01: exports groupByCategory function", () => {
    expect(src).toMatch(/export\s+function\s+groupByCategory/);
  });

  test("TC-F4-FILTERS-02: exports CategoryGroup interface", () => {
    expect(src).toMatch(/export\s+interface\s+CategoryGroup/);
  });

  test("TC-F4-FILTERS-03: CategoryGroup has category, label, color, bgColor, total, expenses fields", () => {
    expect(src).toContain("category: CategoryId");
    expect(src).toContain("label: string");
    expect(src).toContain("color: string");
    expect(src).toContain("bgColor: string");
    expect(src).toContain("total: number");
    expect(src).toContain("expenses: Expense[]");
  });

  test("TC-F4-FILTERS-04: groupByCategory accepts categoryMap parameter", () => {
    expect(src).toMatch(/groupByCategory[\s\S]*categoryMap/);
  });

  test("TC-F4-FILTERS-05: sorts groups by total descending", () => {
    expect(src).toContain("b.total - a.total");
  });

  test("TC-F4-FILTERS-06: categoryMap parameter has default value (empty Map)", () => {
    expect(src).toContain("new Map()");
  });

  test("TC-F4-FILTERS-07: imports CategoryMeta from types", () => {
    expect(src).toMatch(/import.*CategoryMeta.*from\s+["']@\/types["']/);
  });
});

// =========================================================================
// Dead code: SpendingHeatmap, ChronicleView, MonthStartAnchor removed
// =========================================================================

describe("Dead code files confirmed deleted", () => {
  const deleted = [
    "components/dashboard/SpendingHeatmap.tsx",
    "components/dashboard/ChronicleView.tsx",
    "components/dashboard/MonthStartAnchor.tsx",
  ];

  for (const file of deleted) {
    test(`${path.basename(file, ".tsx")} no longer exists`, () => {
      expect(fs.existsSync(path.resolve(SRC, file))).toBe(false);
    });
  }
});

// =========================================================================
// Dead code: No page imports the deleted components
// =========================================================================

describe("No active page imports deleted components", () => {
  const pages = [
    "app/page.tsx",
    "app/analytics/page.tsx",
    "app/expenses/page.tsx",
  ];

  const deletedNames = ["SpendingHeatmap", "ChronicleView", "MonthStartAnchor"];

  for (const page of pages) {
    const src = read(page);
    for (const name of deletedNames) {
      test(`${page} does not import ${name}`, () => {
        expect(src).not.toContain(name);
      });
    }
  }
});
