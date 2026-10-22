import { ValidationError } from "../errors";
import type { IcsPartstat } from "./ics";

export interface ImipReply {
  uid: string;
  sequence: number;
  attendee: { email: string; name?: string; partstat: IcsPartstat };
  dtstamp: Date | null;
}

export const PARTSTATS: readonly IcsPartstat[] = [
  "ACCEPTED",
  "DECLINED",
  "TENTATIVE",
  "NEEDS-ACTION",
];

export function fail(field: string, message: string): never {
  throw new ValidationError({ [field]: [message] });
}

export interface ContentLine {
  name: string;
  params: Map<string, string>;
  value: string;
}

/** RFC 5545 §3.1 unfolding: a line starting with space/tab continues the previous one. */
export function unfold(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\r\n|\r|\n/)) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += raw.slice(1);
    } else {
      out.push(raw);
    }
  }
  return out.filter((l) => l.trim() !== "");
}

/** RFC 5545 §3.3.11 TEXT unescaping. */
export function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_m, c: string) => (c === "n" || c === "N" ? "\n" : c));
}

/** Split on `sep` characters that are outside double quotes. */
export function splitOutsideQuotes(input: string, sep: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quoted = false;
  for (const ch of input) {
    if (ch === '"') quoted = !quoted;
    if (ch === sep && !quoted) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

export function parseLine(line: string): ContentLine | null {
  let quoted = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') quoted = !quoted;
    else if (ch === ":" && !quoted) {
      colon = i;
      break;
    }
  }
  if (colon < 0) return null;
  const [rawName = "", ...rawParams] = splitOutsideQuotes(line.slice(0, colon), ";");
  const params = new Map<string, string>();
  for (const p of rawParams) {
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    let v = p.slice(eq + 1).trim();
    if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    params.set(p.slice(0, eq).trim().toUpperCase(), v);
  }
  return { name: rawName.trim().toUpperCase(), params, value: line.slice(colon + 1) };
}

function parseDtstamp(value: string): Date {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value.trim());
  if (!m) fail("dtstamp", "DTSTAMP is malformed.");
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d ||
    date.getUTCHours() !== h ||
    date.getUTCMinutes() !== mi ||
    date.getUTCSeconds() !== s
  ) {
    fail("dtstamp", "DTSTAMP is malformed.");
  }
  return date;
}

/** Parse an incoming iMIP `METHOD:REPLY` (RFC 5546) into an RSVP update. Pure function. */
export function parseImipReply(icsText: string): ImipReply {
  let method: string | null = null;
  let eventCount = 0;
  let inEvent = false;
  let depth = 0; // nested components inside VEVENT (e.g. VALARM)
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
      method = line.value.trim().toUpperCase();
    }
  }

  if (method !== "REPLY") fail("method", "METHOD must be REPLY.");
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

  const attendees = props.filter((p) => p.name === "ATTENDEE");
  if (attendees.length !== 1) fail("attendee", "Exactly one ATTENDEE is required.");
  const att = attendees[0] as ContentLine;
  const addr = /^mailto:(.*)$/i.exec(att.value.trim());
  const email = addr ? (addr[1] ?? "").trim().toLowerCase() : "";
  if (!email) fail("attendee", "ATTENDEE must be a mailto: address.");

  const partstat = (att.params.get("PARTSTAT") ?? "").toUpperCase() as IcsPartstat;
  if (!PARTSTATS.includes(partstat)) fail("partstat", "PARTSTAT is missing or invalid.");

  const cn = att.params.get("CN");
  const name = cn ? unescapeText(cn).trim() : "";

  const stampLine = props.find((p) => p.name === "DTSTAMP");
  const dtstamp = stampLine ? parseDtstamp(stampLine.value) : null;

  return {
    uid,
    sequence,
    attendee: { email, ...(name ? { name } : {}), partstat },
    dtstamp,
  };
}
