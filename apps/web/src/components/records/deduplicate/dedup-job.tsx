"use client";

import type { FieldDefinition, ModuleApiName } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { useDeduplicate } from "@/lib/api/client/hooks";
import {
  dedupConflictPopupMessage,
  dedupResultSummaryMessage,
  defaultDedupSelection,
  resolveDedupFields,
  toggleDedupSelection,
} from "./dedup-config";
import {
  DedupConfirmDialog,
  DedupConflictPopup,
  DedupFieldDialog,
  DedupProgressDialog,
} from "./dedup-dialogs";

type JobPhase = "fields" | "confirm" | "progress" | "conflict";

type JobOutcome = {
  mergedGroups: number;
  removedRecords: number;
};

export interface DeduplicateJobProps {
  module: ModuleApiName;
  pluralLabel: string;
  fields: readonly FieldDefinition[];
  /** Where the conflict groups of the chosen fields are resolved. */
  conflictGroupsHref: (fields: readonly string[]) => string;
  onClose: () => void;
}

/**
 * Module-wide cleanup started from the list Actions menu: field choice, confirmation, the
 * running notice, and the conflict popup that hands over to the conflict groups screen.
 */
export function DeduplicateJob({
  module,
  pluralLabel,
  fields,
  conflictGroupsHref,
  onClose,
}: DeduplicateJobProps) {
  const router = useRouter();
  const dedupMutation = useDeduplicate(module);
  const panelFields = useMemo(() => resolveDedupFields(module, fields), [module, fields]);
  const [selected, setSelected] = useState<readonly string[]>(() =>
    defaultDedupSelection(module, panelFields),
  );
  const [phase, setPhase] = useState<JobPhase>("fields");
  const [outcome, setOutcome] = useState<JobOutcome | null>(null);
  const settled = useRef(false);

  useEffect(() => {
    if (dedupMutation.status === "pending") {
      settled.current = false;
      return;
    }
    if (settled.current) return;
    if (dedupMutation.status === "success") {
      settled.current = true;
      const result = dedupMutation.data;
      if (result.conflicts.length === 0) {
        toast({
          variant: "success",
          title: `Deduplicate ${pluralLabel}`,
          message: dedupResultSummaryMessage(result.mergedGroups, result.removedRecords),
        });
        onClose();
        return;
      }
      setOutcome({
        mergedGroups: result.mergedGroups,
        removedRecords: result.removedRecords,
      });
      // The running notice keeps the result until the user acknowledges it with OK.
      setPhase((current) => (current === "progress" ? current : "conflict"));
      return;
    }
    if (dedupMutation.status === "error") {
      settled.current = true;
      toast({
        variant: "danger",
        title: "Deduplication failed",
        message:
          dedupMutation.error instanceof Error
            ? dedupMutation.error.message
            : "Deduplication failed.",
      });
      setPhase("fields");
    }
  }, [dedupMutation.status, dedupMutation.data, dedupMutation.error, pluralLabel, onClose]);

  function dismissNotice() {
    if (outcome) setPhase("conflict");
    else onClose();
  }

  if (phase === "confirm") {
    return (
      <DedupConfirmDialog
        pluralLabel={pluralLabel}
        onCancel={onClose}
        onProceed={() => {
          setPhase("progress");
          dedupMutation.mutate(selected);
        }}
      />
    );
  }

  if (phase === "progress") {
    return <DedupProgressDialog onDismiss={dismissNotice} />;
  }

  if (phase === "conflict" && outcome) {
    return (
      <DedupConflictPopup
        pluralLabel={pluralLabel}
        summary={dedupResultSummaryMessage(outcome.mergedGroups, outcome.removedRecords)}
        conflictMessage={dedupConflictPopupMessage(pluralLabel)}
        onLater={onClose}
        onResolveNow={() => router.push(conflictGroupsHref(selected))}
      />
    );
  }

  return (
    <DedupFieldDialog
      pluralLabel={pluralLabel}
      panelFields={panelFields}
      selected={selected}
      onToggle={(apiName) =>
        setSelected((current) => toggleDedupSelection(current, apiName) ?? current)
      }
      onSubmit={() => setPhase("confirm")}
      onCancel={onClose}
    />
  );
}
