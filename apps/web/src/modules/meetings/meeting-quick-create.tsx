"use client";

import { MeetingInformationDialog } from "./meeting-information-dialog";

/** `quickCreate` of the Meetings list: Create Meeting opens the Meeting Information window. */
export function renderMeetingQuickCreate(props: {
  orgSlug: string;
  currentUserId: string;
  onClose: () => void;
}) {
  return <MeetingInformationDialog {...props} />;
}
