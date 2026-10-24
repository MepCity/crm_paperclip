import type { RecordData } from "@crm/core/records";
import type { ModuleKey } from "@/components/ui/later-module";
import { moduleRecordPath } from "@/lib/crm-paths";

/** Lookup names are optional until the service supplies display references. */
export function contactLookupName(value: unknown): string {
  if (typeof value !== "object" || value === null || !("name" in value)) return "";
  return typeof value.name === "string" ? value.name : "";
}

export function contactsRecordHeaderIdentity(
  record: RecordData,
  context?: { orgSlug?: string },
): {
  title: string;
  subtitle?: string;
  subtitleLaterModule?: ModuleKey;
  subtitleHref?: string;
} {
  const text = (name: string) =>
    typeof record.fields[name] === "string" ? (record.fields[name] as string) : "";
  const name =
    text("Full_Name") || [text("First_Name"), text("Last_Name")].filter(Boolean).join(" ");
  const salutation = text("Salutation");
  const title = [salutation === "-None-" ? "" : salutation, name].filter(Boolean).join(" ");
  const subtitle = contactLookupName(record.fields.Account_Name);
  if (!subtitle) return { title };
  const rawRef = record.fields.Account_Name;
  const accountId =
    typeof rawRef === "object" && rawRef !== null && "id" in rawRef && typeof rawRef.id === "string"
      ? rawRef.id
      : "";
  const subtitleHref = accountId
    ? context?.orgSlug
      ? moduleRecordPath(context.orgSlug, "Accounts", accountId)
      : `/tab/Accounts/${encodeURIComponent(accountId)}`
    : undefined;
  return {
    title,
    subtitle,
    ...(subtitleHref ? { subtitleHref } : {}),
  };
}
