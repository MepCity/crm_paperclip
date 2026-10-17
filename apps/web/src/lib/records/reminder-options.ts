import type { FieldValue } from "@crm/core/records";

/** Provisional (D5): offsets before the start; only the chosen value is stored, nothing is sent. */
export const REMINDER_OFFSETS = [
  { id: "PT0M", label: "At start" },
  { id: "PT5M", label: "5 minutes before" },
  { id: "PT10M", label: "10 minutes before" },
  { id: "PT15M", label: "15 minutes before" },
  { id: "PT30M", label: "30 minutes before" },
  { id: "PT1H", label: "1 hour before" },
  { id: "PT2H", label: "2 hours before" },
  { id: "P1D", label: "1 day before" },
  { id: "P2D", label: "2 days before" },
] as const;

export function reminderValue(offsetId: string | null): FieldValue {
  if (!offsetId) return null;
  const trigger = offsetId === "PT0M" ? offsetId : `-${offsetId}`;
  return [{ ALARM: `FREQ=NONE;ACTION=EMAIL;TRIGGER=${trigger}` }];
}

export function reminderOffsetOf(value: FieldValue | undefined): string | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const alarm = (entry as Record<string, unknown>).ALARM;
    const match = typeof alarm === "string" ? /TRIGGER=(-?)(\w+)/.exec(alarm) : null;
    if (match?.[2] && REMINDER_OFFSETS.some((o) => o.id === match[2])) return match[2];
  }
  return null;
}
