export type StageKind = "open" | "won" | "lost";

export interface StageBarStage {
  label: string;
  value: string;
  kind: StageKind;
}

export interface StageBarLabels {
  bar: string;
  startPrefix: string;
  closingPrefix: string;
  scrollPrevious: string;
  scrollNext: string;
  wonMenu: string;
  lostMenu: string;
  search: string;
  searchPlaceholder: string;
  empty: string;
  currentStageMarker: string;
}

export interface StageChangeFormValues {
  amount: number | null;
  closingDate: string;
  stage: string;
  reasonForLoss: string | null;
}

export type StageChangeFieldErrors = Partial<
  Record<"amount" | "closingDate" | "stage" | "reasonForLoss", string>
>;

export class StageChangeSubmitError extends Error {
  readonly fieldErrors: StageChangeFieldErrors;

  readonly generalMessage: string | undefined;

  constructor(fieldErrors: StageChangeFieldErrors, generalMessage?: string) {
    super(generalMessage ?? "Stage change validation failed");
    this.generalMessage = generalMessage;
    this.name = "StageChangeSubmitError";
    this.fieldErrors = fieldErrors;
  }
}
