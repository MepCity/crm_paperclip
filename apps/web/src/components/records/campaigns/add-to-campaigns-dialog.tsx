"use client";

import { ValidationError } from "@crm/core/errors";
import {
  campaignMemberStatuses,
  type ModuleRecordReference,
  type RecordService,
} from "@crm/core/records";
import { useRef, useState } from "react";
import { RecordChoice } from "@/components/ui/record-choice";
import {
  type ClientRecordService,
  useOptionalClientRecordService,
} from "@/lib/api/client/provider";
import { FormErrorBanner } from "../form/form-error-banner";
import { SelectRecordDialog } from "../form/select-record-dialog";
import "../form/form.css";
import "./add-to-campaigns-dialog.css";

export interface AddToCampaignsDialogProps {
  module: "Leads" | "Contacts";
  recordIds: string | readonly string[];
  recordService?: RecordService | ClientRecordService;
  /** Number of memberships created by this dialog, including a partially successful retry. */
  onDone: (createdCount: number) => void;
  onCancel: () => void;
}

/** Provisional dialog chrome under the Campaigns links observation boundary. */
export function AddToCampaignsDialog({
  module,
  recordIds,
  recordService,
  onDone,
  onCancel,
}: AddToCampaignsDialogProps) {
  const clientService = useOptionalClientRecordService();
  const service = recordService ?? clientService;
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const createdCount = useRef(0);

  async function add(campaigns: ModuleRecordReference[]) {
    if (busy.current) return;
    if (!service) {
      setError("Record service is unavailable.");
      return;
    }
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const ids = new Set(typeof recordIds === "string" ? [recordIds] : recordIds);
      for (const campaign of campaigns) {
        for (const id of ids) {
          const query = {
            viewId: "all-campaign-members",
            filters: {
              groupOperator: "and",
              group: [
                { field: "Campaign", comparator: "equal", value: campaign.id },
                { field: module === "Leads" ? "Lead" : "Contact", comparator: "equal", value: id },
              ],
            },
          } as const;
          if (await service.count("Campaign_Members", query)) continue;
          try {
            await service.create("Campaign_Members", {
              Campaign: { module: "Campaigns", id: campaign.id },
              [module === "Leads" ? "Lead" : "Contact"]: { module, id },
              Member_Status: status,
            });
            createdCount.current += 1;
          } catch (failure) {
            // A concurrent add may have created this pair since the initial check.
            if (!(await service.count("Campaign_Members", query))) throw failure;
          }
        }
      }
    } catch (failure) {
      setError(
        failure instanceof ValidationError
          ? (Object.values(failure.fieldErrors).flat()[0] ?? failure.message)
          : failure instanceof Error
            ? failure.message
            : "Unable to add campaign members.",
      );
      return;
    } finally {
      busy.current = false;
      setPending(false);
    }
    onDone(createdCount.current);
  }

  return (
    <SelectRecordDialog
      module="Campaigns"
      nameField="Campaign_Name"
      selection="multiple"
      title="Add to Campaigns"
      doneLabel="Add"
      recordService={service ?? undefined}
      isSubmitting={pending}
      onDone={(campaigns) => void add(campaigns)}
      onCancel={() => {
        if (!busy.current) onCancel();
      }}
      beforeSearch={
        <div className="add-to-campaigns-options">
          <RecordChoice
            label="Member Status"
            value={status}
            onChange={setStatus}
            disabled={pending}
            options={[
              { value: null, label: "-None-" },
              ...campaignMemberStatuses.map((value) => ({ value, label: value })),
            ]}
          />
          {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}
        </div>
      }
    />
  );
}
