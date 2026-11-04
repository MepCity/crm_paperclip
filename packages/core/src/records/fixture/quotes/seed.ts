import type { FieldValue, RecordData } from "../../contract";
import { seedDeal, seedDocument, seedLinks } from "../line-item-seed";
import { quotesMetadata } from "./metadata";
import { quotesPicklists } from "./picklists";

export const fixtureQuoteId = (index: number) => String(330000000000000000n + BigInt(index));
export const fullName = (fields: Readonly<Record<string, FieldValue>>) =>
  String(fields.Subject ?? "");

export function generateFixtureQuotes(now: Date): RecordData[] {
  return Array.from({ length: 40 }, (_, index) => {
    const id = fixtureQuoteId(index);
    const fields: Record<string, FieldValue> = Object.fromEntries(
      quotesMetadata.fields.map((field) => [field.apiName, null]),
    );
    for (const [name, options] of Object.entries(quotesPicklists)) {
      if (/^(Billing|Shipping)_|^Header_Tax$/.test(name)) continue;
      fields[name] = options[index % options.length]?.storedValue ?? null;
    }
    Object.assign(fields, seedLinks(index), seedDocument(index, "Quoted_Items"), {
      id,
      Subject: `Quote ${index + 1}`,
      Deal_Name: seedDeal(index),
      Valid_Till: new Date(now.getTime() + (index - 10) * 86400000).toISOString().slice(0, 10),
      Billing_Street: `${index + 1} Sample Street`,
      Billing_City: "Sample City",
      Shipping_Street: `${index + 1} Sample Street`,
      Shipping_City: "Sample City",
      Created_Time: new Date(now.getTime() - index * 86400000).toISOString(),
      Modified_Time: now.toISOString(),
      Locked__s: index === 1,
    });
    return { id, fields };
  });
}
