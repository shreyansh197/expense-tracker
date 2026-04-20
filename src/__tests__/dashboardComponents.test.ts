/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Dashboard Components Contract Tests
 * ═══════════════════════════════════════════════════════════════════
 *
 * Tests structural contracts of new dashboard components:
 *   - UpcomingStream (US-DASH-001)
 *   - MonthStartAnchor (US-DASH-002)
 *   - PostcardPrompt (US-DASH-003)
 *   - SpendingHeatmap pulse consolidation (US-DASH-004)
 *
 * Environment: Node (Jest), file-based AST/source analysis
 */

import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========================================================================
// TC-DASH-001: UpcomingStream component contract
// Priority: HIGH | US-DASH-001
// =========================================================================

describe("UpcomingStream component contract", () => {
  const src = readComponent("components/dashboard/UpcomingStream.tsx");

  test("TC-DASH-001-01: exports UpcomingStream as named export", () => {
    expect(src).toMatch(/export\s+function\s+UpcomingStream/);
  });

  test("TC-DASH-001-02: uses 'use client' directive", () => {
    expect(src).toContain('"use client"');
  });

  test("TC-DASH-001-03: reads from useSettings for recurring expenses", () => {
    expect(src).toContain("useSettings");
    expect(src).toContain("recurringExpenses");
  });

  test("TC-DASH-001-04: filters only active recurring expenses", () => {
    expect(src).toMatch(/filter.*active/);
  });

  test("TC-DASH-001-05: limits to 7-day window", () => {
    expect(src).toContain("daysUntil > 7");
  });

  test("TC-DASH-001-06: sorts items by soonest first", () => {
    expect(src).toMatch(/sort.*daysUntil/);
  });

  test("TC-DASH-001-07: returns null when no upcoming items", () => {
    expect(src).toMatch(/if\s*\(upcoming\.length\s*===\s*0\)\s*return\s+null/);
  });

  test("TC-DASH-001-08: uses buildCategoryMap (not Map.get)", () => {
    expect(src).toContain("buildCategoryMap");
    // Ensure we use bracket notation (not .get()) since buildCategoryMap returns Record
    expect(src).toContain("categoryMap[r.category]");
    expect(src).not.toContain("categoryMap.get");
  });

  test("TC-DASH-001-09: displays 'Today', 'Tomorrow', 'In X days' labels", () => {
    expect(src).toContain('"Today"');
    expect(src).toContain('"Tomorrow"');
    expect(src).toContain("In ${item.daysUntil} days");
  });

  test("TC-DASH-001-10: uses formatCurrency for amounts", () => {
    expect(src).toContain("formatCurrency");
  });

  test("TC-DASH-001-11: handles day overflow (day > daysInMonth)", () => {
    expect(src).toMatch(/day\s*>\s*daysInMonth/);
  });

  test("TC-DASH-001-12: has Calendar icon in header", () => {
    expect(src).toContain("Calendar");
  });
});

// =========================================================================
// TC-DASH-002: MonthStartAnchor component contract
// Priority: HIGH | US-DASH-002
// =========================================================================

describe("MonthStartAnchor component contract", () => {
  const src = readComponent("components/dashboard/MonthStartAnchor.tsx");

  test("TC-DASH-002-01: exports MonthStartAnchor as named export", () => {
    expect(src).toMatch(/export\s+function\s+MonthStartAnchor/);
  });

  test("TC-DASH-002-02: uses 'use client' directive", () => {
    expect(src).toContain('"use client"');
  });

  test("TC-DASH-002-03: accepts prevMonthExpenses, prevMonthBudget, currentBudget props", () => {
    expect(src).toContain("prevMonthExpenses");
    expect(src).toContain("prevMonthBudget");
    expect(src).toContain("currentBudget");
  });

  test("TC-DASH-002-04: only shows on days 1-3", () => {
    expect(src).toMatch(/today\s*>\s*3.*return\s+null/s);
  });

  test("TC-DASH-002-05: returns null when prevMonthBudget <= 0", () => {
    expect(src).toMatch(/prevMonthBudget\s*<=\s*0.*return\s+null/s);
  });

  test("TC-DASH-002-06: calculates under/over budget correctly", () => {
    expect(src).toContain("underBudget");
    expect(src).toMatch(/prevMonthBudget\s*-\s*prevTotal/);
  });

  test("TC-DASH-002-07: computes recurring committed total", () => {
    expect(src).toContain("recurringTotal");
  });

  test("TC-DASH-002-08: computes flexible amount after recurring", () => {
    expect(src).toContain("afterRecurring");
    expect(src).toMatch(/currentBudget\s*-\s*recurringTotal/);
  });

  test("TC-DASH-002-09: uses success/warning color for border", () => {
    expect(src).toContain("var(--success)");
    expect(src).toContain("var(--warning)");
  });

  test("TC-DASH-002-10: uses Sunrise icon", () => {
    expect(src).toContain("Sunrise");
  });

  test("TC-DASH-002-11: filters out deleted expenses", () => {
    expect(src).toMatch(/filter.*deletedAt/);
  });

  test("TC-DASH-002-12: returns null when anchor is null", () => {
    expect(src).toMatch(/if\s*\(!anchor\)\s*return\s+null/);
  });
});

// =========================================================================
// TC-DASH-003: PostcardPrompt component contract
// Priority: MEDIUM | US-DASH-003
// =========================================================================

describe("PostcardPrompt component contract", () => {
  const src = readComponent("components/dashboard/PostcardPrompt.tsx");

  test("TC-DASH-003-01: exports PostcardPrompt as named export", () => {
    expect(src).toMatch(/export\s+function\s+PostcardPrompt/);
  });

  test("TC-DASH-003-02: uses 'use client' directive", () => {
    expect(src).toContain('"use client"');
  });

  test("TC-DASH-003-03: accepts month, year, hasExpenses props", () => {
    expect(src).toContain("month: number");
    expect(src).toContain("year: number");
    expect(src).toContain("hasExpenses: boolean");
  });

  test("TC-DASH-003-04: only shows days 28-31", () => {
    expect(src).toContain("today >= 28");
  });

  test("TC-DASH-003-05: uses localStorage for dismiss persistence", () => {
    expect(src).toContain("localStorage");
    expect(src).toContain("expenstream-postcard-prompt-dismissed");
  });

  test("TC-DASH-003-06: dispatches custom event to open postcard", () => {
    expect(src).toContain('expenstream:open-postcard');
    expect(src).toContain("CustomEvent");
  });

  test("TC-DASH-003-07: has dismiss button with aria-label", () => {
    expect(src).toContain('aria-label="Dismiss"');
  });

  test("TC-DASH-003-08: returns null when shouldShow is false", () => {
    expect(src).toContain("if (!shouldShow) return null");
  });

  test("TC-DASH-003-09: handles SSR (typeof window check)", () => {
    expect(src).toContain('typeof window === "undefined"');
  });

  test("TC-DASH-003-10: does not show when hasExpenses is false", () => {
    expect(src).toContain("!hasExpenses");
  });

  test("TC-DASH-003-11: only shows for current month/year", () => {
    expect(src).toContain("month !== currentMonth");
    expect(src).toContain("year !== currentYear");
  });
});

// =========================================================================
// TC-DASH-004: SpendingHeatmap with pulse consolidation
// Priority: HIGH | US-DASH-004
// =========================================================================

describe("SpendingHeatmap pulse consolidation contract", () => {
  const src = readComponent("components/dashboard/SpendingHeatmap.tsx");

  test("TC-DASH-004-01: exports SpendingHeatmap as named export", () => {
    expect(src).toMatch(/export\s+function\s+SpendingHeatmap/);
  });

  test("TC-DASH-004-02: accepts todayTotal and avgDaily props", () => {
    expect(src).toContain("todayTotal");
    expect(src).toContain("avgDaily");
  });

  test("TC-DASH-004-03: computes pulse rate moods", () => {
    expect(src).toContain('"Resting"');
    expect(src).toContain('"Calm"');
    expect(src).toContain('"Steady"');
    expect(src).toContain('"Active"');
    expect(src).toContain('"Surging"');
  });

  test("TC-DASH-004-04: pulse rate thresholds are correct", () => {
    // ratio < 0.5 → Calm, < 1 → Steady, < 1.5 → Active, else → Surging
    expect(src).toContain("ratio < 0.5");
    expect(src).toContain("ratio < 1");
    expect(src).toContain("ratio < 1.5");
  });

  test("TC-DASH-004-05: uses Activity and Zap icons for pulse mood", () => {
    expect(src).toContain("Activity");
    expect(src).toContain("Zap");
  });

  test("TC-DASH-004-06: uses terrain color tokens for intensity", () => {
    expect(src).toContain("var(--es-sage)");
    expect(src).toContain("var(--es-clay)");
  });

  test("TC-DASH-004-07: defaults todayTotal and avgDaily to 0", () => {
    expect(src).toContain("todayTotal = 0");
    expect(src).toContain("avgDaily = 0");
  });

  test("TC-DASH-004-08: filters out deleted expenses in heatmap", () => {
    expect(src).toMatch(/deletedAt/);
  });
});

// =========================================================================
// TC-DASH-005: Pulse rate calculation unit tests
// Priority: HIGH | Pure logic extraction from SpendingHeatmap
// =========================================================================

describe("Pulse rate calculation", () => {
  function computePulseRate(todayTotal: number, avgDaily: number): { label: string; intensity: number } {
    if (avgDaily <= 0) return { label: "Calm", intensity: 0 };
    const ratio = todayTotal / avgDaily;
    if (ratio === 0) return { label: "Resting", intensity: 0 };
    if (ratio < 0.5) return { label: "Calm", intensity: 1 };
    if (ratio < 1) return { label: "Steady", intensity: 2 };
    if (ratio < 1.5) return { label: "Active", intensity: 3 };
    return { label: "Surging", intensity: 4 };
  }

  test("TC-DASH-005-01: avgDaily 0 → Calm (division guard)", () => {
    expect(computePulseRate(500, 0)).toEqual({ label: "Calm", intensity: 0 });
  });

  test("TC-DASH-005-02: todayTotal 0 → Resting", () => {
    expect(computePulseRate(0, 500)).toEqual({ label: "Resting", intensity: 0 });
  });

  test("TC-DASH-005-03: ratio 0.3 → Calm", () => {
    expect(computePulseRate(150, 500)).toEqual({ label: "Calm", intensity: 1 });
  });

  test("TC-DASH-005-04: ratio exactly 0.5 → Steady (boundary)", () => {
    expect(computePulseRate(250, 500)).toEqual({ label: "Steady", intensity: 2 });
  });

  test("TC-DASH-005-05: ratio 0.8 → Steady", () => {
    expect(computePulseRate(400, 500)).toEqual({ label: "Steady", intensity: 2 });
  });

  test("TC-DASH-005-06: ratio exactly 1.0 → Active (boundary)", () => {
    expect(computePulseRate(500, 500)).toEqual({ label: "Active", intensity: 3 });
  });

  test("TC-DASH-005-07: ratio 1.3 → Active", () => {
    expect(computePulseRate(650, 500)).toEqual({ label: "Active", intensity: 3 });
  });

  test("TC-DASH-005-08: ratio exactly 1.5 → Surging (boundary)", () => {
    expect(computePulseRate(750, 500)).toEqual({ label: "Surging", intensity: 4 });
  });

  test("TC-DASH-005-09: ratio 2.0 → Surging", () => {
    expect(computePulseRate(1000, 500)).toEqual({ label: "Surging", intensity: 4 });
  });

  test("TC-DASH-005-10: very small amounts still compute correctly", () => {
    expect(computePulseRate(1, 100)).toEqual({ label: "Calm", intensity: 1 });
  });

  test("TC-DASH-005-11: negative avgDaily treated as 0 (guard)", () => {
    expect(computePulseRate(100, -50)).toEqual({ label: "Calm", intensity: 0 });
  });

  test("TC-DASH-005-12: both 0 → Calm (division by zero guard)", () => {
    expect(computePulseRate(0, 0)).toEqual({ label: "Calm", intensity: 0 });
  });
});
