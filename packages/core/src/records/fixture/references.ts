import { ValidationError } from "../../errors";
import type { FieldDefinition, RecordData } from "../contract";
import { acceptsFieldValue } from "./validation";

/** Adapter configuration, deliberately separate from public module metadata. */
export interface FixtureReferenceModule {
  displayNameField: string;
  /** Resolves only records belonging to the service's bound organization. */
  getRecord: (id: string) => RecordData | undefined;
}

export function resolveRecordReferences(
  record: RecordData,
  fields: readonly FieldDefinition[],
  modules: ReadonlyMap<string, FixtureReferenceModule>,
  options?: { requireRegisteredTargets?: boolean },
): RecordData {
  const resolved = { ...record.fields };
  for (const field of fields) {
    if (field.dataType !== "lookup") continue;
    const value = resolved[field.apiName];
    if (value == null) continue;
    if (
      typeof value !== "object" ||
      typeof value.module !== "string" ||
      typeof value.id !== "string" ||
      !acceptsFieldValue(field, value)
    )
      throw new ValidationError({ [field.apiName]: ["Invalid record reference."] });
    const targetModule = modules.get(value.module);
    if (!targetModule) continue;
    const target = targetModule.getRecord(value.id);
    if (!target) {
      if (options?.requireRegisteredTargets) {
        throw new ValidationError({
          [field.apiName]: ["Referenced record does not exist in this organization."],
        });
      }
      resolved[field.apiName] = null;
      continue;
    }
    const name = target.fields[targetModule.displayNameField];
    resolved[field.apiName] = {
      module: value.module,
      id: value.id,
      name: typeof name === "string" ? name : "",
    };
  }
  return { ...record, fields: resolved };
}
