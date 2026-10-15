"use client";

import { useCallback } from "react";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
  type RecordDetailSlotsContext,
} from "@/components/records/detail/record-detail-screen";
import { TaskRelationPanel } from "../tasks/task-relation-panel";
import { MeetingParticipantsSlot } from "./meeting-participants-slot";

export type MeetingRecordScreenProps = Omit<RecordDetailScreenProps, "buildDetailSlots">;

/** MD-47 sits between the business card and details; MD-50–MD-70 reuse Tasks data loading. */
export function MeetingRecordScreen(props: MeetingRecordScreenProps) {
  const buildDetailSlots = useCallback(
    ({ record, orgSlug }: RecordDetailSlotsContext) => ({
      sidePanel: <TaskRelationPanel record={record} orgSlug={orgSlug} />,
      contactSummary: <MeetingParticipantsSlot record={record} />,
    }),
    [],
  );
  return <RecordDetailScreen {...props} buildDetailSlots={buildDetailSlots} />;
}
