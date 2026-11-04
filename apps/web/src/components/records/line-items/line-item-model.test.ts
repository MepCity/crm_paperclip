import { describe, expect, it } from "vitest";
import {
  EMPTY_HEADER,
  emptyRow,
  headerToValues,
  type LineRow,
  liveTotals,
  rowsFromValue,
  rowsToValue,
  validateLineItems,
} from "./line-item-model";

const product = { module: "Products", id: "p1", name: "Widget" };
const row = (over: Partial<LineRow>): LineRow => ({
  ...emptyRow(),
  product,
  quantity: "2",
  listPrice: "100",
  ...over,
});

describe("line item model", () => {
  it("computes live totals with percent + amount discounts, VAT, header discount, adjustment", () => {
    const rows = [
      row({ discountMode: "percent", discountValue: "10", taxes: ["Vat"] }),
      row({ discountMode: "amount", discountValue: "20" }),
      row({ quantity: "1", listPrice: "50" }),
    ];
    const live = liveTotals(rows, {
      discountMode: "amount",
      discountValue: "10",
      taxes: [],
      adjustment: "-0,5",
    });
    // r1: 200-20=180 +36 vat=216; r2: 200-20=180; r3: 50 → sub 446; -10 + -0.5 = 435.5
    expect(live.totals?.Sub_Total).toBe(446);
    expect(live.totals?.Grand_Total).toBe(435.5);
    expect(live.lines[0]?.Net_Total).toBe(216);
  });

  it("recomputes when a quantity changes", () => {
    const first = liveTotals([row({})], EMPTY_HEADER).totals?.Grand_Total;
    const second = liveTotals([row({ quantity: "3" })], EMPTY_HEADER).totals?.Grand_Total;
    expect([first, second]).toEqual([200, 300]);
  });

  it("round-trips rows and header to the record shape", () => {
    const value = rowsToValue([
      row({ discountMode: "percent", discountValue: "5", taxes: ["Vat"] }),
    ]);
    expect(value[0]).toMatchObject({ Discount_Percentage: 5, Quantity: 2, List_Price: 100 });
    expect(rowsFromValue(value)[0]).toMatchObject({
      discountMode: "percent",
      discountValue: "5",
      taxes: ["Vat"],
    });
    expect(
      headerToValues({ ...EMPTY_HEADER, discountMode: "percent", discountValue: "3" }),
    ).toMatchObject({
      Discount: 0,
      Discount_Percentage: 3,
    });
  });

  it("validates required lines, product and quantity", () => {
    expect(validateLineItems([], EMPTY_HEADER)).toEqual({ "": "Add at least one line item." });
    expect(
      validateLineItems([row({ product: null })], EMPTY_HEADER)["[0].Product_Name"],
    ).toBeTruthy();
    expect(validateLineItems([row({ quantity: "0" })], EMPTY_HEADER)["[0].Quantity"]).toBeTruthy();
    expect(
      validateLineItems([row({ discountValue: "500" })], EMPTY_HEADER)["[0].Discount"],
    ).toBeTruthy();
    expect(validateLineItems([row({})], EMPTY_HEADER)).toEqual({});
  });
});
