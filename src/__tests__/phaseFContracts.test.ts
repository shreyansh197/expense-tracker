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
