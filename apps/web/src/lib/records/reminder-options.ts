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

export const REMINDER_CHANNELS = ["EMAIL"] as const;

/** Preserve channels and offsets from older records, including unfamiliar values. */
function firstAlarm(value: FieldValue | undefined): { index: number; alarm: string } | null {
  if (!Array.isArray(value)) return null;
  for (const [index, entry] of value.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const alarm = (entry as Record<string, unknown>).ALARM;
    if (typeof alarm === "string") return { index, alarm };
  }
  return null;
}

export function reminderValue(
  offsetId: string | null,
  channel = "EMAIL",
  previous?: FieldValue,
): FieldValue {
  if (!offsetId) return null;
  const trigger = offsetId === "PT0M" ? offsetId : `-${offsetId}`;
  const existing = firstAlarm(previous);
  if (existing && Array.isArray(previous)) {
    let alarm = existing.alarm;
    for (const [key, next] of [
      ["ACTION", channel],
      ["TRIGGER", trigger],
    ]) {
      const pattern = new RegExp(`(^|;)${key}=[^;]*`);
      alarm = pattern.test(alarm)
        ? alarm.replace(pattern, (_, separator) => `${separator}${key}=${next}`)
        : `${alarm};${key}=${next}`;
    }
    return previous.map((entry, index) =>
      index === existing.index ? { ...(entry as Record<string, FieldValue>), ALARM: alarm } : entry,
    ) as FieldValue;
  }
  return [{ ALARM: `FREQ=NONE;ACTION=${channel};TRIGGER=${trigger}` }];
}

export function reminderOffsetOf(value: FieldValue | undefined): string | null {
  const alarm = firstAlarm(value)?.alarm;
  return alarm?.match(/(?:^|;)TRIGGER=-?([^;]+)(?:;|$)/)?.[1] ?? null;
}

export function reminderChannelOf(value: FieldValue | undefined): string {
  const alarm = firstAlarm(value)?.alarm;
  return alarm?.match(/(?:^|;)ACTION=([^;]+)(?:;|$)/)?.[1] ?? "EMAIL";
}
