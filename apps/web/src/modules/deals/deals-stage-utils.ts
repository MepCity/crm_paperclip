import { ValidationError } from "@crm/core/errors";
import type { FieldDefinition, ModuleMetadata, RecordData, RecordInput } from "@crm/core/records";
import type { StageBarStage, StageKind } from "@/components/records/detail/stage-bar";
import { StageChangeSubmitError } from "@/components/records/detail/stage-bar";
import type { StageChangeFormValues } from "@/components/records/detail/stage-bar/types";

function stageKind(category: string | undefined): StageKind {
  if (category === "Closed Won") return "won";
  if (category === "Closed Lost") return "lost";
  return "open";
}

export function stageFieldDefinition(module: ModuleMetadata): FieldDefinition | undefined {
  return module.fields.find((field) => field.apiName === "Stage");
}

export function buildStageBarStages(module: ModuleMetadata): StageBarStage[] {
  const field = stageFieldDefinition(module);
  if (!field?.picklist) return [];
  return field.picklist
    .filter((option) => option.storedValue !== null)
    .map((option) => ({
      label: option.displayValue,
      value: option.storedValue,
      kind: stageKind(option.stage?.category),
    }));
}

export function stageOptionKind(
  module: ModuleMetadata,
  stageValue: string | null | undefined,
): StageKind {
  if (!stageValue) return "open";
  const field = stageFieldDefinition(module);
  const option = field?.picklist?.find((entry) => entry.storedValue === stageValue);
  return stageKind(option?.stage?.category);
}

export function isClosedStageKind(kind: StageKind): boolean {
  return kind === "won" || kind === "lost";
}

export function readStageValue(record: RecordData): string {
  const value = record.fields.Stage;
  return typeof value === "string" ? value : "";
}

export function buildStageChangeInitialValues(record: RecordData): StageChangeFormValues {
  const amount = record.fields.Amount;
  const closing = record.fields.Closing_Date;
  const loss = record.fields.Reason_For_Loss__s;
  return {
    amount: typeof amount === "number" ? amount : null,
    closingDate: typeof closing === "string" ? closing : "",
    stage: readStageValue(record),
    reasonForLoss: typeof loss === "string" ? loss : null,
  };
}

export function stageChangeToRecordInput(
  values: StageChangeFormValues,
  module: ModuleMetadata,
): RecordInput {
  const isLost = stageOptionKind(module, values.stage) === "lost";
  return {
    Stage: values.stage,
    Closing_Date: values.closingDate,
    Amount: values.amount,
    Reason_For_Loss__s: isLost ? values.reasonForLoss : null,
  };
}

/** Maps a service validation error onto the dialog's field errors; other errors pass through. */
export function mapStageChangeError(error: unknown): unknown {
  if (error instanceof ValidationError) {
    const mapped = {
      amount: error.fieldErrors.Amount?.[0],
      closingDate: error.fieldErrors.Closing_Date?.[0],
      stage: error.fieldErrors.Stage?.[0],
      reasonForLoss: error.fieldErrors.Reason_For_Loss__s?.[0],
    };
    const unmappedMessages = Object.entries(error.fieldErrors)
      .filter(
        ([field]) => !["Amount", "Closing_Date", "Stage", "Reason_For_Loss__s"].includes(field),
      )
      .flatMap(([, messages]) => messages)
      .filter(Boolean);
    const generalMessage =
      unmappedMessages.length > 0
        ? unmappedMessages.join(" ")
        : Object.values(mapped).some(Boolean)
          ? undefined
          : error.message;
    return new StageChangeSubmitError(mapped, generalMessage);
  }
  return error;
}

export function reasonForLossPicklist(
  module: ModuleMetadata,
): readonly { storedValue: string; displayValue: string }[] {
  const field = module.fields.find((candidate) => candidate.apiName === "Reason_For_Loss__s");
  return (
    field?.picklist?.map((option) => ({
      storedValue: option.storedValue,
      displayValue: option.displayValue,
    })) ?? []
  );
}
