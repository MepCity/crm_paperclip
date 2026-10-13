import { ValidationError } from "../../../errors";
import type { FieldValue, RecordInput } from "../../contract";
import { dealsPicklists } from "./picklists";

export function roundMoneyTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON * Math.max(1, Math.abs(value))) * 100) / 100;
}

function probabilityProvided(input: RecordInput): boolean {
  return Object.hasOwn(input, "Probability") && input.Probability !== null;
}

export function applyDealRules(
  fields: Record<string, FieldValue>,
  input: RecordInput,
  previous?: Readonly<Record<string, FieldValue>>,
): void {
  const stage = dealsPicklists.Stage?.find((option) => option.storedValue === fields.Stage);
  if (!probabilityProvided(input) && (!previous || previous.Stage !== fields.Stage))
    fields.Probability = stage?.stage?.probability ?? 0;
  if (!probabilityProvided(input) && previous && previous.Stage === fields.Stage)
    fields.Probability = previous.Probability;
  if (
    probabilityProvided(input) &&
    (typeof input.Probability !== "number" ||
      !Number.isInteger(input.Probability) ||
      input.Probability < 0 ||
      input.Probability > 100)
  )
    throw new ValidationError({ Probability: ["Choose an integer between 0 and 100."] });
  if (stage?.stage?.category !== "Closed Lost") {
    const lossReason = input.Reason_For_Loss__s;
    if (Object.hasOwn(input, "Reason_For_Loss__s") && lossReason !== null && lossReason !== "")
      throw new ValidationError({ Reason_For_Loss__s: ["Choose a closed lost stage first."] });
    fields.Reason_For_Loss__s = null;
  }
  const revenue =
    typeof fields.Amount === "number" ? (fields.Amount * Number(fields.Probability)) / 100 : null;
  fields.Expected_Revenue = revenue === null ? null : roundMoneyTwoDecimals(revenue);
  if (!previous || previous.Stage !== fields.Stage)
    fields.Stage_Modified_Time = fields.Modified_Time ?? null;
}
