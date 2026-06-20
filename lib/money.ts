// ========================================
// KIMICHI ERP - CENTS-SAFE MONEY HELPERS
// ========================================
// All currency amounts in the store are plain JS `number` values (Libyan
// Dinar, with fils as the minor unit). Raw float arithmetic on money is
// unsafe: 0.1 + 0.2 !== 0.3 in JS, and strict equality checks like
// `remaining === 0` can silently fail after a handful of operations.
//
// These helpers convert to integer "cents" (minor units) for arithmetic,
// then convert back, which avoids binary floating point drift for the
// kinds of 2-decimal amounts this app deals with. They are not a full
// arbitrary-precision decimal library, but they are sufficient to make
// payment/invoice math reliable for amounts in the range this ERP handles.

const MINOR_UNITS = 100; // 2 decimal places (fils per dinar)

/** Round a JS float to the nearest integer minor-unit (cent). */
export function toMinorUnits(amount: number): number {
  return Math.round((amount || 0) * MINOR_UNITS);
}

/** Convert minor units back to a normal decimal amount. */
export function fromMinorUnits(minor: number): number {
  return minor / MINOR_UNITS;
}

/** Round a currency amount safely to 2 decimal places. */
export function roundMoney(amount: number): number {
  return fromMinorUnits(toMinorUnits(amount));
}

/** Add any number of currency amounts with cents-safe precision. */
export function addMoney(...amounts: number[]): number {
  return fromMinorUnits(amounts.reduce((sum, a) => sum + toMinorUnits(a), 0));
}

/** Subtract b from a with cents-safe precision. */
export function subMoney(a: number, b: number): number {
  return fromMinorUnits(toMinorUnits(a) - toMinorUnits(b));
}

/** Clamp a currency amount to be >= 0 (after rounding). */
export function clampNonNegative(amount: number): number {
  return Math.max(0, roundMoney(amount));
}

/**
 * Safe replacement for `amount === 0` on money values. Treats anything
 * within half a fils of zero as zero, which absorbs float drift from
 * chained add/subtract operations.
 */
export function isZeroMoney(amount: number): boolean {
  return Math.abs(toMinorUnits(amount)) === 0;
}

/** Safe replacement for `a <= b` comparisons on money values. */
export function moneyLessThanOrEqual(a: number, b: number): boolean {
  return toMinorUnits(a) <= toMinorUnits(b);
}

/** Safe replacement for `a > b` comparisons on money values. */
export function moneyGreaterThan(a: number, b: number): boolean {
  return toMinorUnits(a) > toMinorUnits(b);
}
