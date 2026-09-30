/**
 * Money — the single vocabulary for monetary values in ExpenStream.
 *
 * Binary floats silently lose precision under `+`/`-`/`*` (e.g. `0.1 + 0.2`),
 * which is unacceptable for financial numbers. Every monetary computation must
 * therefore route through the decimal-safe helpers in this module, which perform
 * arithmetic on **integer minor units** (paise/cents) and only convert back to a
 * major-unit number at the boundary.
 *
 * This is the only file permitted to use raw `+`/`-`/`*` on money-bearing values;
 * a lint guard (see `eslint.config.mjs`) enforces that everywhere else.
 *
 * Closes TD-9; mitigates R-5. See IMPLEMENTATION_RULES §1 and Architecture §18.
 */

import { formatCurrency } from "@/lib/utils";

/**
 * A monetary value expressed as an integer count of the currency's smallest
 * unit (paise for INR, cents for USD/EUR/GBP). The brand prevents accidentally
 * mixing minor units with plain major-unit numbers at compile time.
 */
export type Money = number & { readonly __brand: "minor-units" };

/** Minor units per major unit — 100 for every currency ExpenStream supports. */
export const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Convert a major-unit amount (e.g. `12.34` rupees) to branded minor units
 * (`1234` paise), rounding to the nearest minor unit. Throws on non-finite input
 * so precision bugs surface loudly instead of propagating `NaN`.
 */
export function toMinor(major: number): Money {
  if (!Number.isFinite(major)) {
    throw new RangeError(`toMinor: expected a finite number, received ${major}`);
  }
  return Math.round(major * MINOR_UNITS_PER_MAJOR) as Money;
}

/** Convert branded minor units back to a major-unit number (e.g. `1234` → `12.34`). */
export function fromMinor(minor: Money): number {
  return minor / MINOR_UNITS_PER_MAJOR;
}

/** Add two major-unit amounts without binary-float drift. */
export function addMoney(a: number, b: number): number {
  return fromMinor((toMinor(a) + toMinor(b)) as Money);
}

/** Subtract major-unit `b` from major-unit `a` without binary-float drift. */
export function subMoney(a: number, b: number): number {
  return fromMinor((toMinor(a) - toMinor(b)) as Money);
}

/**
 * Multiply a major-unit amount by a unitless factor (e.g. a day ratio or an
 * exchange rate) without drift, rounding the result to the nearest minor unit.
 */
export function mulMoney(amount: number, factor: number): number {
  if (!Number.isFinite(factor)) {
    throw new RangeError(`mulMoney: expected a finite factor, received ${factor}`);
  }
  return fromMinor(Math.round(toMinor(amount) * factor) as Money);
}

/**
 * Sum a list of major-unit amounts without drift. Accumulates in integer minor
 * units so a long series of additions never accrues rounding error.
 */
export function sumMoney(amounts: readonly number[]): number {
  let acc = 0; // minor units
  for (const amount of amounts) {
    acc = acc + toMinor(amount);
  }
  return fromMinor(acc as Money);
}

/**
 * Format a major-unit amount as localized currency. Thin wrapper over
 * `formatCurrency` so display code has a single money-aware entry point.
 */
export function formatMoney(amount: number, currency?: string): string {
  return formatCurrency(amount, currency);
}
