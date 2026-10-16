"use client";

import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
} from "@/components/records/detail/record-detail-screen";

export type MeetingRecordScreenProps = RecordDetailScreenProps;

/**
 * Meetings record detail screen (MD-01 – MD-70).
 * Delegates to the unified RecordDetailScreen with meetingsScreenDefinition.
 */
export function MeetingRecordScreen(props: MeetingRecordScreenProps) {
  return <RecordDetailScreen {...props} />;
}
