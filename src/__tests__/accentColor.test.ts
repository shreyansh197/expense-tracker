/// <reference types="jest" />
/**
 * AccentColorPicker tests — applyAccentColor logic + ACCENT_PRESETS data integrity
 * Covers: functional, negative, boundary, UI contract, security, and performance scenarios.
 */
import { ACCENT_PRESETS, applyAccentColor } from "../components/settings/AccentColorPicker";

// ── Mock document ──

const originalDocument = global.document;

afterAll(() => {
  // Restore original document to avoid polluting other test suites
  global.document = originalDocument;
});

function setupDOM() {
  const styleProps = new Map<string, string>();
  const classList = new Set<string>();

  global.document = {
    documentElement: {
      style: {
        setProperty: (key: string, value: string) => styleProps.set(key, value),
        removeProperty: (key: string) => { styleProps.delete(key); return ''; },
      } as unknown as CSSStyleDeclaration,
      classList: {
        contains: (cls: string) => classList.has(cls),
      } as unknown as DOMTokenList,
    },
  } as unknown as Document;

  return { styleProps, classList };
}

// =========== ACCENT_PRESETS DATA INTEGRITY ===========

describe("ACCENT_PRESETS — data integrity", () => {
  test("has exactly 9 presets", () => {
    expect(ACCENT_PRESETS).toHaveLength(9);
  });

  test("all presets have unique IDs", () => {
    const ids = ACCENT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("all presets have required fields", () => {
    for (const p of ACCENT_PRESETS) {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.accent).toBeTruthy();
      expect(p.accentDark).toBeTruthy();
      expect(p.soft).toBeTruthy();
      expect(p.softDark).toBeTruthy();
    }
  });

  test("first preset is moss (default)", () => {
    expect(ACCENT_PRESETS[0].id).toBe("moss");
  });

  test("all accent colors are valid hex colors", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const p of ACCENT_PRESETS) {
      expect(p.accent).toMatch(hexPattern);
      expect(p.accentDark).toMatch(hexPattern);
    }
  });

  test("all soft colors are valid hex or rgba", () => {
    const colorPattern = /^(#[0-9A-Fa-f]{6}|rgba\(.+\))$/;
    for (const p of ACCENT_PRESETS) {
      expect(p.soft).toMatch(colorPattern);
      expect(p.softDark).toMatch(colorPattern);
    }
  });

  test("preset labels contain only letters", () => {
    for (const p of ACCENT_PRESETS) {
      expect(p.label).toMatch(/^[A-Za-z]+$/);
    }
  });

  test("preset IDs contain only lowercase letters", () => {
    for (const p of ACCENT_PRESETS) {
      expect(p.id).toMatch(/^[a-z]+$/);
    }
  });
});

// =========== applyAccentColor — FUNCTIONAL TESTS ===========

describe("applyAccentColor — functional", () => {
  test("applies light-mode accent color for non-purple preset", () => {
    const { styleProps } = setupDOM();
    applyAccentColor("blue");
    const blue = ACCENT_PRESETS.find((p) => p.id === "blue")!;
    expect(styleProps.get("--accent")).toBe(blue.accent);
    expect(styleProps.get("--accent-soft")).toBe(blue.soft);
  });

  test("applies dark-mode accent color when dark class is present", () => {
    const { styleProps, classList } = setupDOM();
    classList.add("dark");
    applyAccentColor("clay");
    const clay = ACCENT_PRESETS.find((p) => p.id === "clay")!;
    expect(styleProps.get("--accent")).toBe(clay.accentDark);
    expect(styleProps.get("--accent-soft")).toBe(clay.softDark);
  });

  test("removes overrides for moss (default)", () => {
    const { styleProps } = setupDOM();
    // First set a custom color
    applyAccentColor("rose");
    expect(styleProps.has("--accent")).toBe(true);
    // Then reset to moss
    applyAccentColor("moss");
    expect(styleProps.has("--accent")).toBe(false);
    expect(styleProps.has("--accent-soft")).toBe(false);
  });

  test("removes overrides for undefined", () => {
    const { styleProps } = setupDOM();
    applyAccentColor("orange");
    expect(styleProps.has("--accent")).toBe(true);
    applyAccentColor(undefined);
    expect(styleProps.has("--accent")).toBe(false);
    expect(styleProps.has("--accent-soft")).toBe(false);
  });

  test("applies all 9 preset colors without error", () => {
    setupDOM();
    for (const preset of ACCENT_PRESETS) {
      expect(() => applyAccentColor(preset.id)).not.toThrow();
    }
  });

  test("switching between colors updates values correctly", () => {
    const { styleProps } = setupDOM();
    applyAccentColor("green");
    const green = ACCENT_PRESETS.find((p) => p.id === "green")!;
    expect(styleProps.get("--accent")).toBe(green.accent);

    applyAccentColor("rose");
    const rose = ACCENT_PRESETS.find((p) => p.id === "rose")!;
    expect(styleProps.get("--accent")).toBe(rose.accent);
    expect(styleProps.get("--accent")).not.toBe(green.accent);
  });
});

// =========== applyAccentColor — NEGATIVE TESTS ===========

describe("applyAccentColor — negative", () => {
  test("unknown color ID removes overrides (falls back to default)", () => {
    const { styleProps } = setupDOM();
    applyAccentColor("nonexistent");
    expect(styleProps.has("--accent")).toBe(false);
    expect(styleProps.has("--accent-soft")).toBe(false);
  });

  test("empty string removes overrides", () => {
    const { styleProps } = setupDOM();
    applyAccentColor("");
    expect(styleProps.has("--accent")).toBe(false);
  });

  test("does not crash when document is undefined (SSR)", () => {
    // Save ref and remove
    const saved = global.document;
    global.document = undefined as unknown as Document;
    expect(() => applyAccentColor("blue")).not.toThrow();
    global.document = saved;
  });

  test("does not crash with null", () => {
    setupDOM();
    expect(() => applyAccentColor(null as unknown as string)).not.toThrow();
  });
});

// =========== applyAccentColor — BOUNDARY TESTS ===========

describe("applyAccentColor — boundary", () => {
  test("rapid successive calls end with last value", () => {
    const { styleProps } = setupDOM();
    applyAccentColor("blue");
    applyAccentColor("teal");
    applyAccentColor("amber");
    const amber = ACCENT_PRESETS.find((p) => p.id === "amber")!;
    expect(styleProps.get("--accent")).toBe(amber.accent);
  });

  test("calling with same color multiple times is idempotent", () => {
    const { styleProps } = setupDOM();
    applyAccentColor("indigo");
    const val1 = styleProps.get("--accent");
    applyAccentColor("indigo");
    const val2 = styleProps.get("--accent");
    expect(val1).toBe(val2);
  });

  test("light→dark→light mode transitions update correctly", () => {
    const { styleProps, classList } = setupDOM();
    // Light mode
    applyAccentColor("orange");
    const orange = ACCENT_PRESETS.find((p) => p.id === "orange")!;
    expect(styleProps.get("--accent")).toBe(orange.accent);

    // Dark mode
    classList.add("dark");
    applyAccentColor("orange");
    expect(styleProps.get("--accent")).toBe(orange.accentDark);

    // Back to light
    classList.delete("dark");
    applyAccentColor("orange");
    expect(styleProps.get("--accent")).toBe(orange.accent);
  });
});

// =========== SECURITY TESTS ===========

describe("AccentColorPicker — security", () => {
  test("accent hex values don't contain script injection", () => {
    for (const p of ACCENT_PRESETS) {
      expect(p.accent).not.toContain("<");
      expect(p.accent).not.toContain(">");
      expect(p.accent).not.toContain("javascript:");
      expect(p.accentDark).not.toContain("<");
      expect(p.accentDark).not.toContain(">");
    }
  });

  test("preset IDs are safe for use as object keys", () => {
    for (const p of ACCENT_PRESETS) {
      expect(p.id).not.toContain("__proto__");
      expect(p.id).not.toContain("constructor");
      expect(p.id).not.toContain("prototype");
    }
  });

  test("CSS variable names set are whitelisted", () => {
    const { styleProps } = setupDOM();
    applyAccentColor("blue");
    const keys = Array.from(styleProps.keys());
    // Only --accent and --accent-soft should be set
    expect(keys.every((k) => k === "--accent" || k === "--accent-soft")).toBe(true);
  });

  test("soft RGBA values have valid structure", () => {
    const rgbaPattern = /^rgba\(\d{1,3},\d{1,3},\d{1,3},\d+(\.\d+)?\)$/;
    for (const p of ACCENT_PRESETS) {
      if (p.softDark.startsWith("rgba")) {
        expect(p.softDark.replace(/\s/g, "")).toMatch(rgbaPattern);
      }
    }
  });
});

// =========== PERFORMANCE TESTS ===========

describe("applyAccentColor — performance", () => {
  test("applying color 10000 times completes under 50ms", () => {
    setupDOM();
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      applyAccentColor(ACCENT_PRESETS[i % ACCENT_PRESETS.length].id);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  test("ACCENT_PRESETS lookup is O(n) and fast for 8 items", () => {
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      ACCENT_PRESETS.find((p) => p.id === "indigo");
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
