import type { EffectiveModuleDefinition } from "../../customization/types";
import type { RecordData, RecordInput } from "../contract";
import { validateInput } from "./validation";

/** Validate stored values without treating server-managed values as caller writes. */
export function validateSchemaRecord(schema: EffectiveModuleDefinition, record: RecordData): void {
  const fields = schema.fields.map((field) => ({ ...field, readOnly: false }));
  const input: RecordInput = Object.fromEntries(
    fields.map((field) => [field.apiName, record.fields[field.apiName] ?? null]),
  );
  // Tag has its own service; the generic validator always prohibits direct tag writes.
  validateInput(
    inputWithoutTag(input),
    false,
    fields.filter((f) => f.apiName !== "Tag"),
    new Set(),
  );
}
function inputWithoutTag(input: RecordInput): RecordInput {
  return Object.fromEntries(Object.entries(input).filter(([name]) => name !== "Tag"));
}
