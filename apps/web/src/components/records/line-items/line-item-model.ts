import {
  computeLineItemTotals,
  type DocumentTotals,
  type LineItemInput,
  type LineItemTotals,
  MAX_LINE_ITEMS,
} from "@crm/core/records/line-items";
import { findTax, type TaxDefinition } from "@crm/core/records/tax";

/** One editable row; numbers stay strings while typing so "1." and "" survive. */
export interface LineRow {
  key: string;
  id?: string;
  product: { module: string; id: string; name?: string } | null;
  description: string;
  quantity: string;
  listPrice: string;
  discountMode: "amount" | "percent";
  discountValue: string;
  taxes: string[];
}

export interface HeaderState {
  discountMode: "amount" | "percent";
  discountValue: string;
  taxes: string[];
  adjustment: string;
}

export const EMPTY_HEADER: HeaderState = {
  discountMode: "amount",
  discountValue: "",
  taxes: [],
  adjustment: "",
};

let keyCounter = 0;
export function newRowKey(): string {
  keyCounter += 1;
  return `row-${keyCounter}`;
}

export function emptyRow(): LineRow {
  return {
    key: newRowKey(),
    product: null,
    description: "",
    quantity: "1",
    listPrice: "",
    discountMode: "amount",
    discountValue: "",
    taxes: [],
  };
}

/** Parses typed numbers: comma or dot decimals; empty is NaN-free `null`. */
export function parseNumber(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

function numberText(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

type Json = Record<string, unknown>;

/** Server/record shape → editable rows. */
export function rowsFromValue(value: unknown): LineRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry: Json) => {
    const percent = entry.Discount_Percentage as number | null | undefined;
    const taxes = Array.isArray(entry.Line_Tax)
      ? (entry.Line_Tax as { name: string }[]).map((tax) => tax.name)
      : [];
    return {
      key: newRowKey(),
      id: typeof entry.id === "string" ? entry.id : undefined,
      product: (entry.Product_Name as LineRow["product"]) ?? null,
      description: typeof entry.Description === "string" ? entry.Description : "",
      quantity: numberText(entry.Quantity as number | null),
      listPrice: numberText(entry.List_Price as number | null),
      discountMode: percent !== null && percent !== undefined ? "percent" : "amount",
      discountValue:
        percent !== null && percent !== undefined
          ? numberText(percent)
          : (entry.Discount as number) > 0
            ? numberText(entry.Discount as number)
            : "",
      taxes,
    } satisfies LineRow;
  });
}

function taxEntries(names: readonly string[]): { name: string; percentage: number }[] {
  return names.flatMap((name) => {
    const tax = findTax(name);
    return tax ? [{ name: tax.name, percentage: tax.percentage }] : [];
  });
}

/** Editable rows → the payload shape sent to the record service (formula values omitted). */
export function rowsToValue(rows: readonly LineRow[]): Json[] {
  return rows.map((row) => {
    const entry: Json = {
      Product_Name: row.product,
      Description: row.description === "" ? null : row.description,
      Quantity: parseNumber(row.quantity) ?? 0,
      List_Price: parseNumber(row.listPrice) ?? 0,
      Line_Tax: taxEntries(row.taxes),
    };
    if (row.id) entry.id = row.id;
    const discount = parseNumber(row.discountValue) ?? 0;
    if (row.discountMode === "percent") {
      entry.Discount_Percentage = discount;
      entry.Discount = 0;
    } else {
      entry.Discount_Percentage = null;
      entry.Discount = discount;
    }
    return entry;
  });
}

export function headerFromValues(values: Readonly<Record<string, unknown>>): HeaderState {
  const percent = values.Discount_Percentage as number | null | undefined;
  const discount = values.Discount as number | null | undefined;
  return {
    discountMode: percent !== null && percent !== undefined ? "percent" : "amount",
    discountValue:
      percent !== null && percent !== undefined
        ? numberText(percent)
        : discount
          ? numberText(discount)
          : "",
    taxes: Array.isArray(values.Header_Tax) ? (values.Header_Tax as string[]) : [],
    adjustment: values.Adjustment ? numberText(values.Adjustment as number) : "",
  };
}

/** Header state → record field writes. */
export function headerToValues(header: HeaderState): Json {
  const discount = parseNumber(header.discountValue) ?? 0;
  return {
    Discount: header.discountMode === "amount" ? discount : 0,
    Discount_Percentage: header.discountMode === "percent" ? discount : null,
    Header_Tax: header.taxes,
    Adjustment: parseNumber(header.adjustment) ?? 0,
  };
}

export interface LiveTotals {
  ok: boolean;
  totals: DocumentTotals | null;
  /** Row index → computed row, only for rows whose inputs are valid on their own. */
  lines: (LineItemTotals | null)[];
}

function lineInput(row: LineRow): LineItemInput {
  const entry = rowsToValue([row])[0] as Json;
  return {
    Product_Name: row.product ?? { module: "Products", id: "-" },
    Description: entry.Description as string | null,
    Quantity: entry.Quantity as number,
    List_Price: entry.List_Price as number,
    Discount: entry.Discount as number,
    Discount_Percentage: entry.Discount_Percentage as number | null,
    Line_Tax: entry.Line_Tax as { name: string; percentage: number }[],
  };
}

/** Live preview: never throws; rows with invalid numbers show blank formula cells. */
export function liveTotals(rows: readonly LineRow[], header: HeaderState): LiveTotals {
  const lines = rows.map((row) => {
    try {
      return computeLineItemTotals([lineInput(row)]).lines[0] ?? null;
    } catch {
      return null;
    }
  });
  try {
    const headerTaxes: TaxDefinition[] = taxEntries(header.taxes);
    const input = rowsToValue(rows) as unknown as LineItemInput[];
    const totals = computeLineItemTotals(
      input.map((entry, index) => ({
        ...entry,
        Product_Name: rows[index]?.product ?? { module: "Products", id: "-" },
      })),
      {
        ...(header.discountMode === "percent"
          ? { Discount_Percentage: parseNumber(header.discountValue) ?? 0 }
          : { Discount: parseNumber(header.discountValue) ?? 0 }),
        Header_Tax: headerTaxes,
        Adjustment: parseNumber(header.adjustment) ?? 0,
      },
    );
    return { ok: true, totals, lines };
  } catch {
    return { ok: false, totals: null, lines };
  }
}

export { MAX_LINE_ITEMS };

/** Fields the editor owns in the totals block; the generic form must not render them. */
export const LINE_ITEM_HEADER_FIELDS: readonly string[] = [
  "Sub_Total",
  "Discount",
  "Tax",
  "Adjustment",
  "Grand_Total",
];
/** Internal fields (ADR 0016 §2/§3): not in any layout, but written with the record. */
export const LINE_ITEM_EXTRA_FIELDS: readonly string[] = ["Discount_Percentage", "Header_Tax"];

export function pickLineItemExtras(
  source: Readonly<Record<string, unknown>> | undefined,
): Record<string, never> {
  const out: Record<string, unknown> = {};
  for (const name of LINE_ITEM_EXTRA_FIELDS) {
    if (source && name in source && source[name] !== undefined) out[name] = source[name];
  }
  return out as Record<string, never>;
}

/** Client-side check mirroring the service: ≥1 row and per-row/header limits. */
export function validateLineItems(
  rows: readonly LineRow[],
  header: HeaderState,
): Record<string, string> {
  if (rows.length === 0) return { "": "Add at least one line item." };
  const errors: Record<string, string> = {};
  rows.forEach((row, index) => {
    if (!row.product) errors[`[${index}].Product_Name`] = "This field is required.";
    for (const [field, text] of [
      ["Quantity", row.quantity],
      ["List_Price", row.listPrice],
    ] as const) {
      if (text.trim() !== "" && Number.isNaN(parseNumber(text)))
        errors[`[${index}].${field}`] = "Enter a number.";
    }
  });
  const quantityBad = (row: LineRow) => {
    const quantity = parseNumber(row.quantity);
    return quantity === null || Number.isNaN(quantity) || quantity <= 0;
  };
  rows.forEach((row, index) => {
    if (!errors[`[${index}].Quantity`] && quantityBad(row))
      errors[`[${index}].Quantity`] = "Quantity must be greater than 0.";
  });
  if (Object.keys(errors).length > 0) return errors;
  try {
    const input = rowsToValue(rows) as unknown as LineItemInput[];
    computeLineItemTotals(
      input.map((entry, index) => ({
        ...entry,
        Product_Name: rows[index]?.product ?? { module: "Products", id: "-" },
      })),
      {
        ...(header.discountMode === "percent"
          ? { Discount_Percentage: parseNumber(header.discountValue) ?? 0 }
          : { Discount: parseNumber(header.discountValue) ?? 0 }),
        Header_Tax: taxEntries(header.taxes),
        Adjustment: parseNumber(header.adjustment) ?? 0,
      },
    );
  } catch (error) {
    const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    if (fieldErrors) {
      for (const [key, messages] of Object.entries(fieldErrors))
        errors[key.replace(/^[A-Za-z_]+(?=\[)/, "") || (key.includes("[") ? "" : key)] =
          messages[0] ?? "Invalid value.";
    }
  }
  return errors;
}
