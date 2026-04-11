/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

/**
 * Token migration audit — scans every migrated component to verify no
 * hardcoded Tailwind color classes remain and CSS variable tokens are used.
 */

// ---- Helpers ----

function readSrc(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

/**
 * Patterns matching raw Tailwind color- classes that should have been
 * migrated to CSS variable tokens.  We intentionally exclude classes that
 * are legitimate (e.g. `text-white`, `bg-black` used for true white/black,
 * and dynamic `bg-${color}` template literals).
 */
const FORBIDDEN_PATTERNS = [
  // indigo-*  → should be --secondary-*
  /\b(?:bg|text|border)-indigo-\d{2,3}\b/,
  // slate-*  → should be --text-*/--surface-*
  /\b(?:bg|text|border)-slate-\d{2,3}\b/,
  // emerald-* → should be --success-*
  /\b(?:bg|text|border)-emerald-\d{2,3}\b/,
  // red-* → should be --danger-*
  /\b(?:bg|text|border)-red-\d{2,3}\b/,
  // amber-* → should be --warning-*
  /\b(?:bg|text|border)-amber-\d{2,3}\b/,
  // blue-* → should be --info-*
  /\b(?:bg|text|border)-blue-\d{2,3}\b/,
  // gray-* → should be --text-secondary or --surface-secondary
  /\b(?:bg|text|border)-gray-\d{2,3}\b/,
  // zinc/neutral/stone → should be tokens
  /\b(?:bg|text|border)-(?:zinc|neutral|stone)-\d{2,3}\b/,
];

/**
 * Checks for forbidden hardcoded hex colors used inline where tokens should
 * be used. We exempt common safe values like #fff / #000 when used for
 * truly semantic purposes (e.g. button text).
 */
const FORBIDDEN_HEX_INLINE = [
  // Hardcoded teal hex that should now be var(--primary) or var(--primary-text)
  /(?:color|background|border-color)\s*:\s*['"]?#0D9488/i,
  // Hardcoded indigo that should be var(--secondary)
  /(?:color|background|border-color)\s*:\s*['"]?#(?:4C5CFF|6366[fF]1)/i,
];

// ---- Component inventory ----

const MIGRATED_COMPONENTS = [
  "components/settings/CategoryManager.tsx",
  "components/settings/SecurityCard.tsx",
  "components/settings/AccountCard.tsx",
  "components/settings/WorkspaceMembersCard.tsx",
  "components/settings/ExportImportWizard.tsx",
  "components/settings/CSVImport.tsx",
  "components/sync/SyncIndicator.tsx",
  "components/settings/RecurringManager.tsx",
  "components/settings/DataAccountManagement.tsx",
  "components/expenses/ReceiptCapture.tsx",
  "components/settings/AutoRulesManager.tsx",
  "components/settings/CategoryBudgetManager.tsx",
  "components/settings/SettingsAccordion.tsx",
  "app/settings/page.tsx",
  "app/business/page.tsx",
  "app/business/[ledgerId]/page.tsx",
  "components/business/PaymentForm.tsx",
  "components/business/BusinessKpiCards.tsx",
  "components/dashboard/RecurringSuggestions.tsx",
  "components/dashboard/AlertsPanel.tsx",
  "components/pwa/InstallButton.tsx",
  "app/auth/complete/page.tsx",
  "components/settings/SettingsFooterLogout.tsx",
  "components/settings/GoalsManager.tsx",
  "components/dashboard/SpendingHeatmap.tsx",
  "components/dashboard/KpiCards.tsx",
];

// =========== No forbidden Tailwind color classes ===========

describe("token migration: no hardcoded Tailwind color classes", () => {
  for (const componentPath of MIGRATED_COMPONENTS) {
    describe(componentPath, () => {
      let src: string;

      beforeAll(() => {
        src = readSrc(componentPath);
      });

      test("no indigo-* classes", () => {
        expect(src).not.toMatch(FORBIDDEN_PATTERNS[0]);
      });

      test("no slate-* classes", () => {
        expect(src).not.toMatch(FORBIDDEN_PATTERNS[1]);
      });

      test("no emerald-* classes", () => {
        expect(src).not.toMatch(FORBIDDEN_PATTERNS[2]);
      });

      test("no red-* classes", () => {
        expect(src).not.toMatch(FORBIDDEN_PATTERNS[3]);
      });

      test("no amber-* classes", () => {
        expect(src).not.toMatch(FORBIDDEN_PATTERNS[4]);
      });

      test("no blue-* classes", () => {
        expect(src).not.toMatch(FORBIDDEN_PATTERNS[5]);
      });

      test("no gray-* classes", () => {
        expect(src).not.toMatch(FORBIDDEN_PATTERNS[6]);
      });

      test("no zinc/neutral/stone-* classes", () => {
        expect(src).not.toMatch(FORBIDDEN_PATTERNS[7]);
      });
    });
  }
});

// =========== Positive: files use CSS variable tokens ===========

describe("token migration: CSS variable tokens are used", () => {
  test("CategoryManager uses var(--secondary) tokens", () => {
    const src = readSrc("components/settings/CategoryManager.tsx");
    expect(src).toMatch(/var\(--secondary/);
  });

  test("SecurityCard uses semantic tokens (success/warning/danger)", () => {
    const src = readSrc("components/settings/SecurityCard.tsx");
    expect(src).toMatch(/var\(--success/);
    expect(src).toMatch(/var\(--warning/);
    expect(src).toMatch(/var\(--danger/);
  });

  test("AccountCard uses var(--secondary) and var(--danger)", () => {
    const src = readSrc("components/settings/AccountCard.tsx");
    expect(src).toMatch(/var\(--secondary/);
    expect(src).toMatch(/var\(--danger/);
  });

  test("SyncIndicator uses semantic status tokens", () => {
    const src = readSrc("components/sync/SyncIndicator.tsx");
    expect(src).toMatch(/var\(--success/);
  });

  test("ExportImportWizard uses token variables", () => {
    const src = readSrc("components/settings/ExportImportWizard.tsx");
    expect(src).toMatch(/var\(--/);
  });

  test("CSVImport uses token variables", () => {
    const src = readSrc("components/settings/CSVImport.tsx");
    expect(src).toMatch(/var\(--/);
  });

  test("SpendingHeatmap uses var(--text-inverse)", () => {
    const src = readSrc("components/dashboard/SpendingHeatmap.tsx");
    expect(src).toMatch(/var\(--text-inverse\)/);
  });

  test("KpiCards uses var(--text-inverse)", () => {
    const src = readSrc("components/dashboard/KpiCards.tsx");
    expect(src).toMatch(/var\(--text-inverse\)/);
  });
});

// =========== No inline hardcoded hex for brand colors ===========

describe("token migration: no hardcoded hex for brand colors", () => {
  for (const componentPath of MIGRATED_COMPONENTS) {
    test(`${componentPath} has no hardcoded teal/indigo hex`, () => {
      const src = readSrc(componentPath);
      for (const pattern of FORBIDDEN_HEX_INLINE) {
        expect(src).not.toMatch(pattern);
      }
    });
  }
});

// =========== Chart components use var(--text-inverse) instead of #fff ===========

describe("chart Polish: no raw #fff in chart components", () => {
  test("SpendingHeatmap does not use #fff or #ffffff for text fill", () => {
    const src = readSrc("components/dashboard/SpendingHeatmap.tsx");
    // #fff should have been replaced with var(--text-inverse)
    // Exclude common template patterns or CSS that isn't color
    const lines = src.split("\n");
    for (const line of lines) {
      if (line.includes("fill") || line.includes("color")) {
        expect(line).not.toMatch(/#fff(?:fff)?\b/i);
      }
    }
  });

  test("KpiCards does not use #fff for text fill", () => {
    const src = readSrc("components/dashboard/KpiCards.tsx");
    const lines = src.split("\n");
    for (const line of lines) {
      if (line.includes("fill") || line.includes("color")) {
        expect(line).not.toMatch(/#fff(?:fff)?\b/i);
      }
    }
  });
});

// =========== Security: components don't expose sensitive data ===========

describe("security: component files", () => {
  for (const componentPath of MIGRATED_COMPONENTS) {
    test(`${componentPath} has no hardcoded API keys`, () => {
      const src = readSrc(componentPath);
      expect(src).not.toMatch(/(?:api_key|apiKey|API_KEY)\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/);
      expect(src).not.toMatch(/(?:secret|SECRET)\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/);
    });
  }
});

// =========== Performance: no animate-pulse in migrated components ===========

describe("performance: no animate-pulse in premium components", () => {
  test("KpiCards does not use animate-pulse (replaced with shimmer)", () => {
    const src = readSrc("components/dashboard/KpiCards.tsx");
    expect(src).not.toContain("animate-pulse");
  });

  test("BusinessKpiCards does not use animate-pulse", () => {
    const src = readSrc("components/business/BusinessKpiCards.tsx");
    expect(src).not.toContain("animate-pulse");
  });
});

// =========== Accessibility: auth complete page ===========

describe("auth complete page", () => {
  test("uses CSS variable tokens", () => {
    const src = readSrc("app/auth/complete/page.tsx");
    expect(src).toMatch(/var\(--/);
  });
});

// =========== GoalsManager uses goal tokens ===========

describe("GoalsManager", () => {
  test("references goal or success/warning tokens", () => {
    const src = readSrc("components/settings/GoalsManager.tsx");
    const hasGoalTokens = src.includes("var(--goal-") || src.includes("var(--success") || src.includes("var(--warning");
    expect(hasGoalTokens).toBe(true);
  });
});
