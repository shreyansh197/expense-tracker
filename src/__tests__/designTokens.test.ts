/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

const CSS_PATH = path.resolve(__dirname, "../app/globals.css");
const cssContent = fs.readFileSync(CSS_PATH, "utf-8");

// ---- Helpers ----

/** Extract all CSS custom property declarations from a block */
function extractVarsFromBlock(css: string, selectorLiteral: string): string[] {
  // For .dark, we need a different approach since the block is large and nested
  const vars: string[] = [];
  // Find all occurrences of the selector followed by a block
  let searchFrom = 0;
  while (true) {
    const idx = css.indexOf(selectorLiteral, searchFrom);
    if (idx === -1) break;
    // Find the opening brace
    const braceStart = css.indexOf('{', idx);
    if (braceStart === -1) break;
    // Count braces to find matching close
    let depth = 1;
    let pos = braceStart + 1;
    while (pos < css.length && depth > 0) {
      if (css[pos] === '{') depth++;
      else if (css[pos] === '}') depth--;
      pos++;
    }
    const block = css.slice(braceStart + 1, pos - 1);
    const varMatches = block.matchAll(/--([-\w]+)\s*:/g);
    for (const vm of varMatches) {
      vars.push(`--${vm[1]}`);
    }
    searchFrom = pos;
  }
  return vars;
}

const rootVars = extractVarsFromBlock(cssContent, ":root");
const darkVars = extractVarsFromBlock(cssContent, ".dark");

// =========== Token completeness: :root vs .dark parity ===========

describe("design token parity (:root vs .dark)", () => {
  // Tokens that must exist in both light and dark
  const requiredPairs = [
    "--background",
    "--foreground",
    "--surface",
    "--surface-secondary",
    "--surface-hover",
    "--surface-tertiary",
    "--surface-elevated",
    "--border",
    "--border-subtle",
    "--border-card",
    "--text-primary",
    "--text-secondary",
    "--text-tertiary",
    "--text-muted",
    "--text-inverse",
    "--surface-modal",
    "--surface-popover",
    "--border-strong",
    "--primary",
    "--primary-soft",
    "--primary-hover",
    "--primary-border",
    "--primary-text",
    "--secondary",
    "--secondary-soft",
    "--secondary-text",
    "--secondary-hover",
    "--secondary-border",
    "--accent",
    "--accent-soft",
    "--accent-hover",
    "--accent-deep",
    "--accent-border",
    "--info",
    "--info-soft",
    "--info-text",
    "--info-border",
    "--success",
    "--success-soft",
    "--success-text",
    "--success-hover",
    "--warning",
    "--warning-soft",
    "--warning-text",
    "--warning-border",
    "--danger",
    "--danger-soft",
    "--danger-text",
    "--danger-border",
    "--biz-accent",
    "--biz-accent-soft",
    "--biz-accent-hover",
    "--biz-accent-border",
    "--biz-accent-text",
    "--overlay",
    "--shadow-sm",
    "--shadow-md",
    "--shadow-lg",
    "--card-shadow",
    "--card-shadow-hover",
    "--chart-tooltip-bg",
    "--chart-tooltip-fg",
    "--chart-tooltip-border",
  ];

  test.each(requiredPairs)("%s exists in :root", (token) => {
    expect(rootVars).toContain(token);
  });

  test.each(requiredPairs)("%s exists in .dark", (token) => {
    expect(darkVars).toContain(token);
  });
});

// =========== Radius scale ===========

describe("radius scale tokens", () => {
  const radiusTokens = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl"];

  test("all radius tokens exist in :root", () => {
    for (const token of radiusTokens) {
      expect(rootVars).toContain(token);
    }
  });

  test("radius values follow ascending order", () => {
    const values: Record<string, number> = {};
    for (const token of radiusTokens) {
      const regex = new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([\\d.]+)rem`);
      const match = cssContent.match(regex);
      expect(match).not.toBeNull();
      values[token] = parseFloat(match![1]);
    }
    expect(values["--radius-sm"]).toBeLessThan(values["--radius-md"]);
    expect(values["--radius-md"]).toBeLessThan(values["--radius-lg"]);
    expect(values["--radius-lg"]).toBeLessThan(values["--radius-xl"]);
  });
});

// =========== Spacing scale ===========

describe("spacing scale tokens", () => {
  const spacingTokens = [
    "--space-1", "--space-2", "--space-3", "--space-4",
    "--space-5", "--space-6", "--space-8", "--space-10", "--space-12",
  ];

  test("all spacing tokens exist in :root", () => {
    for (const token of spacingTokens) {
      expect(rootVars).toContain(token);
    }
  });

  test("spacing values follow ascending order", () => {
    const values: number[] = [];
    for (const token of spacingTokens) {
      const regex = new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([\\d.]+)rem`);
      const match = cssContent.match(regex);
      expect(match).not.toBeNull();
      values.push(parseFloat(match![1]));
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

// =========== Z-index scale ===========

describe("z-index scale", () => {
  const zTokens = [
    "--z-base", "--z-dropdown", "--z-sticky", "--z-overlay",
    "--z-modal", "--z-toast", "--z-tooltip", "--z-max",
  ];

  test("all z-index tokens exist in :root", () => {
    for (const token of zTokens) {
      expect(rootVars).toContain(token);
    }
  });

  test("z-index values are strictly ascending", () => {
    const values: number[] = [];
    for (const token of zTokens) {
      const regex = new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*(\\d+)`);
      const match = cssContent.match(regex);
      expect(match).not.toBeNull();
      values.push(parseInt(match![1], 10));
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

// =========== Typography fluid scale ===========

describe("fluid typography tokens", () => {
  const typeTokens = [
    "--text-display", "--text-hero", "--text-h1", "--text-h2", "--text-h3", "--text-h4",
    "--text-body-lg", "--text-body", "--text-body-sm",
    "--text-caption-size", "--text-label", "--text-overline",
  ];

  test("all typography tokens exist in :root", () => {
    for (const token of typeTokens) {
      expect(rootVars).toContain(token);
    }
  });

  test("all typography tokens use clamp() for fluid scaling", () => {
    for (const token of typeTokens) {
      const regex = new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*clamp\\(`);
      expect(cssContent).toMatch(regex);
    }
  });
});

// =========== Keyframes existence ===========

describe("keyframes", () => {
  const requiredKeyframes = [
    "shimmer",
    "btn-ripple",
    "btn-spin",
    "fadeIn",
    "dash-enter",
    "float-gentle",
    "icon-pulse",
    "icon-bounce",
    "icon-shake",
  ];

  test.each(requiredKeyframes)("@keyframes %s exists", (name) => {
    const regex = new RegExp(`@keyframes\\s+${name}\\s*\\{`);
    expect(cssContent).toMatch(regex);
  });
});

// =========== CSS motion tokens mirror JS tokens ===========

describe("CSS motion tokens mirror JS values", () => {
  test("--ease-out matches JS ease.out", () => {
    expect(cssContent).toContain("--ease-out: cubic-bezier(0.22, 1, 0.36, 1)");
  });

  test("--ease-in-out matches JS ease.inOut", () => {
    expect(cssContent).toContain("--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)");
  });

  test("--ease-in matches JS ease.in", () => {
    expect(cssContent).toContain("--ease-in: cubic-bezier(0.55, 0, 1, 0.45)");
  });

  test("--duration-instant is 80ms", () => {
    expect(cssContent).toContain("--duration-instant: 80ms");
  });

  test("--duration-fast is 150ms", () => {
    expect(cssContent).toContain("--duration-fast: 150ms");
  });

  test("--duration-normal is 250ms", () => {
    expect(cssContent).toContain("--duration-normal: 250ms");
  });

  test("--duration-emphasis is 400ms", () => {
    expect(cssContent).toContain("--duration-emphasis: 400ms");
  });
});

// =========== Utility classes exist ===========

describe("utility classes", () => {
  const utilityClasses = [
    ".form-input",
    ".form-select",
    ".form-label",
    ".btn-primary",
    ".btn-secondary",
    ".btn-danger",
    ".btn-ghost",
    ".btn-loading",
    ".btn-sm",
    ".btn-md",
    ".btn-lg",
    ".card",
    ".card-interactive",
    ".card-sm",
    ".card-hero",
    ".card-glass",
    ".card-gradient",
    ".card-accent-teal",
    ".card-accent-indigo",
    ".card-accent-coral",
    ".segmented-control",
    ".text-display",
    ".text-page-title",
    ".text-section-title",
    ".text-card-title",
    ".text-body",
    ".text-body-sm",
    ".text-meta",
    ".text-caption",
    ".text-label",
    ".text-overline",
    ".text-amount",
    ".text-hero-amount",
    ".text-amount-lg",
    ".text-amount-md",
  ];

  test.each(utilityClasses)("%s is defined", (cls) => {
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escaped}\\s*[{,]`);
    expect(cssContent).toMatch(regex);
  });
});

// =========== btn-primary uses token-based border-radius ===========

describe("btn-primary token usage", () => {
  test("uses var(--radius-md) for border-radius", () => {
    // Extract the btn-primary block
    const btnBlock = cssContent.match(/\.btn-primary\s*\{([^}]+)\}/);
    expect(btnBlock).not.toBeNull();
    expect(btnBlock![1]).toContain("var(--radius-md)");
  });

  test("has overflow: hidden for ripple containment", () => {
    const btnBlock = cssContent.match(/\.btn-primary\s*\{([^}]+)\}/);
    expect(btnBlock).not.toBeNull();
    expect(btnBlock![1]).toContain("overflow: hidden");
  });

  test("has position: relative for ripple positioning", () => {
    const btnBlock = cssContent.match(/\.btn-primary\s*\{([^}]+)\}/);
    expect(btnBlock).not.toBeNull();
    expect(btnBlock![1]).toContain("position: relative");
  });
});

// =========== form-input uses token-based border-radius ===========

describe("form-input token usage", () => {
  test("uses var(--radius-md) for border-radius", () => {
    const formBlock = cssContent.match(/\.form-input\s*\{([^}]+)\}/);
    expect(formBlock).not.toBeNull();
    expect(formBlock![1]).toContain("var(--radius-md)");
  });
});

// =========== Elevation / shadow system ===========

describe("elevation system", () => {
  test("shadow-sm, shadow-md, shadow-lg all have values in :root", () => {
    expect(rootVars).toContain("--shadow-sm");
    expect(rootVars).toContain("--shadow-md");
    expect(rootVars).toContain("--shadow-lg");
  });

  test("card-shadow references shadow-sm", () => {
    expect(cssContent).toMatch(/--card-shadow:\s*var\(--shadow-sm\)/);
  });

  test("card-shadow-hover references shadow-md", () => {
    expect(cssContent).toMatch(/--card-shadow-hover:\s*var\(--shadow-md\)/);
  });
});

// =========== Icon size tokens ===========

describe("icon size tokens", () => {
  const iconTokens = ["--icon-xs", "--icon-sm", "--icon-base", "--icon-md", "--icon-lg"];

  test("all icon size tokens exist", () => {
    for (const token of iconTokens) {
      expect(rootVars).toContain(token);
    }
  });

  test("icon sizes are ascending", () => {
    const values: number[] = [];
    for (const token of iconTokens) {
      const regex = new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*(\\d+)px`);
      const match = cssContent.match(regex);
      expect(match).not.toBeNull();
      values.push(parseInt(match![1], 10));
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

// =========== Security: no sensitive data in CSS variables ===========

describe("security: no sensitive data in CSS", () => {
  test("no API keys or tokens in CSS variables", () => {
    expect(cssContent).not.toMatch(/api[_-]?key/i);
    expect(cssContent).not.toMatch(/secret/i);
    // "password" appears legitimately in input[type="password"] selectors
    expect(cssContent).not.toMatch(/--[\w-]*password/i);
    expect(cssContent).not.toMatch(/bearer\s/i);
    expect(cssContent).not.toMatch(/auth[_-]?token/i);
  });

  test("no data: URIs contain scripts", () => {
    // Data URIs should only be SVGs
    const dataUris = cssContent.match(/url\("data:[^"]+"\)/g) || [];
    for (const uri of dataUris) {
      expect(uri).not.toContain("javascript:");
      expect(uri).not.toContain("<script");
      expect(uri).toMatch(/data:image\/svg\+xml/);
    }
  });
});

// =========== Performance: no excessive transitions ===========

describe("performance: transition durations", () => {
  test("shimmer keyframe animation exists", () => {
    expect(cssContent).toMatch(/@keyframes shimmer/);
  });

  test("btn-ripple keyframe has correct scale end", () => {
    // The ripple should scale up significantly before fading
    const rippleBlock = cssContent.match(/@keyframes btn-ripple\s*\{([^}]+\{[^}]+\}[^}]*)\}/);
    expect(rippleBlock).not.toBeNull();
    expect(rippleBlock![1]).toContain("scale(4)");
    expect(rippleBlock![1]).toContain("opacity: 0");
  });
});

// =========== Safe-area compat ===========

describe("safe-area PWA support", () => {
  test("body uses env(safe-area-inset-*) within standalone media query", () => {
    expect(cssContent).toContain("display-mode: standalone");
    expect(cssContent).toContain("env(safe-area-inset-top");
    expect(cssContent).toContain("env(safe-area-inset-bottom");
    expect(cssContent).toContain("env(safe-area-inset-left");
    expect(cssContent).toContain("env(safe-area-inset-right");
  });
});

// =========== Focus ring accessibility ===========

describe("accessibility: focus ring", () => {
  test(":focus-visible outline uses accent color", () => {
    expect(cssContent).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+var\(--accent\)/);
  });

  test("focus-ring token exists in :root", () => {
    expect(rootVars).toContain("--focus-ring");
  });
});

// =========== Goal tokens ===========

describe("goal achievement tokens", () => {
  const goalTokens = [
    "--goal-achieved-bg", "--goal-achieved-text", "--goal-achieved-border",
    "--goal-warning-bg", "--goal-warning-text",
    "--goal-exceeded-bg", "--goal-exceeded-text",
  ];

  test("all goal tokens exist in :root", () => {
    for (const token of goalTokens) {
      expect(rootVars).toContain(token);
    }
  });

  test("all goal tokens exist in .dark", () => {
    for (const token of goalTokens) {
      expect(darkVars).toContain(token);
    }
  });
});

// =========== Business mode tokens ===========

describe("business mode tokens", () => {
  const bizTokens = [
    "--biz-accent", "--biz-accent-soft", "--biz-accent-hover",
    "--biz-accent-border", "--biz-accent-text",
    "--biz-pending-bg", "--biz-pending-text", "--biz-pending-border",
    "--biz-upi-bg", "--biz-upi-text",
    "--biz-cash-bg", "--biz-cash-text",
    "--biz-cheque-bg", "--biz-cheque-text",
    "--biz-other-bg", "--biz-other-text",
  ];

  test.each(bizTokens)("%s exists in :root", (token) => {
    expect(rootVars).toContain(token);
  });

  test.each(bizTokens.filter(t => !t.includes("cash") && !t.includes("other")))(
    "%s exists in .dark",
    (token) => {
      expect(darkVars).toContain(token);
    }
  );
});

// =========== Status surface tokens ===========

describe("status surface tokens", () => {
  const statusTokens = [
    "--status-ok-bg", "--status-ok-border", "--status-ok-text",
    "--status-warn-bg", "--status-warn-border", "--status-warn-text",
    "--status-err-bg", "--status-err-border", "--status-err-text",
  ];

  test("all exist in :root", () => {
    for (const token of statusTokens) {
      expect(rootVars).toContain(token);
    }
  });

  test("all exist in .dark", () => {
    for (const token of statusTokens) {
      expect(darkVars).toContain(token);
    }
  });
});
