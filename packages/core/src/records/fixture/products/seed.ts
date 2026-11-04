import type { FieldValue, RecordData } from "../../contract";
import { organisationTaxes } from "../../tax";
import { productsMetadata } from "./metadata";
import { productsPicklists } from "./picklists";

export const fixtureProductId = (index: number) => String(310000000000000000n + BigInt(index));
export const fullName = (fields: Readonly<Record<string, FieldValue>>) =>
  String(fields.Product_Name ?? "");

export function generateFixtureProducts(now: Date): RecordData[] {
  return Array.from({ length: 30 }, (_, index) => {
    const id = fixtureProductId(index);
    const fields: Record<string, FieldValue> = Object.fromEntries(
      productsMetadata.fields.map((field) => [field.apiName, null]),
    );
    for (const [name, options] of Object.entries(productsPicklists)) {
      if (name === "Tax" || name === "Header_Tax" || /^(Billing|Shipping)_/.test(name)) continue;
      fields[name] = options[index % options.length]?.storedValue ?? null;
    }
    const suffix = String(index + 1).padStart(3, "0");
    const taxable = index % 3 !== 2;
    Object.assign(fields, {
      id,
      Product_Name: `Product ${suffix}`,
      Product_Code: `P-${suffix}`,
      Product_Active: index % 5 !== 4,
      Unit_Price: 50 + index * 12.5,
      Description: `Synthetic product ${suffix}`,
      Taxable: taxable,
      Tax: taxable ? [organisationTaxes[index % organisationTaxes.length]?.name ?? "Vat"] : [],
      Qty_in_Stock: 100 - index,
      Created_Time: new Date(now.getTime() - index * 86400000).toISOString(),
      Modified_Time: now.toISOString(),
      Locked__s: index === 1,
    });
    return { id, fields };
  });
}
