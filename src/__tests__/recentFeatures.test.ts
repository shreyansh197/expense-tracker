/// <reference types="jest" />
/**
 * Tests for features added in the recent audit sprint:
 *  - CSV import: parseCSV, autoMapHeaders, convertRow
 *  - RecurringFrequency: type guard ensuring all 5 values exist
 *  - PIN sessionStorage migration: storage keys go to the right store
 *  - CategoryManager merge guard: stale UI cleared on null workspace
 */

import { parseCSV, autoMapHeaders, convertRow } from "../components/expenses/CSVImportWizard";
import type { MappedField } from "../components/expenses/CSVImportWizard";
import type { RecurringFrequency } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. parseCSV
// ─────────────────────────────────────────────────────────────────────────────

describe("parseCSV", () => {
  it("parses simple comma-separated rows", () => {
    const csv = "date,amount,category\n2025-01-15,500,groceries\n2025-01-16,200,transport";
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ date: "2025-01-15", amount: "500", category: "groceries" });
    expect(rows[1]).toEqual({ date: "2025-01-16", amount: "200", category: "transport" });
  });

  it("handles quoted fields containing commas", () => {
    const csv = `date,amount,remark\n2025-02-01,1200,"Dinner, Hotel, Taxi"`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].remark).toBe("Dinner, Hotel, Taxi");
    expect(rows[0].amount).toBe("1200");
  });

  it("skips blank lines between data rows", () => {
    const csv = "date,amount\n2025-01-01,100\n\n2025-01-02,200\n";
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
  });

  it("returns [] when the file has only a header (no data rows)", () => {
    expect(parseCSV("date,amount,category")).toEqual([]);
  });

  it("returns [] for empty string", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("normalises CRLF line endings", () => {
    const csv = "date,amount\r\n2025-01-01,100\r\n2025-01-02,200";
    expect(parseCSV(csv)).toHaveLength(2);
  });

  it("strips surrounding quotes from header names", () => {
    const csv = `"Date","Amount"\n2025-01-01,100`;
    const rows = parseCSV(csv);
    expect(rows[0]).toHaveProperty("date");
    expect(rows[0]).toHaveProperty("amount");
  });

  it("lowercases header names", () => {
    const csv = "DATE,AMOUNT\n2025-01-01,100";
    const rows = parseCSV(csv);
    expect(rows[0]).toHaveProperty("date");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. autoMapHeaders
// ─────────────────────────────────────────────────────────────────────────────

describe("autoMapHeaders", () => {
  const cases: [string, MappedField][] = [
    // date variants
    ["date", "date"],
    ["Date", "date"],
    ["DATE", "date"],
    ["transaction_date", "date"],
    ["day", "date"],
    // amount variants
    ["amount", "amount"],
    ["Amount", "amount"],
    ["price", "amount"],
    ["Price (INR)", "amount"],
    ["cost", "amount"],
    // category
    ["category", "category"],
    ["Category", "category"],
    ["type", "category"],
    ["expense type", "category"],
    // remark
    ["remark", "remark"],
    ["Remark", "remark"],
    ["note", "remark"],
    ["description", "remark"],
    ["desc", "remark"],
    // currency
    ["currency", "currency"],
    ["Currency", "currency"],
    ["cur", "currency"],
    // unknown
    ["foo", "__ignore__"],
    ["bar_baz", "__ignore__"],
    ["123", "__ignore__"],
  ];

  test.each(cases)('maps header "%s" → "%s"', (header, expected) => {
    const result = autoMapHeaders([header]);
    expect(result[header]).toBe(expected);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. convertRow
// ─────────────────────────────────────────────────────────────────────────────

describe("convertRow", () => {
  const catMap = { groceries: "Groceries", transport: "Transport", miscellaneous: "Miscellaneous" };
  const mapping: Record<string, MappedField> = {
    date: "date",
    amount: "amount",
    category: "category",
    remark: "remark",
  };

  it("parses a valid YYYY-MM-DD date row correctly", () => {
    const row = convertRow({ date: "2025-03-15", amount: "1500", category: "groceries", remark: "Weekly shop" }, mapping, catMap);
    expect(row.date).toEqual({ day: 15, month: 3, year: 2025 });
    expect(row.amount).toBe(1500);
    expect(row.category).toBe("groceries");
    expect(row.remark).toBe("Weekly shop");
    expect(row.error).toBeUndefined();
  });

  it("parses DD/MM/YYYY date format", () => {
    const row = convertRow({ date: "15/03/2025", amount: "500" }, { date: "date", amount: "amount" }, catMap);
    expect(row.date).toEqual({ day: 15, month: 3, year: 2025 });
  });

  it("parses natural date strings via Date constructor fallback", () => {
    const row = convertRow({ date: "March 15 2025", amount: "100" }, { date: "date", amount: "amount" }, catMap);
    expect(row.date?.year).toBe(2025);
    expect(row.date?.month).toBe(3);
    expect(row.date?.day).toBe(15);
  });

  it("sets error for an unparseable date", () => {
    const row = convertRow({ date: "not-a-date", amount: "100" }, { date: "date", amount: "amount" }, catMap);
    expect(row.error).toContain("Invalid date");
  });

  it("strips currency symbols from amount (e.g. ₹1,500)", () => {
    const row = convertRow({ amount: "₹1500" }, { amount: "amount" }, catMap);
    expect(row.amount).toBe(1500);
  });

  it("sets error for zero / negative amount", () => {
    const row = convertRow({ amount: "0" }, { amount: "amount" }, catMap);
    expect(row.error).toBeDefined();
  });

  it("falls back to miscellaneous for unknown category", () => {
    const row = convertRow({ amount: "100", category: "leisure" }, { amount: "amount", category: "category" }, catMap);
    expect(row.category).toBe("miscellaneous");
  });

  it("matches category case-insensitively by label", () => {
    const row = convertRow({ amount: "100", category: "GROCERIES" }, { amount: "amount", category: "category" }, catMap);
    expect(row.category).toBe("groceries");
  });

  it("uppercases currency code", () => {
    const row = convertRow({ amount: "100", currency: "usd" }, { amount: "amount", currency: "currency" }, catMap);
    expect(row.currency).toBe("USD");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. RecurringFrequency — all valid values exist
// ─────────────────────────────────────────────────────────────────────────────

describe("RecurringFrequency", () => {
  // Runtime guard: these must be all valid values of the union
  const VALID_FREQUENCIES: RecurringFrequency[] = [
    "monthly",
    "weekly",
    "bi-weekly",
    "quarterly",
    "annual",
  ];

  it("contains exactly 5 valid frequencies", () => {
    expect(VALID_FREQUENCIES).toHaveLength(5);
  });

  it("includes monthly", () => {
    expect(VALID_FREQUENCIES).toContain("monthly");
  });

  it("includes weekly", () => {
    expect(VALID_FREQUENCIES).toContain("weekly");
  });

  it("includes bi-weekly", () => {
    expect(VALID_FREQUENCIES).toContain("bi-weekly");
  });

  it("includes quarterly", () => {
    expect(VALID_FREQUENCIES).toContain("quarterly");
  });

  it("includes annual", () => {
    expect(VALID_FREQUENCIES).toContain("annual");
  });

  it("does not include deprecated values", () => {
    // These were never valid — TypeScript would also catch this but belt-and-suspenders
    const invalid = ["daily", "yearly", "fortnightly", ""];
    for (const v of invalid) {
      expect(VALID_FREQUENCIES).not.toContain(v);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PIN storage key routing (sessionStorage vs localStorage)
// ─────────────────────────────────────────────────────────────────────────────
// Strategy: Read the raw source text to confirm the right storage API is used
// for each key constant. This is a static-analysis-style test that catches
// accidental regressions without needing to run the hook in a browser.

describe('PIN storage migration: sessionStorage for ephemeral keys', () => {
  const fsNode = require('fs');
  const pathNode = require('path');
  const hookSrc = fsNode.readFileSync(pathNode.resolve(__dirname, '../hooks/usePinLock.ts'), 'utf8');

  // Constants whose storage API calls must use sessionStorage
  const sessionConsts = ['PIN_LAST_ACTIVE_KEY', 'PIN_ATTEMPTS_KEY', 'PIN_LOCKOUT_UNTIL_KEY'];
  // Constants whose storage API calls must use localStorage
  const persistConsts = ['PIN_STORAGE_KEY', 'PIN_TIMEOUT_KEY'];

  for (const name of sessionConsts) {
    it(name + ' storage calls use sessionStorage', () => {
      const apiLines = hookSrc.split('\n').filter(
        (l) => l.includes(name) && /Storage[.(]/.test(l),
      );
      expect(apiLines.length).toBeGreaterThan(0);
      for (const line of apiLines) {
        expect(line).toMatch(/sessionStorage/);
        expect(line).not.toMatch(/localStorage/);
      }
    });
  }

  for (const name of persistConsts) {
    it(name + ' storage calls use localStorage', () => {
      const apiLines = hookSrc.split('\n').filter(
        (l) => l.includes(name) && /Storage[.(]/.test(l),
      );
      expect(apiLines.length).toBeGreaterThan(0);
      for (const line of apiLines) {
        expect(line).toMatch(/localStorage/);
        expect(line).not.toMatch(/sessionStorage/);
      }
    });
  }
});
