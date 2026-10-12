import { ConflictError, RecordLockedError, ValidationError } from "../../errors";
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

// Identity and the write lock are never values a caller can choose during a merge.
const neverConflictFields = new Set(["id", "Locked__s"]);

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
      // Identity, attribution, the lock flag and computed names
      // differ independently of business conflicts.
      conflictFields: metadata
        .filter(
          (field) =>
            !neverConflictFields.has(field.apiName) &&
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

/** A lock or unique collision blocks one group; any other merge failure is a bug. */
export function isDeferredMergeRejection(error: unknown): boolean {
  return error instanceof RecordLockedError || error instanceof ConflictError;
}

/**
 * A lookup copied into the master by the automatic merge must not aim at a record of its own
 * group: the duplicates disappear and the master would end up pointing at itself.
 */
export function pointsAtGroupMember(
  value: unknown,
  module: string,
  members: ReadonlySet<string>,
): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "module" in value &&
    "id" in value &&
    value.module === module &&
    members.has(String(value.id))
  );
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
