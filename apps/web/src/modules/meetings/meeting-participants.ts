import type { MeetingsParticipant } from "./meetings-participants-card";

/** Interim MEP-517 rule: opaque array entries have no agreed display schema. */
export function meetingParticipants(value: unknown): readonly MeetingsParticipant[] | null {
  return Array.isArray(value) && value.length > 0 ? null : [];
}
