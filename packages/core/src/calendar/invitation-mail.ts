import { createHash } from "node:crypto";
import { ValidationError } from "../errors";
import type { ComposeMail } from "../mail/outbox";
import { buildInvitation } from "./ics";
import { type MeetingInvitationSource, meetingToInvitation } from "./meeting-invitation";

export interface InvitationMailMeeting extends MeetingInvitationSource {
  id: string;
}

export interface InvitationMailInput {
  meeting: InvitationMailMeeting;
  organizer: { name?: string; email: string };
  mailboxId: string;
  method: "REQUEST" | "CANCEL";
  sequence: number;
  now?: Date;
}

export interface InvitationMailResult {
  compose: ComposeMail;
  /** Participants that have no email address and therefore get no invitation. */
  skipped: { name?: string }[];
  body: string;
  calendarPart: { contentType: string; filename: "invite.ics"; content: string };
}

const pad = (n: number) => String(n).padStart(2, "0");
const dateTime = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
const day = (d: Date) => dateTime(d).slice(0, 10);

function whenText(m: MeetingInvitationSource): string {
  if (m.allDay) {
    const last = new Date(m.end.getTime() - 86_400_000);
    return day(last) === day(m.start)
      ? `${day(m.start)} (all day)`
      : `${day(m.start)} to ${day(last)} (all day)`;
  }
  return `${dateTime(m.start)} to ${dateTime(m.end)} UTC`;
}

/** Deterministic, queue-safe key from (meeting id, UID, sequence, method). */
function idempotencyKey(id: string, uid: string, sequence: number, method: string): string {
  const hash = createHash("sha256").update(JSON.stringify([id, uid, sequence, method]));
  return `invite_${hash.digest("hex").slice(0, 40)}`;
}

/** Builds the compose input and the calendar part of a meeting invitation. Does not enqueue. */
export function buildInvitationMail(input: InvitationMailInput): InvitationMailResult {
  const { meeting, organizer, mailboxId, method, sequence } = input;
  const invitees = meeting.participants.filter((p) => p.email?.trim());
  const skipped = meeting.participants
    .filter((p) => !p.email?.trim())
    .map((p) => (p.name?.trim() ? { name: p.name.trim() } : {}));
  if (invitees.length === 0) {
    throw new ValidationError({ to: ["The meeting has no invitee with an email address."] });
  }

  const ics = buildInvitation(
    meetingToInvitation(
      { ...meeting, sequence },
      { organizer, method, ...(input.now ? { now: input.now } : {}) },
    ),
  );

  const cancelled = method === "CANCEL";
  const lines = [
    cancelled
      ? `This meeting has been cancelled: ${meeting.title}`
      : `You are invited: ${meeting.title}`,
    "",
    `When: ${whenText(meeting)}`,
  ];
  if (meeting.location) lines.push(`Where: ${meeting.location}`);
  if (meeting.description && !cancelled) lines.push("", meeting.description);
  const body = `${lines.join("\n")}\n`;

  const compose: ComposeMail = {
    idempotencyKey: idempotencyKey(meeting.id, meeting.uid, sequence, method),
    mailboxId,
    from: { address: organizer.email, ...(organizer.name ? { name: organizer.name } : {}) },
    to: invitees.map((p) => ({
      address: (p.email as string).trim(),
      ...(p.name?.trim() ? { name: p.name.trim() } : {}),
    })),
    subject: `${cancelled ? "Cancelled: " : "Invitation: "}${meeting.title}`.slice(0, 998),
    summary: body.slice(0, 2000),
    bodyRef: null,
  };

  return {
    compose,
    skipped,
    body,
    calendarPart: {
      contentType: `text/calendar; method=${method}; charset=UTF-8`,
      filename: "invite.ics",
      content: ics,
    },
  };
}
