/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

// ---- Helpers ----

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========== BottomSheet contract ===========

describe("BottomSheet component contract", () => {
  const src = readComponent("components/ui/BottomSheet.tsx");

  test("exports DISMISS_THRESHOLD constant", () => {
    expect(src).toMatch(/const DISMISS_THRESHOLD\s*=\s*\d+/);
  });

  test("DISMISS_THRESHOLD is 100", () => {
    const match = src.match(/DISMISS_THRESHOLD\s*=\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(parseInt(match![1], 10)).toBe(100);
  });

  test("uses spring.default for entrance animation", () => {
    expect(src).toContain("spring.default");
  });

  test("uses duration.exit for exit animation", () => {
    expect(src).toContain("duration.exit");
  });

  test("imports from motion/tokens", () => {
    expect(src).toMatch(/from\s+["']@\/lib\/motion\/tokens["']/);
  });

  test("uses var(--surface) background token", () => {
    expect(src).toContain("var(--surface)");
  });

  test("uses var(--border) for border token", () => {
    expect(src).toContain("var(--border)");
  });

  test("uses role='dialog' for accessibility", () => {
    expect(src).toContain('role="dialog"');
  });

  test("uses aria-modal='true'", () => {
    expect(src).toContain('aria-modal="true"');
  });

  test("supports aria-label via label prop", () => {
    expect(src).toContain("aria-label={label}");
  });

  test("uses useFocusTrap for keyboard navigation", () => {
    expect(src).toContain("useFocusTrap");
  });

  test("handles visualViewport resize for mobile keyboard", () => {
    expect(src).toContain("visualViewport");
  });

  test("handles touch events for swipe-to-dismiss", () => {
    expect(src).toContain("onTouchStart");
    expect(src).toContain("onTouchMove");
    expect(src).toContain("onTouchEnd");
  });

  test("calculates opacity fade during drag", () => {
    // Opacity decreases as drag increases, clamped at 0.5
    expect(src).toMatch(/Math\.max\(1\s*-\s*dragY\s*\/\s*300,\s*0\.5\)/);
  });
});

// =========== Skeleton component contract ===========

describe("Skeleton component contract", () => {
  const src = readComponent("components/ui/Skeleton.tsx");

  test("uses var(--surface-secondary) for background", () => {
    expect(src).toContain("var(--surface-secondary)");
  });

  test("uses shimmer animation", () => {
    expect(src).toContain("shimmer");
  });

  test("shimmer animation is 1.8s ease-in-out infinite", () => {
    expect(src).toContain("shimmer 1.8s ease-in-out infinite");
  });

  test("uses var(--surface-hover) in gradient", () => {
    expect(src).toContain("var(--surface-hover)");
  });

  test("uses cn() for class merging", () => {
    expect(src).toContain("cn(");
  });

  test("accepts className prop", () => {
    expect(src).toContain("className?:");
  });

  test("exports named Skeleton function", () => {
    expect(src).toMatch(/export\s+function\s+Skeleton/);
  });

  test("does not use hardcoded color classes", () => {
    expect(src).not.toMatch(/bg-(gray|slate|zinc|neutral|stone)-\d/);
  });
});

// =========== Loading route files use Skeleton ===========

describe("loading.tsx files use Skeleton component", () => {
  const loadingPaths = [
    "app/settings/loading.tsx",
    "app/business/loading.tsx",
    "app/business/[ledgerId]/loading.tsx",
    "app/expenses/loading.tsx",
    "app/category/[slug]/loading.tsx",
  ];

  test.each(loadingPaths)("%s imports from Skeleton", (relPath) => {
    const src = readComponent(relPath);
    expect(src).toContain("@/components/ui/Skeleton");
  });

  test.each(loadingPaths)("%s renders skeleton placeholders", (relPath) => {
    const src = readComponent(relPath);
    // Loading files use Skeleton component which internally provides aria attributes
    expect(src).toContain("<Skeleton");
  });
});

// =========== Skeleton sub-components ===========

describe("Skeleton sub-components", () => {
  const src = readComponent("components/ui/Skeleton.tsx");

  test("exports SkeletonKpiCards", () => {
    expect(src).toMatch(/export\s+function\s+SkeletonKpiCards/);
  });

  test("exports SkeletonChart", () => {
    expect(src).toMatch(/export\s+function\s+SkeletonChart/);
  });

  test("SkeletonKpiCards uses card-sm class token", () => {
    expect(src).toContain("card-sm");
  });

  test("SkeletonKpiCards has accessibility attributes", () => {
    expect(src).toContain('aria-label="Loading');
  });
});

// =========== Variant barrel export ===========

describe("motion barrel export", () => {
  const src = readComponent("lib/motion/index.ts");

  test("re-exports tokens", () => {
    expect(src).toContain("./tokens");
  });

  test("re-exports variants", () => {
    expect(src).toContain("./variants");
  });
});

// =========== Safe area completeness ===========

describe("safe area inset contracts", () => {
  test("BottomNav uses env(safe-area-inset-bottom)", () => {
    const src = readComponent("components/layout/BottomNav.tsx");
    expect(src).toContain("safe-area-inset-bottom");
  });

  test("BottomSheet uses env(safe-area-inset-bottom)", () => {
    const src = readComponent("components/ui/BottomSheet.tsx");
    expect(src).toContain("safe-area-inset-bottom");
  });

  test("Toast uses env(safe-area-inset-bottom)", () => {
    const src = readComponent("components/ui/Toast.tsx");
    expect(src).toContain("safe-area-inset-bottom");
  });

  test("PaymentList uses env(safe-area-inset-bottom)", () => {
    const src = readComponent("components/business/PaymentList.tsx");
    expect(src).toContain("safe-area-inset-bottom");
  });

  test("DashboardCustomizer uses env(safe-area-inset-top) and bottom", () => {
    const src = readComponent("components/dashboard/DashboardCustomizer.tsx");
    expect(src).toContain("safe-area-inset-top");
    expect(src).toContain("safe-area-inset-bottom");
  });

  test("WelcomeTutorial uses env(safe-area-inset-top) and bottom", () => {
    const src = readComponent("components/onboarding/WelcomeTutorial.tsx");
    expect(src).toContain("safe-area-inset-top");
    expect(src).toContain("safe-area-inset-bottom");
  });

  test("AuthModal uses env(safe-area-inset-bottom)", () => {
    const src = readComponent("components/onboarding/AuthModal.tsx");
    expect(src).toContain("safe-area-inset-bottom");
  });

  test("OfflineScreen uses env(safe-area-inset-top)", () => {
    const src = readComponent("components/app/OfflineScreen.tsx");
    expect(src).toContain("safe-area-inset-top");
  });
});

// =========== Touch target contracts ===========

describe("touch target contracts — critical regression guards", () => {
  test("FilterPanel delete button is not p-0.5 (was 12px)", () => {
    const src = readComponent("components/expenses/FilterPanel.tsx");
    // Must NOT have the original p-0.5 on the delete button
    expect(src).not.toMatch(/className="[^"]*p-0\.5[^"]*"[^>]*aria-label="Clear/);
  });

  test("SavingsGoalsWidget close button is not h-7 w-7 (was 28px)", () => {
    const src = readComponent("components/dashboard/SavingsGoalsWidget.tsx");
    expect(src).not.toMatch(/h-7 w-7/);
  });
});

// =========== aria-label contracts ===========

describe("aria-label contracts — interactive elements", () => {
  test("DatePicker trigger has aria-expanded", () => {
    const src = readComponent("components/ui/DatePicker.tsx");
    expect(src).toContain("aria-expanded={open}");
  });

  test("CategoryTrendChart has role=img", () => {
    const src = readComponent("components/dashboard/CategoryTrendChart.tsx");
    expect(src).toContain('role="img"');
  });

  test("SubscriptionsSummary toggle has aria-expanded", () => {
    const src = readComponent("components/dashboard/SubscriptionsSummary.tsx");
    expect(src).toContain("aria-expanded={expanded}");
  });
});
