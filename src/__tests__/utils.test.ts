/// <reference types="jest" />
import {
  formatCurrency,
  formatCurrencyCompact,
  getCurrencySymbol,
  getDaysInMonth,
  getMonthName,
  getShortMonthName,
  cn,
  SUPPORTED_CURRENCIES,
} from "../lib/utils";

// =========== cn (class merge utility) ===========

describe("cn", () => {
  test("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  test("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  test("deduplicates conflicting Tailwind classes", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  test("merges complex Tailwind classes", () => {
    const result = cn("text-red-500 bg-blue-200", "text-green-500");
    expect(result).toContain("text-green-500");
    expect(result).toContain("bg-blue-200");
    expect(result).not.toContain("text-red-500");
  });

  test("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });

  test("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});

// =========== SUPPORTED_CURRENCIES ===========

describe("SUPPORTED_CURRENCIES", () => {
  test("contains INR, USD, EUR, GBP", () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
    expect(codes).toContain("INR");
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("GBP");
  });

  test("each currency has code, symbol, label, locale", () => {
    for (const c of SUPPORTED_CURRENCIES) {
      expect(c.code).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.locale).toBeTruthy();
    }
  });
});

// =========== formatCurrency ===========

describe("formatCurrency", () => {
  test("formats INR correctly", () => {
    const result = formatCurrency(50000, "INR");
    expect(result).toContain("50,000");
    expect(result).toMatch(/₹/);
  });

  test("formats USD correctly", () => {
    const result = formatCurrency(1234, "USD");
    expect(result).toContain("1,234");
    expect(result).toMatch(/\$/);
  });

  test("formats EUR correctly", () => {
    const result = formatCurrency(999, "EUR");
    expect(result).toContain("999");
    expect(result).toMatch(/€/);
  });

  test("formats GBP correctly", () => {
    const result = formatCurrency(500, "GBP");
    expect(result).toContain("500");
    expect(result).toMatch(/£/);
  });

  test("defaults to INR when no currency specified", () => {
    const result = formatCurrency(1000);
    expect(result).toMatch(/₹/);
  });

  test("defaults to INR for unknown currency code", () => {
    const result = formatCurrency(1000, "XYZ");
    expect(result).toMatch(/₹/);
  });

  test("formats 0 correctly", () => {
    const result = formatCurrency(0, "INR");
    expect(result).toContain("0");
  });

  test("formats negative amounts", () => {
    const result = formatCurrency(-500, "INR");
    expect(result).toContain("500");
  });

  test("formats large amounts with proper grouping", () => {
    const result = formatCurrency(1234567, "INR");
    // Indian locale uses lakh grouping: 12,34,567
    expect(result).toMatch(/12,34,567/);
  });
});

// =========== formatCurrencyCompact ===========

describe("formatCurrencyCompact", () => {
  test("formats >= 100000 as L (lakh)", () => {
    expect(formatCurrencyCompact(100000, "INR")).toBe("₹1.0L");
    expect(formatCurrencyCompact(250000, "INR")).toBe("₹2.5L");
  });

  test("formats >= 1000 as K", () => {
    expect(formatCurrencyCompact(1000, "INR")).toBe("₹1.0K");
    expect(formatCurrencyCompact(5500, "INR")).toBe("₹5.5K");
  });

  test("formats < 1000 as plain number", () => {
    expect(formatCurrencyCompact(999, "INR")).toBe("₹999");
    expect(formatCurrencyCompact(0, "INR")).toBe("₹0");
  });

  test("uses correct symbol per currency", () => {
    expect(formatCurrencyCompact(5000, "USD")).toBe("$5.0K");
    expect(formatCurrencyCompact(5000, "EUR")).toBe("€5.0K");
    expect(formatCurrencyCompact(5000, "GBP")).toBe("£5.0K");
  });

  test("defaults to INR symbol", () => {
    expect(formatCurrencyCompact(500)).toBe("₹500");
  });

  test("boundary: exactly 1000", () => {
    expect(formatCurrencyCompact(1000, "INR")).toBe("₹1.0K");
  });

  test("boundary: exactly 100000", () => {
    expect(formatCurrencyCompact(100000, "INR")).toBe("₹1.0L");
  });

  test("boundary: 99999 uses K format", () => {
    expect(formatCurrencyCompact(99999, "INR")).toBe("₹100.0K");
  });
});

// =========== getCurrencySymbol ===========

describe("getCurrencySymbol", () => {
  test("returns ₹ for INR", () => {
    expect(getCurrencySymbol("INR")).toBe("₹");
  });

  test("returns $ for USD", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  test("returns € for EUR", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  test("returns £ for GBP", () => {
    expect(getCurrencySymbol("GBP")).toBe("£");
  });

  test("defaults to ₹ for unknown currency", () => {
    expect(getCurrencySymbol("XYZ")).toBe("₹");
  });

  test("defaults to ₹ when no argument", () => {
    expect(getCurrencySymbol()).toBe("₹");
  });
});

// =========== getDaysInMonth ===========

describe("getDaysInMonth", () => {
  test("January has 31 days", () => {
    expect(getDaysInMonth(1, 2026)).toBe(31);
  });

  test("February non-leap year has 28 days", () => {
    expect(getDaysInMonth(2, 2026)).toBe(28);
  });

  test("February leap year has 29 days", () => {
    expect(getDaysInMonth(2, 2028)).toBe(29);
  });

  test("April has 30 days", () => {
    expect(getDaysInMonth(4, 2026)).toBe(30);
  });

  test("December has 31 days", () => {
    expect(getDaysInMonth(12, 2026)).toBe(31);
  });

  test("February 2000 (century leap year) has 29 days", () => {
    expect(getDaysInMonth(2, 2000)).toBe(29);
  });

  test("February 1900 (century non-leap year) has 28 days", () => {
    expect(getDaysInMonth(2, 1900)).toBe(28);
  });

  test("all months return between 28 and 31", () => {
    for (let m = 1; m <= 12; m++) {
      const days = getDaysInMonth(m, 2026);
      expect(days).toBeGreaterThanOrEqual(28);
      expect(days).toBeLessThanOrEqual(31);
    }
  });
});

// =========== getMonthName ===========

describe("getMonthName", () => {
  test("returns full month names", () => {
    expect(getMonthName(1)).toBe("January");
    expect(getMonthName(6)).toBe("June");
    expect(getMonthName(12)).toBe("December");
  });

  test("all 12 months return distinct names", () => {
    const names = Array.from({ length: 12 }, (_, i) => getMonthName(i + 1));
    expect(new Set(names).size).toBe(12);
  });
});

// =========== getShortMonthName ===========

describe("getShortMonthName", () => {
  test("returns short month names", () => {
    expect(getShortMonthName(1)).toBe("Jan");
    expect(getShortMonthName(6)).toBe("Jun");
    expect(getShortMonthName(12)).toBe("Dec");
  });

  test("short names are 3 characters", () => {
    for (let m = 1; m <= 12; m++) {
      expect(getShortMonthName(m).length).toBe(3);
    }
  });

  test("all 12 short month names are distinct", () => {
    const names = Array.from({ length: 12 }, (_, i) => getShortMonthName(i + 1));
    expect(new Set(names).size).toBe(12);
  });
});
