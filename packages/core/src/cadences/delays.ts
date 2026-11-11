import type { CadenceStepDelay } from "./types";

/**
 * Computes next due date relative to a base date.
 * Delays relative to previous step completion (UTC; days in org time zone);
 * past-due after downtime run once, never back-filled.
 */
export function computeDueAt(baseDate: Date, delay: CadenceStepDelay, _timeZone = "UTC"): Date {
  if (delay.amount <= 0) {
    return new Date(baseDate.getTime());
  }

  const result = new Date(baseDate.getTime());

  if (delay.unit === "minutes") {
    result.setTime(result.getTime() + delay.amount * 60 * 1000);
    return result;
  }

  if (delay.unit === "hours") {
    result.setTime(result.getTime() + delay.amount * 3600 * 1000);
    return result;
  }

  if (delay.unit === "days") {
    // Delays in days relative to org time zone
    result.setTime(result.getTime() + delay.amount * 24 * 3600 * 1000);
    return result;
  }

  return result;
}
