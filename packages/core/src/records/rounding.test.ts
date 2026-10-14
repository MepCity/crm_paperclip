import { describe, expect, it } from "vitest";
import { roundMoneyTwoDecimals } from "./rounding";

describe("roundMoneyTwoDecimals", () => {
  it("rounds positive and negative half-cent amounts symmetrically away from zero", () => {
    expect(roundMoneyTwoDecimals(1.005)).toBe(1.01);
    expect(roundMoneyTwoDecimals(-1.005)).toBe(-1.01);
    expect(roundMoneyTwoDecimals(2.675)).toBe(2.68);
    expect(roundMoneyTwoDecimals(-2.675)).toBe(-2.68);
  });

  it("never returns negative zero", () => {
    const zeroResult = roundMoneyTwoDecimals(0);
    expect(zeroResult).toBe(0);
    expect(Object.is(zeroResult, 0)).toBe(true);

    const negZeroResult = roundMoneyTwoDecimals(-0);
    expect(negZeroResult).toBe(0);
    expect(Object.is(negZeroResult, 0)).toBe(true);

    const smallNegResult = roundMoneyTwoDecimals(-0.004);
    expect(smallNegResult).toBe(0);
    expect(Object.is(smallNegResult, 0)).toBe(true);
  });

  it("handles typical and large monetary values correctly", () => {
    expect(roundMoneyTwoDecimals(1234.5)).toBe(1234.5);
    expect(roundMoneyTwoDecimals(123456789.125)).toBe(123456789.13);
    expect(roundMoneyTwoDecimals(-123456789.125)).toBe(-123456789.13);
  });

  it("preserves non-finite values", () => {
    expect(Number.isNaN(roundMoneyTwoDecimals(Number.NaN))).toBe(true);
    expect(roundMoneyTwoDecimals(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
    expect(roundMoneyTwoDecimals(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY);
  });
});
