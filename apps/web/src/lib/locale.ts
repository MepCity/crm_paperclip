import type { FormatOptions } from "@crm/core/format";

/**
 * The locale and time zone the web app formats with until organization and user settings exist
 * (ADR 0003, "Language and formatting"). Timestamps themselves are stored in UTC (ADR 0001).
 */
export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_TIME_ZONE = "Europe/Istanbul";
export const DEFAULT_FORMAT: FormatOptions = {
  locale: DEFAULT_LOCALE,
  timeZone: DEFAULT_TIME_ZONE,
};
