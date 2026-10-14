"use client";

import { useCallback } from "react";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
  type RecordDetailSlotsContext,
} from "@/components/records/detail/record-detail-screen";
import { toast } from "@/components/ui/toast";
import { TaskRelationPanel } from "./task-relation-panel";
import { closeTaskPatch, isCloseTaskButtonVisible } from "./tasks-closing";

export type TaskRecordScreenProps = Omit<RecordDetailScreenProps, "buildDetailSlots">;

/**
 * Tasks record detail: shared record screen plus the right-hand relation panel and the
 * Close Task header command. Interim rule: Close Task shows only while the task is open,
 * opens no confirmation, updates the record and reloads it; errors show a toast.
 */
export function TaskRecordScreen(props: TaskRecordScreenProps) {
  const buildDetailSlots = useCallback(
    ({ record, orgSlug, saveRecord }: RecordDetailSlotsContext) => ({
      sidePanel: <TaskRelationPanel record={record} orgSlug={orgSlug} />,
      headerCommands: isCloseTaskButtonVisible(record)
        ? [
            {
              id: "close-task",
              label: "Close Task",
              variant: "primary" as const,
              onPress: () => {
                saveRecord(closeTaskPatch()).catch((error: unknown) => {
                  toast({
                    variant: "danger",
                    title: "Could not close the task",
                    message: error instanceof Error ? error.message : undefined,
                  });
                });
              },
            },
          ]
        : [],
    }),
    [],
  );
  return <RecordDetailScreen {...props} buildDetailSlots={buildDetailSlots} />;
}
