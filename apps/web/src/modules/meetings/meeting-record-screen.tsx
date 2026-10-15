"use client";

import { useCallback } from "react";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
  type RecordDetailSlotsContext,
} from "@/components/records/detail/record-detail-screen";
import { TaskRelationPanel } from "../tasks/task-relation-panel";
import { meetingParticipants } from "./meeting-participants";
import { MeetingsParticipantsCard } from "./meetings-participants-card";

export type MeetingRecordScreenProps = Omit<RecordDetailScreenProps, "buildDetailSlots">;

/** MD-47 sits between the business card and details; MD-50–MD-70 reuse Tasks data loading. */
export function MeetingRecordScreen(props: MeetingRecordScreenProps) {
  const buildDetailSlots = useCallback(
    ({ record, orgSlug }: RecordDetailSlotsContext) => ({
      sidePanel: <TaskRelationPanel record={record} orgSlug={orgSlug} />,
      contactSummary: (
        <MeetingsParticipantsCard participants={meetingParticipants(record.fields.Participants)} />
      ),
    }),
    [],
  );
  return <RecordDetailScreen {...props} buildDetailSlots={buildDetailSlots} />;
}
