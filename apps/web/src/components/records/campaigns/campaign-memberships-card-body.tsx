"use client";

import {
  type Criteria,
  campaignMemberStatuses,
  type FieldDefinition,
  type FieldValue,
  type ModuleRecordReference,
  type RecordData,
  type RecordId,
} from "@crm/core/records";
import { useId, useMemo, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { FieldValueView } from "@/components/records/detail/field-value";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Link } from "@/components/ui/link";
import { RecordChoice } from "@/components/ui/record-choice";
import { useDeleteRecords, useRecordList, useUpdateRecord, useViews } from "@/lib/api/client/hooks";
import { useFormat } from "@/lib/format-context";

const LIST_PAGE_SIZE = 100;
const DATE_FIELDS = {
  Start_Date: { apiName: "Start_Date", label: "Start Date", dataType: "date" },
  End_Date: { apiName: "End_Date", label: "End Date", dataType: "date" },
} as unknown as Record<"Start_Date" | "End_Date", FieldDefinition>;
const COLUMNS = [
  "Campaign Name",
  "Status",
  "Type",
  "Start Date",
  "End Date",
  "Member Status",
  "",
] as const;

export interface CampaignMembershipsCardBodyProps {
  module: "Leads" | "Contacts";
  recordId: RecordId;
  campaignPath: (campaignId: RecordId) => string;
}

/** Memberships of one Lead or Contact. */
export function membershipsOfRecord(module: "Leads" | "Contacts", recordId: RecordId): Criteria {
  return {
    field: module === "Leads" ? "Lead" : "Contact",
    comparator: "equal",
    value: recordId,
  };
}

function reference(value: FieldValue | undefined): ModuleRecordReference | null {
  return typeof value === "object" && value !== null && "id" in value && "module" in value
    ? (value as ModuleRecordReference)
    : null;
}

function text(value: FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function EmptyState({ children }: { children: string }) {
  return (
    <div data-part="empty" className="py-8 text-left text-md text-text-empty">
      {children}
    </div>
  );
}

/** Provisional chrome: the filled card and its row actions were not observed. */
function EditStatusDialog({
  initial,
  onClose,
  onSave,
  busy,
  error,
}: {
  initial: string | null;
  onClose: () => void;
  onSave: (status: string | null) => void;
  busy: boolean;
  error: string | null;
}) {
  const titleId = useId();
  const [status, setStatus] = useState<string | null>(initial);
  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <Modal className="w-(--size-dialog-width) max-w-full rounded-(--radius-create-menu) bg-surface p-6 shadow-lg outline-none">
        <AriaDialog aria-labelledby={titleId} className="outline-none">
          <Heading slot="title" id={titleId} className="mb-4 text-2xl font-bold text-text-strong">
            Edit Member Status
          </Heading>
          <RecordChoice
            label="Member Status"
            value={status}
            onChange={setStatus}
            disabled={busy}
            options={[
              { value: null, label: "-None-" },
              ...campaignMemberStatuses.map((value) => ({ value, label: value })),
            ]}
          />
          {error ? (
            <p role="alert" className="mt-2 text-md text-danger">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onPress={onClose} isDisabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onPress={() => onSave(status)} isDisabled={busy}>
              Save
            </Button>
          </div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

export function CampaignMembershipsCardBody({
  module,
  recordId,
  campaignPath,
}: CampaignMembershipsCardBodyProps) {
  const orgFormat = useFormat();
  const filter = useMemo(() => membershipsOfRecord(module, recordId), [module, recordId]);
  const members = useRecordList(
    "Campaign_Members",
    { viewId: "all-campaign-members", page: 1, perPage: LIST_PAGE_SIZE, filters: filter },
    { enabled: true },
  );
  const campaignViews = useViews("Campaigns");
  const campaignsViewId = useMemo(
    () => campaignViews.data?.find((view) => view.isDefault)?.id ?? null,
    [campaignViews.data],
  );
  const rows = members.data?.records ?? [];
  const campaignFilter = useMemo<Criteria>(
    () => ({
      groupOperator: "or",
      group: [
        ...new Set(
          rows.flatMap((row) => {
            const campaign = reference(row.fields.Campaign);
            return campaign ? [campaign.id] : [];
          }),
        ),
      ].map((id) => ({ field: "id", comparator: "equal", value: id })),
    }),
    [rows],
  );
  const hasCampaigns = "group" in campaignFilter && campaignFilter.group.length > 0;
  const campaigns = useRecordList(
    "Campaigns",
    {
      viewId: campaignsViewId ?? "pending",
      page: 1,
      perPage: LIST_PAGE_SIZE,
      filters: campaignFilter,
    },
    { enabled: campaignsViewId !== null && hasCampaigns },
  );
  const campaignsById = useMemo(
    () => new Map<string, RecordData>((campaigns.data?.records ?? []).map((r) => [r.id, r])),
    [campaigns.data],
  );
  const update = useUpdateRecord("Campaign_Members");
  const remove = useDeleteRecords("Campaign_Members");
  const [editing, setEditing] = useState<RecordData | null>(null);
  const [removing, setRemoving] = useState<RecordData | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (members.isLoading || (hasCampaigns && (campaignViews.isLoading || campaigns.isLoading))) {
    return <EmptyState>Loading...</EmptyState>;
  }
  if (members.isError || (hasCampaigns && (campaignViews.isError || campaigns.isError))) {
    return <RelatedRecordsListError />;
  }
  if (rows.length === 0) return <EmptyState>No records found</EmptyState>;

  async function saveStatus(status: string | null) {
    if (!editing) return;
    setError(null);
    try {
      await update.mutateAsync({ id: editing.id, input: { Member_Status: status } });
      setEditing(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to update Member Status.");
    }
  }

  return (
    <div className="overflow-x-auto py-2">
      <table className="w-full text-left text-md">
        <thead>
          <tr className="border-b border-panel-border text-text-muted">
            {COLUMNS.map((label, index) => (
              <th
                key={label || `actions-${index}`}
                className="px-2 py-2 font-semibold text-text-strong"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ref = reference(row.fields.Campaign);
            const campaign = ref ? campaignsById.get(ref.id) : undefined;
            const name = text(campaign?.fields.Campaign_Name) || ref?.name || "";
            return (
              <tr key={row.id} className="border-b border-panel-border last:border-b-0">
                <td className="whitespace-nowrap px-2 py-2">
                  {ref ? (
                    <Link
                      href={campaignPath(ref.id)}
                      variant="body"
                      className="text-primary hover:underline"
                    >
                      {name || ref.id}
                    </Link>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-text">
                  {text(campaign?.fields.Status)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-text">
                  {text(campaign?.fields.Type)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-text">
                  <FieldValueView
                    field={DATE_FIELDS.Start_Date}
                    value={campaign?.fields.Start_Date ?? null}
                    format={orgFormat}
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-text">
                  <FieldValueView
                    field={DATE_FIELDS.End_Date}
                    value={campaign?.fields.End_Date ?? null}
                    format={orgFormat}
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-text">
                  {text(row.fields.Member_Status)}
                </td>
                <td className="whitespace-nowrap px-2 py-2">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    aria-label={`Edit ${name || "membership"}`}
                    onClick={() => {
                      setError(null);
                      setEditing(row);
                    }}
                  >
                    Edit
                  </button>
                  <span aria-hidden className="px-1 text-text-muted">
                    |
                  </span>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    aria-label={`Remove ${name || "membership"}`}
                    onClick={() => setRemoving(row)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {editing ? (
        <EditStatusDialog
          initial={text(editing.fields.Member_Status) || null}
          busy={update.isPending}
          error={error}
          onClose={() => setEditing(null)}
          onSave={(status) => void saveStatus(status)}
        />
      ) : null}
      {removing ? (
        <ConfirmDialog
          isOpen
          onOpenChange={(open) => {
            if (!open && !remove.isPending) setRemoving(null);
          }}
          title="Remove Campaign"
          message="Are you sure you want to remove this campaign membership?"
          confirmLabel="Remove"
          cancelLabel="Cancel"
          tone="danger"
          busy={remove.isPending}
          onConfirm={async () => {
            await remove.mutateAsync([removing.id]);
            setRemoving(null);
          }}
        />
      ) : null}
    </div>
  );
}
