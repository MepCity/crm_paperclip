import type { FieldDefinition, ModuleApiName } from "@crm/core/records";

/** Deduplication accepts up to three matching fields (duplicates.md › Rules and limits). */
export const DEDUP_MAX_FIELDS = 3;

/** Records in one conflict group above this count have to be narrowed down first. */
export const DEDUP_MAX_MERGE_RECORDS = 3;

const DEDUP_ELIGIBLE_TYPES: ReadonlySet<string> = new Set(["text", "email", "phone"]);

/**
 * Panel field order from the documented example; every row still has to come from the
 * module's metadata, so rows the module does not have are skipped.
 */
export const DEDUP_PANEL_PRIORITY: Readonly<Record<ModuleApiName, readonly string[]>> = {
  Leads: ["Email", "Company", "Phone", "Mobile"],
  Contacts: ["Email", "Account_Name", "Phone", "Mobile"],
};

/** Interim default selection (MEP-354): Email for both delivered modules. */
export const DEDUP_DEFAULT_FIELDS: Readonly<Record<ModuleApiName, readonly string[]>> = {
  Leads: ["Email"],
  Contacts: ["Email"],
};

export function isDedupFieldEligible(field: FieldDefinition): boolean {
  if (field.apiName === "id") return false;
  return DEDUP_ELIGIBLE_TYPES.has(field.dataType);
}

/**
 * Fields marked unique lead the panel, as in the reference; the documented panel order and
 * the remaining eligible text, email and phone fields of the module follow.
 */
export function resolveDedupFields(
  module: ModuleApiName,
  fields: readonly FieldDefinition[],
): FieldDefinition[] {
  const eligible = fields.filter(isDedupFieldEligible);
  const byName = new Map(eligible.map((field) => [field.apiName, field]));
  const ordered: FieldDefinition[] = [];
  const add = (field: FieldDefinition | undefined) => {
    if (field && !ordered.some((item) => item.apiName === field.apiName)) ordered.push(field);
  };
  for (const field of eligible) if (field.unique) add(field);
  for (const apiName of DEDUP_PANEL_PRIORITY[module] ?? []) add(byName.get(apiName));
  for (const field of eligible) add(field);
  return ordered;
}

export function defaultDedupSelection(
  module: ModuleApiName,
  panelFields: readonly FieldDefinition[],
): string[] {
  const available = new Set(panelFields.map((field) => field.apiName));
  return (DEDUP_DEFAULT_FIELDS[module] ?? [])
    .filter((apiName) => available.has(apiName))
    .slice(0, DEDUP_MAX_FIELDS);
}

/** Returns the next selection, or null when a fourth field would be added. */
export function toggleDedupSelection(
  selected: readonly string[],
  apiName: string,
): string[] | null {
  if (selected.includes(apiName)) return selected.filter((item) => item !== apiName);
  if (selected.length >= DEDUP_MAX_FIELDS) return null;
  return [...selected, apiName];
}

export function dedupFieldPanelMessage(pluralLabel: string): string {
  return `Select the fields you want to identify duplicate ${pluralLabel} with.`;
}

export function dedupConfirmMessage(pluralLabel: string): string {
  return `You are about to run the de-duplication check on the ${pluralLabel} module. Please go through these instructions below before you proceed.`;
}

export function dedupConflictPopupMessage(pluralLabel: string): string {
  return `A Few duplicate ${pluralLabel} with conflicts found.`;
}

export function dedupResultSummaryMessage(mergedGroups: number, removedRecords: number): string {
  return `${mergedGroups} duplicate ${mergedGroups === 1 ? "group" : "groups"} merged and ${removedRecords} ${removedRecords === 1 ? "record" : "records"} removed.`;
}

export function dedupConflictIntro(fields: readonly string[]): string {
  const labels = fields.map((label) => label.trim());
  const listed =
    labels.length <= 1
      ? labels.join("")
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  return `Duplicates with conflicts based on the field ${listed} are listed below. View and merge them manually.`;
}

/** A group needs manual resolution when values differ or it holds more than three records. */
export function isDedupConflictGroup(group: {
  records: readonly unknown[];
  conflictFields: readonly string[];
}): boolean {
  return group.conflictFields.length > 0 || group.records.length > DEDUP_MAX_MERGE_RECORDS;
}
