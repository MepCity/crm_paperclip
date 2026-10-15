"use client";

import type { RecordInput } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
  type RecordDetailSlotsContext,
} from "@/components/records/detail/record-detail-screen";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { CallRelationPanel } from "./call-relation-panel";
import { CALLS_FORM_CANCELLED_STATUS } from "./calls-form-rules";
import { isCallScheduled } from "./calls-reschedule";

export type CallRecordScreenProps = Omit<RecordDetailScreenProps, "buildDetailSlots">;

export const CALLS_CANCEL_CONFIRM_TITLE = "Cancel Call";
export const CALLS_CANCEL_CONFIRM_MESSAGE = "Are you sure you want to cancel this Call?";

/**
 * Calls record detail: shared record screen plus the right-hand relation panel and the
 * Reschedule Call header commands (CD-05, CD-05.1). Both show only while the call is
 * scheduled (isCallScheduled). Reschedule Call opens Edit with Call Start Time focused; the
 * arrow menu holds Mark as Completed (Edit with the status set to Completed, record mode) and
 * Cancel Call (confirmation, then the status becomes Cancelled and the record stays).
 */
export function CallRecordScreen(props: CallRecordScreenProps) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const saveRef = useRef<((input: RecordInput) => Promise<void>) | null>(null);
  const { orgSlug, recordId, paths, definition } = props;
  const editHref = useCallback(
    (intent: string) => `${paths.edit(orgSlug, definition.tab, recordId)}?intent=${intent}`,
    [paths, orgSlug, definition.tab, recordId],
  );

  const buildDetailSlots = useCallback(
    ({ record, orgSlug: slug, saveRecord }: RecordDetailSlotsContext) => {
      saveRef.current = saveRecord;
      return {
        sidePanel: <CallRelationPanel record={record} orgSlug={slug} />,
        suppressEditCommand: true,
        headerCommands: isCallScheduled(record)
          ? [
              {
                id: "reschedule-call",
                label: "Reschedule Call",
                variant: "primary" as const,
                onPress: () => router.push(editHref("reschedule")),
              },
              {
                id: "reschedule-call-arrow",
                label: "Down arrow",
                ariaLabel: "Down arrow",
                variant: "primary" as const,
                icon: Icons.chevronDown,
                iconOnly: true,
                menu: [
                  {
                    id: "mark-as-completed",
                    label: "Mark as Completed",
                    onAction: () => router.push(editHref("complete")),
                  },
                  {
                    id: "cancel-call",
                    label: "Cancel Call",
                    onAction: () => {
                      setCancelError(null);
                      setCancelOpen(true);
                    },
                  },
                ],
              },
            ]
          : [],
      };
    },
    [router, editHref],
  );

  async function confirmCancel() {
    if (!saveRef.current) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      await saveRef.current({ Outgoing_Call_Status: CALLS_FORM_CANCELLED_STATUS });
      setCancelOpen(false);
      toast({ variant: "success", title: "Call cancelled" });
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : "Could not cancel the call.");
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <>
      {cancelOpen ? (
        <ConfirmDialog
          isOpen
          onOpenChange={(open) => {
            if (!open && !cancelBusy) setCancelOpen(false);
          }}
          title={CALLS_CANCEL_CONFIRM_TITLE}
          message={CALLS_CANCEL_CONFIRM_MESSAGE}
          confirmLabel="Cancel Call"
          cancelLabel="Close"
          busy={cancelBusy}
          errorMessage={cancelError}
          onConfirm={confirmCancel}
        />
      ) : null}
      <RecordDetailScreen {...props} buildDetailSlots={buildDetailSlots} />
    </>
  );
}
