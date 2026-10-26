import { ValidationError } from "../errors";
import type { IcsPartstat } from "./ics";
import { type ContentLine, fail, PARTSTATS, parseLine, unescapeText, unfold } from "./imip-reply";

export interface ImipAttendee {
  email: string;
  partstat: IcsPartstat;
  role?: string;
  name?: string;
}

export interface ImipOrganizer {
  email: string;
  name?: string;
}

export interface ImipRequestBase {
  uid: string;
  sequence: number;
  summary: string;
  allDay?: boolean;
  tzid?: string;
  location?: string;
  organizer: ImipOrganizer;
  attendees: ImipAttendee[];
}

export interface ImipInviteRequest extends ImipRequestBase {
  method: "REQUEST";
  start: string;
  end: string;
}

export interface ImipCancelRequest extends ImipRequestBase {
  method: "CANCEL";
  start?: string;
  end?: string;
}

export type ImipRequest = ImipInviteRequest | ImipCancelRequest;

interface ParsedDateTime {
  iso: string;
  isDateOnly: boolean;
  isUtc: boolean;
}

interface ParsedDuration {
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isNegative: boolean;
  totalSeconds: number;
  hasTimeComponents: boolean;
}

function parseIcsDuration(value: string): ParsedDuration {
  const v = value.trim();

  // 1. dur-week: (["+"] / "-") "P" 1*DIGIT "W"
  const weekMatch = /^([+-])?P(\d+)W$/i.exec(v);
  if (weekMatch) {
    const isNegative = weekMatch[1] === "-";
    const weeks = Number(weekMatch[2]);
    const totalSeconds = (isNegative ? -1 : 1) * weeks * 7 * 86400;
    return {
      weeks,
      days: weeks * 7,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isNegative,
      totalSeconds,
      hasTimeComponents: false,
    };
  }

  // 2. dur-date / dur-time: (["+"] / "-") "P" [1*DIGIT "D"] ["T" [1*DIGIT "H"] [1*DIGIT "M"] [1*DIGIT "S"]]
  const dtMatch = /^([+-])?P(?:(\d+)D)?(?:T(?=.)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(v);
  if (dtMatch) {
    const isNegative = dtMatch[1] === "-";
    const daysStr = dtMatch[2];
    const hoursStr = dtMatch[3];
    const minutesStr = dtMatch[4];
    const secondsStr = dtMatch[5];

    if (!daysStr && !hoursStr && !minutesStr && !secondsStr) {
      fail("duration", "DURATION is malformed.");
    }

    const days = daysStr ? Number(daysStr) : 0;
    const hours = hoursStr ? Number(hoursStr) : 0;
    const minutes = minutesStr ? Number(minutesStr) : 0;
    const seconds = secondsStr ? Number(secondsStr) : 0;
    const hasTimeComponents = Boolean(hoursStr || minutesStr || secondsStr);
    const totalSeconds =
      (isNegative ? -1 : 1) * (days * 86400 + hours * 3600 + minutes * 60 + seconds);

    return {
      weeks: 0,
      days,
      hours,
      minutes,
      seconds,
      isNegative,
      totalSeconds,
      hasTimeComponents,
    };
  }

  fail("duration", "DURATION is malformed.");
}

function formatDateOnly(dt: Date): string {
  const y = String(dt.getUTCFullYear()).padStart(4, "0");
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

function formatDateTime(dt: Date, isUtc: boolean): string {
  const y = String(dt.getUTCFullYear()).padStart(4, "0");
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const mi = String(dt.getUTCMinutes()).padStart(2, "0");
  const s = String(dt.getUTCSeconds()).padStart(2, "0");
  return `${y}-${mo}-${d}T${h}:${mi}:${s}${isUtc ? "Z" : ""}`;
}

function addDurationToStart(start: ParsedDateTime, durationSeconds: number): string {
  if (start.isDateOnly) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start.iso);
    const y = m ? Number(m[1]) : 0;
    const mo = m ? Number(m[2]) : 1;
    const d = m ? Number(m[3]) : 1;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    dt.setUTCSeconds(dt.getUTCSeconds() + durationSeconds);
    return formatDateOnly(dt);
  }

  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(start.iso);
  const y = m ? Number(m[1]) : 0;
  const mo = m ? Number(m[2]) : 1;
  const d = m ? Number(m[3]) : 1;
  const h = m ? Number(m[4]) : 0;
  const mi = m ? Number(m[5]) : 0;
  const s = m ? Number(m[6]) : 0;
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  dt.setUTCSeconds(dt.getUTCSeconds() + durationSeconds);
  return formatDateTime(dt, start.isUtc);
}

function parseIcsDateOrDateTime(value: string, field: "start" | "end"): ParsedDateTime {
  const v = value.trim();

  // 1. Date-only format: YYYYMMDD or YYYY-MM-DD
  const mDateCompact = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  const mDateIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const mDate = mDateCompact ?? mDateIso;
  if (mDate) {
    const y = Number(mDate[1]);
    const mo = Number(mDate[2]);
    const d = Number(mDate[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
      fail(field, `${field.toUpperCase()} date is malformed.`);
    }
    return {
      iso: `${mDate[1]}-${mDate[2]}-${mDate[3]}`,
      isDateOnly: true,
      isUtc: false,
    };
  }

  // 2. Date-time format: YYYYMMDDTHHMMSS(Z)? or YYYY-MM-DDTHH:MM:SS(Z)?
  const mDtCompact = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/i.exec(v);
  const mDtIso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z)?$/i.exec(v);
  const mDt = mDtCompact ?? mDtIso;
  if (mDt) {
    const y = Number(mDt[1]);
    const mo = Number(mDt[2]);
    const d = Number(mDt[3]);
    const h = Number(mDt[4]);
    const mi = Number(mDt[5]);
    const s = Number(mDt[6]);
    const isUtc = Boolean(mDt[7]);
    const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() !== mo - 1 ||
      dt.getUTCDate() !== d ||
      dt.getUTCHours() !== h ||
      dt.getUTCMinutes() !== mi ||
      dt.getUTCSeconds() !== s
    ) {
      fail(field, `${field.toUpperCase()} date-time is malformed.`);
    }
    const iso = `${mDt[1]}-${mDt[2]}-${mDt[3]}T${mDt[4]}:${mDt[5]}:${mDt[6]}${isUtc ? "Z" : ""}`;
    return {
      iso,
      isDateOnly: false,
      isUtc,
    };
  }

  fail(field, `${field.toUpperCase()} is malformed.`);
}

/** Parse an incoming iMIP `METHOD:REQUEST` or `METHOD:CANCEL` (RFC 5546) invitation. Pure function. */
export function parseImipRequest(icsText: string): ImipRequest {
  let method: "REQUEST" | "CANCEL" | null = null;
  let eventCount = 0;
  let inEvent = false;
  let depth = 0;
  const props: ContentLine[] = [];

  for (const raw of unfold(icsText)) {
    const line = parseLine(raw);
    if (!line) continue;
    if (line.name === "BEGIN") {
      const comp = line.value.trim().toUpperCase();
      if (inEvent) depth++;
      else if (comp === "VEVENT") {
        eventCount++;
        inEvent = true;
      }
      continue;
    }
    if (line.name === "END") {
      if (inEvent) {
        if (depth > 0) depth--;
        else inEvent = false;
      }
      continue;
    }
    if (inEvent) {
      if (depth === 0) props.push(line);
    } else if (line.name === "METHOD" && method === null) {
      const m = line.value.trim().toUpperCase();
      if (m === "REQUEST" || m === "CANCEL") {
        method = m;
      } else {
        fail("method", "METHOD must be REQUEST or CANCEL.");
      }
    }
  }

  if (method === null) fail("method", "METHOD must be REQUEST or CANCEL.");
  if (eventCount !== 1) fail("vevent", "Exactly one VEVENT is required.");

  const uidLine = props.find((p) => p.name === "UID");
  const uid = uidLine ? unescapeText(uidLine.value).trim() : "";
  if (!uid) fail("uid", "UID is required.");

  const seqLine = props.find((p) => p.name === "SEQUENCE");
  let sequence = 0;
  if (seqLine) {
    const v = seqLine.value.trim();
    if (!/^\d+$/.test(v)) fail("sequence", "SEQUENCE must be a non-negative integer.");
    sequence = Number(v);
  }

  const sumLine = props.find((p) => p.name === "SUMMARY");
  const summary = sumLine ? unescapeText(sumLine.value).trim() : "";

  const startLine = props.find((p) => p.name === "DTSTART");
  const endLine = props.find((p) => p.name === "DTEND");
  const durationLine = props.find((p) => p.name === "DURATION");

  if (endLine && durationLine) {
    throw new ValidationError({
      end: ["Both DTEND and DURATION cannot be specified."],
      duration: ["Both DTEND and DURATION cannot be specified."],
    });
  }

  const startParsed = startLine ? parseIcsDateOrDateTime(startLine.value, "start") : undefined;
  const endParsed = endLine ? parseIcsDateOrDateTime(endLine.value, "end") : undefined;
  const duration = durationLine ? parseIcsDuration(durationLine.value) : undefined;

  if (duration?.isNegative) {
    fail("duration", "DURATION must be positive or zero.");
  }

  if (startParsed?.isDateOnly && duration?.hasTimeComponents) {
    fail("duration", "DURATION must not contain time units for all-day events.");
  }

  const isAllDay = Boolean(
    startParsed?.isDateOnly ||
      endParsed?.isDateOnly ||
      startLine?.params.get("VALUE")?.toUpperCase() === "DATE" ||
      endLine?.params.get("VALUE")?.toUpperCase() === "DATE",
  );

  const rawTzid = startLine?.params.get("TZID") ?? endLine?.params.get("TZID");
  const tzid = rawTzid ? unescapeText(rawTzid).trim() : undefined;

  const locLine = props.find((p) => p.name === "LOCATION");
  const location = locLine ? unescapeText(locLine.value).trim() : "";

  const orgLines = props.filter((p) => p.name === "ORGANIZER");
  if (orgLines.length !== 1) fail("organizer", "Exactly one ORGANIZER is required.");
  const orgLine = orgLines[0] as ContentLine;
  const orgAddr = /^mailto:(.*)$/i.exec(orgLine.value.trim());
  const orgEmail = orgAddr ? (orgAddr[1] ?? "").trim().toLowerCase() : "";
  if (!orgEmail) fail("organizer", "ORGANIZER must be a mailto: address.");
  const orgCn = orgLine.params.get("CN");
  const orgName = orgCn ? unescapeText(orgCn).trim() : "";
  const organizer: ImipOrganizer = {
    email: orgEmail,
    ...(orgName ? { name: orgName } : {}),
  };

  const attLines = props.filter((p) => p.name === "ATTENDEE");
  const attendees: ImipAttendee[] = [];
  for (const att of attLines) {
    const addr = /^mailto:(.*)$/i.exec(att.value.trim());
    const email = addr ? (addr[1] ?? "").trim().toLowerCase() : "";
    if (!email) fail("attendee", "ATTENDEE must be a mailto: address.");

    let partstat: IcsPartstat = "NEEDS-ACTION";
    const rawPartstat = att.params.get("PARTSTAT");
    if (rawPartstat) {
      const p = rawPartstat.toUpperCase() as IcsPartstat;
      if (!PARTSTATS.includes(p)) fail("partstat", "PARTSTAT is missing or invalid.");
      partstat = p;
    }

    const roleParam = att.params.get("ROLE");
    const role = roleParam ? unescapeText(roleParam).trim().toUpperCase() : "";

    const cn = att.params.get("CN");
    const name = cn ? unescapeText(cn).trim() : "";

    attendees.push({
      email,
      partstat,
      ...(role ? { role } : {}),
      ...(name ? { name } : {}),
    });
  }

  if (method === "REQUEST") {
    if (!startParsed) {
      fail("start", "DTSTART is required.");
    }

    let endIso: string;
    if (endParsed) {
      endIso = endParsed.iso;
    } else if (duration) {
      endIso = addDurationToStart(startParsed, duration.totalSeconds);
    } else if (isAllDay || startParsed.isDateOnly) {
      endIso = addDurationToStart(startParsed, 86400);
    } else {
      endIso = startParsed.iso;
    }

    const req: ImipInviteRequest = {
      method: "REQUEST",
      uid,
      sequence,
      summary,
      start: startParsed.iso,
      end: endIso,
      ...(isAllDay ? { allDay: true } : {}),
      ...(tzid && !startParsed.isUtc ? { tzid } : {}),
      ...(location ? { location } : {}),
      organizer,
      attendees,
    };
    return req;
  }

  if (duration && !startParsed) {
    fail("duration", "DURATION requires DTSTART.");
  }

  let endIso: string | undefined;
  if (endParsed) {
    endIso = endParsed.iso;
  } else if (duration && startParsed) {
    endIso = addDurationToStart(startParsed, duration.totalSeconds);
  }

  const cancelReq: ImipCancelRequest = {
    method: "CANCEL",
    uid,
    sequence,
    summary,
    ...(startParsed ? { start: startParsed.iso } : {}),
    ...(endIso ? { end: endIso } : {}),
    ...(isAllDay ? { allDay: true } : {}),
    ...(tzid && !startParsed?.isUtc ? { tzid } : {}),
    ...(location ? { location } : {}),
    organizer,
    attendees,
  };
  return cancelReq;
}
