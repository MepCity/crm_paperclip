/**
 * RFC 5322 Date and Time header parser.
 *
 * Implements RFC 5322 §3.3 (date-time) and §4.3 (obs-date-time).
 * Pure function — no I/O, no side effects, no persistence.
 */

const DAYS = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/**
 * Obsolete fixed timezone names defined in RFC 5322 §4.3 / RFC 2822 / RFC 822.
 * Offsets are expressed in minutes from UTC.
 */
const OBS_ZONE_OFFSETS: Record<string, number> = {
  UT: 0,
  GMT: 0,
  Z: 0,
  EST: -5 * 60, // -0500 (-300 mins)
  EDT: -4 * 60, // -0400 (-240 mins)
  CST: -6 * 60, // -0600 (-360 mins)
  CDT: -5 * 60, // -0500 (-300 mins)
  MST: -7 * 60, // -0700 (-420 mins)
  MDT: -6 * 60, // -0600 (-360 mins)
  PST: -8 * 60, // -0800 (-480 mins)
  PDT: -7 * 60, // -0700 (-420 mins)
};

/**
 * Check whether a Gregorian year is a leap year.
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Return the number of days in the specified month (1-12) of a given year.
 */
function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 1: // Jan
    case 3: // Mar
    case 5: // May
    case 7: // Jul
    case 8: // Aug
    case 10: // Oct
    case 12: // Dec
      return 31;
    case 4: // Apr
    case 6: // Jun
    case 9: // Sep
    case 11: // Nov
      return 30;
    case 2: // Feb
      return isLeapYear(year) ? 29 : 28;
    default:
      return 0;
  }
}

/**
 * Strip RFC 5322 comments `(...)` from the input string.
 *
 * Comments may be nested. Escaped parentheses `\(` and `\)` do not affect nesting.
 * Replaces each top-level comment with a space to avoid accidental token merging.
 * Returns `null` if parentheses are unbalanced or an escape is unterminated.
 */
function stripComments(input: string): string | null {
  let depth = 0;
  let result = "";
  let inEscape = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (depth > 0) {
      if (inEscape) {
        inEscape = false;
        continue;
      }
      if (ch === "\\") {
        inEscape = true;
        continue;
      }
      if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        depth--;
        if (depth === 0) {
          result += " ";
        }
      }
    } else {
      if (ch === "(") {
        depth = 1;
      } else if (ch === ")") {
        // Unmatched closing parenthesis outside any comment
        return null;
      } else {
        result += ch;
      }
    }
  }

  if (depth !== 0 || inEscape) {
    // Unterminated comment or trailing escape
    return null;
  }

  return result;
}

/**
 * Parse an RFC 5322 / RFC 2822 / RFC 822 Date header value into epoch milliseconds.
 *
 * Supports:
 * - Optional day of week (e.g. `Mon,` or `Mon`)
 * - 1 or 2 digit day of month
 * - English month abbreviation (case-insensitive)
 * - 4-digit, 2-digit (00-49 -> 20xx, 50-99 -> 19xx), or 3-digit (+1900) year
 * - Time with optional seconds (leap second 60 treated as 59)
 * - Numeric timezone offsets (`+hhmm`, `-hhmm`, `+hh:mm`, `-hh:mm`)
 * - Obsolete named timezones (`UT`, `GMT`, `Z`, `EST`, `EDT`, `CST`, `CDT`, `MST`, `MDT`, `PST`, `PDT`)
 * - Single-letter military timezones (A-I, K-Z) and unknown alphabetical zones treated as +0000
 * - Nested parenthesized comments and CRLF / folding whitespace
 *
 * Returns epoch ms (UTC), or `null` if the date is invalid or out-of-range.
 * Never throws, never returns NaN.
 */
export function parseMailDate(raw: string): number | null {
  if (typeof raw !== "string") {
    return null;
  }

  try {
    let text = raw.trim();
    if (!text) {
      return null;
    }

    // Strip optional "Date:" header name if present
    if (/^date\s*:\s*/i.test(text)) {
      text = text.replace(/^date\s*:\s*/i, "").trim();
      if (!text) {
        return null;
      }
    }

    // Strip comments
    const stripped = stripComments(text);
    if (stripped === null) {
      return null;
    }

    // Normalize line folding and whitespace
    const unfolded = stripped.replace(/[\r\n]+/g, " ");
    const colonsNormalized = unfolded.replace(/\s*:\s*/g, ":");
    const commasNormalized = colonsNormalized.replace(/,/g, " , ");
    const tokens = commasNormalized.trim().split(/\s+/).filter(Boolean);

    if (tokens.length === 0) {
      return null;
    }

    let idx = 0;

    // Optional day of week
    const firstLower = tokens[idx]?.toLowerCase();
    if (firstLower && DAYS.has(firstLower)) {
      idx++;
      if (tokens[idx] === ",") {
        idx++;
      }
    }

    // Day of month (1-2 digits)
    const dayToken = tokens[idx++];
    if (!dayToken || !/^\d{1,2}$/.test(dayToken)) {
      return null;
    }
    const day = Number.parseInt(dayToken, 10);
    if (day < 1 || day > 31) {
      return null;
    }

    // Month (3-letter English month name, case-insensitive)
    const monthToken = tokens[idx++]?.toLowerCase();
    const month = monthToken ? MONTHS[monthToken] : undefined;
    if (month === undefined) {
      return null;
    }

    // Year (2, 3, or 4 digits)
    const yearToken = tokens[idx++];
    if (!yearToken || !/^\d{2,4}$/.test(yearToken)) {
      return null;
    }
    let year: number;
    if (yearToken.length === 2) {
      const y = Number.parseInt(yearToken, 10);
      year = y < 50 ? 2000 + y : 1900 + y;
    } else if (yearToken.length === 3) {
      const y = Number.parseInt(yearToken, 10);
      year = 1900 + y;
    } else {
      year = Number.parseInt(yearToken, 10);
    }

    // Validate day against calendar (month and leap year)
    if (day > daysInMonth(year, month)) {
      return null;
    }

    // Time of day (HH:MM or HH:MM:SS)
    const timeToken = tokens[idx++];
    if (!timeToken) {
      return null;
    }
    const timeMatch = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(timeToken);
    if (!timeMatch) {
      return null;
    }
    const hourRaw = timeMatch[1];
    const minuteRaw = timeMatch[2];
    if (hourRaw === undefined || minuteRaw === undefined) {
      return null;
    }
    const hour = Number.parseInt(hourRaw, 10);
    const minute = Number.parseInt(minuteRaw, 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    let second = 0;
    if (timeMatch[3] !== undefined) {
      const s = Number.parseInt(timeMatch[3], 10);
      if (s < 0 || s > 60) {
        return null;
      }
      // Leap second (60) is treated as 59
      second = s === 60 ? 59 : s;
    }

    // Timezone
    const zoneToken = tokens[idx++];
    if (!zoneToken) {
      return null;
    }

    let offsetMinutes: number;
    const numZoneMatch = /^([+-])(\d{2}):?(\d{2})$/.exec(zoneToken);
    if (numZoneMatch) {
      const signStr = numZoneMatch[1];
      const zhStr = numZoneMatch[2];
      const zmStr = numZoneMatch[3];
      if (signStr === undefined || zhStr === undefined || zmStr === undefined) {
        return null;
      }
      const sign = signStr === "-" ? -1 : 1;
      const zh = Number.parseInt(zhStr, 10);
      const zm = Number.parseInt(zmStr, 10);
      if (zh > 23 || zm > 59) {
        return null;
      }
      offsetMinutes = sign * (zh * 60 + zm);
    } else if (/^[A-Za-z]+$/.test(zoneToken)) {
      const upperZone = zoneToken.toUpperCase();
      const obsOffset = OBS_ZONE_OFFSETS[upperZone];
      if (obsOffset !== undefined) {
        offsetMinutes = obsOffset;
      } else {
        // Military single-letter (A-I, K-Z) and unknown alphabetical zones -> +0000 (RFC -0000 equivalent)
        offsetMinutes = 0;
      }
    } else {
      return null;
    }

    // No extra tokens permitted
    if (idx < tokens.length) {
      return null;
    }

    const d = new Date(0);
    d.setUTCFullYear(year, month - 1, day);
    d.setUTCHours(hour, minute, second, 0);
    const epochMs = d.getTime() - offsetMinutes * 60 * 1000;

    if (Number.isNaN(epochMs)) {
      return null;
    }

    return epochMs;
  } catch {
    return null;
  }
}
