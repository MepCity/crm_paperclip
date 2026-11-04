import type { FieldValue, JsonObject, RecordData } from "../contract";
import { computeLineItemTotals, type LineItemInput } from "../line-items";
import { organisationTaxes } from "../tax";
import { fixtureAccountId } from "./accounts/seed";
import { fixtureProductId } from "./products/seed";

/** Deterministic synthetic document: 1–4 lines linked to seeded Products, all formulas computed. */
export function seedDocument(index: number, itemsField: string): Record<string, FieldValue> {
  const count = (index % 4) + 1;
  const items: LineItemInput[] = Array.from({ length: count }, (_, row) => {
    const productIndex = (index * 3 + row) % 30;
    const percent = (index + row) % 5 === 0;
    return {
      Product_Name: {
        module: "Products",
        id: fixtureProductId(productIndex),
        name: `Product ${String(productIndex + 1).padStart(3, "0")}`,
      },
      Description: null,
      Quantity: row + 1,
      List_Price: 50 + productIndex * 12.5,
      Discount_Percentage: percent ? 10 : null,
      Discount: percent ? null : (index + row) % 4 === 0 ? 5 : 0,
      Line_Tax: (index + row) % 3 === 0 ? [] : [{ name: "Vat" }],
    };
  });
  const headerTax =
    index % 4 === 1 ? [organisationTaxes[0]].flatMap((tax) => (tax ? [tax] : [])) : [];
  const totals = computeLineItemTotals(
    items,
    {
      Discount: index % 6 === 0 ? 10 : 0,
      Header_Tax: headerTax,
      Adjustment: index % 7 === 0 ? -2.5 : 0,
    },
    itemsField,
  );
  return {
    [itemsField]: totals.lines.map(
      (line, row) => ({ id: `${itemsField}-${index}-${row}`, ...line }) as unknown as JsonObject,
    ),
    Sub_Total: totals.Sub_Total,
    Discount: totals.Discount,
    Discount_Percentage: null,
    Header_Tax: headerTax.map((tax) => tax.name),
    Tax: totals.Tax,
    Adjustment: totals.Adjustment,
    Grand_Total: totals.Grand_Total,
  };
}

export const seedLinks = (index: number): Record<string, FieldValue> => ({
  Account_Name: { module: "Accounts", id: fixtureAccountId(index % 10) },
  Contact_Name: { module: "Contacts", id: String(300000000000000000n + BigInt(index % 10)) },
});

export const seedDeal = (index: number): FieldValue => ({
  module: "Deals",
  id: String(700000000000000000n + BigInt(index % 10)),
});

export type SeedBuilder = (now: Date) => RecordData[];
