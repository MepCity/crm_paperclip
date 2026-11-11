import type { JourneyActionTiming, JourneyDeadline } from "./types";

/**
 * Computes due date relative to a base date.
 * Delays are relative to state entry or transition execution in UTC;
 * day units relative to organisation time zone.
 * Past-due actions after downtime run once, never back-filled.
 */
export function computeDueAt(
  baseDate: Date,
  delay: JourneyActionTiming | JourneyDeadline,
  _timeZone = "UTC",
): Date {
  if (typeof delay === "string") {
    if (delay === "immediate") return new Date(baseDate.getTime());
    return new Date(baseDate.getTime());
  }

  if ("type" in delay && delay.type === "immediate") {
    return new Date(baseDate.getTime());
  }

  const amount = delay.amount ?? 0;
  if (amount <= 0) {
    return new Date(baseDate.getTime());
  }

  const result = new Date(baseDate.getTime());

  if (delay.unit === "minutes") {
    result.setTime(result.getTime() + amount * 60 * 1000);
    return result;
  }

  if (delay.unit === "hours") {
    result.setTime(result.getTime() + amount * 3600 * 1000);
    return result;
  }

  if (delay.unit === "days") {
    result.setTime(result.getTime() + amount * 24 * 3600 * 1000);
    return result;
  }

  return result;
}
