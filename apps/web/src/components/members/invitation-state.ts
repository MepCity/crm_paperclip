export type InvitationActionState =
  | { status: "idle" }
  | { status: "success"; inviteUrl: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };
