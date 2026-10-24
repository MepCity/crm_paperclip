"use client";

import { formatDate } from "@crm/core/format";
import type { ModuleMetadata, RecordData, RecordInput } from "@crm/core/records";
import { useMemo, useState } from "react";
import {
  StageBar,
  type StageBarLabels,
  StageChangeDialog,
} from "@/components/records/detail/stage-bar";
import { useHomeCurrency } from "@/lib/api/client/hooks";
import { useFormat } from "@/lib/format-context";
import {
  buildStageBarStages,
  buildStageChangeInitialValues,
  isClosedStageKind,
  mapStageChangeError,
  readStageValue,
  reasonForLossPicklist,
  stageChangeToRecordInput,
  stageOptionKind,
} from "./deals-stage-utils";

const STAGE_BAR_LABELS: StageBarLabels = {
  bar: "Deal stage",
  startPrefix: "START ",
  closingPrefix: "CLOSING ",
  scrollPrevious: "Scroll previous stages",
  scrollNext: "Scroll next stages",
  wonMenu: "Choose won stage",
  lostMenu: "Choose lost stage",
  search: "Search stages",
  searchPlaceholder: "Search",
  empty: "No matching stages",
  currentStageMarker: "Current stage",
};

export interface DealsStageOverviewProps {
  module: ModuleMetadata;
  record: RecordData;
  saveRecord: (input: RecordInput) => Promise<void>;
  isSaving?: boolean;
}

export function DealsStageOverview({
  module,
  record,
  saveRecord,
  isSaving = false,
}: DealsStageOverviewProps) {
  const orgFormat = useFormat();
  const stages = useMemo(() => buildStageBarStages(module), [module]);
  const currentStage = readStageValue(record);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const homeCurrency = useHomeCurrency();

  const startDate = useMemo(() => {
    const created = record.fields.Created_Time;
    if (typeof created !== "string" || !created) return "—";
    return formatDate(created, orgFormat);
  }, [record.fields.Created_Time, orgFormat]);

  const closingDate = useMemo(() => {
    const closing = record.fields.Closing_Date;
    if (typeof closing !== "string" || !closing) return "—";
    return formatDate(closing, orgFormat);
  }, [record.fields.Closing_Date, orgFormat]);

  const dialogInitial = useMemo(() => {
    const base = buildStageChangeInitialValues(record);
    if (pendingStage) base.stage = pendingStage;
    return base;
  }, [pendingStage, record]);

  const showReasonForLoss =
    pendingStage !== null && stageOptionKind(module, pendingStage) === "lost";

  async function applyStage(stageValue: string) {
    const kind = stageOptionKind(module, stageValue);
    if (isClosedStageKind(kind)) {
      setPendingStage(stageValue);
      setDialogOpen(true);
      return;
    }
    setErrorMessage(null);
    try {
      await saveRecord({ Stage: stageValue });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Update failed.");
    }
  }

  async function submitDialog(values: typeof dialogInitial) {
    setErrorMessage(null);
    try {
      await saveRecord(stageChangeToRecordInput(values, module));
    } catch (error) {
      throw mapStageChangeError(error);
    }
  }

  const currencyPrefix = homeCurrency.data?.symbol ?? "TL";

  return (
    <div className="mx-3 mb-3 flex flex-col gap-2" data-deals-stage-overview>
      <StageBar
        stages={stages}
        currentStageValue={currentStage}
        startDate={startDate}
        closingDate={closingDate}
        labels={STAGE_BAR_LABELS}
        onSelectStage={(value) => void applyStage(value)}
        isDisabled={isSaving}
      />
      {errorMessage ? (
        <p className="text-sm text-danger px-1" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <StageChangeDialog
        isOpen={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPendingStage(null);
        }}
        stages={stages}
        initialValues={dialogInitial}
        reasonForLossOptions={reasonForLossPicklist(module)}
        showReasonForLoss={showReasonForLoss && stageOptionKind(module, pendingStage) === "lost"}
        onSubmit={submitDialog}
        isPending={isSaving}
        currencyPrefix={currencyPrefix}
      />
    </div>
  );
}
