/// <reference types="jest" />
/**
 * Phase F component contracts — source-level verification
 * Verifies accessibility attributes, CSS token usage, structural patterns,
 * and type safety for all Phase F components.
 */
import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========== AchievementsCard UI CONTRACT ===========

describe("AchievementsCard component contract", () => {
  const src = readComponent("components/dashboard/AchievementsCard.tsx");

  // -- Accessibility --
  test("has role='progressbar' for achievement progress", () => {
    expect(src).toContain('role="progressbar"');
  });

  test("has aria-valuenow on progress bar", () => {
    expect(src).toContain("aria-valuenow");
  });

  test("has aria-valuemin on progress bar", () => {
    expect(src).toContain("aria-valuemin={0}");
  });

  test("has aria-valuemax on progress bar", () => {
    expect(src).toContain("aria-valuemax");
  });

  test("has aria-label on progress bar", () => {
    expect(src).toContain("aria-label={`${unlockedCount} of ${totalCount} achievements unlocked`}");
  });

  test("achievement icons have role='img' with aria-label", () => {
    expect(src).toContain('role="img"');
    expect(src).toContain("aria-label={def.name}");
  });

  // -- CSS Token Usage --
  test("uses var(--accent) token", () => {
    expect(src).toContain("var(--accent)");
  });

  test("uses var(--surface-secondary) token", () => {
    expect(src).toContain("var(--surface-secondary)");
  });

  test("uses var(--text-secondary) token", () => {
    expect(src).toContain("var(--text-secondary)");
  });

  test("uses var(--text-muted) token", () => {
    expect(src).toContain("var(--text-muted)");
  });

  test("does NOT contain hardcoded hex colors", () => {
    // Match hex patterns like #fff, #AABBCC — exclude emoji character escapes
    const hexMatches = src.match(/#[0-9A-Fa-f]{3,6}(?=[^0-9A-Fa-f])/g) || [];
    expect(hexMatches).toHaveLength(0);
  });

  // -- Structure --
  test("uses Framer Motion (m) for animations", () => {
    expect(src).toContain("m.");
  });

  test("uses AnimatePresence for celebration banner exit animation", () => {
    expect(src).toContain("AnimatePresence");
  });

  test("uses Confetti component", () => {
    expect(src).toContain("Confetti");
  });

  test("renders achievement count as fraction (X/Y)", () => {
    expect(src).toContain("{unlockedCount}/{totalCount}");
  });

  test("shows celebration banner with 'Achievement Unlocked!' text", () => {
    expect(src).toContain("Achievement Unlocked!");
  });

  test("uses tabular-nums for count display", () => {
    expect(src).toContain("tabular-nums");
  });

  test("has section title heading", () => {
    expect(src).toContain("Achievements");
  });

  test("uses Award icon from lucide-react", () => {
    expect(src).toContain("Award");
  });

  // -- Badge grid layout --
  test("renders badges in a 5-column grid", () => {
    expect(src).toContain("grid-cols-5");
  });

  test("locked badges have reduced opacity", () => {
    expect(src).toContain("opacity: unlocked ? 1 : 0.4");
  });
});

// =========== SpendingInsights UI CONTRACT ===========

describe("SpendingInsights component contract", () => {
  const src = readComponent("components/dashboard/SpendingInsights.tsx");

  // -- Accessibility --
  test("has section title heading", () => {
    expect(src).toContain("Spending Insights");
  });

  // -- CSS Token Usage --
  test("uses var(--accent) token", () => {
    expect(src).toContain("var(--accent)");
  });

  test("uses var(--surface-secondary) token for insight cards", () => {
    expect(src).toContain("var(--surface-secondary)");
  });

  test("uses var(--success-text) for positive sentiment", () => {
    expect(src).toContain("var(--success-text)");
  });

  test("uses var(--danger-text) for negative sentiment", () => {
    expect(src).toContain("var(--danger-text)");
  });

  test("uses var(--text-muted) token", () => {
    expect(src).toContain("var(--text-muted)");
  });

  test("does NOT contain hardcoded hex colors", () => {
    const hexMatches = src.match(/#[0-9A-Fa-f]{3,6}(?=[^0-9A-Fa-f])/g) || [];
    expect(hexMatches).toHaveLength(0);
  });

  // -- Structure --
  test("uses 2-column grid for insight cards", () => {
    expect(src).toContain("grid-cols-2");
  });

  test("uses Framer Motion for animations", () => {
    expect(src).toContain("m.div");
  });

  test("returns null when no insights available", () => {
    expect(src).toContain("if (insights.length === 0) return null");
  });

  test("caps insights at 4 maximum", () => {
    expect(src).toContain("results.slice(0, 4)");
  });

  test("imports BarChart3 icon for section", () => {
    expect(src).toContain("BarChart3");
  });

  test("uses useMemo for insight computation", () => {
    expect(src).toContain("useMemo");
  });

  // -- Insight types --
  test("handles month-over-month insight", () => {
    expect(src).toContain("vs Last Month");
  });

  test("handles weekend pattern insight", () => {
    expect(src).toContain("Weekend Pattern");
  });

  test("handles category shift insight", () => {
    expect(src).toContain("Category Shift");
  });

  test("handles cheapest day insight", () => {
    expect(src).toContain("Cheapest Day");
  });

  test("handles recurring share insight", () => {
    expect(src).toContain("Recurring Share");
  });
});

// =========== AccentColorPicker UI CONTRACT ===========

describe("AccentColorPicker component contract", () => {
  const src = readComponent("components/settings/AccentColorPicker.tsx");

  // -- Accessibility --
  test("uses role='radiogroup' for color selection", () => {
    expect(src).toContain('role="radiogroup"');
  });

  test("uses role='radio' for individual options", () => {
    expect(src).toContain('role="radio"');
  });

  test("uses aria-checked for selected state", () => {
    expect(src).toContain("aria-checked={isActive}");
  });

  test("uses aria-label for radio group", () => {
    expect(src).toContain('aria-label="Accent color"');
  });

  test("uses aria-label on each button", () => {
    expect(src).toContain("aria-label={preset.label}");
  });

  // -- CSS Token Usage --
  test("uses var(--surface-secondary) token", () => {
    expect(src).toContain("var(--surface-secondary)");
  });

  test("uses var(--accent) token for active indicator", () => {
    expect(src).toContain("var(--accent)");
  });

  test("uses var(--text-primary) token", () => {
    expect(src).toContain("var(--text-primary)");
  });

  test("uses var(--text-muted) token", () => {
    expect(src).toContain("var(--text-muted)");
  });

  // -- Structure --
  test("uses 4-column grid for color swatches", () => {
    expect(src).toContain("grid-cols-4");
  });

  test("uses Check icon for selected state", () => {
    expect(src).toContain("Check");
  });

  test("defaults to 'purple' when no color selected", () => {
    expect(src).toContain('currentColor || "purple"');
  });

  test("uses Framer Motion for swatch animations", () => {
    expect(src).toContain("whileTap");
    expect(src).toContain("m.div");
  });

  test("check icon renders white (#fff) for contrast", () => {
    expect(src).toContain('color="#fff"');
  });

  // -- applyAccentColor function --
  test("exports applyAccentColor function", () => {
    expect(src).toContain("export function applyAccentColor");
  });

  test("handles SSR by checking typeof document", () => {
    expect(src).toContain('typeof document === "undefined"');
  });

  test("detects dark mode via classList.contains('dark')", () => {
    expect(src).toContain('classList.contains("dark")');
  });

  test("sets --accent CSS variable", () => {
    expect(src).toContain('setProperty("--accent"');
  });

  test("sets --accent-soft CSS variable", () => {
    expect(src).toContain('setProperty("--accent-soft"');
  });

  test("removes overrides via removeProperty", () => {
    expect(src).toContain('removeProperty("--accent")');
    expect(src).toContain('removeProperty("--accent-soft")');
  });
});

// =========== useAchievements hook CONTRACT ===========

describe("useAchievements hook contract", () => {
  const src = readComponent("hooks/useAchievements.tsx" in {} ? "hooks/useAchievements.tsx" : "hooks/useAchievements.ts");

  // -- Type Safety --
  test("exports ACHIEVEMENT_DEFS array", () => {
    expect(src).toContain("export const ACHIEVEMENT_DEFS");
  });

  test("exports AchievementDef interface", () => {
    expect(src).toContain("export interface AchievementDef");
  });

  test("exports AchievementStatus interface", () => {
    expect(src).toContain("export interface AchievementStatus");
  });

  test("exports useAchievements function", () => {
    expect(src).toContain("export function useAchievements");
  });

  // -- Hook patterns --
  test("uses useMemo for expensive computations", () => {
    expect(src).toContain("useMemo");
  });

  test("uses useRef for stable persistence tracking", () => {
    expect(src).toContain("useRef");
  });

  test("uses useCallback for stable persistNew", () => {
    expect(src).toContain("useCallback");
  });

  // -- Achievement IDs match between defs and checks --
  test("all 10 achievement IDs are present", () => {
    const ids = ["first_step", "week_warrior", "monthly_master", "budget_hero", "triple_crown",
      "category_king", "goal_setter", "goal_crusher", "recurring_pro", "data_driven"];
    for (const id of ids) {
      expect(src).toContain(`"${id}"`);
    }
  });

  // -- Deduplication guard --
  test("has deduplication guard to prevent double-persisting", () => {
    expect(src).toContain("lastPersistedRef");
    expect(src).toContain("if (key === lastPersistedRef.current) return");
  });

  // -- Filters deleted expenses --
  test("filters deleted expenses from context", () => {
    expect(src).toContain("!e.deletedAt");
  });

  test("handles missing achievements gracefully with ?? []", () => {
    expect(src).toContain("settings.achievements ?? []");
  });
});

// =========== Types contract ===========

describe("Types — Phase F additions", () => {
  const src = readComponent("types/index.ts").replace(/\s+/g, " ");

  test("DashboardSectionId includes 'achievements'", () => {
    expect(src).toContain('"achievements"');
  });

  test("DashboardSectionId includes 'insights'", () => {
    expect(src).toContain('"insights"');
  });

  test("Achievement interface exists with id and unlockedAt", () => {
    expect(src).toContain("interface Achievement");
    expect(src).toContain("unlockedAt: number");
  });

  test("UserSettings includes achievements field", () => {
    expect(src).toContain("achievements?: Achievement[]");
  });

  test("UserSettings includes accentColor field", () => {
    expect(src).toContain("accentColor?: string");
  });
});

// =========== providers.tsx — AccentColorEffect contract ===========

describe("Providers — AccentColorEffect integration", () => {
  const src = readComponent("app/providers.tsx");

  test("imports applyAccentColor", () => {
    expect(src).toContain("applyAccentColor");
  });

  test("contains AccentColorEffect component", () => {
    expect(src).toContain("AccentColorEffect");
  });

  test("AccentColorEffect uses useSettings", () => {
    expect(src).toContain("useSettings");
  });

  test("AccentColorEffect uses useTheme", () => {
    expect(src).toContain("useTheme");
  });

  test("calls applyAccentColor with settings.accentColor", () => {
    expect(src).toContain("applyAccentColor(settings.accentColor)");
  });

  test("AccentColorEffect reacts to resolved theme changes", () => {
    expect(src).toContain("resolved");
  });

  test("AccentColorEffect is mounted in the provider tree", () => {
    expect(src).toContain("<AccentColorEffect");
  });
});

// =========== Empty state contracts ===========

describe("empty state contracts", () => {
  test("CollectionChart imports EmptyState", () => {
    const src = readComponent("components/business/CollectionChart.tsx");
    expect(src).toMatch(/import.*EmptyState/);
  });

  test("CollectionChart does not return bare null for empty data", () => {
    const src = readComponent("components/business/CollectionChart.tsx");
    expect(src).not.toMatch(/data\.length === 0\)\s*return\s*null/);
  });

  test("TagBreakdown imports EmptyState", () => {
    const src = readComponent("components/business/TagBreakdown.tsx");
    expect(src).toMatch(/import.*EmptyState/);
  });

  test("TagBreakdown does not return bare null for empty data", () => {
    const src = readComponent("components/business/TagBreakdown.tsx");
    expect(src).not.toMatch(/data\.length === 0\)\s*return\s*null/);
  });
});

// =========== Loading state contracts ===========

describe("loading state contracts", () => {
  test("Skeleton.tsx exports SkeletonSessionsList", () => {
    const src = readComponent("components/ui/Skeleton.tsx");
    expect(src).toContain("export function SkeletonSessionsList");
  });

  test("Skeleton.tsx exports SkeletonMembersList", () => {
    const src = readComponent("components/ui/Skeleton.tsx");
    expect(src).toContain("export function SkeletonMembersList");
  });

  test("AccountCard uses Skeleton for avatar during upload", () => {
    const src = readComponent("components/settings/AccountCard.tsx");
    expect(src).toContain("<Skeleton");
    expect(src).toContain("avatarUploading");
  });
});
