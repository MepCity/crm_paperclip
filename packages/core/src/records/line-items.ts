import { ValidationError } from "../errors";
import { roundMoneyTwoDecimals } from "./rounding";
import { findTax, type TaxDefinition } from "./tax";

/** Limits from ADR 0016 §2. */
export const MIN_LINE_ITEMS = 1;
export const MAX_LINE_ITEMS = 200;

export interface LineItemInput {
  id?: string;
  Product_Name: { module: string; id: string; name?: string } | null;
  Description?: string | null;
  Quantity: number;
  List_Price: number;
  /** Amount mode: the discount as entered. Ignored when Discount_Percentage is set. */
  Discount?: number | null;
  /** Percent mode (our extension): survives quantity changes. */
  Discount_Percentage?: number | null;
  /** Only `name` is trusted by the service; percentage comes from the tax definitions. */
  Line_Tax?: readonly { name: string; percentage?: number; value?: number }[] | null;
}

export interface LineTaxValue {
  name: string;
  percentage: number;
  value: number;
}

export interface LineItemTotals {
  Sequence_Number: number;
  Product_Name: LineItemInput["Product_Name"];
  Description: string | null;
  Quantity: number;
  List_Price: number;
  Total: number;
  Discount: number;
  Discount_Percentage: number | null;
  Total_After_Discount: number;
  Tax: number;
  Net_Total: number;
  Line_Tax: LineTaxValue[];
}

export interface HeaderInput {
  /** Amount mode value. Ignored when Discount_Percentage is set. */
  Discount?: number | null;
  Discount_Percentage?: number | null;
  /** Header-level tax selections. */
  Header_Tax?: readonly TaxDefinition[] | null;
  Adjustment?: number | null;
}

export interface DocumentTotals {
  lines: LineItemTotals[];
  Sub_Total: number;
  Discount: number;
  Discount_Percentage: number | null;
  Tax: number;
  Adjustment: number;
  Grand_Total: number;
}

const round = roundMoneyTwoDecimals;
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-7;
}

/**
 * Pure, server-authoritative calculation (ADR 0016 §3). Used by the record service on
 * every write and by forms for live preview. Client-sent formula values are never read.
 * Throws ValidationError keyed `<itemsField>[i].<Field>` / header field names.
 */
export function computeLineItemTotals(
  items: readonly LineItemInput[],
  header: HeaderInput = {},
  itemsField = "Quoted_Items",
): DocumentTotals {
  const errors: Record<string, string[]> = {};
  const fail = (key: string, message: string) => {
    errors[key] = [message];
  };
  if (items.length < MIN_LINE_ITEMS || items.length > MAX_LINE_ITEMS)
    fail(itemsField, `Add between ${MIN_LINE_ITEMS} and ${MAX_LINE_ITEMS} line items.`);
  const lines = items.map((item, index): LineItemTotals => {
    const key = (field: string) => `${itemsField}[${index}].${field}`;
    if (!item.Product_Name) fail(key("Product_Name"), "This field is required.");
    if (!finite(item.Quantity) || item.Quantity <= 0 || !hasAtMostTwoDecimals(item.Quantity))
      fail(key("Quantity"), "Quantity must be greater than 0 with at most 2 decimals.");
    if (!finite(item.List_Price) || item.List_Price < 0)
      fail(key("List_Price"), "List price cannot be negative.");
    const quantity = finite(item.Quantity) ? item.Quantity : 0;
    const listPrice = finite(item.List_Price) ? item.List_Price : 0;
    const total = round(quantity * listPrice);
    const percent = item.Discount_Percentage ?? null;
    let discount: number;
    if (percent !== null) {
      if (!finite(percent) || percent < 0 || percent > 100)
        fail(key("Discount_Percentage"), "Discount must be between 0 and 100 percent.");
      discount = round((total * (finite(percent) ? percent : 0)) / 100);
    } else {
      const entered = item.Discount ?? 0;
      if (!finite(entered) || entered < 0 || round(entered) > total)
        fail(key("Discount"), "Discount must be between 0 and the line total.");
      discount = round(finite(entered) ? entered : 0);
    }
    const afterDiscount = round(total - discount);
    const lineTax: LineTaxValue[] = (item.Line_Tax ?? []).map((tax) => {
      const definition = findTax(tax.name);
      // Percentage is taken from the definition when known, else from the (validated) input.
      const percentage = definition?.percentage ?? tax.percentage;
      if (!finite(percentage) || percentage < 0) fail(key("Line_Tax"), "Choose a listed tax.");
      const pct = finite(percentage) ? percentage : 0;
      return { name: tax.name, percentage: pct, value: round((afterDiscount * pct) / 100) };
    });
    const tax = round(lineTax.reduce((sum, entry) => sum + entry.value, 0));
    return {
      Sequence_Number: index + 1,
      Product_Name: item.Product_Name,
      Description: item.Description ?? null,
      Quantity: quantity,
      List_Price: listPrice,
      Total: total,
      Discount: discount,
      Discount_Percentage: percent,
      Total_After_Discount: afterDiscount,
      Tax: tax,
      Net_Total: round(afterDiscount + tax),
      Line_Tax: lineTax,
    };
  });
  const subTotal = round(lines.reduce((sum, line) => sum + line.Net_Total, 0));
  const headerPercent = header.Discount_Percentage ?? null;
  let headerDiscount: number;
  if (headerPercent !== null) {
    if (!finite(headerPercent) || headerPercent < 0 || headerPercent > 100)
      fail("Discount_Percentage", "Discount must be between 0 and 100 percent.");
    headerDiscount = round((subTotal * (finite(headerPercent) ? headerPercent : 0)) / 100);
  } else {
    const entered = header.Discount ?? 0;
    if (!finite(entered) || entered < 0 || round(entered) > subTotal)
      fail("Discount", "Discount must be between 0 and the sub total.");
    headerDiscount = round(finite(entered) ? entered : 0);
  }
  const taxable = round(subTotal - headerDiscount);
  const headerTax = round(
    (header.Header_Tax ?? []).reduce(
      (sum, tax) => sum + round((taxable * tax.percentage) / 100),
      0,
    ),
  );
  const adjustmentInput = header.Adjustment ?? 0;
  if (!finite(adjustmentInput)) fail("Adjustment", "Enter a number.");
  const adjustment = round(finite(adjustmentInput) ? adjustmentInput : 0);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return {
    lines,
    Sub_Total: subTotal,
    Discount: headerDiscount,
    Discount_Percentage: headerPercent,
    Tax: headerTax,
    Adjustment: adjustment,
    Grand_Total: round(subTotal - headerDiscount + headerTax + adjustment),
  };
}

/** Product fields the line defaults need (ADR 0016 §6). */
export interface ProductForLine {
  id: string;
  Product_Name: string;
  Unit_Price?: number | null;
  Description?: string | null;
  Taxable?: boolean | null;
  Tax?: readonly string[] | null;
  Product_Active?: boolean | null;
}

/** Values a product pick writes into a line; keeps an existing discount and non-empty quantity. */
export function productLineDefaults(
  product: ProductForLine,
  current: Partial<LineItemInput> = {},
): LineItemInput {
  const taxes: { name: string; percentage: number }[] =
    product.Taxable === true
      ? (product.Tax ?? []).flatMap((name) => {
          const definition = findTax(name);
          return definition ? [{ name: definition.name, percentage: definition.percentage }] : [];
        })
      : [];
  return {
    ...current,
    Product_Name: { module: "Products", id: product.id, name: product.Product_Name },
    Description: product.Description ?? null,
    List_Price: product.Unit_Price ?? 0,
    Quantity: finite(current.Quantity) && current.Quantity > 0 ? current.Quantity : 1,
    Line_Tax: taxes,
  };
}
