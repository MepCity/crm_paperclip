/** Normalized Activities wire values shared with form consumers. */
export type MeetingParticipant = {
  type: "user" | "lead" | "contact" | "email";
  id: string | null;
  name: string;
  email: string | null;
};
export type CallStatus = "Scheduled" | "Completed" | "Overdue" | "Cancelled";
