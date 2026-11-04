import type { RecordData } from "@crm/core/records";
import type { DetailSection } from "../detail/details-card";
import { LineItemTable } from "./line-item-table";

/** Detail section with the read-only line table and totals (ADR 0016 §9). */
export function lineItemDetailSection(
  record: RecordData,
  itemsField: string,
  title: string,
): DetailSection {
  const items = Array.isArray(record.fields[itemsField])
    ? (record.fields[itemsField] as unknown as Record<string, unknown>[])
    : [];
  return {
    title,
    fields: [],
    node: <LineItemTable title={title} items={items} totals={record.fields} />,
  };
}
