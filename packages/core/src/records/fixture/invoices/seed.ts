import type { FieldValue, RecordData } from "../../contract";
import { seedDocument, seedLinks } from "../line-item-seed";
import { invoicesMetadata } from "./metadata";
import { invoicesPicklists } from "./picklists";

export const fixtureInvoiceId = (index: number) => String(350000000000000000n + BigInt(index));
export const fullName = (fields: Readonly<Record<string, FieldValue>>) =>
  String(fields.Subject ?? "");

export function generateFixtureInvoices(now: Date): RecordData[] {
  return Array.from({ length: 30 }, (_, index) => {
    const id = fixtureInvoiceId(index);
    const fields: Record<string, FieldValue> = Object.fromEntries(
      invoicesMetadata.fields.map((field) => [field.apiName, null]),
    );
    for (const [name, options] of Object.entries(invoicesPicklists)) {
      if (/^(Billing|Shipping)_|^Header_Tax$/.test(name)) continue;
      fields[name] = options[index % options.length]?.storedValue ?? null;
    }
    const day = (offset: number) =>
      new Date(now.getTime() + offset * 86400000).toISOString().slice(0, 10);
    Object.assign(fields, seedLinks(index), seedDocument(index, "Invoiced_Items"), {
      id,
      Subject: `Invoice ${index + 1}`,
      Deal_Name__s: {
        module: "Deals",
        id: String(700000000000000000n + BigInt(index % 10)),
      },
      Invoice_Date: day(-index),
      Due_Date: day(30 - index),
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
