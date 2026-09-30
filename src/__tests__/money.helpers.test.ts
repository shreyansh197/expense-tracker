/// <reference types="jest" />
import {
  toMinor,
  fromMinor,
  addMoney,
  subMoney,
  mulMoney,
  sumMoney,
  formatMoney,
  MINOR_UNITS_PER_MAJOR,
  type Money,
} from "../lib/money";

describe("money helpers — decimal-safe arithmetic (T-2.3.4)", () => {
  describe("constants", () => {
    test("MINOR_UNITS_PER_MAJOR is 100", () => {
      expect(MINOR_UNITS_PER_MAJOR).toBe(100);
    });
  });

  describe("toMinor / fromMinor", () => {
    test("converts major units to integer minor units", () => {
      expect(toMinor(12.34)).toBe(1234);
      expect(toMinor(0)).toBe(0);
      expect(toMinor(1000)).toBe(100000);
    });

    test("rounds to the nearest minor unit", () => {
      expect(toMinor(12.345)).toBe(1235); // 1234.5 → 1235
      expect(toMinor(12.344)).toBe(1234);
    });

    test("round-trips through fromMinor", () => {
      expect(fromMinor(toMinor(12.34))).toBe(12.34);
      expect(fromMinor(1234 as Money)).toBe(12.34);
    });

    test("throws on non-finite input (NaN branch)", () => {
      expect(() => toMinor(NaN)).toThrow(RangeError);
    });

    test("throws on non-finite input (Infinity branch)", () => {
      expect(() => toMinor(Infinity)).toThrow(RangeError);
      expect(() => toMinor(-Infinity)).toThrow(RangeError);
    });
  });

  describe("addMoney", () => {
    test("adds without binary-float drift", () => {
      expect(addMoney(0.1, 0.2)).toBe(0.3);
      expect(0.1 + 0.2).not.toBe(0.3); // proves the drift the helper avoids
    });

    test("handles whole and fractional amounts", () => {
      expect(addMoney(1000, 250.5)).toBe(1250.5);
      expect(addMoney(0, 0)).toBe(0);
    });
  });

  describe("subMoney", () => {
    test("subtracts without binary-float drift", () => {
      expect(subMoney(0.3, 0.1)).toBe(0.2);
      expect(subMoney(1000, 999.99)).toBe(0.01);
    });

    test("supports negative results", () => {
      expect(subMoney(10, 25)).toBe(-15);
    });
  });

  describe("mulMoney", () => {
    test("multiplies by a unitless factor, rounding to minor units", () => {
      expect(mulMoney(19.99, 3)).toBe(59.97);
      expect(mulMoney(100, 0.5)).toBe(50);
    });

    test("rounds fractional minor units", () => {
      expect(mulMoney(10, 1.005)).toBe(10.05); // 1000 * 1.005 = 1005
    });

    test("throws on non-finite factor (Infinity branch)", () => {
      expect(() => mulMoney(10, Infinity)).toThrow(RangeError);
      expect(() => mulMoney(10, NaN)).toThrow(RangeError);
    });
  });

  describe("sumMoney", () => {
    test("sums a list without accruing drift", () => {
      expect(sumMoney([0.1, 0.2, 0.3])).toBe(0.6);
      expect(sumMoney([10.01, 20.02, 30.03])).toBe(60.06);
    });

    test("empty list sums to 0 (empty-loop branch)", () => {
      expect(sumMoney([])).toBe(0);
    });

    test("long series stays exact", () => {
      const cents = Array.from({ length: 1000 }, () => 0.01);
      expect(sumMoney(cents)).toBe(10);
    });
  });

  describe("formatMoney", () => {
    test("formats using the given currency", () => {
      expect(typeof formatMoney(1234.5, "USD")).toBe("string");
      expect(formatMoney(1234.5, "USD")).toContain("1,234.5");
    });

    test("defaults to INR when no currency is supplied", () => {
      expect(formatMoney(1000)).toContain("1,000");
    });
  });
});
