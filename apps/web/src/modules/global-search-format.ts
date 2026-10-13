import type { RecordData } from "@crm/core/records";
import type { ModuleScreenDefinition } from "./types";

export function formatModuleSearchSecondaryLine(
  record: RecordData,
  definition?: ModuleScreenDefinition,
): string | null {
  const keys = definition?.search?.secondaryFields;
  if (!keys?.length) return null;
  const values = keys
    .map((key) => record.fields[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  return values.length > 0 ? values.join(" · ") : null;
}
