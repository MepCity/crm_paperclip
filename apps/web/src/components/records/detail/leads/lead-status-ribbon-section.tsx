"use client";

import { isAppError } from "@crm/core/errors";
import type { FieldDefinition, ModuleApiName, RecordId } from "@crm/core/records";
import { useCallback, useState } from "react";
import { StatusRibbon } from "@/components/records/detail/status-ribbon";
import { useUpdateRecord } from "@/lib/api/client/hooks";
import {
  buildLeadStatusStages,
  buildLeadStatusTerminalGroups,
  LEADS_STATUS_RIBBON_LABELS,
} from "@/lib/records/leads-status-ribbon";

export type LeadStatusRibbonSectionProps = {
  module: ModuleApiName;
  recordId: RecordId;
  field: FieldDefinition;
  value: string | null;
  onValueChange: (value: string | null | undefined) => void;
};

export function LeadStatusRibbonSection({
  module,
  recordId,
  field,
  value,
  onValueChange,
}: LeadStatusRibbonSectionProps) {
  const update = useUpdateRecord(module);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stages = buildLeadStatusStages(field);
  const terminalGroups = buildLeadStatusTerminalGroups(stages);
  const busy = update.isPending;

  const handleSelect = useCallback(
    async (next: string | null) => {
      if (next === value) return;
      const previous = value;
      onValueChange(next);
      setErrorMessage(null);
      try {
        await update.mutateAsync({ id: recordId, input: { Lead_Status: next } });
      } catch (error) {
        onValueChange(previous);
        setErrorMessage(isAppError(error) ? error.message : "Unable to update lead status.");
      } finally {
        onValueChange(undefined);
      }
    },
    [onValueChange, recordId, update, value],
  );

  return (
    <div className="flex flex-col gap-1" data-lead-status-ribbon>
      <StatusRibbon
        stages={stages}
        value={value}
        terminalGroups={terminalGroups}
        labels={LEADS_STATUS_RIBBON_LABELS}
        onSelect={(next) => {
          void handleSelect(next);
        }}
        isDisabled={busy}
      />
      {errorMessage ? (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
