import type { IcsAttendee, InvitationInput } from "./ics";

export interface MeetingParticipant {
  name?: string | null;
  email?: string | null;
}

export interface MeetingInvitationSource {
  uid: string;
  sequence: number;
  title: string;
  start: Date;
  /** For all-day meetings `end` is exclusive, as in `InvitationInput`. */
  end: Date;
  allDay: boolean;
  location?: string | null;
  description?: string | null;
  participants: MeetingParticipant[];
}

export interface MeetingInvitationOptions {
  organizer: { name?: string; email: string };
  method: "REQUEST" | "CANCEL";
  /** DTSTAMP; defaults to the current time. */
  now?: Date;
}

/** Maps a plain meeting record to the input of `buildInvitation`. Participants without an email are skipped. */
export function meetingToInvitation(
  meeting: MeetingInvitationSource,
  options: MeetingInvitationOptions,
): InvitationInput {
  const attendees: IcsAttendee[] = [];
  for (const p of meeting.participants) {
    const email = p.email?.trim();
    if (!email) continue;
    const name = p.name?.trim();
    attendees.push({ email, ...(name ? { name } : {}), rsvp: true });
  }
  const input: InvitationInput = {
    uid: meeting.uid,
    sequence: meeting.sequence,
    method: options.method,
    dtstamp: options.now ?? new Date(),
    organizer: options.organizer,
    attendees,
    summary: meeting.title,
    start: meeting.start,
    end: meeting.end,
    allDay: meeting.allDay,
  };
  if (meeting.location) input.location = meeting.location;
  if (meeting.description) input.description = meeting.description;
  return input;
}
