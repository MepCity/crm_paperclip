import type {
  FieldDefinition,
  FieldValue,
  ModuleApiName,
  RecordData,
  RecordService,
} from "@crm/core/records";
import { lookupTargetModules } from "@crm/core/records";
import { resolveModuleScreenByApiName } from "./registry";

type CreatePrefillService = Pick<RecordService, "getModule" | "get">;

/** A lookup reference shows the target record's own name column, read back from the service. */
function referenceDisplayName(module: ModuleApiName, fields: RecordData["fields"]): string {
  const linkField = resolveModuleScreenByApiName(module)?.list.linkField;
  const value = linkField ? fields[linkField] : undefined;
  return typeof value === "string" ? value : "";
}

async function prefillValueForField(
  service: CreatePrefillService,
  field: FieldDefinition,
  text: string,
  moduleHint?: string,
): Promise<FieldValue | undefined> {
  switch (field.dataType) {
    case "text":
    case "email":
    case "phone":
    case "website":
    case "textarea":
    case "picklist":
    case "date":
    case "bigint":
    case "ownerlookup":
      return text;
    case "integer":
    case "double":
    case "currency": {
      const parsed = Number(text);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    case "boolean":
      return text === "true";
    case "lookup": {
      const allowed = lookupTargetModules(field);
      const targetModule =
        moduleHint && allowed.includes(moduleHint as ModuleApiName)
          ? (moduleHint as ModuleApiName)
          : field.lookup?.module;
      if (!targetModule) return undefined;
      let record: RecordData | undefined;
      try {
        record = await service.get(targetModule, text);
      } catch {
        return undefined;
      }
      return {
        module: targetModule,
        id: text,
        name: referenceDisplayName(targetModule, record.fields),
      };
    }
    default:
      return undefined;
  }
}

/**
 * Create-route query parameters that name a create-visible field prefill the form. Interim: the
 * reference encodes a create prefill in its own query language and the Deals create URL was never
 * captured with one, so a parameter is named by the field's API name and a lookup parameter
 * carries the referenced record's id.
 */
export async function resolveCreatePrefillParams(
  service: CreatePrefillService,
  module: ModuleApiName,
  params: Readonly<Record<string, string | string[] | undefined>>,
): Promise<Record<string, FieldValue> | undefined> {
  const requested = Object.entries(params)
    .map(([name, raw]) => [name, Array.isArray(raw) ? raw[0] : raw] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined);
  if (requested.length === 0) return undefined;
  const metadata = await service.getModule(module);
  const values: Record<string, FieldValue> = {};
  for (const [name, text] of requested) {
    const field = metadata.fields.find((item) => item.apiName === name);
    if (!field?.views.create || field.readOnly) continue;
    const value = await prefillValueForField(
      service,
      field,
      text,
      params[`${name}_module`] as string | undefined,
    );
    if (value !== undefined) values[name] = value;
  }
  return Object.keys(values).length > 0 ? values : undefined;
}
