#!/usr/bin/env node
/**
 * Scaffold an accessibility contract test for a component (M4 · T-4.1.2).
 *
 * Usage:
 *   npm run contracts:new -- src/components/<domain>/<Component>.tsx [--force] [--stdout]
 *
 * Writes src/__tests__/<camelCaseComponent>.contract.test.ts containing the
 * baseline contract plus assertions for the ARIA names, roles, and states the
 * component already exposes. Every generated assertion is derived from the
 * component source, so the skeleton passes on first run; authors then add
 * intent-level assertions (see docs/CONTRACT_TESTS.md §1).
 */
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI script executed directly by Node (npm run contracts:*) */
"use strict";

const fs = require("fs");
const path = require("path");
const { camelName } = require("./check-contract-tests");

const ROOT = path.resolve(__dirname, "..");
const TESTS_DIR = path.join(ROOT, "src", "__tests__");
const MAX_DETECTED = 6;

/** Absolute path of the spec that satisfies the CI gate for a component. */
function specPathFor(componentPath) {
  return path.join(TESTS_DIR, `${camelName(componentPath)}.contract.test.ts`);
}

/** Path relative to `src/` using forward slashes (what `readSource` expects). */
function srcRelative(componentPath) {
  const abs = path.resolve(ROOT, componentPath);
  return path.relative(path.join(ROOT, "src"), abs).split(path.sep).join("/");
}

function stripComments(src) {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

function unique(values) {
  return [...new Set(values)].slice(0, MAX_DETECTED);
}

/** Detect the accessibility surface a component already exposes. */
function detect(src) {
  const code = stripComments(src);
  return {
    exportName: (code.match(/export\s+(?:default\s+)?function\s+([A-Z]\w*)/) || [])[1] || null,
    ariaLabels: unique([...code.matchAll(/aria-label="([^"{}]+)"/g)].map((m) => m[1])),
    roles: unique([...code.matchAll(/role="([a-z]+)"/g)].map((m) => m[1])),
    states: unique([...code.matchAll(/(aria-(?:expanded|pressed|checked|selected|current|modal|live))=/g)].map((m) => m[1])),
    touchTarget: /min-h-\[4[48]px\]|min-h-11|min-h-12|\bh-11\b|\bh-12\b|min-w-\[44px\]|\bh-\[44px\]/.test(code),
    interactive: /<button\b|onClick=|<a\b|<Link\b|<input\b|<select\b/.test(code),
  };
}

function quote(value) {
  return JSON.stringify(value);
}

/** Build the spec source for a component. Pure — exported for tests. */
function buildSpec(componentPath, src) {
  const rel = srcRelative(componentPath);
  const name = path.basename(componentPath).replace(/\.tsx?$/, "");
  const d = detect(src);
  const helpers = ["readSource", "expectBaselineContract"];
  if (d.touchTarget) helpers.push("expectTouchTargets");

  const tests = [
    `  test("meets the baseline accessibility contract", () => {\n    expectBaselineContract(src);\n  });`,
  ];
  if (d.exportName) {
    tests.push(`  test("exports the ${d.exportName} component", () => {\n    expect(src).toMatch(/export\\s+(default\\s+)?function\\s+${d.exportName}\\b/);\n  });`);
  }
  if (d.ariaLabels.length) {
    const lines = d.ariaLabels.map((l) => `    expect(src).toContain(${quote(`aria-label="${l}"`)});`).join("\n");
    tests.push(`  test("interactive elements keep their accessible names", () => {\n${lines}\n  });`);
  }
  if (d.roles.length) {
    const lines = d.roles.map((r) => `    expect(src).toContain(${quote(`role="${r}"`)});`).join("\n");
    tests.push(`  test("exposes its semantic roles", () => {\n${lines}\n  });`);
  }
  if (d.states.length) {
    const lines = d.states.map((s) => `    expect(src).toContain(${quote(`${s}=`)});`).join("\n");
    tests.push(`  test("exposes state to assistive technology", () => {\n${lines}\n  });`);
  }
  if (d.touchTarget) {
    tests.push(`  test("interactive targets meet the 44px minimum", () => {\n    expectTouchTargets(src);\n  });`);
  }

  return `/// <reference types="jest" />
import { ${helpers.join(", ")} } from "./helpers/contractAssertions";

/**
 * Accessibility contract for ${name} (docs/CONTRACT_TESTS.md).
 * Scaffolded by scripts/gen-contract-test.js — extend with intent-level
 * assertions for this component's accessible name, role, and state.
 */
describe("${name} contract", () => {
  const src = readSource(${quote(rel)});

${tests.join("\n\n")}
});
`;
}

function main(argv) {
  const args = argv.filter((a) => !a.startsWith("--"));
  const force = argv.includes("--force");
  const toStdout = argv.includes("--stdout");
  const target = args[0];

  if (!target) {
    console.error("Usage: npm run contracts:new -- src/components/<domain>/<Component>.tsx [--force] [--stdout]");
    return 1;
  }
  const abs = path.resolve(ROOT, target);
  if (!fs.existsSync(abs) || !/\.tsx$/.test(abs)) {
    console.error(`Component not found (expected a .tsx file): ${target}`);
    return 1;
  }
  if (!abs.startsWith(path.join(ROOT, "src", "components") + path.sep)) {
    console.error("Contract tests are scaffolded for files under src/components/ only.");
    return 1;
  }

  const spec = buildSpec(abs, fs.readFileSync(abs, "utf-8"));
  if (toStdout) {
    process.stdout.write(spec);
    return 0;
  }
  const out = specPathFor(abs);
  if (fs.existsSync(out) && !force) {
    console.error(`Spec already exists: ${path.relative(ROOT, out)} (use --force to overwrite)`);
    return 1;
  }
  fs.writeFileSync(out, spec, "utf-8");
  process.stdout.write(`Created ${path.relative(ROOT, out)}\nNext: add intent-level assertions, then run npx jest ${path.relative(ROOT, out).split(path.sep).join("/")}\n`);
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { buildSpec, camelName, detect, specPathFor, srcRelative };
