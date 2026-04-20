/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

const COMPONENT_DIR = path.resolve(__dirname, "..", "components");

/** Recursively find all .tsx files */
function findTsxFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findTsxFiles(full));
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

// Intentional palette definition files — these define the palette and are allowed to have hex colors
const ALLOWED_HEX_FILES = new Set([
  "AccentColorPicker.tsx",
  "Confetti.tsx",     // Canvas-rendered particles with CSS token fallbacks
]);

// =========== No raw hex in component render output ===========

describe("color token consistency — no raw hex in non-palette components", () => {
  const allComponentFiles = findTsxFiles(COMPONENT_DIR);

  // Filter out intentional palette files
  const checkFiles = allComponentFiles.filter(f => {
    const name = path.basename(f);
    return !ALLOWED_HEX_FILES.has(name);
  });

  for (const file of checkFiles) {
    const relPath = path.relative(path.resolve(__dirname, ".."), file);
    const content = fs.readFileSync(file, "utf-8");

    // Skip if file has no hex colors at all
    const hexMatches = content.match(/#[0-9a-fA-F]{6}\b/g);
    if (!hexMatches) continue;

    test(`${relPath} — hex colors are only in CSS fallbacks (var(..., #xxx))`, () => {
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineHexes = line.match(/#[0-9a-fA-F]{6}\b/g);
        if (!lineHexes) continue;

        for (const hex of lineHexes) {
          // Allowed patterns:
          // 1. CSS var fallback: var(--token, #hex)
          // 2. SVG fill for brand logos (Google)
          // 3. Comment lines
          // 4. Confetti decorative colors (marked with comment)
          // 5. Array of swatches in settings (theme preview)
          // 6. Fallback arrays for SSR/canvas (FALLBACK_COLORS)
          // 7. QR code config objects (dark/light color)
          const isFallback = line.includes(`var(`) && line.includes(hex);
          const isSvgBrand = line.includes("fill=") && (line.includes("Google") || line.includes("path d="));
          const isComment = line.trim().startsWith("//") || line.trim().startsWith("*") || line.trim().startsWith("/*");
          const isDecorativeComment = line.includes("// decorative");
          const isSwatchArray = line.includes("swatches:");
          const isFallbackArray = line.includes("FALLBACK_COLORS") || (content.includes("FALLBACK_COLORS") && /^\s*"#[0-9a-fA-F]{6}"/.test(line.trim()));
          const isQrConfig = line.includes("dark:") || line.includes("light:");

          const isAllowed = isFallback || isSvgBrand || isComment || isDecorativeComment || isSwatchArray || isFallbackArray || isQrConfig;
          if (!isAllowed) {
            // Check if it's inside a CSS token definition (globals.css variable)
            const isTokenDef = line.match(/--[\w-]+\s*:\s*.*#/);
            expect({
              file: relPath,
              line: i + 1,
              hex,
              context: line.trim(),
              allowed: isAllowed || !!isTokenDef,
            }).toEqual(
              expect.objectContaining({ allowed: true })
            );
          }
        }
      }
    });
  }
});

// =========== Confetti uses getComputedStyle for token resolution ===========

describe("color token consistency — Confetti token resolution", () => {
  const src = readComponent("components/motion/Confetti.tsx");

  test("resolves colors from CSS tokens via getComputedStyle", () => {
    expect(src).toContain("getComputedStyle");
    expect(src).toContain("getPropertyValue");
  });

  test("has fallback colors for SSR", () => {
    expect(src).toContain("FALLBACK_COLORS");
  });

  test("resolves known brand tokens", () => {
    expect(src).toContain("--accent");
    expect(src).toContain("--primary");
    expect(src).toContain("--warning");
    expect(src).toContain("--danger");
    expect(src).toContain("--success");
  });
});

// =========== SavingsGoalsWidget uses token references ===========

describe("color token consistency — SavingsGoalsWidget", () => {
  const src = readComponent("components/dashboard/SavingsGoalsWidget.tsx");

  test("uses accent token var(--accent) for progress and fund button", () => {
    expect(src).toContain("var(--accent)");
  });

  test("uses accent-soft token for soft backgrounds", () => {
    expect(src).toContain("var(--accent-soft)");
  });

  test("uses accent gradient for remove funds button", () => {
    expect(src).toContain("var(--accent-gradient)");
  });

  test("does not have hardcoded #ef4444 or #dc2626", () => {
    expect(src).not.toContain("#ef4444");
    expect(src).not.toContain("#dc2626");
    expect(src).not.toContain("rgba(239,68,68");
  });
});

// =========== AuthModal uses CSS token references ===========

describe("color token consistency — AuthModal", () => {
  const src = readComponent("components/onboarding/AuthModal.tsx");

  test("hero background uses var(--auth-hero-bg)", () => {
    expect(src).toContain("var(--auth-hero-bg)");
  });

  test("hero cyan uses var(--auth-hero-cyan)", () => {
    expect(src).toContain("var(--auth-hero-cyan)");
  });

  test("hero violet uses var(--auth-hero-violet)", () => {
    expect(src).toContain("var(--auth-hero-violet)");
  });

  test("decorative orbs use var(--auth-orb-1) and var(--auth-orb-2)", () => {
    expect(src).toContain("var(--auth-orb-1)");
    expect(src).toContain("var(--auth-orb-2)");
  });

  test("badge uses var(--auth-badge-bg) and var(--auth-badge-ring)", () => {
    expect(src).toContain("var(--auth-badge-bg)");
    expect(src).toContain("var(--auth-badge-ring)");
  });

  test("FEATURES use color-mix for alpha derivations", () => {
    expect(src).toContain("color-mix(in srgb, var(--auth-hero-violet)");
    expect(src).toContain("color-mix(in srgb, var(--auth-hero-cyan)");
  });

  test("does not have hardcoded hero hex values", () => {
    expect(src).not.toContain('"#0a0f1e');
    expect(src).not.toContain('"#0d1340');
    expect(src).not.toContain('"#130a2e');
    expect(src).not.toContain('"#22d3ee');
    expect(src).not.toContain('"#a78bfa');
  });

  test("no raw rgba with hardcoded brand RGB values", () => {
    expect(src).not.toContain("rgba(167,139,250");
    expect(src).not.toContain("rgba(34,211,238");
    expect(src).not.toContain("rgba(99,102,241");
  });
});

// =========== Chart tooltips use tokens without hex fallbacks ===========

describe("color token consistency — chart tooltip tokens", () => {
  const globals = fs.readFileSync(
    path.resolve(__dirname, "..", "app", "globals.css"),
    "utf-8"
  );

  test("globals.css defines chart tooltip tokens in :root", () => {
    expect(globals).toContain("--chart-tooltip-bg:");
    expect(globals).toContain("--chart-tooltip-fg:");
    expect(globals).toContain("--chart-tooltip-border:");
  });

  test("globals.css defines auth hero tokens in :root", () => {
    expect(globals).toContain("--auth-hero-bg:");
    expect(globals).toContain("--auth-hero-cyan:");
    expect(globals).toContain("--auth-hero-violet:");
  });

  test("globals.css defines auth orb tokens with dark overrides", () => {
    expect(globals).toContain("--auth-orb-1:");
    expect(globals).toContain("--auth-orb-2:");
    expect(globals).toContain("--auth-badge-bg:");
    expect(globals).toContain("--auth-badge-ring:");
  });
});

// =========== SecurityCard QR error handling ===========

describe("color token consistency — SecurityCard QR error state", () => {
  const src = readComponent("components/settings/SecurityCard.tsx");

  test("tracks QR error state", () => {
    expect(src).toContain("qrError");
  });

  test("shows informative message on QR failure instead of infinite spinner", () => {
    expect(src).toContain("QR code could not be generated");
    expect(src).toContain("manual entry");
  });

  test("QR error message does not leak internal details", () => {
    expect(src).not.toMatch(/stack\s*trace/i);
    expect(src).not.toContain("Error:");
  });
});
