import { ValidationError } from "../../errors";
import type { DuplicateGroup, FieldDefinition, RecordData } from "../contract";

const searchableTypes = new Set([
  "text",
  "textarea",
  "phone",
  "email",
  "multipicklist",
  "integer",
  "currency",
  "double",
  "bigint",
  "autonumber",
  "website",
  "lookup",
  "multi_module_lookup",
]);

export function searchableText(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(searchableText).join(" ");
  if (typeof value === "object") return "name" in value ? String(value.name ?? "") : "";
  return String(value);
}

export function matchesGlobalSearch(
  record: RecordData,
  fields: readonly FieldDefinition[],
  text: string,
  nameField?: string,
): boolean {
  return fields.some(
    (field) =>
      (nameField ? field.apiName === nameField : searchableTypes.has(field.dataType)) &&
      searchableText(record.fields[field.apiName]).toLowerCase().includes(text),
  );
}

export function duplicateKey(value: unknown): string | null {
  if (value == null || value === "" || (Array.isArray(value) && !value.length)) return null;
  if (Array.isArray(value)) return JSON.stringify(value.map(duplicateKey).sort());
  if (typeof value === "object" && "id" in value && "module" in value)
    return JSON.stringify([value.module, value.id]);
  return String(value).toLowerCase();
}

export function duplicateGroups(
  records: readonly RecordData[],
  fields: readonly string[],
  metadata: readonly FieldDefinition[],
  managed: ReadonlySet<string>,
): DuplicateGroup[] {
  if (
    fields.length < 1 ||
    fields.length > 3 ||
    new Set(fields).size !== fields.length ||
    fields.some((name) => !metadata.some((field) => field.apiName === name))
  )
    throw new ValidationError({ fields: ["Choose between one and three distinct known fields."] });
  const groups = new Map<string, RecordData[]>();
  for (const record of records) {
    const parts = fields.map((name) => duplicateKey(record.fields[name]));
    if (parts.some((part) => part === null)) continue;
    const key = JSON.stringify(parts);
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      records: group,
      // Identity, attribution and computed names differ independently of business conflicts.
      conflictFields: metadata
        .filter(
          (field) =>
            field.apiName !== "id" &&
            !managed.has(field.apiName) &&
            new Set(
              group
                .map((record) => duplicateKey(record.fields[field.apiName]))
                .filter((key) => key !== null),
            ).size > 1,
        )
        .map((field) => field.apiName),
    }));
}

export function automaticMaster(records: readonly RecordData[]): RecordData {
  const timestamp = (record: RecordData, name: string) => {
    const parsed = Date.parse(String(record.fields[name] ?? ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return [...records].sort(
    (a, b) =>
      timestamp(b, "Last_Activity_Time") - timestamp(a, "Last_Activity_Time") ||
      timestamp(b, "Modified_Time") - timestamp(a, "Modified_Time"),
  )[0] as RecordData;
}
