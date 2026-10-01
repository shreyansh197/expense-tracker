#!/usr/bin/env node
/**
 * Contract-test presence gate + coverage report (M4 · T-4.1.3).
 *
 *   npm run contracts:check    → CI gate (exit 1 on any violation)
 *   npm run contracts:report   → ranked coverage report (always exit 0)
 *   node scripts/check-contract-tests.js --json
 *
 * A component (`src/components/**\/*.tsx`) is covered when either
 *   1. `src/__tests__/<camelCaseComponent>.contract.test.ts` exists, or
 *   2. any spec under `src/__tests__/` reads its path (`components/<...>.tsx`).
 * Pure-presentation / non-rendering files are exempted in
 * `contract-tests.allowlist.json`; every entry must still exist and carry a reason.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI script executed directly by Node (npm run contracts:*) */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const COMPONENTS_DIR = path.join(ROOT, "src", "components");
const TESTS_DIR = path.join(ROOT, "src", "__tests__");
const ALLOWLIST_PATH = path.join(ROOT, "contract-tests.allowlist.json");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const toPosix = (p) => p.split(path.sep).join("/");
const rel = (p) => toPosix(path.relative(ROOT, p));

/** `MonthSwitcher.tsx` → `monthSwitcher`, `CSVImportWizard.tsx` → `csvImportWizard`. */
function camelName(file) {
  const base = path.basename(file).replace(/\.tsx?$/, "");
  return base.replace(/^[A-Z]+(?=[A-Z][a-z]|$)|^[A-Z]/, (m) => m.toLowerCase());
}

function loadAllowlist(allowlistPath) {
  const raw = JSON.parse(fs.readFileSync(allowlistPath, "utf-8"));
  const entries = Array.isArray(raw.entries) ? raw.entries : [];
  return { threshold: typeof raw.threshold === "number" ? raw.threshold : 0.9, entries };
}

function isAllowlisted(relPath, entries) {
  return entries.some((e) => (e.path.endsWith("/") ? relPath.startsWith(e.path) : relPath === e.path));
}

/**
 * Pure analysis — exported so the gate itself is unit-tested.
 * @param {{ components: string[], specs: {name: string, source: string}[], allowlist: {threshold: number, entries: {path: string, reason?: string}[]}, exists: (p: string) => boolean, lines?: (p: string) => number }} input
 */
function analyse({ components, specs, allowlist, exists, lines = () => 0 }) {
  const specNames = new Set(specs.map((s) => s.name));
  const covered = [];
  const uncovered = [];
  const allowlisted = [];

  for (const file of components) {
    if (isAllowlisted(file, allowlist.entries)) {
      allowlisted.push(file);
      continue;
    }
    const dedicated = specNames.has(`${camelName(file)}.contract.test.ts`);
    const srcRel = file.replace(/^src\//, "");
    const withoutExt = srcRel.replace(/\.tsx$/, "");
    const referenced = specs.some((s) => s.source.includes(srcRel) || s.source.includes(`"${withoutExt}"`));
    (dedicated || referenced ? covered : uncovered).push(file);
  }

  const problems = [];
  for (const entry of allowlist.entries) {
    if (!entry.reason) problems.push(`Allowlist entry "${entry.path}" has no reason.`);
    if (!exists(entry.path)) problems.push(`Allowlist entry "${entry.path}" no longer exists — remove it.`);
  }

  const denominator = covered.length + uncovered.length;
  const coverage = denominator === 0 ? 1 : covered.length / denominator;
  if (uncovered.length > 0) problems.push(`${uncovered.length} component(s) have no contract test.`);
  if (coverage < allowlist.threshold) {
    problems.push(`Coverage ${(coverage * 100).toFixed(1)}% is below the ${(allowlist.threshold * 100).toFixed(0)}% threshold.`);
  }

  return {
    total: components.length,
    covered,
    uncovered: [...uncovered].sort((a, b) => lines(b) - lines(a)),
    allowlisted,
    coverage,
    problems,
  };
}

function collect() {
  const components = walk(COMPONENTS_DIR).filter((f) => f.endsWith(".tsx")).map(rel).sort();
  const specs = walk(TESTS_DIR)
    .filter((f) => f.endsWith(".test.ts"))
    .map((f) => ({ name: path.basename(f), source: fs.readFileSync(f, "utf-8") }));
  return {
    components,
    specs,
    allowlist: loadAllowlist(ALLOWLIST_PATH),
    exists: (p) => fs.existsSync(path.join(ROOT, p)),
    lines: (p) => fs.readFileSync(path.join(ROOT, p), "utf-8").split("\n").length,
  };
}

function main(argv) {
  const input = collect();
  const result = analyse(input);
  const pct = `${(result.coverage * 100).toFixed(1)}%`;

  if (argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify({ ...result, coverage: Number(pct.replace("%", "")) }, null, 2)}\n`);
    return result.problems.length && !argv.includes("--report") ? 1 : 0;
  }

  const out = [
    "Contract-test coverage (docs/CONTRACT_TESTS.md)",
    `  components:   ${result.total}`,
    `  allowlisted:  ${result.allowlisted.length} (pure presentation / non-rendering)`,
    `  covered:      ${result.covered.length}`,
    `  uncovered:    ${result.uncovered.length}`,
    `  coverage:     ${pct} (threshold ${(input.allowlist.threshold * 100).toFixed(0)}%)`,
  ];
  if (result.uncovered.length) {
    out.push("", "Uncovered components (largest first):");
    for (const file of result.uncovered) out.push(`  - ${file} (${input.lines(file)} lines)`);
    out.push("", "Fix: npm run contracts:new -- <component path>");
  }
  process.stdout.write(`${out.join("\n")}\n`);

  if (argv.includes("--report")) return 0;
  if (result.problems.length) {
    process.stderr.write(`\nContract gate FAILED:\n${result.problems.map((p) => `  ✗ ${p}`).join("\n")}\n`);
    return 1;
  }
  process.stdout.write("\nContract gate passed.\n");
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { analyse, camelName, isAllowlisted, loadAllowlist };
