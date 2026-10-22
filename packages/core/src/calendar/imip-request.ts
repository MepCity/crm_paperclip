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

export interface ImipRequest {
  method: "REQUEST" | "CANCEL";
  uid: string;
  sequence: number;
  summary: string;
  start: string;
  end: string;
  allDay?: boolean;
  tzid?: string;
  location?: string;
  organizer: ImipOrganizer;
  attendees: ImipAttendee[];
}

interface ParsedDateTime {
  iso: string;
  isDateOnly: boolean;
  isUtc: boolean;
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
  if (!startLine) fail("start", "DTSTART is required.");
  const endLine = props.find((p) => p.name === "DTEND");
  if (!endLine) fail("end", "DTEND is required.");

  const startParsed = parseIcsDateOrDateTime(startLine.value, "start");
  const endParsed = parseIcsDateOrDateTime(endLine.value, "end");

  const isAllDay =
    startParsed.isDateOnly ||
    endParsed.isDateOnly ||
    startLine.params.get("VALUE")?.toUpperCase() === "DATE" ||
    endLine.params.get("VALUE")?.toUpperCase() === "DATE";

  const rawTzid = startLine.params.get("TZID") ?? endLine.params.get("TZID");
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

  return {
    method,
    uid,
    sequence,
    summary,
    start: startParsed.iso,
    end: endParsed.iso,
    ...(isAllDay ? { allDay: true } : {}),
    ...(tzid && !startParsed.isUtc ? { tzid } : {}),
    ...(location ? { location } : {}),
    organizer,
    attendees,
  };
}
