import type { FieldValue, ModuleRecordReference } from "@crm/core/records";

export const MEETING_PARTICIPANTS_MAX = 50;
export const MEETING_PARTICIPANT_MODULES = ["Contacts", "Leads"] as const;

const TYPE_MODULE: Readonly<Record<string, string>> = { contact: "Contacts", lead: "Leads" };

/** Stored items follow the Events write contract: `{ type, id, name, email }`. */
export function participantEntries(value: FieldValue | undefined): ModuleRecordReference[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    const module = TYPE_MODULE[String(item.type)];
    return module && typeof item.id === "string"
      ? [{ module, id: item.id, ...(typeof item.name === "string" ? { name: item.name } : {}) }]
      : [];
  });
}

/** The stored form of the picked records. */
export function participantValue(entries: readonly ModuleRecordReference[]): FieldValue {
  if (entries.length === 0) return null;
  return entries.map((entry) => ({
    type: entry.module === "Leads" ? "lead" : "contact",
    id: entry.id,
    name: entry.name ?? entry.id,
    email: null,
  })) as unknown as FieldValue;
}

/** Appends one participant: no repeat, at most 50. */
export function addParticipant(
  current: readonly ModuleRecordReference[],
  added: ModuleRecordReference,
): ModuleRecordReference[] {
  if (current.length >= MEETING_PARTICIPANTS_MAX) return [...current];
  if (current.some((p) => p.module === added.module && p.id === added.id)) return [...current];
  return [...current, added];
}
