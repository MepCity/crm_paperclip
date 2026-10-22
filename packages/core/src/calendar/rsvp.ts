import { normalizeAddress } from "../mail-threading/address";
import type { IcsPartstat } from "./ics";
import type { ImipReply } from "./imip-reply";

export interface InvitationAttendee {
  email: string;
  partstat: IcsPartstat;
  lastReplyStamp: Date | null;
}

export interface InvitationState {
  tenantId: string;
  uid: string;
  sequence: number;
  attendees: InvitationAttendee[];
}

export type RsvpOutcome = "applied" | "stale" | "unknown_event" | "unknown_attendee";

/**
 * Applies a parsed iMIP REPLY to the invitation state (RFC 5546 §3.2.3).
 * Pure: the input is never mutated; non-applied outcomes return the same state object.
 */
export function applyImipReply(
  state: InvitationState,
  reply: ImipReply,
): { outcome: RsvpOutcome; next: InvitationState } {
  if (reply.uid !== state.uid) return { outcome: "unknown_event", next: state };
  const address = normalizeAddress(reply.attendee.email);
  const index = state.attendees.findIndex((a) => normalizeAddress(a.email) === address);
  if (address === null || index < 0) return { outcome: "unknown_attendee", next: state };
  if (reply.sequence < state.sequence) return { outcome: "stale", next: state };
  const current = state.attendees[index] as InvitationAttendee;
  if (
    reply.sequence === state.sequence &&
    reply.dtstamp !== null &&
    current.lastReplyStamp !== null &&
    reply.dtstamp.getTime() < current.lastReplyStamp.getTime()
  ) {
    return { outcome: "stale", next: state };
  }
  // A null dtstamp never overrides a stamped reply of the same sequence.
  if (
    reply.sequence === state.sequence &&
    reply.dtstamp === null &&
    current.lastReplyStamp !== null
  ) {
    return { outcome: "stale", next: state };
  }
  const attendees = state.attendees.map((a, i) =>
    i === index
      ? { ...a, partstat: reply.attendee.partstat, lastReplyStamp: reply.dtstamp }
      : { ...a },
  );
  return { outcome: "applied", next: { ...state, attendees } };
}

export function summarizeRsvp(state: InvitationState): Record<IcsPartstat, number> {
  const counts: Record<IcsPartstat, number> = {
    "NEEDS-ACTION": 0,
    ACCEPTED: 0,
    DECLINED: 0,
    TENTATIVE: 0,
  };
  for (const a of state.attendees) counts[a.partstat] += 1;
  return counts;
}
