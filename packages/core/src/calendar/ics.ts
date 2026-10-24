import { ValidationError } from "../errors";
import { assertSupportedRrule, UnsupportedRecurrenceError } from "./recurrence";

export type IcsPartstat = "NEEDS-ACTION" | "ACCEPTED" | "DECLINED" | "TENTATIVE";

export interface IcsAttendee {
  email: string;
  name?: string;
  partstat?: IcsPartstat;
  rsvp?: boolean;
}

export interface InvitationInput {
  uid: string;
  sequence: number;
  method: "REQUEST" | "CANCEL";
  dtstamp: Date;
  organizer: { email: string; name?: string };
  attendees: IcsAttendee[];
  summary: string;
  location?: string;
  description?: string;
  start: Date;
  end: Date;
  /** For all-day events `start`/`end` are UTC dates and `end` is exclusive (one-day event: end = next day). */
  allDay: boolean;
  /** RFC 5545 RRULE value without the `RRULE:` prefix, e.g. `FREQ=WEEKLY;BYDAY=MO;COUNT=4`. Blank = no recurrence. */
  recurrence?: string;
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

function formatDate(d: Date): string {
  return `${pad(d.getUTCFullYear(), 4)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function formatDateTime(d: Date): string {
  return `${formatDate(d)}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** RFC 5545 TEXT escaping. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** Parameter values containing `:`, `;` or `,` must be quoted; quotes are not allowed inside. */
function paramValue(value: string): string {
  const clean = value.replace(/"/g, "'").replace(/[\r\n]+/g, " ");
  return /[:;,]/.test(clean) ? `"${clean}"` : clean;
}

const encoder = new TextEncoder();

/** Fold a content line at 75 octets without splitting a UTF-8 character. */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = "";
  let size = 0;
  let limit = 75;
  for (const ch of line) {
    const bytes = encoder.encode(ch).length;
    if (size + bytes > limit) {
      parts.push(current);
      current = "";
      size = 0;
      limit = 74; // continuation lines start with one space
    }
    current += ch;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function fail(field: string, message: string): never {
  throw new ValidationError({ [field]: [message] });
}

function validate(input: InvitationInput): void {
  if (!input.uid || input.uid.trim() === "") fail("uid", "UID is required.");
  if (input.method === "REQUEST" && input.attendees.length === 0) {
    fail("attendees", "At least one attendee is required.");
  }
  const emailOk = (e: string) => /^[^\s@:;,<>"\\]+@[^\s@:;,<>"\\]+$/.test(e);
  if (!emailOk(input.organizer.email)) fail("organizer", "Organizer email is invalid.");
  if (input.attendees.some((a) => !emailOk(a.email)))
    fail("attendees", "Attendee email is invalid.");
  if (Number.isNaN(input.start.getTime())) fail("start", "Start is invalid.");
  if (Number.isNaN(input.end.getTime())) fail("end", "End is invalid.");
  const bad = input.allDay
    ? formatDate(input.end) <= formatDate(input.start)
    : input.end.getTime() <= input.start.getTime();
  if (bad) fail("end", "End must be after start.");
}

function normalizeRecurrence(input: InvitationInput): string | undefined {
  const raw = input.recurrence?.trim();
  if (!raw) return undefined;
  const value = raw.replace(/^rrule:/i, "");
  try {
    assertSupportedRrule(value);
  } catch (e) {
    if (e instanceof UnsupportedRecurrenceError) fail("recurrence", e.message);
    throw e;
  }
  return value;
}

export function buildInvitation(input: InvitationInput): string {
  validate(input);
  const recurrence = normalizeRecurrence(input);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MepCity//CRM//EN",
    `METHOD:${input.method}`,
    "BEGIN:VEVENT",
    `UID:${escapeText(input.uid)}`,
    `SEQUENCE:${input.sequence}`,
    `DTSTAMP:${formatDateTime(input.dtstamp)}`,
  ];

  if (input.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDate(input.start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDate(input.end)}`);
  } else {
    lines.push(`DTSTART:${formatDateTime(input.start)}`);
    lines.push(`DTEND:${formatDateTime(input.end)}`);
  }

  if (recurrence) lines.push(`RRULE:${recurrence}`);
  lines.push(`SUMMARY:${escapeText(input.summary)}`);
  if (input.location) lines.push(`LOCATION:${escapeText(input.location)}`);
  if (input.description) lines.push(`DESCRIPTION:${escapeText(input.description)}`);

  const organizerCn = input.organizer.name ? `;CN=${paramValue(input.organizer.name)}` : "";
  lines.push(`ORGANIZER${organizerCn}:mailto:${input.organizer.email}`);

  for (const a of input.attendees) {
    const cn = a.name ? `;CN=${paramValue(a.name)}` : "";
    const partstat = `;PARTSTAT=${a.partstat ?? "NEEDS-ACTION"}`;
    const rsvp = a.rsvp === undefined ? "" : `;RSVP=${a.rsvp ? "TRUE" : "FALSE"}`;
    lines.push(`ATTENDEE${cn}${partstat}${rsvp}:mailto:${a.email}`);
  }

  if (input.method === "CANCEL") lines.push("STATUS:CANCELLED");
  lines.push("END:VEVENT", "END:VCALENDAR");

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
