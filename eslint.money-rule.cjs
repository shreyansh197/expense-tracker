// ── Money-arithmetic guard (T-2.3.6) ──
//
// Binary floats silently lose precision under `+`/`-`/`*`, which is unacceptable
// for money. All monetary math must route through the decimal-safe helpers in
// `src/lib/money.ts` (`addMoney`, `subMoney`, `mulMoney`, `sumMoney`). This rule
// forbids raw `+`/`-`/`*` (and their compound `+=`/`-=`/`*=` forms) on any
// identifier or member named `amount`, `expectedAmount`, or `receivedAmount`
// everywhere except `src/lib/money.ts`. Codifies TD-9; see IMPLEMENTATION_RULES §1.
//
// Shared as CommonJS so both `eslint.config.mjs` and the T-2.3.6 smoke test
// (`src/__tests__/moneyLintRule.test.ts`) enforce the exact same selectors.
const MONEY_FIELD = "/^(amount|expectedAmount|receivedAmount)$/";

const MONEY_ARITHMETIC_MESSAGE =
  "Raw arithmetic on money fields loses precision. Use the decimal-safe helpers in src/lib/money.ts (addMoney/subMoney/mulMoney/sumMoney).";

const noMoneyArithmetic = [
  "error",
  {
    selector: `BinaryExpression[operator=/^[-+*]$/] > Identifier[name=${MONEY_FIELD}]`,
    message: MONEY_ARITHMETIC_MESSAGE,
  },
  {
    selector: `BinaryExpression[operator=/^[-+*]$/] > MemberExpression[property.name=${MONEY_FIELD}]`,
    message: MONEY_ARITHMETIC_MESSAGE,
  },
  {
    selector: `AssignmentExpression[operator=/^[-+*]=$/] > Identifier[name=${MONEY_FIELD}]`,
    message: MONEY_ARITHMETIC_MESSAGE,
  },
  {
    selector: `AssignmentExpression[operator=/^[-+*]=$/] > MemberExpression[property.name=${MONEY_FIELD}]`,
    message: MONEY_ARITHMETIC_MESSAGE,
  },
];

// Flat-config block: the guard applies to all app source except the money
// helpers themselves (the one place raw arithmetic is intentional) and test
// files (fixtures freely construct arithmetic on money-named identifiers).
const moneyGuardConfig = {
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/lib/money.ts", "src/__tests__/**"],
  rules: {
    "no-restricted-syntax": noMoneyArithmetic,
  },
};

module.exports = { MONEY_FIELD, MONEY_ARITHMETIC_MESSAGE, noMoneyArithmetic, moneyGuardConfig };
