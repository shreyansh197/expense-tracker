/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";
import { readSource, expectBaselineContract, expectTouchTargets } from "./helpers/contractAssertions";

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
      "components/ui/DatePicker.tsx",
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

// =========== M4 inventory — baseline contract for every remaining component ===========
//
// Components without a dedicated `<name>.contract.test.ts` are locked here
// (docs/CONTRACT_TESTS.md §8). Each entry applies the shared baseline contract
// plus the accessible names / roles / states the component must keep.

interface InventoryEntry {
  path: string;
  mustContain?: string[];
  touchTargets?: boolean;
}

const INVENTORY: InventoryEntry[] = [
  { path: "components/analytics/AnomalyCallout.tsx" },
  { path: "components/analytics/ComparisonView.tsx" },
  { path: "components/analytics/PredictiveBurnBar.tsx", mustContain: ['role="img"'] },
  { path: "components/app/PinLock.tsx", mustContain: ['aria-label="PIN entry"', 'aria-live="assertive"'] },
  { path: "components/business/BusinessExport.tsx", mustContain: ["<button"] },
  { path: "components/business/LedgerCard.tsx", mustContain: ['role="progressbar"', 'aria-label="Collection progress"'] },
  { path: "components/dashboard/BudgetVsActuals.tsx", mustContain: ["No category data yet for this month."] },
  { path: "components/dashboard/FingerprintBlob.tsx", mustContain: ["<DataTableView", 'aria-hidden="true"'] },
  { path: "components/dashboard/MoneyDnaCard.tsx", mustContain: ["aria-expanded={expanded}"] },
  { path: "components/dashboard/NarrativeInsight.tsx", mustContain: ['aria-live="polite"', 'aria-atomic="true"'] },
  { path: "components/expenses/EchoCard.tsx", mustContain: ['role="status"', 'aria-live="polite"', "useReducedMotion"] },
  { path: "components/expenses/ExpenseFormModal.tsx", mustContain: ["<BottomSheet"] },
  { path: "components/motion/RevealOnScroll.tsx", mustContain: ["whileInView"] },
  { path: "components/motion/RouteTransition.tsx" },
  { path: "components/motion/SuccessFlash.tsx" },
  { path: "components/onboarding/NewUserChecklist.tsx", mustContain: ["<h2", "<Link"] },
  { path: "components/pwa/AppReviewPrompt.tsx", mustContain: ['role="dialog"', 'aria-label="Dismiss review prompt"'] },
  { path: "components/pwa/RecoveryCodeBanner.tsx", mustContain: ['role="alert"', 'aria-label="Dismiss recovery code reminder"'] },
  { path: "components/pwa/UpdateBanner.tsx", mustContain: ['type="button"', "A new version is available"] },
  { path: "components/settings/PinLockSettings.tsx", mustContain: ["htmlFor={timeoutId}", "id={timeoutId}", 'aria-label={step === "setup" ? "New 4-digit PIN" : "Confirm PIN"}'] },
  { path: "components/settings/RateSourceInfo.tsx", mustContain: ["<button"] },
  { path: "components/settings/ThemeToggle.tsx", mustContain: ["aria-label={`Theme: ${theme}. Tap to switch.`}"] },
  { path: "components/ui/AnimatedNumber.tsx", mustContain: ["useReducedMotion"] },
  { path: "components/ui/EmptyState.tsx" },
  { path: "components/ui/ErrorBoundary.tsx", mustContain: ["<h2", "<button"] },
  { path: "components/ui/FormError.tsx", mustContain: ['role="alert"'] },
  { path: "components/ui/InfoTooltip.tsx", mustContain: ['role="tooltip"', 'aria-label="Close tooltip"', "aria-describedby"] },
  { path: "components/ui/KeyboardShortcutsHelp.tsx", mustContain: ['role="dialog"', 'aria-modal="true"', 'aria-label="Close keyboard shortcuts"'] },
  { path: "components/ui/MoneyEcho.tsx", mustContain: ["useReducedMotion", "pointer-events-none"] },
  { path: "components/ui/PullToRefreshIndicator.tsx", mustContain: ["pointer-events-none"] },
  { path: "components/ui/charts/AreaChart.tsx", mustContain: ['aria-hidden="true"'] },
  { path: "components/ui/charts/DonutChart.tsx", mustContain: ['aria-hidden="true"'] },
  { path: "components/ui/charts/Sparkline.tsx", mustContain: ['aria-hidden="true"'] },
  { path: "components/ui/charts/TerrainBarGroup.tsx", mustContain: ['aria-hidden="true"'] },
];

describe("accessibility contracts — M4 component inventory", () => {
  test.each(INVENTORY.map((e) => [e.path, e] as const))("%s meets its contract", (_path, entry) => {
    const src = readSource(entry.path);
    expectBaselineContract(src);
    for (const needle of entry.mustContain ?? []) expect(src).toContain(needle);
    if (entry.touchTargets) expectTouchTargets(src);
  });

  test("app root honours prefers-reduced-motion for every Framer animation", () => {
    const providers = readSource("app/providers.tsx");
    expect(providers).toContain('<MotionConfig reducedMotion="user">');
    const css = readSource("app/globals.css");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
