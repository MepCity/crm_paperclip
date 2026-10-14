import type { FieldValue, ModuleRecordReference } from "@crm/core/records";

export const MEETING_PARTICIPANTS_MAX = 50;
export const MEETING_PARTICIPANT_MODULES = ["Contacts", "Leads"] as const;

/** Entries written by the form: a record reference with its display name. */
export function participantEntries(value: FieldValue | undefined): ModuleRecordReference[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    return typeof item.module === "string" && typeof item.id === "string"
      ? [
          {
            module: item.module,
            id: item.id,
            ...(typeof item.name === "string" ? { name: item.name } : {}),
          },
        ]
      : [];
  });
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
