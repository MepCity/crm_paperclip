import type { RecordData } from "@crm/core/records";

/** Lookup names are optional until the service supplies display references. */
export function contactLookupName(value: unknown): string {
  if (typeof value !== "object" || value === null || !("name" in value)) return "";
  return typeof value.name === "string" ? value.name : "";
}

export function contactsRecordHeaderIdentity(record: RecordData): {
  title: string;
  subtitle?: string;
  subtitleLaterModule?: "M3";
} {
  const text = (name: string) =>
    typeof record.fields[name] === "string" ? (record.fields[name] as string) : "";
  const name =
    text("Full_Name") || [text("First_Name"), text("Last_Name")].filter(Boolean).join(" ");
  const salutation = text("Salutation");
  const title = [salutation === "-None-" ? "" : salutation, name].filter(Boolean).join(" ");
  const subtitle = contactLookupName(record.fields.Account_Name);
  return subtitle ? { title, subtitle, subtitleLaterModule: "M3" } : { title };
}
