import { participantEntries } from "@/lib/records/meeting-participants";
import type { MeetingsParticipant } from "./meetings-participants-card";

/**
 * Entries written by the Meetings form carry `module`, `id` and an optional name and are listed.
 * Any other populated array stays opaque (interim MEP-517 rule): its item schema is not agreed.
 */
export function meetingParticipants(value: unknown): readonly MeetingsParticipant[] | null {
  if (!Array.isArray(value) || value.length === 0) return [];
  const entries = participantEntries(value as never);
  if (entries.length !== value.length) return null;
  return entries.map((entry) => ({ id: entry.id, name: entry.name ?? entry.id }));
}
