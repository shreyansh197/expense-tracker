/// <reference types="jest" />
/**
 * ═══════════════════════════════════════════════════════════════════
 * ExpenStream — Deleted Component Cleanup Verification
 * ═══════════════════════════════════════════════════════════════════
 *
 * Requirements Traceability:
 *   US-CLEANUP-001  Remove dead dashboard components (Task 1)
 *   US-CLEANUP-002  No orphan imports remain after deletion
 *   US-CLEANUP-003  Dashboard page uses new components only
 *
 * Verifies that the 11 deleted files are actually gone and
 * that no remaining files import from them.
 *
 * Environment: Node (Jest), filesystem checks
 */

import * as fs from "fs";
import * as path from "path";

const SRC = path.resolve(__dirname, "..");

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.resolve(SRC, relativePath));
}

// =========================================================================
// TC-CLEAN-001: Deleted component files no longer exist
// Priority: HIGH | US-CLEANUP-001
// =========================================================================

describe("Deleted component files are removed", () => {
  const deletedFiles = [
    "components/dashboard/KpiCards.tsx",
    "components/dashboard/AlertsPanel.tsx",
    "components/dashboard/DailyTrendChart.tsx",
    "components/dashboard/SmartInsights.tsx",
    "components/dashboard/SpendingInsights.tsx",
    "components/dashboard/SpendingComparison.tsx",
    "components/dashboard/AchievementsCard.tsx",
    "components/dashboard/SubscriptionsSummary.tsx",
    "components/dashboard/SpendingPulse.tsx",
  ];

  for (const file of deletedFiles) {
    const name = path.basename(file, ".tsx");
    test(`TC-CLEAN-001-${name}: ${file} does not exist`, () => {
      expect(fileExists(file)).toBe(false);
    });
  }
});

// =========================================================================
// TC-CLEAN-002: Deleted library files no longer exist
// Priority: HIGH | US-CLEANUP-001
// =========================================================================

describe("Deleted library files are removed", () => {
  test("TC-CLEAN-002-01: offlineQueue.ts deleted", () => {
    expect(fileExists("lib/offlineQueue.ts")).toBe(false);
  });
});

// =========================================================================
// TC-CLEAN-003: Deleted test files no longer exist
// Priority: MEDIUM | US-CLEANUP-001
// =========================================================================

describe("Deleted test files are removed", () => {
  const deletedTests = [
    "__tests__/spendingInsights.test.ts",
    "__tests__/offlineQueue.test.ts",
  ];

  for (const file of deletedTests) {
    const name = path.basename(file, ".test.ts");
    test(`TC-CLEAN-003-${name}: ${file} does not exist`, () => {
      expect(fileExists(file)).toBe(false);
    });
  }
});

// =========================================================================
// TC-CLEAN-004: No orphan imports in dashboard page
// Priority: HIGH | US-CLEANUP-002
// =========================================================================

describe("Dashboard page has no orphan imports", () => {
  const dashboardSrc = fs.readFileSync(
    path.resolve(SRC, "app", "page.tsx"),
    "utf-8",
  );

  const removedComponents = [
    "KpiCards",
    "AlertsPanel",
    "DailyTrendChart",
    "SmartInsights",
    "SpendingInsights",
    "SpendingComparison",
    "AchievementsCard",
    "SubscriptionsSummary",
    "SpendingPulse",
  ];

  for (const comp of removedComponents) {
    test(`TC-CLEAN-004-${comp}: no import of ${comp}`, () => {
      expect(dashboardSrc).not.toContain(`import { ${comp}`);
      expect(dashboardSrc).not.toContain(`import ${comp}`);
      expect(dashboardSrc).not.toContain(`from "./${comp}"`);
      expect(dashboardSrc).not.toContain(`from "../${comp}"`);
    });

    test(`TC-CLEAN-004-${comp}-use: no JSX usage of <${comp}`, () => {
      expect(dashboardSrc).not.toContain(`<${comp}`);
    });
  }
});

// =========================================================================
// TC-CLEAN-005: New dashboard components are present
// Priority: HIGH | US-CLEANUP-003
// =========================================================================

describe("Dashboard page uses new components", () => {
  const dashboardSrc = fs.readFileSync(
    path.resolve(SRC, "app", "page.tsx"),
    "utf-8",
  );

  test("TC-CLEAN-005-01: imports UpcomingStream", () => {
    expect(dashboardSrc).toContain("UpcomingStream");
  });

  test("TC-CLEAN-005-02: imports MonthStartAnchor", () => {
    expect(dashboardSrc).toContain("MonthStartAnchor");
  });

  test("TC-CLEAN-005-03: imports PostcardPrompt", () => {
    expect(dashboardSrc).toContain("PostcardPrompt");
  });

  test("TC-CLEAN-005-04: imports SpendingHeatmap", () => {
    expect(dashboardSrc).toContain("SpendingHeatmap");
  });

  test("TC-CLEAN-005-05: imports useNotifications", () => {
    expect(dashboardSrc).toContain("useNotifications");
  });

  test("TC-CLEAN-005-06: passes todayTotal to SpendingHeatmap", () => {
    expect(dashboardSrc).toContain("todayTotal");
  });

  test("TC-CLEAN-005-07: passes avgDaily to SpendingHeatmap", () => {
    expect(dashboardSrc).toContain("avgDaily");
  });
});

// =========================================================================
// TC-CLEAN-006: New component files exist
// Priority: HIGH | Verifies all new files were created
// =========================================================================

describe("New component files exist", () => {
  const newFiles = [
    "components/dashboard/UpcomingStream.tsx",
    "components/dashboard/MonthStartAnchor.tsx",
    "components/dashboard/PostcardPrompt.tsx",
    "components/settings/NotificationSettings.tsx",
    "hooks/useNotifications.ts",
    "lib/pushSubscription.ts",
    "app/api/push/subscribe/route.ts",
    "app/api/push/send/route.ts",
    "app/api/push/vapid-key/route.ts",
  ];

  for (const file of newFiles) {
    const name = path.basename(file).replace(/\.[^.]+$/, "");
    test(`TC-CLEAN-006-${name}: ${file} exists`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }
});
