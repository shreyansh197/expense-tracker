/// <reference types="jest" />
/**
 * M4 tooling tests (T-4.1.2, T-4.1.3): the contract-test generator scaffolds a
 * spec whose assertions hold for the component it was generated from, and the
 * CI gate fails when a component ships without a contract test.
 */
import * as fs from "fs";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS CLI scripts shared with CI
const gate = require("../../scripts/check-contract-tests.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS CLI scripts shared with CI
const generator = require("../../scripts/gen-contract-test.js");

const ROOT = path.resolve(__dirname, "..", "..");
const SAMPLE = "src/components/ui/DataTableView.tsx";

const allowlist = { threshold: 0.9, entries: [{ path: "src/components/demo/illustrations/", reason: "decorative" }] };
const exists = () => true;

describe("contract-test gate (scripts/check-contract-tests.js)", () => {
  test("a synthetic PR adding a component without a spec fails the gate", () => {
    const result = gate.analyse({
      components: ["src/components/demo/Existing.tsx", "src/components/demo/BrandNew.tsx"],
      specs: [{ name: "existing.contract.test.ts", source: "" }],
      allowlist,
      exists,
    });
    expect(result.uncovered).toEqual(["src/components/demo/BrandNew.tsx"]);
    expect(result.problems.join(" ")).toMatch(/1 component\(s\) have no contract test/);
  });

  test("a component is covered by a dedicated spec or by a path reference", () => {
    const result = gate.analyse({
      components: ["src/components/demo/Dedicated.tsx", "src/components/demo/Referenced.tsx"],
      specs: [
        { name: "dedicated.contract.test.ts", source: "" },
        { name: "inventory.test.ts", source: 'readSource("components/demo/Referenced.tsx")' },
      ],
      allowlist,
      exists,
    });
    expect(result.uncovered).toEqual([]);
    expect(result.problems).toEqual([]);
    expect(result.coverage).toBe(1);
  });

  test("allowlisted presentation primitives are excluded from the denominator", () => {
    const result = gate.analyse({
      components: ["src/components/demo/illustrations/Hill.tsx", "src/components/demo/Card.tsx"],
      specs: [{ name: "card.contract.test.ts", source: "" }],
      allowlist,
      exists,
    });
    expect(result.allowlisted).toEqual(["src/components/demo/illustrations/Hill.tsx"]);
    expect(result.coverage).toBe(1);
  });

  test("stale or unjustified allowlist entries fail the gate", () => {
    const result = gate.analyse({
      components: [],
      specs: [],
      allowlist: { threshold: 0.9, entries: [{ path: "src/components/gone.tsx" }] },
      exists: () => false,
    });
    expect(result.problems.join(" ")).toMatch(/no reason/);
    expect(result.problems.join(" ")).toMatch(/no longer exists/);
  });

  test("coverage below the threshold fails the gate", () => {
    const result = gate.analyse({
      components: ["src/components/demo/A.tsx", "src/components/demo/B.tsx"],
      specs: [{ name: "a.contract.test.ts", source: "" }],
      allowlist,
      exists,
    });
    expect(result.coverage).toBe(0.5);
    expect(result.problems.join(" ")).toMatch(/below the 90% threshold/);
  });

  test("spec names follow the camelCase convention (acronyms lower-cased)", () => {
    expect(gate.camelName("MonthSwitcher.tsx")).toBe("monthSwitcher");
    expect(gate.camelName("CSVImportWizard.tsx")).toBe("csvImportWizard");
  });

  test("the repository allowlist only contains justified, existing entries", () => {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "contract-tests.allowlist.json"), "utf-8"));
    expect(raw.threshold).toBeGreaterThanOrEqual(0.9);
    for (const entry of raw.entries) {
      expect(entry.reason).toBeTruthy();
      expect(fs.existsSync(path.join(ROOT, entry.path))).toBe(true);
    }
  });
});

describe("contract-test generator (scripts/gen-contract-test.js)", () => {
  const source = fs.readFileSync(path.join(ROOT, SAMPLE), "utf-8");
  const spec: string = generator.buildSpec(path.join(ROOT, SAMPLE), source);

  test("targets the spec file name the CI gate expects", () => {
    expect(path.basename(generator.specPathFor(path.join(ROOT, SAMPLE)))).toBe("dataTableView.contract.test.ts");
  });

  test("scaffolds the baseline contract and reads the component via readSource", () => {
    expect(spec).toContain('readSource("components/ui/DataTableView.tsx")');
    expect(spec).toContain("expectBaselineContract(src)");
    expect(spec).toContain('describe("DataTableView contract"');
    expect(spec).not.toMatch(/TODO|FIXME/);
  });

  test("every detected assertion holds for the sample component (skeleton passes)", () => {
    const needles = [...spec.matchAll(/toContain\(("(?:[^"\\]|\\.)*")\)/g)].map((m) => JSON.parse(m[1]) as string);
    expect(needles.length).toBeGreaterThan(0);
    for (const needle of needles) expect(source).toContain(needle);
  });

  test("detects touch targets and live regions in the sample component", () => {
    const detected = generator.detect(source);
    expect(detected.touchTarget).toBe(true);
    expect(detected.states).toEqual(expect.arrayContaining(["aria-pressed", "aria-live"]));
  });
});
