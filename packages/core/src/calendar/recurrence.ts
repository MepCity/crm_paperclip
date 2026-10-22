export interface ExpandRecurrenceInput {
  rrule: string;
  start: string;
  windowStart: string;
  windowEnd: string;
  exdates?: string[];
  maxOccurrences?: number;
}

export class UnsupportedRecurrenceError extends Error {
  override name = "UnsupportedRecurrenceError";

  constructor(message = "Unsupported recurrence rule") {
    super(message);
  }
}

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
type Weekday = (typeof WEEKDAYS)[number];

const WEEKDAY_INDEX: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      return 0;
  }
}

interface ParsedWallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  iso: string;
}

const WALL_TIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function parseWallDateTime(str: string, fieldName = "date"): ParsedWallTime {
  const match = WALL_TIME_REGEX.exec(str);
  if (!match?.[1] || !match[2] || !match[3] || !match[4] || !match[5]) {
    throw new UnsupportedRecurrenceError(`Invalid ${fieldName} format: ${str}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (month < 1 || month > 12) {
    throw new UnsupportedRecurrenceError(`Invalid month in ${fieldName}: ${str}`);
  }
  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) {
    throw new UnsupportedRecurrenceError(`Invalid day in ${fieldName}: ${str}`);
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new UnsupportedRecurrenceError(`Invalid hour or minute in ${fieldName}: ${str}`);
  }

  return { year, month, day, hour, minute, iso: str };
}

function formatWallDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  return `${pad4(year)}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`;
}

function addDaysToDate(
  year: number,
  month: number,
  day: number,
  count: number,
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day + count));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

interface ParsedUntil {
  isDateOnly: boolean;
  untilDate: string;
  untilIso: string;
}

function parseUntil(raw: string): ParsedUntil {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(?:(\d{2}))?Z?)?$/.exec(raw.trim());
  if (!match?.[1] || !match[2] || !match[3]) {
    throw new UnsupportedRecurrenceError(`Invalid UNTIL format: ${raw}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    throw new UnsupportedRecurrenceError(`Invalid month in UNTIL: ${raw}`);
  }
  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) {
    throw new UnsupportedRecurrenceError(`Invalid day in UNTIL: ${raw}`);
  }

  const dateStr = `${pad4(year)}-${pad2(month)}-${pad2(day)}`;

  if (match[4] === undefined || match[5] === undefined) {
    return {
      isDateOnly: true,
      untilDate: dateStr,
      untilIso: `${dateStr}T23:59:59`,
    };
  }

  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] !== undefined ? Number(match[6]) : 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    throw new UnsupportedRecurrenceError(`Invalid time in UNTIL: ${raw}`);
  }

  const timeStr = `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
  return {
    isDateOnly: false,
    untilDate: dateStr,
    untilIso: `${dateStr}T${timeStr}`,
  };
}

function isPastUntil(curr: string, until: ParsedUntil): boolean {
  if (until.isDateOnly) {
    return curr.slice(0, 10) > until.untilDate;
  }
  return `${curr}:00` > until.untilIso;
}

interface ParsedRRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count?: number;
  until?: ParsedUntil;
  byDays?: Weekday[];
  monthlyByDay?: { ord: number; weekday: Weekday };
  monthlyByMonthDay?: number;
  wkst: Weekday;
}

function parseRRule(rruleStr: string): ParsedRRule {
  let raw = rruleStr.trim();
  if (/^rrule:/i.test(raw)) {
    raw = raw.slice(6).trim();
  }
  if (!raw) {
    throw new UnsupportedRecurrenceError("RRULE is empty");
  }

  const tokens = raw
    .split(";")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) {
    throw new UnsupportedRecurrenceError("RRULE has no valid parts");
  }

  const seenKeys = new Set<string>();
  const parsedMap = new Map<string, string>();

  for (const token of tokens) {
    const eqIdx = token.indexOf("=");
    if (eqIdx === -1) {
      throw new UnsupportedRecurrenceError(`Malformed RRULE part: ${token}`);
    }
    const key = token.slice(0, eqIdx).trim().toUpperCase();
    const value = token.slice(eqIdx + 1).trim();
    if (!key || !value) {
      throw new UnsupportedRecurrenceError(`Malformed RRULE part: ${token}`);
    }
    if (seenKeys.has(key)) {
      throw new UnsupportedRecurrenceError(`Duplicate RRULE key: ${key}`);
    }
    seenKeys.add(key);
    parsedMap.set(key, value);
  }

  const allowedKeys = new Set([
    "FREQ",
    "INTERVAL",
    "COUNT",
    "UNTIL",
    "BYDAY",
    "BYMONTHDAY",
    "WKST",
  ]);

  for (const key of seenKeys) {
    if (!allowedKeys.has(key)) {
      throw new UnsupportedRecurrenceError(`Unsupported RRULE part: ${key}`);
    }
  }

  const rawFreq = parsedMap.get("FREQ");
  if (!rawFreq) {
    throw new UnsupportedRecurrenceError("Missing FREQ in RRULE");
  }
  const freqUpper = rawFreq.toUpperCase();
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freqUpper)) {
    throw new UnsupportedRecurrenceError(`Unsupported FREQ: ${rawFreq}`);
  }
  const freq = freqUpper as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

  let interval = 1;
  const rawInterval = parsedMap.get("INTERVAL");
  if (rawInterval !== undefined) {
    if (!/^\d+$/.test(rawInterval)) {
      throw new UnsupportedRecurrenceError(`Invalid INTERVAL: ${rawInterval}`);
    }
    interval = Number(rawInterval);
    if (!Number.isInteger(interval) || interval <= 0) {
      throw new UnsupportedRecurrenceError(`Invalid INTERVAL: ${rawInterval}`);
    }
  }

  let count: number | undefined;
  const rawCount = parsedMap.get("COUNT");
  if (rawCount !== undefined) {
    if (!/^\d+$/.test(rawCount)) {
      throw new UnsupportedRecurrenceError(`Invalid COUNT: ${rawCount}`);
    }
    count = Number(rawCount);
    if (!Number.isInteger(count) || count <= 0) {
      throw new UnsupportedRecurrenceError(`Invalid COUNT: ${rawCount}`);
    }
  }

  let until: ParsedUntil | undefined;
  const rawUntil = parsedMap.get("UNTIL");
  if (rawUntil !== undefined) {
    until = parseUntil(rawUntil);
  }

  if (count !== undefined && until !== undefined) {
    throw new UnsupportedRecurrenceError("COUNT and UNTIL cannot both be specified");
  }

  let wkst: Weekday = "MO";
  const rawWkst = parsedMap.get("WKST");
  if (rawWkst !== undefined) {
    const wkstUpper = rawWkst.toUpperCase();
    if (!WEEKDAYS.includes(wkstUpper as Weekday)) {
      throw new UnsupportedRecurrenceError(`Invalid WKST: ${rawWkst}`);
    }
    wkst = wkstUpper as Weekday;
  }

  let byDays: Weekday[] | undefined;
  let monthlyByDay: { ord: number; weekday: Weekday } | undefined;
  const rawByDay = parsedMap.get("BYDAY");
  if (rawByDay !== undefined) {
    if (freq === "DAILY" || freq === "YEARLY") {
      throw new UnsupportedRecurrenceError(`BYDAY is not supported for FREQ=${freq}`);
    }
    if (freq === "WEEKLY") {
      const items = rawByDay.split(",").map((s) => s.trim().toUpperCase());
      const days: Weekday[] = [];
      for (const item of items) {
        if (!WEEKDAYS.includes(item as Weekday)) {
          throw new UnsupportedRecurrenceError(`Invalid BYDAY for WEEKLY: ${item}`);
        }
        if (!days.includes(item as Weekday)) {
          days.push(item as Weekday);
        }
      }
      if (days.length === 0) {
        throw new UnsupportedRecurrenceError("Empty BYDAY for WEEKLY");
      }
      byDays = days;
    } else if (freq === "MONTHLY") {
      if (rawByDay.includes(",")) {
        throw new UnsupportedRecurrenceError("Multiple BYDAY values not supported for MONTHLY");
      }
      const match = /^([+-]?[1-5])(MO|TU|WE|TH|FR|SA|SU)$/i.exec(rawByDay.trim());
      if (!match?.[1] || !match[2]) {
        throw new UnsupportedRecurrenceError(`Invalid BYDAY for MONTHLY: ${rawByDay}`);
      }
      const ord = Number(match[1]);
      const weekday = match[2].toUpperCase() as Weekday;
      monthlyByDay = { ord, weekday };
    }
  }

  let monthlyByMonthDay: number | undefined;
  const rawByMonthDay = parsedMap.get("BYMONTHDAY");
  if (rawByMonthDay !== undefined) {
    if (freq !== "MONTHLY") {
      throw new UnsupportedRecurrenceError("BYMONTHDAY is only supported for FREQ=MONTHLY");
    }
    if (monthlyByDay !== undefined) {
      throw new UnsupportedRecurrenceError("Cannot specify both BYDAY and BYMONTHDAY");
    }
    if (rawByMonthDay.includes(",")) {
      throw new UnsupportedRecurrenceError("Multiple BYMONTHDAY values not supported");
    }
    if (!/^[+-]?\d+$/.test(rawByMonthDay.trim())) {
      throw new UnsupportedRecurrenceError(`Invalid BYMONTHDAY: ${rawByMonthDay}`);
    }
    const val = Number(rawByMonthDay);
    if ((val >= 1 && val <= 31) || val === -1) {
      monthlyByMonthDay = val;
    } else {
      throw new UnsupportedRecurrenceError(`Invalid BYMONTHDAY value: ${rawByMonthDay}`);
    }
  }

  return {
    freq,
    interval,
    count,
    until,
    byDays,
    monthlyByDay,
    monthlyByMonthDay,
    wkst,
  };
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  ord: number,
  weekday: Weekday,
): number | null {
  const targetWk = WEEKDAY_INDEX[weekday];
  const daysInMonth = getDaysInMonth(year, month);
  const matchingDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (getDayOfWeek(year, month, d) === targetWk) {
      matchingDays.push(d);
    }
  }

  if (ord > 0) {
    const idx = ord - 1;
    return idx < matchingDays.length ? (matchingDays[idx] ?? null) : null;
  }
  if (ord < 0) {
    const idx = matchingDays.length + ord;
    return idx >= 0 ? (matchingDays[idx] ?? null) : null;
  }
  return null;
}

const MAX_ITERATIONS = 100_000;

export function expandRecurrence(input: ExpandRecurrenceInput): string[] {
  const start = parseWallDateTime(input.start, "start");
  const windowStart = parseWallDateTime(input.windowStart, "windowStart");
  const windowEnd = parseWallDateTime(input.windowEnd, "windowEnd");

  if (windowEnd.iso < windowStart.iso) {
    throw new UnsupportedRecurrenceError("windowEnd cannot be before windowStart");
  }

  const exdatesSet = new Set<string>();
  if (input.exdates) {
    for (const ex of input.exdates) {
      parseWallDateTime(ex, "exdate");
      exdatesSet.add(ex);
    }
  }

  const maxOccurrences = input.maxOccurrences !== undefined ? input.maxOccurrences : 500;
  if (maxOccurrences <= 0 || windowStart.iso === windowEnd.iso) {
    // Validate rrule before returning empty
    parseRRule(input.rrule);
    return [];
  }

  const rule = parseRRule(input.rrule);
  const results: string[] = [];
  let generatedCount = 0;

  if (rule.freq === "DAILY") {
    let step = 0;
    while (step < MAX_ITERATIONS) {
      const { year, month, day } = addDaysToDate(
        start.year,
        start.month,
        start.day,
        step * rule.interval,
      );
      const curr = formatWallDateTime(year, month, day, start.hour, start.minute);

      if (rule.until && isPastUntil(curr, rule.until)) {
        break;
      }

      generatedCount++;
      if (rule.count !== undefined && generatedCount > rule.count) {
        break;
      }

      if (curr >= windowEnd.iso) {
        break;
      }

      if (curr >= windowStart.iso && !exdatesSet.has(curr)) {
        results.push(curr);
        if (results.length >= maxOccurrences) {
          break;
        }
      }

      step++;
    }
  } else if (rule.freq === "WEEKLY") {
    const startWkDay = WEEKDAYS[getDayOfWeek(start.year, start.month, start.day)] as Weekday;
    const byDays = rule.byDays ?? [startWkDay];
    const byDaySet = new Set<Weekday>(byDays);

    const startWkIndex = WEEKDAY_INDEX[startWkDay] ?? 0;
    const wkstIndex = WEEKDAY_INDEX[rule.wkst] ?? 0;
    const diff = (startWkIndex - wkstIndex + 7) % 7;
    const firstWeekStart = addDaysToDate(start.year, start.month, start.day, -diff);

    // If start weekday is not in byDays, DTSTART is still the first occurrence (RFC 5545 §3.3.10)
    if (!byDaySet.has(startWkDay)) {
      if (rule.until && isPastUntil(start.iso, rule.until)) {
        return results;
      }
      generatedCount++;
      if (rule.count !== undefined && generatedCount > rule.count) {
        return results;
      }
      if (start.iso >= windowEnd.iso) {
        return results;
      }
      if (start.iso >= windowStart.iso && !exdatesSet.has(start.iso)) {
        results.push(start.iso);
        if (results.length >= maxOccurrences) {
          return results;
        }
      }
    }

    let w = 0;
    while (w < MAX_ITERATIONS) {
      const currentWeekStart = addDaysToDate(
        firstWeekStart.year,
        firstWeekStart.month,
        firstWeekStart.day,
        w * rule.interval * 7,
      );

      // Check if the entire week is beyond windowEnd
      const weekStartCurr = formatWallDateTime(
        currentWeekStart.year,
        currentWeekStart.month,
        currentWeekStart.day,
        start.hour,
        start.minute,
      );
      if (weekStartCurr >= windowEnd.iso) {
        break;
      }

      for (let d = 0; d < 7; d++) {
        const { year, month, day } = addDaysToDate(
          currentWeekStart.year,
          currentWeekStart.month,
          currentWeekStart.day,
          d,
        );
        const curr = formatWallDateTime(year, month, day, start.hour, start.minute);

        if (curr < start.iso) {
          continue;
        }

        const weekday = WEEKDAYS[getDayOfWeek(year, month, day)] as Weekday;
        if (!byDaySet.has(weekday)) {
          continue;
        }

        if (rule.until && isPastUntil(curr, rule.until)) {
          return results;
        }

        generatedCount++;
        if (rule.count !== undefined && generatedCount > rule.count) {
          return results;
        }

        if (curr >= windowEnd.iso) {
          return results;
        }

        if (curr >= windowStart.iso && !exdatesSet.has(curr)) {
          results.push(curr);
          if (results.length >= maxOccurrences) {
            return results;
          }
        }
      }

      w++;
    }
  } else if (rule.freq === "MONTHLY") {
    let m = 0;
    const byMonthDay =
      rule.monthlyByDay === undefined && rule.monthlyByMonthDay === undefined
        ? start.day
        : rule.monthlyByMonthDay;

    while (m < MAX_ITERATIONS) {
      const totalMonths = start.year * 12 + (start.month - 1) + m * rule.interval;
      const year = Math.floor(totalMonths / 12);
      const month = (totalMonths % 12) + 1;

      // If the 1st of this month is past windowEnd, no future date can be inside the window
      const monthFirstIso = formatWallDateTime(year, month, 1, 0, 0);
      if (monthFirstIso >= windowEnd.iso) {
        break;
      }

      let targetDay: number | null = null;
      if (byMonthDay !== undefined) {
        if (byMonthDay === -1) {
          targetDay = getDaysInMonth(year, month);
        } else if (byMonthDay <= getDaysInMonth(year, month)) {
          targetDay = byMonthDay;
        } else {
          // Month does not have this day (e.g. 31 in April) - skip month without shifting
          targetDay = null;
        }
      } else if (rule.monthlyByDay !== undefined) {
        targetDay = getNthWeekdayOfMonth(
          year,
          month,
          rule.monthlyByDay.ord,
          rule.monthlyByDay.weekday,
        );
      }

      if (targetDay !== null) {
        const curr = formatWallDateTime(year, month, targetDay, start.hour, start.minute);

        if (curr >= start.iso) {
          if (rule.until && isPastUntil(curr, rule.until)) {
            break;
          }

          generatedCount++;
          if (rule.count !== undefined && generatedCount > rule.count) {
            break;
          }

          if (curr >= windowEnd.iso) {
            break;
          }

          if (curr >= windowStart.iso && !exdatesSet.has(curr)) {
            results.push(curr);
            if (results.length >= maxOccurrences) {
              break;
            }
          }
        }
      }

      m++;
    }
  } else if (rule.freq === "YEARLY") {
    let y = 0;
    while (y < MAX_ITERATIONS) {
      const year = start.year + y * rule.interval;

      const yearFirstIso = formatWallDateTime(year, 1, 1, 0, 0);
      if (yearFirstIso >= windowEnd.iso) {
        break;
      }

      if (start.month === 2 && start.day === 29 && !isLeapYear(year)) {
        // Feb 29 occurs only in leap years; non-leap years are skipped
        y++;
        continue;
      }

      const curr = formatWallDateTime(year, start.month, start.day, start.hour, start.minute);

      if (curr >= start.iso) {
        if (rule.until && isPastUntil(curr, rule.until)) {
          break;
        }

        generatedCount++;
        if (rule.count !== undefined && generatedCount > rule.count) {
          break;
        }

        if (curr >= windowEnd.iso) {
          break;
        }

        if (curr >= windowStart.iso && !exdatesSet.has(curr)) {
          results.push(curr);
          if (results.length >= maxOccurrences) {
            break;
          }
        }
      }

      y++;
    }
  }

  return results;
}
