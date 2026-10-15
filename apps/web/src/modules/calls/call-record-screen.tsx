"use client";

import { useCallback } from "react";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
  type RecordDetailSlotsContext,
} from "@/components/records/detail/record-detail-screen";
import { Icons } from "@/components/ui/icon";
import { CallRelationPanel } from "./call-relation-panel";
import { isCallScheduled } from "./calls-reschedule";

export type CallRecordScreenProps = Omit<RecordDetailScreenProps, "buildDetailSlots">;

/**
 * Calls record detail: shared record screen plus the right-hand relation panel and the
 * Reschedule Call header commands (CD-05, CD-05.1). Reschedule Call and the separate
 * down-arrow segment appear only when the call is scheduled (isCallScheduled), drawn
 * without handlers in this task (bound in form task). Edit button is suppressed from header
 * commands as it lives in More Options (CD-07.1). No related-list rail.
 */
export function CallRecordScreen(props: CallRecordScreenProps) {
  const buildDetailSlots = useCallback(
    ({ record, orgSlug }: RecordDetailSlotsContext) => ({
      sidePanel: <CallRelationPanel record={record} orgSlug={orgSlug} />,
      suppressEditCommand: true,
      headerCommands: isCallScheduled(record)
        ? [
            {
              id: "reschedule-call",
              label: "Reschedule Call",
              variant: "primary" as const,
              onPress: () => {},
            },
            {
              id: "reschedule-call-arrow",
              label: "Down arrow",
              ariaLabel: "Down arrow",
              variant: "primary" as const,
              icon: Icons.chevronDown,
              iconOnly: true,
              onPress: () => {},
            },
          ]
        : [],
    }),
    [],
  );
  return <RecordDetailScreen {...props} buildDetailSlots={buildDetailSlots} />;
}
