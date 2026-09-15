/// <reference types="jest" />
import { ESLint } from "eslint";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- share the exact shipped selectors with eslint.config.mjs (CommonJS interop)
const { moneyGuardConfig } = require("../../eslint.money-rule.cjs");

/**
 * Smoke test for the money-arithmetic lint guard (T-2.3.6).
 *
 * Loads the SAME flat-config block used by `eslint.config.mjs` (shared via
 * `eslint.money-rule.cjs`) in-process and lints synthetic snippets to prove the
 * `no-restricted-syntax` guard fires on raw `+`/`-`/`*` (and compound) arithmetic
 * over money-named identifiers, stays quiet when the decimal-safe helpers are
 * used, and is disabled inside `src/lib/money.ts`. Snippets are plain JS so the
 * default parser handles them without the TypeScript parser.
 */
describe("money-arithmetic lint guard (T-2.3.6)", () => {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [moneyGuardConfig] });

  async function moneyRuleErrors(code: string, filePath: string): Promise<number> {
    const results = await eslint.lintText(code, { filePath, warnIgnored: false });
    // An ignored file yields no result — the guard simply does not apply there.
    const result = results[0];
    if (!result) return 0;
    return result.messages.filter((m) => m.ruleId === "no-restricted-syntax").length;
  }

  test("fires on raw + between two money members", async () => {
    const code = "const a = {}, b = {};\nexport const total = a.amount + b.amount;\n";
    expect(await moneyRuleErrors(code, "src/__smoke__/violation.ts")).toBeGreaterThan(0);
  });

  test("fires on compound += onto a money field", async () => {
    const code = "export function f(rows) { let total = 0; for (const r of rows) total += r.amount; return total; }\n";
    expect(await moneyRuleErrors(code, "src/__smoke__/compound.ts")).toBeGreaterThan(0);
  });

  test("fires on raw - between money members (expectedAmount)", async () => {
    const code = "const l = {}, p = {};\nexport const remaining = l.expectedAmount - p.amount;\n";
    expect(await moneyRuleErrors(code, "src/__smoke__/subtract.ts")).toBeGreaterThan(0);
  });

  test("stays quiet when the decimal-safe helpers are used", async () => {
    const code = "import { addMoney } from '@/lib/money';\nconst a = {}, b = {};\nexport const total = addMoney(a.amount, b.amount);\n";
    expect(await moneyRuleErrors(code, "src/__smoke__/clean.ts")).toBe(0);
  });

  test("is disabled inside src/lib/money.ts", async () => {
    const code = "export function addRaw(amount) { return amount + amount; }\n";
    expect(await moneyRuleErrors(code, "src/lib/money.ts")).toBe(0);
  });
});
