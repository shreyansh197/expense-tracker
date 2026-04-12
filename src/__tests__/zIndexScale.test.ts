/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

const CSS_PATH = path.resolve(__dirname, "../app/globals.css");
const cssContent = fs.readFileSync(CSS_PATH, "utf-8");

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========== Z-index tokens exist ===========

describe("z-index scale — token definitions", () => {
  const requiredTokens = [
    "--z-base",
    "--z-dropdown",
    "--z-sticky",
    "--z-overlay",
    "--z-modal",
    "--z-toast",
    "--z-tooltip",
    "--z-max",
    "--z-splash",
    "--z-confetti",
  ];

  for (const token of requiredTokens) {
    test(`${token} is defined in :root`, () => {
      const pattern = new RegExp(`${token.replace(/[-/]/g, "\\$&")}\\s*:`);
      expect(cssContent).toMatch(pattern);
    });
  }
});

// =========== Z-index values are in sane range ===========

describe("z-index scale — value sanity", () => {
  test("--z-splash and --z-confetti are above --z-max", () => {
    const zMax = cssContent.match(/--z-max:\s*(\d+)/);
    const zSplash = cssContent.match(/--z-splash:\s*(\d+)/);
    const zConfetti = cssContent.match(/--z-confetti:\s*(\d+)/);

    expect(zMax).not.toBeNull();
    expect(zSplash).not.toBeNull();
    expect(zConfetti).not.toBeNull();

    expect(parseInt(zSplash![1])).toBeGreaterThan(parseInt(zMax![1]));
    expect(parseInt(zConfetti![1])).toBeGreaterThan(parseInt(zMax![1]));
  });

  test("z-index values are below 10000", () => {
    const zSplash = cssContent.match(/--z-splash:\s*(\d+)/);
    const zConfetti = cssContent.match(/--z-confetti:\s*(\d+)/);

    expect(parseInt(zSplash![1])).toBeLessThan(10000);
    expect(parseInt(zConfetti![1])).toBeLessThan(10000);
  });

  test("standard z-index scale is monotonically increasing", () => {
    const tokens = ["--z-base", "--z-dropdown", "--z-sticky", "--z-overlay", "--z-modal", "--z-toast", "--z-tooltip", "--z-max"];
    const values: number[] = [];

    for (const token of tokens) {
      const match = cssContent.match(new RegExp(`${token.replace(/[-/]/g, "\\$&")}:\\s*(\\d+)`));
      expect(match).not.toBeNull();
      values.push(parseInt(match![1]));
    }

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

// =========== Components use z-index tokens, not hardcoded values ===========

describe("z-index scale — component usage", () => {
  test("Confetti uses var(--z-confetti)", () => {
    const src = readComponent("components/motion/Confetti.tsx");
    expect(src).toContain("--z-confetti");
    expect(src).not.toMatch(/zIndex:\s*9999/);
  });

  test("SplashScreen uses var(--z-splash)", () => {
    const src = readComponent("components/app/SplashScreen.tsx");
    expect(src).toContain("--z-splash");
    expect(src).not.toMatch(/zIndex:\s*9999/);
  });

  test("OfflineScreen uses var(--z-splash)", () => {
    const src = readComponent("components/app/OfflineScreen.tsx");
    expect(src).toContain("--z-splash");
    expect(src).not.toMatch(/zIndex:\s*9998/);
  });
});

// =========== No hardcoded z-index: 9999 anywhere ===========

describe("z-index scale — no rogue high z-index values", () => {
  const COMPONENT_DIR = path.resolve(__dirname, "..", "components");

  function findTsxFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...findTsxFiles(full));
      else if (entry.name.endsWith(".tsx")) files.push(full);
    }
    return files;
  }

  const allFiles = findTsxFiles(COMPONENT_DIR);

  for (const file of allFiles) {
    const relPath = path.relative(path.resolve(__dirname, ".."), file);
    const content = fs.readFileSync(file, "utf-8");

    // Check for hardcoded z-index values above 999
    const highZMatches = content.match(/zIndex:\s*(\d{4,})/g);
    if (!highZMatches) continue;

    test(`${relPath} — no hardcoded z-index above 999 (should use tokens)`, () => {
      for (const match of highZMatches) {
        // Allow var() references
        expect(match).toContain("var(");
      }
    });
  }
});
