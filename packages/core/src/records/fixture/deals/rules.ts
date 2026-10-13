import { ValidationError } from "../../../errors";
import type { FieldValue, RecordInput } from "../../contract";
import { dealsPicklists } from "./picklists";

export function applyDealRules(
  fields: Record<string, FieldValue>,
  input: RecordInput,
  previous?: Readonly<Record<string, FieldValue>>,
): void {
  const stage = dealsPicklists.Stage?.find((option) => option.storedValue === fields.Stage);
  if (!Object.hasOwn(input, "Probability") && (!previous || previous.Stage !== fields.Stage))
    fields.Probability = stage?.stage?.probability ?? 0;
  if (
    Object.hasOwn(input, "Probability") &&
    (typeof input.Probability !== "number" ||
      !Number.isInteger(input.Probability) ||
      input.Probability < 0 ||
      input.Probability > 100)
  )
    throw new ValidationError({ Probability: ["Choose an integer between 0 and 100."] });
  if (stage?.stage?.category !== "Closed Lost") {
    if (Object.hasOwn(input, "Reason_For_Loss__s"))
      throw new ValidationError({ Reason_For_Loss__s: ["Choose a closed lost stage first."] });
    fields.Reason_For_Loss__s = null;
  }
  const revenue =
    typeof fields.Amount === "number" ? (fields.Amount * Number(fields.Probability)) / 100 : null;
  fields.Expected_Revenue =
    revenue === null
      ? null
      : Math.round((revenue + Number.EPSILON * Math.max(1, Math.abs(revenue))) * 100) / 100;
  if (!previous || previous.Stage !== fields.Stage)
    fields.Stage_Modified_Time = fields.Modified_Time ?? null;
}
