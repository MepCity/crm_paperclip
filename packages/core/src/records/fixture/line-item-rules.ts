import { randomUUID } from "node:crypto";
import { ValidationError } from "../../errors";
import type { FieldValue, JsonObject } from "../contract";
import { computeLineItemTotals, type LineItemInput } from "../line-items";
import { findTax } from "../tax";
import type { FixtureModuleHooks } from "./hooks";

/** Formula fields owned by the service; client-sent values are ignored (ADR 0016 §3). */
export const lineItemIgnoredFields: ReadonlySet<string> = new Set([
  "Sub_Total",
  "Tax",
  "Grand_Total",
]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function toItem(
  raw: unknown,
  index: number,
  itemsField: string,
  known: (id: string) => boolean,
  previousProducts: ReadonlySet<string>,
): LineItemInput {
  const key = (field: string) => `${itemsField}[${index}].${field}`;
  if (!isObject(raw)) throw new ValidationError({ [itemsField]: ["Invalid line item."] });
  const ref = raw.Product_Name;
  let product: LineItemInput["Product_Name"] = null;
  if (ref !== null && ref !== undefined) {
    if (!isObject(ref) || ref.module !== "Products" || typeof ref.id !== "string")
      throw new ValidationError({ [key("Product_Name")]: ["Invalid record reference."] });
    // A deleted product keeps its stored reference (dangling-reference read policy).
    if (!known(ref.id) && !previousProducts.has(ref.id))
      throw new ValidationError({
        [key("Product_Name")]: ["Referenced record does not exist in this organization."],
      });
    product = {
      module: "Products",
      id: ref.id,
      ...(typeof ref.name === "string" ? { name: ref.name } : {}),
    };
  }
  const num = (field: string): number | null | undefined => {
    const value = raw[field];
    if (value === undefined || value === null) return value as null | undefined;
    if (typeof value !== "number") throw new ValidationError({ [key(field)]: ["Enter a number."] });
    return value;
  };
  const taxes = raw.Line_Tax;
  if (taxes != null && !Array.isArray(taxes))
    throw new ValidationError({ [key("Line_Tax")]: ["Choose a listed tax."] });
  return {
    ...(typeof raw.id === "string" ? { id: raw.id } : {}),
    Product_Name: product,
    Description: typeof raw.Description === "string" ? raw.Description : null,
    Quantity: (num("Quantity") ?? Number.NaN) as number,
    List_Price: (num("List_Price") ?? Number.NaN) as number,
    Discount: num("Discount"),
    Discount_Percentage: num("Discount_Percentage"),
    Line_Tax: (taxes ?? []).map((tax: unknown) => {
      if (!isObject(tax) || typeof tax.name !== "string" || !findTax(tax.name))
        throw new ValidationError({ [key("Line_Tax")]: ["Choose a listed tax."] });
      return { name: tax.name };
    }),
  };
}

/**
 * `applyRules` for Quotes and Invoices: validates the inline rows, resolves taxes and
 * products, and recomputes every formula field from scratch on each write.
 */
export function lineItemRules(itemsField: string): NonNullable<FixtureModuleHooks["applyRules"]> {
  return (fields, _input, previous, ctx) => {
    const raw = fields[itemsField];
    const rows: readonly unknown[] = Array.isArray(raw) ? raw : [];
    const products = ctx.moduleStore("Products").records;
    const previousRows = Array.isArray(previous?.[itemsField])
      ? (previous?.[itemsField] as unknown as readonly JsonObject[])
      : [];
    const previousProducts = new Set(
      previousRows.flatMap((row) =>
        isObject(row.Product_Name) && typeof row.Product_Name.id === "string"
          ? [row.Product_Name.id]
          : [],
      ),
    );
    const items = rows.map((row, index) =>
      toItem(row, index, itemsField, (id) => products.has(id), previousProducts),
    );
    const headerTaxNames = fields.Header_Tax;
    if (headerTaxNames != null && !Array.isArray(headerTaxNames))
      throw new ValidationError({ Header_Tax: ["Choose a listed tax."] });
    const headerTaxes = ((headerTaxNames ?? []) as unknown[]).map((name) => {
      const tax = typeof name === "string" ? findTax(name) : undefined;
      if (!tax) throw new ValidationError({ Header_Tax: ["Choose a listed tax."] });
      return tax;
    });
    const num = (value: FieldValue): number | null => (typeof value === "number" ? value : null);
    const totals = computeLineItemTotals(
      items,
      {
        Discount: num(fields.Discount ?? null),
        Discount_Percentage: num(fields.Discount_Percentage ?? null),
        Header_Tax: headerTaxes,
        Adjustment: num(fields.Adjustment ?? null),
      },
      itemsField,
    );
    const used = new Set<string>();
    fields[itemsField] = totals.lines.map((line, index) => {
      const sent = items[index]?.id;
      const id = sent && !used.has(sent) ? sent : randomUUID();
      used.add(id);
      return { id, ...line } as unknown as JsonObject;
    });
    fields.Sub_Total = totals.Sub_Total;
    fields.Discount = totals.Discount;
    fields.Discount_Percentage = totals.Discount_Percentage;
    fields.Tax = totals.Tax;
    fields.Adjustment = totals.Adjustment;
    fields.Grand_Total = totals.Grand_Total;
  };
}
